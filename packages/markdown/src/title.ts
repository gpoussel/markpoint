import type { Heading, Root } from 'mdast'

function extractAndGetTitle(heading: Heading): string {
  const firstChild = heading.children[0]
  if (heading.children.length !== 1 || !firstChild) {
    throw new Error('Document title must have exactly one child')
  }
  if (firstChild.type !== 'text') {
    throw new Error('Document title must be plain text')
  }
  return firstChild.value
}

export function extractTitle(tree: Root) {
  const firstChild = tree.children[0]
  if (!firstChild) {
    return
  }
  if (firstChild.type !== 'heading') {
    throw new Error('First document element must be a heading')
  }
  if (firstChild.depth !== 1) {
    throw new Error('First heading must be a level 1 heading')
  }
  const headingNode = tree.children.shift() as Heading
  return extractAndGetTitle(headingNode)
}
