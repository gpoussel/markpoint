import type { MarkdownPresentation } from '@markpoint/markdown'
import { PowerpointWriter, type PowerpointSlidesConfiguration } from '@markpoint/powerpoint'
import {
  StringUtils,
  type TemplateConfiguration,
  type TemplateDefinition,
  type TemplateElementConfiguration,
  type TemplateElementDefinition,
  type TemplateLayoutConfiguration,
} from '@markpoint/shared'

function convertElementConfigurationToDefinition(
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

function generateSlide(
  layoutConfiguration: TemplateLayoutConfiguration,
  data: Record<string, string>,
): PowerpointSlidesConfiguration {
  return {
    layoutSlide: layoutConfiguration.baseSlideNumber,
    content: layoutConfiguration.elements.map((e) => convertElementConfigurationToDefinition(e, data)),
  }
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
    const slides: PowerpointSlidesConfiguration[] = []
    const layout = templateConfiguration.layout
    const firstSlideLayout = layout?.document?.first
    if (firstSlideLayout) {
      slides.push(generateSlide(firstSlideLayout, templateData))
    }

    const lastSlideLayout = layout?.document?.last
    if (lastSlideLayout) {
      slides.push(generateSlide(lastSlideLayout, templateData))
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
          slides,
        },
        template: powerpointDefinition,
      },
      outputFile,
    )
    // eslint-disable-next-line no-console
    console.log({ presentation })
  }
}
