/* eslint-disable unicorn/prefer-dom-node-append */
import type { Comment as CommentHast, Doctype as DoctypeHast, Element as ElementHast, Text as TextHast } from 'hast'
import { common, createLowlight } from 'lowlight'
import type { ShapeModificationCallback, XmlElement } from 'pptx-automizer'

import { ELEMENT_TAG_NAMES } from '../opendocument.js'
import {
  getElementByTagNameRecursive,
  getOrCreateChild,
  removeAllChild,
  removeAllNamedChild,
} from '../utils/xml-utils.js'

import type { PowerpointCodeLanguage } from './configuration.js'

const lowlight = createLowlight(common)

function createParagraph(document: Document) {
  const paragraph = document.createElement(ELEMENT_TAG_NAMES.paragraph)
  return paragraph
}

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

function createRange(document: Document, text: string, kind: ElementKind) {
  const range = document.createElement(ELEMENT_TAG_NAMES.range)

  const rangeProperties = document.createElement(ELEMENT_TAG_NAMES.rangeProperties)
  rangeProperties.setAttribute('lang', 'en-US')
  rangeProperties.setAttribute('sz', '1400')
  rangeProperties.setAttribute('b', '0')
  rangeProperties.setAttribute('dirty', '0')

  let color
  switch (kind) {
    case 'comment': {
      color = '676867'
      break
    }
    case 'attr': {
      color = '9A9B99'
      break
    }
    case 'keyword':
    case 'number': {
      color = '6089B4'
      break
    }
    case 'punctuation':
    case 'bullet':
    case 'meta': {
      color = 'C5C8C6'
      break
    }
    case 'string': {
      color = '9AA83A'
      break
    }
    case 'literal': {
      color = '56B6C2'
      break
    }
    case 'whitespace': {
      color = undefined
      break
    }
    default: {
      throw new Error('Unsupported kind')
    }
  }
  if (color) {
    getOrCreateSolidFill(rangeProperties, color)
  }

  const latin = document.createElement(ELEMENT_TAG_NAMES.latin)
  latin.setAttribute('typeface', `VictorMono Nerd Font`)
  latin.setAttribute('panose', '00000309000000000000')
  latin.setAttribute('pitchFamily', '50')
  latin.setAttribute('charset', '0')
  rangeProperties.appendChild(latin)

  range.appendChild(rangeProperties)

  const textElement = document.createElement(ELEMENT_TAG_NAMES.text)
  textElement.setAttribute('xml:space', 'preserve')
  textElement.appendChild(document.createTextNode(text))
  range.appendChild(textElement)

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
    return children.flatMap((c) => convertElementToRanges(xmlElement, c, kind))
  }
  const childKind = kind ?? (element.type === 'text' ? 'whitespace' : 'comment')
  return [createRange(xmlElement.ownerDocument, element.value, childKind)]
}

export function highlightCode(language: PowerpointCodeLanguage, code: string): ShapeModificationCallback {
  return (element: XmlElement) => {
    const shapeProperties = getElementByTagNameRecursive(element, ELEMENT_TAG_NAMES.shapeProperties)
    if (!shapeProperties) {
      return
    }
    getOrCreateSolidFill(shapeProperties, '1E1E1E')

    const textBody = getElementByTagNameRecursive(element, ELEMENT_TAG_NAMES.shapeTextBody)
    if (!textBody) {
      return
    }
    removeAllNamedChild(textBody, ELEMENT_TAG_NAMES.paragraph)

    const bodyProperties = getOrCreateChild(element, ELEMENT_TAG_NAMES.bodyProperties)
    for (const dir of ['lIns', 'tIns', 'rIns', 'bIns']) {
      bodyProperties.setAttribute(dir, '46800')
    }
    bodyProperties.setAttribute('anchor', 't')
    bodyProperties.setAttribute('anchorCtr', '0')
    removeAllChild(bodyProperties)
    getOrCreateChild(bodyProperties, ELEMENT_TAG_NAMES.normalizedAutoFit)

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
      for (const r of paragraph.flatMap((c) => convertElementToRanges(element, c))) {
        paragraphElement.appendChild(r)
      }
      textBody.appendChild(paragraphElement)
    }
  }
}
