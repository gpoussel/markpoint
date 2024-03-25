import { ELEMENT_TAG_NAMES } from '../opendocument.js'

export function createParagraph(document: Document) {
  return document.createElement(ELEMENT_TAG_NAMES.paragraph)
}

export function createTextNode(document: Document, value: string) {
  const textElement = document.createElement(ELEMENT_TAG_NAMES.text)
  textElement.setAttribute('xml:space', 'preserve')
  // eslint-disable-next-line unicorn/prefer-dom-node-append
  textElement.appendChild(document.createTextNode(value))
  return textElement
}
