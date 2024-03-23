import type { Heading, Root } from 'mdast'

import { extractFirst } from './utils'

export function extractTitle(tree: Root) {
  const headingNode = extractFirst(
    tree.children,
    (node): node is Heading => node.type === 'heading' && node.depth === 1,
    true,
  )
  const firstChild = headingNode.children[0]
  if (!firstChild || headingNode.children.length !== 1) {
    throw new Error('Document title must have exactly one child')
  }
  if (firstChild.type !== 'text') {
    throw new Error('Document title must be plain text')
  }
  return firstChild.value
}
