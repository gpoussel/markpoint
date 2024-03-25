import type { MarkdownPresentation, MarkdownSection } from '@markpoint/markdown'
import { PowerpointWriter, type PowerpointSlidesConfiguration } from '@markpoint/powerpoint'
import {
  StringUtils,
  type TemplateConfiguration,
  type TemplateDefinition,
  type TemplateElementConfiguration,
  type TemplateElementDefinition,
  type TemplateLayoutConfiguration,
  type SingleLineText,
} from '@markpoint/shared'

interface SlideData {
  metadata?: Record<string, string>
  section?: MarkdownSection
}

function convertElementConfigurationToDefinition(
  elementConfiguration: TemplateElementConfiguration,
  data: SlideData,
): TemplateElementDefinition {
  if (elementConfiguration.type === 'text') {
    if (!data.metadata) {
      throw new Error('Cannot convert text element without metadata')
    }
    return {
      creationId: elementConfiguration.creationId,
      type: 'text',
      text: [
        {
          text: StringUtils.template(elementConfiguration.template, data.metadata),
          bold: false,
          italic: false,
          monospace: false,
        },
      ],
    }
  }
  if (elementConfiguration.type === 'content') {
    if (!data.section) {
      throw new Error('Cannot convert content element without section')
    }
    let textLine: SingleLineText
    switch (elementConfiguration.reference) {
      case 'title': {
        textLine = data.section.title
        break
      }
      case 'summary': {
        textLine = data.section.summary ?? []
        break
      }
      default: {
        throw new Error(`Unsupported content reference`)
      }
    }
    return {
      creationId: elementConfiguration.creationId,
      type: 'text',
      text: textLine,
    }
  }
  throw new Error(`Unsupported element type: ${elementConfiguration.type}`)
}

function generateSlide(
  layoutConfiguration: TemplateLayoutConfiguration,
  data: SlideData,
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

    const documentTemplateData = {
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
          convertElementConfigurationToDefinition(e, { metadata: documentTemplateData }),
        ),
      },
    }
    const slides: PowerpointSlidesConfiguration[] = []
    const layout = templateConfiguration.layout
    const firstDocumentSlideLayout = layout?.document?.first
    if (firstDocumentSlideLayout) {
      slides.push(generateSlide(firstDocumentSlideLayout, { metadata: documentTemplateData }))
    }

    for (const section of presentation.sections) {
      const firstSectionSlideLayout = layout?.section?.first
      if (firstSectionSlideLayout) {
        slides.push(generateSlide(firstSectionSlideLayout, { section }))
      }

      const lastSectionSlideLayout = layout?.section?.last
      if (lastSectionSlideLayout) {
        slides.push(generateSlide(lastSectionSlideLayout, { section }))
      }
    }

    const lastDocumentSlideLayout = layout?.document?.last
    if (lastDocumentSlideLayout) {
      slides.push(generateSlide(lastDocumentSlideLayout, { metadata: documentTemplateData }))
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
  }
}
