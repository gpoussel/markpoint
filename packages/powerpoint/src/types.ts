export interface PowerpointMasterTemplate {
  masterTextElements: PowerpointSlideTextElement[]
  layoutSlides: PowerpointLayoutSlide[]
  slides: PowerpointSlide[]
}

export interface PowerpointLocation {
  x: number
  y: number
  width: number
  height: number
}

export interface PowerpointSlideTextElement extends PowerpointLocation {
  id: string
  creationId?: string | undefined
  name: string
  text?: string
}

export interface PowerpointLayoutSlide {
  name: string
  number: number
}

export interface PowerpointSlide {
  id: number
  number: number
  name: string
  textElements: PowerpointSlideTextElement[]
  pictures: PowerpointSlidePictureElement[]
}

export interface PowerpointSlidePictureElement extends PowerpointLocation {
  id: string
  name: string
}
