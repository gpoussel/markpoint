import type { TemplateElementDefinition, TemplateDefinition, CodeLanguage } from '@markpoint/shared'

export interface PresentationMetadata {
  title: string
  author: string
  company: string
  subject: string
}

export interface PowerpointLinePartContent {
  type: 'line'
  text: string
}

export interface PowerpointCodePartContent {
  type: 'code'
  language: CodeLanguage
  code: string
}

export interface PowerpointListItem {
  text: string
  level: 0 | 1 | 2 | 3 | 4
}

export interface PowerpointListPartContent {
  type: 'list'
  items: PowerpointListItem[]
}

export interface PowerpointPicturePartContent {
  type: 'picture'
  path: string
}

export type PowerpointPartContent =
  | PowerpointLinePartContent
  | PowerpointListPartContent
  | PowerpointPicturePartContent
  | PowerpointCodePartContent

export interface PowerpointPartDefinition {
  name: string
  content: PowerpointPartContent
}

export interface PowerpointSlidesConfiguration {
  layoutSlide: number
  content: TemplateElementDefinition[]
}

export interface PowerpointPresentationDefinition {
  slides: PowerpointSlidesConfiguration[]
}

export interface PowerpointGenerationConfiguration {
  metadata: PresentationMetadata
  template: TemplateDefinition
  presentation: PowerpointPresentationDefinition
}
