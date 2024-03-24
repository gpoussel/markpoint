import type { MarkdownPresentation } from '@markpoint/markdown'
import { PowerpointWriter } from '@markpoint/powerpoint'
import {
  StringUtils,
  type TemplateConfiguration,
  type TemplateDefinition,
  type TemplateElementConfiguration,
  type TemplateElementDefinition,
} from '@markpoint/shared'

export function convertElementConfigurationToDefinition(
  elementConfiguration: TemplateElementConfiguration,
  data: Record<string, string>,
): TemplateElementDefinition {
  if (elementConfiguration.type === 'text') {
    return {
      creationId: elementConfiguration.creationId,
      type: 'text',
      text: StringUtils.template(elementConfiguration.template, data),
    }
  }
  throw new Error(`Unsupported element type: ${elementConfiguration.type}`)
}

export class MarkpointConverter {
  public async convert(
    templateConfiguration: TemplateConfiguration,
    presentation: MarkdownPresentation,
    outputFile: string,
  ): Promise<void> {
    const powerpointWriter = new PowerpointWriter()

    const templateData = {
      title: presentation.title,
      company: presentation.metadata?.company ?? '',
      author: presentation.metadata?.author ?? '',
      date: presentation.metadata?.date ?? '',
      issue: presentation.metadata?.issue ?? '',
      location: presentation.metadata?.location ?? '',
      reference: presentation.metadata?.reference ?? '',
    }
    const powerpointDefinition: TemplateDefinition = {
      layouts: [],
      master: {
        elements: templateConfiguration.master.elements.map((e) =>
          convertElementConfigurationToDefinition(e, templateData),
        ),
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
