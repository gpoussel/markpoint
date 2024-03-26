/* eslint-disable unicorn/prefer-dom-node-append */
import type { CodeLanguage } from '@markpoint/shared'
import type { Comment as CommentHast, Doctype as DoctypeHast, Element as ElementHast, Text as TextHast } from 'hast'
import { common, createLowlight } from 'lowlight'
import type { ShapeModificationCallback, XmlElement } from 'pptx-automizer'

import { ATTRIBUTE_NAMES, ELEMENT_TAG_NAMES, centimetersToEmu, emuToPoints } from '../opendocument.js'
import type { PresentationTheme } from '../theme.js'
import { createParagraph, createTextNode } from '../utils/pptx-utils.js'
import {
  getElementByTagNameRecursive,
  getOrCreateChild,
  removeAllChild,
  removeAllNamedChild,
} from '../utils/xml-utils.js'

import { computeTextFitOptions } from './sizing.js'

const lowlight = createLowlight(common)

function getOrCreateSolidFill(element: Element, rgbColor: string) {
  const solidFill = getOrCreateChild(element, ELEMENT_TAG_NAMES.solidFill)
  const rgbColorElement = element.ownerDocument.createElement(ELEMENT_TAG_NAMES.rgbColor)
  rgbColorElement.setAttribute('val', rgbColor)
  solidFill.appendChild(rgbColorElement)
  return solidFill
}

type ElementKind =
  | 'attr'
  | 'comment'
  | 'keyword'
  | 'literal'
  | 'number'
  | 'punctuation'
  | 'bullet'
  | 'string'
  | 'whitespace'
  | 'meta'

function createRange(theme: PresentationTheme, document: Document, text: string, kind: ElementKind) {
  const range = document.createElement(ELEMENT_TAG_NAMES.range)

  const rangeProperties = document.createElement(ELEMENT_TAG_NAMES.rangeProperties)
  rangeProperties.setAttribute('lang', 'en-US')
  rangeProperties.setAttribute('sz', '1400')
  rangeProperties.setAttribute('dirty', '0')
  const color = theme.color[`code.${kind}`] ?? theme.color[`code.default`]
  if (color) {
    getOrCreateSolidFill(rangeProperties, color)
  }

  const latin = document.createElement(ELEMENT_TAG_NAMES.latin)
  latin.setAttribute('typeface', theme.font.monospace)
  latin.setAttribute('panose', '00000309000000000000')
  latin.setAttribute('pitchFamily', '50')
  latin.setAttribute('charset', '0')
  rangeProperties.appendChild(latin)

  range.appendChild(rangeProperties)
  range.appendChild(createTextNode(document, text))
  return range
}

function detectKind(element: ElementHast): ElementKind {
  const className = element.properties['className']
  if (!Array.isArray(className)) {
    throw new TypeError('Expected className to be an array')
  }
  for (const kind of [
    'attr',
    'comment',
    'keyword',
    'literal',
    'number',
    'punctuation',
    'bullet',
    'string',
    'meta',
  ] as ElementKind[]) {
    if (className.includes(`hljs-${kind}`)) {
      return kind
    }
  }
  throw new Error(`Unsupported class name (className: ${className.toString()})`)
}

function convertElementToRanges(
  theme: PresentationTheme,
  xmlElement: Element,
  element: CommentHast | DoctypeHast | ElementHast | TextHast,
  kind?: ElementKind,
): Element[] {
  if (element.type === 'doctype') {
    return []
  }
  if (element.type === 'element') {
    const kind = detectKind(element)
    const children = element.children
    return children.flatMap((c) => convertElementToRanges(theme, xmlElement, c, kind))
  }
  const childKind = kind ?? (element.type === 'text' ? 'whitespace' : 'comment')
  return [createRange(theme, xmlElement.ownerDocument, element.value, childKind)]
}

function countCodeLines(code: string) {
  return code.split('\n').length
}

