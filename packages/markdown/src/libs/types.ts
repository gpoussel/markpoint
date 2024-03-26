import type { SingleLineText } from '@markpoint/shared'
import z from 'zod'

export interface MarkdownPresentation {
  filename: string
  title: string
  metadata: FrontmatterAttributes | undefined
  sections: MarkdownSection[]
}

export interface MarkdownSection {
  title: SingleLineText
  summary: SingleLineText | undefined
  slides: MarkdownSlide[]
}

// TODO: Name "slide" is misleading, as it is actually a "slide content"
// Maybe rename to MarkdownSlideContent? or MarkdownPage? or MarkdownPart?
export interface MarkdownSlide {
  title: SingleLineText | undefined
  content: MarkdownMixedContent[]
}

export type MarkdownCodeLanguage = 'yaml' | 'json' | 'text'

export interface MarkdownCodeContent {
  type: 'code'
  language: MarkdownCodeLanguage
  code: string
}

export type MarkdownListLevel = 0 | 1 | 2 | 3 | 4

export interface MarkdownTextContent {
  type: 'text'
  level: MarkdownListLevel
  text: SingleLineText
}

export type MarkdownMixedContent = MarkdownCodeContent | MarkdownTextContent

export const FrontmatterObjectType = z.object({
  company: z.string().optional(),
  author: z.string().optional(),
  date: z.string().optional(),
  issue: z.string().optional(),
  location: z.string().optional(),
  reference: z.string().optional(),
})

export type FrontmatterAttributes = z.infer<typeof FrontmatterObjectType>
