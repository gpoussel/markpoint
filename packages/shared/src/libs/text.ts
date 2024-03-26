export interface TextPart {
  text: string
  bold: boolean
  italic: boolean
  monospace: boolean
}

export type SingleLineText = TextPart[]

export type ListLevel = 0 | 1 | 2 | 3 | 4