export function highlightCode(
  theme: PresentationTheme,
  language: CodeLanguage,
  code: string,
): ShapeModificationCallback {
  return (element: XmlElement) => {
    const shapeProperties = getElementByTagNameRecursive(element, ELEMENT_TAG_NAMES.shapeProperties)
    if (!shapeProperties) {
      return
    }
    if (theme.color['code.background']) {
      getOrCreateSolidFill(shapeProperties, theme.color['code.background'])
    }

    const textBody = getElementByTagNameRecursive(element, ELEMENT_TAG_NAMES.shapeTextBody)
    if (!textBody) {
      return
    }
    removeAllNamedChild(textBody, ELEMENT_TAG_NAMES.paragraph)

    const bodyProperties = getOrCreateChild(element, ELEMENT_TAG_NAMES.bodyProperties)
    const insetHeightEmu = centimetersToEmu(0.25)
    for (const dir of ['lIns', 'tIns', 'rIns', 'bIns']) {
      bodyProperties.setAttribute(dir, insetHeightEmu.toString())
    }
    bodyProperties.setAttribute('anchor', 't')
    bodyProperties.setAttribute('anchorCtr', '0')
    removeAllChild(bodyProperties)
    const codeLines = countCodeLines(code)

    const paragraphMarginPoints = 2
    const extentTag = getElementByTagNameRecursive(
      shapeProperties,
      ELEMENT_TAG_NAMES.transform,
      ELEMENT_TAG_NAMES.extent,
    )
    if (extentTag) {
      const shapeHeightEmu = Number.parseInt(extentTag.getAttribute('cy') as string)
      const availableTextHeightPoints = emuToPoints(shapeHeightEmu - 2 * insetHeightEmu)
      const textFitOptions = computeTextFitOptions(
        codeLines,
        14 /* TODO: Auto detect */,
        availableTextHeightPoints,
        paragraphMarginPoints,
      )
      const normAutoFit = element.ownerDocument.createElement(ELEMENT_TAG_NAMES.normalizedAutoFit)
      if (textFitOptions.fontScale) {
        normAutoFit.setAttribute('fontScale', (textFitOptions.fontScale * 1000).toString())
      }
      if (textFitOptions.lineSpaceReduction) {
        normAutoFit.setAttribute('lnSpcReduction', (textFitOptions.lineSpaceReduction * 1000).toString())
      }
      bodyProperties.appendChild(normAutoFit)
    }

    const root = lowlight.highlight(language, code)

    const paragraphs = []
    let ongoingParagraph = []
    for (const highlightedElement of root.children) {
      if (highlightedElement.type === 'doctype' || highlightedElement.type === 'element') {
        ongoingParagraph.push(highlightedElement)
        continue
      }
      if (highlightedElement.value.startsWith('\n')) {
        paragraphs.push(ongoingParagraph)
        ongoingParagraph = []
        ongoingParagraph.push({
          type: highlightedElement.type,
          data: highlightedElement.data,
          position: highlightedElement.position,
          value: highlightedElement.value.slice(1),
        })
      } else {
        ongoingParagraph.push(highlightedElement)
      }
    }
    if (ongoingParagraph.length > 0) {
      paragraphs.push(ongoingParagraph)
    }

    for (const paragraph of paragraphs) {
      const paragraphElement = createParagraph(element.ownerDocument)
      const paragraphProperties = element.ownerDocument.createElement(ELEMENT_TAG_NAMES.paragraphProperties)
      for (const dir of [ELEMENT_TAG_NAMES.spacingBefore, ELEMENT_TAG_NAMES.spacingAfter]) {
        const spacing = element.ownerDocument.createElement(dir)
        const spacingValue = element.ownerDocument.createElement(ELEMENT_TAG_NAMES.spacingPoints)
        spacingValue.setAttribute(ATTRIBUTE_NAMES.val, (paragraphMarginPoints * 100).toString())
        spacing.appendChild(spacingValue)
        paragraphProperties.appendChild(spacing)
      }
      paragraphElement.appendChild(paragraphProperties)
      for (const r of paragraph.flatMap((c) => convertElementToRanges(theme, element, c))) {
        paragraphElement.appendChild(r)
      }
      textBody.appendChild(paragraphElement)
    }
  }
}
