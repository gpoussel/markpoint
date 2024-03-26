export const ELEMENT_TAG_NAMES = {
  bodyProperties: 'a:bodyPr',
  creationId: 'a16:creationId',
  extent: 'a:ext',
  latin: 'a:latin',
  normalizedAutoFit: 'a:normAutofit',
  nonVisualDrawingProperties: 'p:cNvPr',
  offset: 'a:off',
  paragraph: 'a:p',
  paragraphProperties: 'a:pPr',
  range: 'a:r',
  rangeProperties: 'a:rPr',
  relationships: 'Relationship',
  rgbColor: 'a:srgbClr',
  shape: 'p:sp',
  shapeAutoFit: 'a:spAutoFit',
  shapeProperties: 'p:spPr',
  shapeTextBody: 'p:txBody',
  spacingBefore: 'a:spcBef',
  spacingAfter: 'a:spcAft',
  spacingPoints: 'a:spcPts',
  slide: 'p:cSld',
  slideLayoutId: 'p:sldLayoutId',
  solidFill: 'a:solidFill',
  text: 'a:t',
  transform: 'a:xfrm',
}

export const XML_FILE_NAMES = {
  master1: 'ppt/slideMasters/slideMaster1.xml',
  master1Relationships: 'ppt/slideMasters/_rels/slideMaster1.xml.rels',
}

export const ATTRIBUTE_NAMES = {
  after: 'a:after',
  before: 'a:before',
  creationIdId: 'id',
  cx: 'cx',
  cy: 'cy',
  dirty: 'dirty',
  id: 'Id',
  lang: 'lang',
  level: 'lvl',
  relationshipId: 'Id',
  relationshipTarget: 'Target',
  shapePropertiesId: 'id',
  shapePropertiesName: 'name',
  slideLayoutIdId: 'r:id',
  slideName: 'name',
  x: 'x',
  y: 'y',
  val: 'val',
}

export const SLIDE_ELEMENT_TYPES = {
  shape: 'sp',
  picture: 'pic',
}

export const EMU_PER_CENTIMETER = 360_000
export const DOT_PER_INCH = 72

function toNumber(emu: number | string | undefined | null) {
  if (emu === undefined || emu === null) {
    return 0
  }
  if (typeof emu === 'string') {
    return Number.parseInt(emu)
  }
  return emu
}

export function centimetersToEmu(centimeters: number) {
  return centimeters * EMU_PER_CENTIMETER
}

export function emuToCentimeters(emu: number | string | undefined | null) {
  return toNumber(emu) / EMU_PER_CENTIMETER
}

export function pointsToEmu(points: number) {
  return (points / DOT_PER_INCH) * 2.54 * EMU_PER_CENTIMETER
}

export function emuToPoints(emu: number | string | undefined | null) {
  return (toNumber(emu) / EMU_PER_CENTIMETER / 2.54) * DOT_PER_INCH
}
