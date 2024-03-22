import fs from 'node:fs/promises'
import path from 'node:path'

import type { Heading, Node, Text } from 'mdast'
import remarkFrontmatter from 'remark-frontmatter'
import remarkParse from 'remark-parse'
import { unified } from 'unified'

import { convertMarkdownSections } from './conversion.js'
import { extractFrontMatter } from './frontmatter.js'
import { extractTitle } from './title.js'
import type { MarkdownPresentation } from './types.js'

function debugPrintAst(node: Node, depth: number) {
  let additionalInfo = ''
  if (node.type === 'heading') {
    additionalInfo = ` ${(node as Heading).depth}`
  } else if (node.type === 'text') {
    additionalInfo = ` "${(node as Text).value}"`
  } else {
    additionalInfo = ''
  }
  // eslint-disable-next-line no-console
  console.log('  '.repeat(depth) + node.type + additionalInfo)
  if (!('children' in node)) {
    return
  }
  for (const child of node.children as Node[]) {
    debugPrintAst(child, depth + 1)
  }
}

export class MarkdownReader {
  async read(file: string): Promise<MarkdownPresentation> {
    const markdownFileContent = await fs.readFile(file, 'utf8')

    const processingResult = unified()
      //
      .use(remarkParse)
      .use(remarkFrontmatter, {
        type: 'yaml',
        marker: '-',
        anywhere: false,
      })
      .parse(markdownFileContent)

    const frontmatter = extractFrontMatter(processingResult)
    const title = extractTitle(processingResult)

    // eslint-disable-next-line no-console
    console.log({ frontmatter, title })

    const sections = convertMarkdownSections(processingResult)
    debugPrintAst(processingResult, 0)

    return {
      filename: path.basename(file),
      sections,
    }
  }
}
