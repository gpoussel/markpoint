/* eslint-disable unicorn/prefer-dom-node-append */
import type { SingleLineText, TemplateTextBlockElementDefinition, TextPart } from '@markpoint/shared'
import type { ShapeModificationCallback, XmlElement } from 'pptx-automizer'

import { ELEMENT_TAG_NAMES } from '../opendocument.js'
import type { PresentationTheme } from '../theme.js'
import { createParagraph, createParagraphProperties, createTextNode } from '../utils/pptx-utils.js'
import { getElementByTagNameRecursive, getOrCreateChild, removeAllNamedChild } from '../utils/xml-utils.js'

function createRange(
  theme: PresentationTheme,
  document: Document,
  textPart: TextPart,
  existingRangeProperties: Element | undefined,
): Node {
  const range = document.createElement(ELEMENT_TAG_NAMES.range)
  const rangeProperties = existingRangeProperties
    ? (existingRangeProperties.cloneNode(true) as Element)
    : document.createElement(ELEMENT_TAG_NAMES.rangeProperties)
  rangeProperties.setAttribute('lang', 'en-US')
  rangeProperties.setAttribute('b', textPart.bold ? '1' : '0')
  rangeProperties.setAttribute('i', textPart.italic ? '1' : '0')
  rangeProperties.setAttribute('dirty', '1')
  if (textPart.monospace) {
    const latin = getOrCreateChild(rangeProperties, ELEMENT_TAG_NAMES.latin)
    latin.setAttribute('typeface', theme.font.monospace)
    latin.setAttribute('panose', '00000309000000000000')
    latin.setAttribute('pitchFamily', '50')
    latin.setAttribute('charset', '0')
  }
  range.appendChild(rangeProperties)
  range.appendChild(createTextNode(document, textPart.text))
  return range
}

function cleanupContent(element: XmlElement): { rangeProperties: Element | undefined; textBody: Element | undefined } {
  const textBody = getElementByTagNameRecursive(element, ELEMENT_TAG_NAMES.shapeTextBody)
  if (!textBody) {
    return { rangeProperties: undefined, textBody: undefined }
  }
  const existingRangeProperties = getElementByTagNameRecursive(element, ELEMENT_TAG_NAMES.rangeProperties)
  removeAllNamedChild(textBody, ELEMENT_TAG_NAMES.paragraph)
  return { rangeProperties: existingRangeProperties, textBody }
}

export function setSingleLineText(theme: PresentationTheme, singleLineText: SingleLineText): ShapeModificationCallback {
  return (element: XmlElement) => {
    const { rangeProperties, textBody } = cleanupContent(element)
    if (!textBody) {
      return
    }
    const paragraphElement = createParagraph(element.ownerDocument)
    for (const textPart of singleLineText) {
      paragraphElement.appendChild(createRange(theme, element.ownerDocument, textPart, rangeProperties))
    }
    textBody.appendChild(paragraphElement)
  }
}

export function setTextBlock(
  theme: PresentationTheme,
  textLines: TemplateTextBlockElementDefinition['lines'],
): ShapeModificationCallback {
  return (element: XmlElement) => {
    const { rangeProperties, textBody } = cleanupContent(element)
    if (!textBody) {
      return
    }
    if (textLines.length === 0) {
      // We cannot have an empty shape (i.e. without paragraph) in PowerPoint
      const paragraphElement = createParagraph(element.ownerDocument)
      textBody.appendChild(paragraphElement)
      return
    }
    for (const line of textLines) {
      const paragraphElement = createParagraph(element.ownerDocument)
      paragraphElement.appendChild(createParagraphProperties(element.ownerDocument, line.level))
      for (const textPart of line.text) {
        paragraphElement.appendChild(createRange(theme, element.ownerDocument, textPart, rangeProperties))
      }
      textBody.appendChild(paragraphElement)
    }
  }
}
