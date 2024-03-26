export interface FontTheme {
  monospace: string
}

export type ColorTheme = Record<string, string>

export class PresentationTheme {
  #font: FontTheme
  #color: ColorTheme

  public constructor(font: FontTheme, color: ColorTheme) {
    this.#font = font
    this.#color = color
  }

  public get font(): FontTheme {
    return this.#font
  }

  public get color(): ColorTheme {
    return this.#color
  }
}
