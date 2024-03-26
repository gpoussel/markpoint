/* eslint-disable unicorn/prefer-dom-node-append */
import type { SingleLineText, TextPart } from '@markpoint/shared'
import type { ShapeModificationCallback, XmlElement } from 'pptx-automizer'

import { ELEMENT_TAG_NAMES } from '../opendocument.js'
import { createParagraph, createTextNode } from '../utils/pptx-utils.js'
import { getElementByTagNameRecursive, getOrCreateChild, removeAllNamedChild } from '../utils/xml-utils.js'

function createRange(document: Document, textPart: TextPart, existingRangeProperties: Element | undefined): Node {
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
    latin.setAttribute('typeface', `VictorMono Nerd Font`)
    latin.setAttribute('panose', '00000309000000000000')
    latin.setAttribute('pitchFamily', '50')
    latin.setAttribute('charset', '0')
  }
  range.appendChild(rangeProperties)
  range.appendChild(createTextNode(document, textPart.text))
  return range
}

export function setSingleLineText(singleLineText: SingleLineText): ShapeModificationCallback {
  return (element: XmlElement) => {
    const textBody = getElementByTagNameRecursive(element, ELEMENT_TAG_NAMES.shapeTextBody)
    if (!textBody) {
      return
    }
    const existingRangeProperties = getElementByTagNameRecursive(element, ELEMENT_TAG_NAMES.rangeProperties)
    removeAllNamedChild(textBody, ELEMENT_TAG_NAMES.paragraph)
    const paragraphElement = createParagraph(element.ownerDocument)
    for (const textPart of singleLineText) {
      paragraphElement.appendChild(createRange(element.ownerDocument, textPart, existingRangeProperties))
    }
    textBody.appendChild(paragraphElement)
  }
}
