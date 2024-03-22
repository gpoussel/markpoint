import type { Heading, List, ListItem, Paragraph, PhrasingContent, Root, RootContent, ThematicBreak } from 'mdast'

// thematicBreak is the --- separator
// heading is the title of each section
// paragraph is the text
// list is a list of items
function checkPhrasingContent(element: PhrasingContent) {
  if (
    element.type === 'text' ||
    element.type === 'inlineCode' ||
    element.type === 'emphasis' ||
    element.type === 'link' ||
    element.type === 'strong' ||
    element.type === 'image'
  ) {
    // Basic text => valid
    return
  }
  throw new Error(`Unsupported phrasing content type: ${element.type} at line ${element.position?.start.line}`)
}

function checkThematicBreak(element: ThematicBreak) {
  const startPosition = element.position?.start
  const endPosition = element.position?.end
  if (endPosition && startPosition && (endPosition.offset ?? 0) - (startPosition.offset ?? 0) !== 3) {
    throw new Error(`Thematic break must be 3 character long at line ${startPosition.line}`)
  }
}
function checkHeading(element: Heading) {
  for (const child of element.children) {
    checkPhrasingContent(child)
  }
}
function checkParagraph(element: Paragraph) {
  for (const child of element.children) {
    checkPhrasingContent(child)
  }
}

function checkListItem(element: ListItem) {
  if (element.checked) {
    throw new Error(`List item checked property must be undefined at line ${element.position?.start.line}`)
  }
  for (const child of element.children) {
    if (child.type === 'paragraph') {
      checkParagraph(child)
    } else if (child.type === 'list') {
      checkList(child)
    } else {
      throw new Error(`Unsupported list item child type: ${child.type} at line ${child.position?.start.line}`)
    }
  }
}

function checkList(element: List) {
  for (const item of element.children) {
    checkListItem(item)
  }
}

/**
 * Since the library is supporting a limited sunbset of markdown, we need to check that the AST is valid
 * regarding to the supported features. This function will throw an error if the AST is not valid.
 * @param root root node of the markdown AST
 */
export function checkRoot(root: Root) {
  for (const children of root.children) {
    const checkCallbacks: Record<string, ((children: RootContent) => void) | undefined> = {
      thematicBreak: (node: RootContent) => checkThematicBreak(node as ThematicBreak),
      heading: (node: RootContent) => checkHeading(node as Heading),
      paragraph: (node: RootContent) => checkParagraph(node as Paragraph),
      list: (node: RootContent) => checkList(node as List),
      code: undefined,
    }
    const checkCallback = checkCallbacks[children.type]
    if (!(children.type in checkCallbacks)) {
      throw new Error(`Unsupported node type: ${children.type} at line ${children.position?.start.line ?? 'unknown'}`)
    }
    if (checkCallback) {
      checkCallback(children)
    }
  }
}
