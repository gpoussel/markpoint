export interface FontTheme {
  monospace: string
}

export class PresentationTheme {
  #font: FontTheme

  public constructor(font: FontTheme) {
    this.#font = font
  }

  public get font(): FontTheme {
    return this.#font
  }
}
