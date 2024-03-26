function getTextHeight(
  numberOfLines: number,
  fontSizePoints: number,
  paragraphMarginPoints: number,
  lineSpacing: number,
): number {
  return (
    numberOfLines * lineSpacing * fontSizePoints +
    paragraphMarginPoints * numberOfLines +
    paragraphMarginPoints * (numberOfLines - 1)
  )
}

/**
 * Compute text fit options that will be used to determine the font size and line spacing for a text block. It tries to
 * mimic the behavior of PowerPoint when it comes to fitting text into a shape (since when selecting "autofit" in
 * PowerPoint, scaling factor must be written in the XML).
 * @param numberOfLines The number of lines of text that will be displayed
 * @param fontSizePoints The font size in points
 * @param heightPoints The height of the shape in points
 * @param paragraphMarginPoints The margin between paragraphs in points
 * @returns The font scale (integer, undefined means no change) and line space reduction (integer, undefined means no change) that
 * should be applied to the text block
 */
export function computeTextFitOptions(
  numberOfLines: number,
  fontSizePoints: number,
  heightPoints: number,
  paragraphMarginPoints: number,
): { fontScale: number | undefined; lineSpaceReduction: number | undefined } {
  // Line height is 120% of character height + 2 pt before + 2 pt after
  const baseTextHeightPoints = getTextHeight(numberOfLines, fontSizePoints, paragraphMarginPoints, 1.2)
  if (baseTextHeightPoints <= heightPoints) {
    return {
      fontScale: undefined,
      lineSpaceReduction: 0,
    }
  }
  const scale = heightPoints / baseTextHeightPoints
  // We are trying to get the same output as Powerpoint
  const lineSpaceReduction = scale > 0.9 ? 10 : 20
  const newTextHeightPoints = getTextHeight(
    numberOfLines,
    fontSizePoints,
    paragraphMarginPoints,
    1.2 - (lineSpaceReduction - 10) / 100,
  )
  const newScale = heightPoints / newTextHeightPoints
  const fontSizeScale = Math.floor(newScale * fontSizePoints) / fontSizePoints
  return {
    fontScale: newScale < 1 ? Math.ceil(fontSizeScale * 100) : undefined,
    lineSpaceReduction,
  }
}
