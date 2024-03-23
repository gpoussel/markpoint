declare module 'nodejs-pptx' {
  export interface Presentation {
    addSlide: (slide?: (Slide) => void) => Promise<void>
    layout: (
      layoutString: 'LAYOUT_4x3' | 'LAYOUT_16x9' | 'LAYOUT_16x10' | 'LAYOUT_WIDE' | 'LAYOUT_USER',
    ) => Presentation
    title: (str: string) => Presentation
    author: (str: string) => Presentation
    company: (str: string) => Presentation
    subject: (str: string) => Presentation
  }
  export interface Slide {
    addText: (text: (Text) => void) => void
  }
  export interface Text {
    value: (str: string) => void
  }
  export class Composer {
    compose(pres: (Presentation) => void): Promise<void> {
      throw new Error(pres)
    }
    save(path: string): Promise<void> {
      throw new Error(path)
    }
  }
}
