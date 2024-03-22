import fs from 'node:fs/promises'
import path from 'node:path'

import type { Node } from 'mdast'
import remarkFrontmatter from 'remark-frontmatter'
import remarkParse from 'remark-parse'
import { unified } from 'unified'

import { checkRoot } from './check.js'
import { extractFrontMatter } from './frontmatter.js'

export interface MarkdownPresentation {
  filename: string
}

function debugPrintAst(node: Node, depth: number) {
  // eslint-disable-next-line no-console
  console.log('  '.repeat(depth) + node.type)
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
    // eslint-disable-next-line no-console
    console.log('frontmatter', frontmatter)
    checkRoot(processingResult)
    debugPrintAst(processingResult, 0)

    return {
      filename: path.basename(file),
    }
  }
}
