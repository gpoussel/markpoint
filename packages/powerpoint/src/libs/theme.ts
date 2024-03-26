export interface FontTheme {
  monospace: string
}

export interface SizeTheme {
  codeLines: number
}

export type ColorTheme = Record<string, string>

export class PresentationTheme {
  #font: FontTheme
  #color: ColorTheme
  #size: SizeTheme

  public constructor(font: FontTheme, color: ColorTheme, size: SizeTheme) {
    this.#font = font
    this.#color = color
    this.#size = size
  }

  public get font(): FontTheme {
    return this.#font
  }

  public get color(): ColorTheme {
    return this.#color
  }

  public get size(): SizeTheme {
    return this.#size
  }
}
