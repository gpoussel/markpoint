import type { CodeLanguage } from './code.js'
import type { ListLevel, SingleLineText } from './text.js'

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

export type TemplateElementDefinition =
  | TemplateTextElementDefinition
  | TemplatePictureElementDefinition
  | TemplateTextBlockElementDefinition
  | TemplateCodeBlockElementDefinition

interface BaseTemplateElementDefinition {
  creationId: string
}

export interface TemplateTextElementDefinition extends BaseTemplateElementDefinition {
  type: 'text'
  text: SingleLineText
}

export interface TemplateTextBlockElementDefinition extends BaseTemplateElementDefinition {
  type: 'textBlock'
  lines: {
    level: ListLevel
    text: SingleLineText
  }[]
}

export interface TemplateCodeBlockElementDefinition extends BaseTemplateElementDefinition {
  type: 'codeBlock'
  language: CodeLanguage
  code: string
}

export interface TemplatePictureElementDefinition extends BaseTemplateElementDefinition {
  type: 'picture'
  path: string
}
