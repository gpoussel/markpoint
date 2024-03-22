import type { Code, Heading, List, ListItem, Paragraph, PhrasingContent, Root, RootContent, ThematicBreak } from 'mdast'

const SUPPORTED_CODE_LANGUAGES = new Set(['json', 'text', 'yaml', 'yml'])

// thematicBreak is the --- separator
// heading is the title of each section
// paragraph is the text
// list is a list of items
// code is a code block

function checkPhrasingContent(element: PhrasingContent) {
  if (
    element.type === 'text' ||
    element.type === 'inlineCode' ||
    element.type === 'emphasis' ||
    element.type === 'link' ||
    element.type === 'strong' ||
    element.type === 'image'
  ) {
    // Basic text
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
  if (element.depth === 1) {
    throw new Error(`Heading 1 is only allowed as the first element, found one at line ${element.position?.start.line}`)
  }
  if (element.depth >= 4) {
    throw new Error(`Heading depth must be less than 4 at line ${element.position?.start.line}`)
  }
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
function checkCode(element: Code) {
  if (!element.lang) {
    throw new Error(`Code block language must be set at line ${element.position?.start.line}`)
  }
  if (!SUPPORTED_CODE_LANGUAGES.has(element.lang)) {
    throw new Error(`Unsupported code block language: ${element.lang} at line ${element.position?.start.line}`)
  }
}

/**
 * Since the library is supporting a limited sunbset of markdown, we need to check that the AST is valid
 * regarding to the supported features. This function will throw an error if the AST is not valid.
 * @param root root node of the markdown AST
 */
export function checkRoot(root: Root) {
  for (const children of root.children) {
    const checkCallbacks: Record<string, (children: RootContent) => void> = {
      thematicBreak: (node: RootContent) => checkThematicBreak(node as ThematicBreak),
      heading: (node: RootContent) => checkHeading(node as Heading),
      paragraph: (node: RootContent) => checkParagraph(node as Paragraph),
      list: (node: RootContent) => checkList(node as List),
      code: (node: RootContent) => checkCode(node as Code),
    }
    const checkCallback = checkCallbacks[children.type]
    if (!checkCallback) {
      throw new Error(`Unsupported node type: ${children.type} at line ${children.position?.start.line ?? 'unknown'}`)
    }
    checkCallback(children)
  }
}
