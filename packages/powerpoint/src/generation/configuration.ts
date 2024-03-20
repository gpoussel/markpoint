export interface PresentationMetadata {
  title: string
  author: string
  company: string
  subject: string
}

export interface PowerpointTemplatePart {
  name: string
  creationId: string
  type: 'line' | 'picture' | 'text'
}

export interface PresentationTemplateConfiguration {
  masterParts: PowerpointTemplatePart[]
  layouts: {
    name: string
    baseSlideNumber: number
    parts: PowerpointTemplatePart[]
  }[]
}

export interface PowerpointLinePartContent {
  type: 'line'
  text: string
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

export type PowerpointPartContent = PowerpointLinePartContent | PowerpointListPartContent | PowerpointPicturePartContent

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
  template: PresentationTemplateConfiguration
  presentation: PowerpointPresentationDefinition
}
