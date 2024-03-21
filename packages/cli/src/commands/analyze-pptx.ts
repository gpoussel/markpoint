import fs from 'node:fs/promises'

import { PowerpointReader } from '@markpoint/powerpoint'

export async function analyzePowerpoint(path: string, outputPath: string | undefined) {
  const reader = new PowerpointReader()
  const template = await reader.read(path)

  if (outputPath) {
    await fs.writeFile(outputPath, JSON.stringify(template, undefined, 2), 'utf8')
  } else {
    for (const masterSlide of template.slides) {
      // eslint-disable-next-line no-console
      console.log(masterSlide)
    }
  }
}
