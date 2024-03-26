import type {
  MarkdownCodeContent,
  MarkdownMixedContent,
  MarkdownPresentation,
  MarkdownSection,
  MarkdownSlide,
  MarkdownTextContent,
} from '@markpoint/markdown'
import { PowerpointWriter, type PowerpointSlidesConfiguration, PresentationTheme } from '@markpoint/powerpoint'
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
  part?: MarkdownSlide
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
    if (data.section && !data.part) {
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
    } else if (data.section && data.part) {
      if (elementConfiguration.reference === 'title' || elementConfiguration.reference === 'subtitle') {
        return {
          creationId: elementConfiguration.creationId,
          type: 'text',
          text: elementConfiguration.reference === 'title' ? data.section.title : data.part.title ?? [],
        }
      }
      if (elementConfiguration.reference === 'content') {
        if (data.part.content.every((c) => c.type === 'text')) {
          return {
            creationId: elementConfiguration.creationId,
            type: 'textBlock',
            lines: data.part.content
              .filter((mmc: MarkdownMixedContent): mmc is MarkdownTextContent => mmc.type === 'text')
              .map((line: MarkdownTextContent) => ({
                level: line.level,
                text: line.text,
              })),
          }
        }
        if (data.part.content.every((c) => c.type === 'code')) {
          if (data.part.content.length !== 1) {
            throw new Error('Only one code block is supported')
          }
          const codeContent = data.part.content[0] as MarkdownCodeContent
          return {
            creationId: elementConfiguration.creationId,
            type: 'codeBlock',
            language: codeContent.language,
            code: codeContent.code,
          }
        }
      }
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
    const theme = new PresentationTheme(
      templateConfiguration.theme.font,
      templateConfiguration.theme.color,
      templateConfiguration.theme.size,
    )
    const powerpointWriter = new PowerpointWriter(theme)

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
    const firstDocumentSlideLayout = layout.document?.first
    if (firstDocumentSlideLayout) {
      slides.push(generateSlide(firstDocumentSlideLayout, { metadata: documentTemplateData }))
    }

    for (const section of presentation.sections) {
      const firstSectionSlideLayout = layout.section?.first
      if (firstSectionSlideLayout) {
        slides.push(generateSlide(firstSectionSlideLayout, { section }))
      }

      for (const sectionSlide of section.slides) {
        // const title = sectionSlide.title
        const content = sectionSlide.content

        const uniqueContentTypes = [...new Set(content.map((c) => c.type))].sort()
        if (uniqueContentTypes.length === 1) {
          if (uniqueContentTypes[0] === 'text' || uniqueContentTypes[0] === 'code') {
            // Section with full text content
            const layout = templateConfiguration.layout.content.text
            if (!layout) {
              throw new Error('No layout for text content')
            }
            slides.push({
              layoutSlide: layout.baseSlideNumber,
              content: layout.elements.map((e) =>
                convertElementConfigurationToDefinition(e, { part: sectionSlide, section }),
              ),
            })
          } else {
            throw new Error(`Unsupported content type:${uniqueContentTypes[0]}`)
          }
        } else {
          console.error('Unsupported content types:', uniqueContentTypes)
        }
      }

      const lastSectionSlideLayout = layout.section?.last
      if (lastSectionSlideLayout) {
        slides.push(generateSlide(lastSectionSlideLayout, { section }))
      }
    }

    const lastDocumentSlideLayout = layout.document?.last
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
