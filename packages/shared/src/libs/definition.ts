export interface TemplateDefinition {
  master: {
    elements: TemplateElementDefunition[]
  }
  layouts: TemplateLayoutDefinition[]
}

export interface TemplateLayoutDefinition {
  name: string
  baseSlideNumber: number
  elements: TemplateElementDefunition[]
}

export interface TemplateElementDefunition {
  name: string
  creationId: string
  type: 'line' | 'picture' | 'text'
}
