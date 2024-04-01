import type { CodeLanguage, ListLevel, SingleLineText } from '@markpoint/shared'
import type { Root, PhrasingContent, Paragraph, RootContent, List, ThematicBreak, Heading } from 'mdast'

import type { MarkdownMixedContent, MarkdownSection, MarkdownSlide, MarkdownTextContent } from './types.js'
import { splitParts } from './utils.js'

interface TextPartStyle {
  bold: boolean
  italic: boolean
  monospace: boolean
  url: string | undefined
}
const DEFAULT_TEXT_PART_STYLE: TextPartStyle = { bold: false, italic: false, monospace: false, url: undefined }

function convertContentToTextPart(
  nodes: PhrasingContent[],
  inheritedStyle: TextPartStyle = DEFAULT_TEXT_PART_STYLE,
): SingleLineText {
  return nodes.flatMap((node: PhrasingContent) => {
    switch (node.type) {
      case 'text': {
        return [{ text: node.value, ...inheritedStyle }]
      }
      case 'inlineCode': {
        return [{ text: node.value, ...inheritedStyle, monospace: true }]
      }
      case 'strong': {
        return convertContentToTextPart(node.children, { ...inheritedStyle, bold: true })
      }
      case 'emphasis': {
        return convertContentToTextPart(node.children, { ...inheritedStyle, italic: true })
      }
      case 'link': {
        return convertContentToTextPart(node.children, { ...inheritedStyle, url: node.url })
      }
      default: {
        throw new Error(
          `Markdown error: unsupported content type at line ${node.position?.start.line} (found '${node.type}')`,
        )
      }
    }
  })
}

function convertListToSlideContent(node: List, level: ListLevel = 0): MarkdownTextContent[] {
  return node.children.flatMap((listItem) => {
    const textContents: MarkdownTextContent[] = []
    for (const child of listItem.children) {
      if (child.type === 'paragraph') {
        textContents.push({
          type: 'text',
          level,
          text: convertContentToTextPart(child.children),
        })
      } else if (child.type === 'list') {
        if (level === 4) {
          throw new Error(
            `Markdown error: list level cannot be greater than 4 at line ${listItem.position?.start.line}`,
          )
        }
        textContents.push(...convertListToSlideContent(child, (level + 1) as ListLevel))
      } else {
        throw new Error(
          `Markdown error: unsupported list item child type: ${child.type} at line ${child.position?.start.line}`,
        )
      }
    }

    return textContents
  })
}

function convertContentToSlideContent(node: RootContent, level: ListLevel = 0): MarkdownMixedContent[] {
  if (node.type === 'paragraph') {
    if (node.children.length === 1) {
      const firstChild = node.children[0] as PhrasingContent
      if (firstChild.type === 'image') {
        return [
          {
            type: 'image',
            path: firstChild.url,
            alt: firstChild.alt ?? undefined,
          },
        ]
      }
    }
    return [
      {
        type: 'text',
        level,
        text: convertContentToTextPart(node.children),
      },
    ]
  }
  if (node.type === 'code') {
    let language: CodeLanguage | undefined
    switch (node.lang) {
      case 'yaml':
      case 'yml': {
        language = 'yaml'
        break
      }
      case 'json': {
        language = 'json'
        break
      }
      case 'text': {
        language = 'text'
        break
      }
      default: {
        throw new Error(
          `Markdown error: code block language is not supported at line ${node.position?.start.line} (found '${node.lang}')`,
        )
      }
    }
    return [
      {
        type: 'code',
        language,
        code: node.value,
      },
    ]
  }
  if (node.type === 'list') {
    return convertListToSlideContent(node, (level + 1) as ListLevel)
  }
  throw new Error(`Markdown error: unsupported node type: ${node.type} at line ${node.position?.start.line}`)
}

export function convertMarkdownSections(root: Root): MarkdownSection[] {
  const sections: MarkdownSection[] = []

  const heading2Parts = splitParts(
    root.children,
    (node): node is Heading => node.type === 'heading' && node.depth === 2,
  )
  if (heading2Parts.initialParts.length > 0) {
    throw new Error(`Markdown error: unsupported content type before first section`)
  }

  for (const heading2Part of heading2Parts.parts) {
    const heading2 = heading2Part.splitter
    const content = heading2Part.subparts
    const heading3Parts = splitParts(content, (node): node is Heading => node.type === 'heading' && node.depth === 3)

    let summary: SingleLineText | undefined
    const slides: MarkdownSlide[] = []
    if (heading3Parts.parts.length === 0) {
      // When no heading 3 is found, the section is considered as a single slide (and no summary)
      slides.push({
        title: undefined,
        content: heading3Parts.initialParts.flatMap((slideContentEntry) =>
          convertContentToSlideContent(slideContentEntry),
        ),
      })
    } else {
      const paragraphsOfSummary = heading3Parts.initialParts.filter(
        (node): node is Paragraph => node.type === 'paragraph',
      )
      if (paragraphsOfSummary.length !== heading3Parts.initialParts.length) {
        throw new Error(
          `Markdown error: unsupported content type as section summary at line ${heading2.position?.start.line} (found ${heading3Parts.initialParts.length} initial parts, ${paragraphsOfSummary.length} paragraphs)`,
        )
      }
      if (paragraphsOfSummary.length > 0) {
        summary = convertContentToTextPart(paragraphsOfSummary.flatMap((paragraph) => paragraph.children))
      }

      for (const heading3Part of heading3Parts.parts) {
        const genericSlideTitle = convertContentToTextPart(heading3Part.splitter.children)
        const slideParts = splitParts(
          heading3Part.subparts,
          (node): node is ThematicBreak => node.type === 'thematicBreak',
        )
        const slidesContent = [slideParts.initialParts, ...slideParts.parts.map((sp) => sp.subparts)]
        const totalNumberOfSlides = slidesContent.length
        let i = 1
        for (const slideContent of slidesContent) {
          const slideTitle: SingleLineText =
            totalNumberOfSlides > 1
              ? [
                  ...genericSlideTitle,
                  {
                    text: ` (${i}/${totalNumberOfSlides})`,
                    ...DEFAULT_TEXT_PART_STYLE,
                  },
                ]
              : genericSlideTitle
          slides.push({
            title: slideTitle,
            content: slideContent.flatMap((slideContentEntry) => convertContentToSlideContent(slideContentEntry)),
          })
          ++i
        }
      }
    }

    sections.push({
      title: convertContentToTextPart(heading2.children),
      summary,
      slides,
    })
  }

  return sections
}
