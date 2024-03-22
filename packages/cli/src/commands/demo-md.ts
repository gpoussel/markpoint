import { MarkdownReader } from '@markpoint/markdown'

export async function sampleMarkdownReading(inputFile: string, outputFile: string): Promise<void> {
  const markdownReader = new MarkdownReader()
  await markdownReader.read(inputFile)
  // eslint-disable-next-line no-console
  console.log('Should write to file:', outputFile)
}
