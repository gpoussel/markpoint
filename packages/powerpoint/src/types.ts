export interface PowerpointSlideTextElement {
  id: string
  creationId?: string | undefined
  name: string
  text?: string
}

export interface PowerpointSlidePictureElement {
  id: string
  name: string
  x: number
  y: number
  width: number
  height: number
}

export interface PowerpointSlide {
  id: number
  number: number
  name: string
  textElements: PowerpointSlideTextElement[]
  pictures: PowerpointSlidePictureElement[]
}

export interface PowerpointMasterTemplate {
  masterTextElements: PowerpointSlideTextElement[]
  layoutSlides: PowerpointLayoutSlide[]
  slides: PowerpointSlide[]
}

export interface PowerpointLayoutSlide {
  name: string
  number: number
}

export interface PowerpointGenerationSlideConfiguration {
  copyOnSlide: number
  texts?: PowerpointGenerationTextPlaceholder[]
  pictures?: PowerpointGenerationImagePlaceholder[]
}

export type PowerpointGenerationTextLines = {
  text: string
  level: number
}[]

export interface PowerpointGenerationTextPlaceholder {
  creationId: string
  content: string | PowerpointGenerationTextLines
}

export interface PowerpointGenerationImagePlaceholder {
  creationId: string
  path: string
}

export interface PowerpointGenerationMetadata {
  title: string
  author: string
  company: string
  subject: string
}

export interface PowerpointGenerationConfiguration {
  metadata: PowerpointGenerationMetadata
  masterTexts: PowerpointGenerationTextPlaceholder[]
  slides: PowerpointGenerationSlideConfiguration[]
}
