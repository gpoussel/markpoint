import type { Root, PhrasingContent, Paragraph, RootContent, List, ThematicBreak, Heading } from 'mdast'

import type {
  MarkdownCodeLanguage,
  MarkdownListLevel,
  MarkdownMixedContent,
  MarkdownSection,
  MarkdownSlide,
  MarkdownTextContent,
  SingleLineText,
} from './types.js'
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
        throw new Error(`Unsupported content type at line ${node.position?.start.line} (found '${node.type}')`)
      }
    }
  })
}

function convertListToSlideContent(node: List, level: MarkdownListLevel = 0): MarkdownTextContent[] {
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
          throw new Error(`List level cannot be greater than 4 at line ${listItem.position?.start.line}`)
        }
        textContents.push(...convertListToSlideContent(child, (level + 1) as MarkdownListLevel))
      } else {
        throw new Error(`Unsupported list item child type: ${child.type} at line ${child.position?.start.line}`)
      }
    }

    return textContents
  })
}

function convertContentToSlideContent(node: RootContent, level: MarkdownListLevel = 0): MarkdownMixedContent[] {
  if (node.type === 'paragraph') {
    return [
      {
        type: 'text',
        level,
        text: convertContentToTextPart(node.children),
      },
    ]
  }
  if (node.type === 'code') {
    if (!node.lang) {
      throw new Error(`Code block language must be set at line ${node.position?.start.line}`)
    }
    let language: MarkdownCodeLanguage | undefined
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
          `Code block language is not supported at line ${node.position?.start.line} (found '${node.lang}')`,
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
    return convertListToSlideContent(node, (level + 1) as MarkdownListLevel)
  }
  throw new Error(`Unsupported node type: ${node.type} at line ${node.position?.start.line}`)
}

export function convertMarkdownSections(root: Root): MarkdownSection[] {
  const sections: MarkdownSection[] = []

  const heading2Parts = splitParts(
    root.children,
    (node): node is Heading => node.type === 'heading' && node.depth === 2,
    false,
  )
  for (const heading2Part of heading2Parts.parts) {
    const heading2 = heading2Part.splitter
    const content = heading2Part.subparts
    const heading3Parts = splitParts(
      content,
      (node): node is Heading => node.type === 'heading' && node.depth === 3,
      true,
    )

    const paragraphsOfSummary = heading3Parts.initialParts.filter(
      (node): node is Paragraph => node.type === 'paragraph',
    )
    if (paragraphsOfSummary.length !== heading3Parts.initialParts.length) {
      throw new Error(`Unsupported content type as section summary at line ${heading2.position?.start.line}`)
    }

    const summary =
      paragraphsOfSummary.length > 0
        ? convertContentToTextPart(paragraphsOfSummary.flatMap((paragraph) => paragraph.children))
        : undefined

    const slides: MarkdownSlide[] = []
    for (const heading3Part of heading3Parts.parts) {
      const slideTitle = convertContentToTextPart(heading3Part.splitter.children)
      if (heading3Part.subparts.length === 0) {
        slides.push({
          title: slideTitle,
          content: [],
        })
      } else {
        const slideParts = splitParts(
          heading3Part.subparts,
          (node): node is ThematicBreak => node.type === 'thematicBreak',
          true,
        )
        const slidesContent = [slideParts.initialParts, ...slideParts.parts.map((sp) => sp.subparts)]
        for (const slideContent of slidesContent) {
          slides.push({
            title: slideTitle,
            content: slideContent.flatMap((slideContentEntry) => convertContentToSlideContent(slideContentEntry)),
          })
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
