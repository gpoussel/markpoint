/* eslint-disable unicorn/prefer-dom-node-append */
/**
 * Iterates over a collection of HTML elements
 * @param collection HTML elements to iterate over
 * @param callbackFn Function called on each element, that return a value
 * @returns List of result of callback function
 */
export function map<T extends Element, V>(collection: HTMLCollectionOf<T>, callbackFn: (e: T) => V | undefined) {
  const result: V[] = []
  for (let i = 0; i < collection.length; ++i) {
    const element = collection.item(i)
    if (!element) {
      continue
    }
    const mappedElement = callbackFn(element)
    if (mappedElement) {
      result.push(mappedElement)
    }
  }
  return result
}

/**
 * Remove all children from a DOM node, based on their tag name
 * @param parentNode Parent node to remove children from
 * @param tagName Tag name of children to remove
 */
export function removeAllNamedChild(parentNode: Element, tagName: string) {
  let elements = parentNode.getElementsByTagName(tagName)
  while (elements.length > 0) {
    // eslint-disable-next-line unicorn/prefer-dom-node-remove
    parentNode.removeChild(elements[0] as Element)
    elements = parentNode.getElementsByTagName(tagName)
  }
}

/**
 * Remove all children from a DOM node
 * @param parentNode Parent node to remove children from
 */
export function removeAllChild(parentNode: Element) {
  let elements = parentNode.childNodes
  while (elements.length > 0) {
    // eslint-disable-next-line unicorn/prefer-dom-node-remove
    parentNode.removeChild(elements[0] as Element)
    elements = parentNode.childNodes
  }
}

/**
 * Returns an element by its tag name (including at nested levels)
 * @param element Element to search in
 * @param tagNames Tag names to search for
 */
export function getElementByTagNameRecursive(element: Element, ...tagNames: string[]): Element | undefined {
  let currentElement = element
  for (const tagName of tagNames) {
    const childElements = currentElement.getElementsByTagName(tagName)
    if (childElements.length > 0 && childElements[0]) {
      currentElement = childElements[0]
    } else {
      return undefined
    }
  }
  return currentElement
}

/**
 * Gets or creates a direct child element by its tag name
 * @param element Element to search in
 * @param tagNames Tag name of the child
 */
export function getOrCreateChild(element: Element, tagName: string): Element {
  const childElement = element.getElementsByTagName(tagName)
  if (childElement.length > 0 && childElement[0]) {
    return childElement[0]
  }
  const newElement = element.ownerDocument.createElement(tagName)
  element.appendChild(newElement)
  return newElement
}

/**
 * Returns the text of an element (e.g. a shape)
 * @param element Element to get text from
 * @returns text lines inside element
 */
export function getText(element: Element): string {
  const paragraphs = element.getElementsByTagName('a:p')
  return map(paragraphs, (paragraph) => {
    return map(paragraph.getElementsByTagName('a:t'), (textElement) => {
      return textElement.textContent?.trim()
    }).join(' ')
  }).join('\n')
}
