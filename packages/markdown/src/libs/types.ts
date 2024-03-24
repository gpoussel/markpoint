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

export interface MarkdownSlide {
  title: SingleLineText
  content: MarkdownMixedContent[]
}

export interface TextPart {
  text: string
  bold: boolean
  italic: boolean
  monospace: boolean
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

export type SingleLineText = TextPart[]

export const FrontmatterObjectType = z.object({
  company: z.string().optional(),
  author: z.string().optional(),
  date: z.string().optional(),
  issue: z.string().optional(),
  location: z.string().optional(),
  reference: z.string().optional(),
})

export type FrontmatterAttributes = z.infer<typeof FrontmatterObjectType>
