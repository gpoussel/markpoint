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

export function removeAllChild(parentNode: Element, tagName: string) {
  let elements = parentNode.getElementsByTagName(tagName)
  while (elements.length > 0) {
    // eslint-disable-next-line unicorn/prefer-dom-node-remove
    parentNode.removeChild(elements[0] as Element)
    elements = parentNode.getElementsByTagName(tagName)
  }
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
