import { copyFile, rm } from 'node:fs/promises'
import path from 'node:path'

import PPTX, { type Presentation } from 'nodejs-pptx'
import { Automizer, ModifyImageHelper, ModifyTextHelper, type XmlElement } from 'pptx-automizer'
import { withDir } from 'tmp-promise'

const pptx = new PPTX.Composer()

const EMPTY_FILENAME = 'Empty.pptx'
const TEMPLATE_FILENAME = 'Template.pptx'
const TEMPLATE_LABEL = 'template'
const OUTPUT_FILENAME = 'Output.pptx'

export interface PowerpointGenerationSlideConfiguration {
  copyOnSlide: number
  texts?: PowerpointGenerationTextPlaceholder[]
  pictures?: PowerpointGenerationImagelaceholder[]
}

export interface PowerpointGenerationTextPlaceholder {
  creationId: string
  content: string
}

export interface PowerpointGenerationImagelaceholder {
  creationId: string
  path: string
}

export interface PowerpointGenerationMetadata {
  title: string
  author: string
  company: string
  subject: string
}

export interface PowerpointGenerationConfiguration {
  metadata: PowerpointGenerationMetadata
  masterTexts: PowerpointGenerationTextPlaceholder[]
  slides: PowerpointGenerationSlideConfiguration[]
}

export class PowerpointWriter {
  async generate(
    templatePath: string,
    configuration: PowerpointGenerationConfiguration,
    outPath: string,
  ): Promise<void> {
    return withDir(
      async (dir) => {
        const workingDirectory = dir.path
        const automizer = new Automizer({
          templateDir: workingDirectory,
          outputDir: workingDirectory,
          removeExistingSlides: true,
          autoImportSlideMasters: true,
          cleanup: true,
          compression: 9,
        })

        const temlateWorkingPath = path.join(workingDirectory, TEMPLATE_FILENAME)
        const stubWorkingPath = path.join(workingDirectory, EMPTY_FILENAME)
        const outputWorkingPath = path.join(workingDirectory, OUTPUT_FILENAME)
        await copyFile(templatePath, temlateWorkingPath)

        await this.generateEmptyPresentation(stubWorkingPath, configuration.metadata)

        const presentation = automizer.loadRoot(EMPTY_FILENAME).load(TEMPLATE_FILENAME, TEMPLATE_LABEL)
        presentation.addMaster(TEMPLATE_LABEL, 1, (master) => {
          for (const masterText of configuration.masterTexts) {
            master.modifyElement(
              { creationId: masterText.creationId, name: masterText.creationId },
              ModifyTextHelper.setText(masterText.content),
            )
          }
        })
        for (const slideConfiguration of configuration.slides) {
          presentation.addSlide(TEMPLATE_LABEL, slideConfiguration.copyOnSlide, (slide) => {
            if (slideConfiguration.texts) {
              for (const textConfiguration of slideConfiguration.texts) {
                slide.modifyElement(
                  { creationId: textConfiguration.creationId, name: textConfiguration.creationId },
                  ModifyTextHelper.setText(textConfiguration.content),
                )
              }
            }
            if (slideConfiguration.pictures) {
              for (const pictureConfiguration of slideConfiguration.pictures) {
                const imageFolder = path.dirname(pictureConfiguration.path)
                const imageName = path.basename(pictureConfiguration.path)
                presentation.loadMedia(imageName, imageFolder)
                slide.modifyElement(
                  { creationId: pictureConfiguration.creationId, name: pictureConfiguration.creationId },
                  ModifyImageHelper.setRelationTarget(imageName) as (
                    element: XmlElement | undefined,
                    arg1: XmlElement | undefined,
                  ) => void,
                )
              }
            }
          })
        }
        await presentation.write(OUTPUT_FILENAME)

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

  private async generateEmptyPresentation(outputPath: string, metadata: PowerpointGenerationMetadata) {
    await pptx.compose(async (pres: Presentation) => {
      pres.title(metadata.title).author(metadata.author).company(metadata.company).subject(metadata.subject)
      await pres.layout('LAYOUT_WIDE').addSlide()
    })
    await pptx.save(outputPath)
  }
}
