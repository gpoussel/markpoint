import fs from 'node:fs/promises'
import path from 'node:path'

import remarkFrontmatter from 'remark-frontmatter'
import remarkParse from 'remark-parse'
import { unified } from 'unified'

import { convertMarkdownSections } from './conversion.js'
import { extractFrontMatter } from './frontmatter.js'
import { extractTitle } from './title.js'
import type { MarkdownPresentation } from './types.js'

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

    const sections = convertMarkdownSections(processingResult)

    return {
      filename: path.basename(file),
      title,
      metadata: frontmatter,
      sections,
    }
  }
}
