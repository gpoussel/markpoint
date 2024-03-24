export interface TemplateDefinition {
  master: {
    elements: TemplateElementDefinition[]
  }
  layouts: TemplateLayoutDefinition[]
}

export interface TemplateLayoutDefinition {
  name: string
  baseSlideNumber: number
  elements: TemplateElementDefinition[]
}

export type TemplateElementDefinition = TemplateTextElementDefinition | TemplatePictureElementDefinition

interface BaseTemplateElementDefinition {
  creationId: string
}

export interface TemplateTextElementDefinition extends BaseTemplateElementDefinition {
  type: 'text'
  text: string
}

export interface TemplatePictureElementDefinition extends BaseTemplateElementDefinition {
  type: 'picture'
  path: string
}
