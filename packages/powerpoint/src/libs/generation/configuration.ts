import type { PowerpointTemplateConfiguration } from '@markpoint/shared'

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

export type PowerpointCodeLanguage = 'json' | 'yaml'

export interface PowerpointCodePartContent {
  type: 'code'
  language: PowerpointCodeLanguage
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
  layout: string
  parts: PowerpointPartDefinition[]
}

export interface PowerpointPresentationDefinition {
  master: PowerpointPartDefinition[]
  slides: PowerpointSlidesConfiguration[]
}

export interface PowerpointGenerationConfiguration {
  metadata: PresentationMetadata
  template: PowerpointTemplateConfiguration
  presentation: PowerpointPresentationDefinition
}
