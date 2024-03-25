export interface TextPart {
  text: string
  bold: boolean
  italic: boolean
  monospace: boolean
}

export type SingleLineText = TextPart[]
