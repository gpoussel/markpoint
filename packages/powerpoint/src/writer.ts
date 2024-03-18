import { copyFile, rm } from 'node:fs/promises'
import path from 'node:path'

import PPTX, { type Presentation } from 'nodejs-pptx'
import { Automizer } from 'pptx-automizer'
import { withDir } from 'tmp-promise'

const pptx = new PPTX.Composer()

const EMPTY_FILENAME = 'Empty.pptx'
const TEMPLATE_FILENAME = 'Template.pptx'
const TEMPLATE_LABEL = 'template'
const OUTPUT_FILENAME = 'Output.pptx'

export class PowerpointWriter {
  async generate(templatePath: string, outPath: string): Promise<void> {
    return withDir(
      async (dir) => {
        const workingDirectory = dir.path
        const automizer = new Automizer({
          templateDir: workingDirectory,
          outputDir: workingDirectory,
          removeExistingSlides: true,
          autoImportSlideMasters: true,
        })

        const temlateWorkingPath = path.join(workingDirectory, TEMPLATE_FILENAME)
        const stubWorkingPath = path.join(workingDirectory, EMPTY_FILENAME)
        const outputWorkingPath = path.join(workingDirectory, OUTPUT_FILENAME)
        await copyFile(templatePath, temlateWorkingPath)

        await this.generateEmptyPresentation(stubWorkingPath)

        const pres = automizer.loadRoot(EMPTY_FILENAME).load(TEMPLATE_FILENAME, TEMPLATE_LABEL)
        pres.addSlide(TEMPLATE_LABEL, 1)
        await pres.write(OUTPUT_FILENAME)

        await copyFile(outputWorkingPath, outPath)
        await rm(outputWorkingPath)
        await rm(temlateWorkingPath)
        await rm(stubWorkingPath)
      },
      {
        unsafeCleanup: true,
      },
    )
  }

  private async generateEmptyPresentation(outputPath: string) {
    await pptx.compose(async (pres: Presentation) => {
      pres.title('Presentation Title').author('John DOE').company('Acme Inc.').subject('My Presentation')
      await pres.layout('LAYOUT_WIDE').addSlide()
    })
    await pptx.save(outputPath)
  }
}
