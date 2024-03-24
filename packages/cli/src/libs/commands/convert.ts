import { MarkpointConverter, TemplateConfigurationReader } from '@markpoint/conversion'
import { MarkdownReader } from '@markpoint/markdown'

const markdownReader = new MarkdownReader()
const templateConfigurationReader = new TemplateConfigurationReader()
const converter = new MarkpointConverter()

export async function convert(template: string, presentation: string, output: string) {
  const markdownDocument = await markdownReader.read(presentation)
  const templateConfiguration = await templateConfigurationReader.readConfiguration(template)
  await converter.convert(templateConfiguration, markdownDocument, output)

  // eslint-disable-next-line no-console
  console.log(markdownDocument)
}
