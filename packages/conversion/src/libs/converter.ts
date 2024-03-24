import type { MarkdownPresentation } from '@markpoint/markdown'
import { PowerpointWriter } from '@markpoint/powerpoint'
import type { TemplateConfiguration, TemplateDefinition } from '@markpoint/shared'

export class MarkpointConverter {
  public async convert(
    templateConfiguration: TemplateConfiguration,
    presentation: MarkdownPresentation,
    outputFile: string,
  ): Promise<void> {
    const powerpointWriter = new PowerpointWriter()
    const powerpointDefinition: TemplateDefinition = {
      layouts: [],
      master: {
        elements: [],
      },
    }
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
        template: powerpointDefinition,
      },
      outputFile,
    )
    // eslint-disable-next-line no-console
    console.log({ presentation })
  }
}
