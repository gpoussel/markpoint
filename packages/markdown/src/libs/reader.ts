import fs from 'node:fs/promises'
import path from 'node:path'

import type { Root } from 'mdast'
import remarkFrontmatter from 'remark-frontmatter'
import remarkParse from 'remark-parse'
import { unified } from 'unified'

import { convertMarkdownSections } from './conversion.js'
import { extractFrontMatter } from './frontmatter.js'
import { extractTitle } from './title.js'
import type { MarkdownPresentation } from './types.js'

function extractElements(result: Root) {
  try {
    const metadata = extractFrontMatter(result)
    const title = extractTitle(result)
    return { metadata, title }
  } catch (error) {
    throw new Error(`Markdown error: ${JSON.stringify(error)}`)
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
      })
      .parse(markdownFileContent)

    const { metadata, title } = extractElements(processingResult)
    const sections = convertMarkdownSections(processingResult)
    return {
      filename: path.basename(file),
      title,
      metadata,
      sections,
    }
  }
}
