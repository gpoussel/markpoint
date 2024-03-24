import type { MarkdownPresentation } from '@markpoint/markdown'
import { PowerpointWriter } from '@markpoint/powerpoint'
import type { TemplateConfiguration } from '@markpoint/shared'

export class MarkpointConverter {
  public async convert(
    templateConfiguration: TemplateConfiguration,
    presentation: MarkdownPresentation,
    outputFile: string,
  ): Promise<void> {
    const powerpointWriter = new PowerpointWriter()
    await powerpointWriter.generate(
      templateConfiguration.baseFile,
      {
        metadata: {
          title: presentation.title,
          author: presentation.metadata?.author ?? '',
          company: presentation.metadata?.company ?? '',
          subject: presentation.title,
        },
        presentation: {
          master: [], // TODO: Use data from presentation
          slides: [], // TODO: Use data from presentation
        },
        template: templateConfiguration,
      },
      outputFile,
    )
    // eslint-disable-next-line no-console
    console.log({ presentation })
  }
}
