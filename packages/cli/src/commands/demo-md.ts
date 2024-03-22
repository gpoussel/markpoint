import fs from 'node:fs/promises'

import { MarkdownReader } from '@markpoint/markdown'

export async function sampleMarkdownReading(inputFile: string, outputPath: string | undefined): Promise<void> {
  const markdownReader = new MarkdownReader()
  const presentation = await markdownReader.read(inputFile)

  if (outputPath) {
    await fs.writeFile(outputPath, JSON.stringify(presentation, undefined, 2), 'utf8')
  } else {
    // eslint-disable-next-line no-console
    console.log(presentation)
  }
}
