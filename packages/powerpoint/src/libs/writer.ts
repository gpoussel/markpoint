import { copyFile, rm } from 'node:fs/promises'
import path from 'node:path'

import type { TemplateElementDefinition } from '@markpoint/shared'
import PPTX, { type Presentation } from 'nodejs-pptx'
import { Automizer, ModifyImageHelper, type IMaster, type XmlElement, type ISlide } from 'pptx-automizer'
import { withDir } from 'tmp-promise'

import type {
  PowerpointGenerationConfiguration,
  PowerpointPresentationDefinition,
  PresentationMetadata,
} from './generation/configuration.js'
import { setSingleLineText, setTextBlock } from './generation/text.js'

const pptx = new PPTX.Composer()

const EMPTY_FILENAME = 'Empty.pptx'
const TEMPLATE_FILENAME = 'Template.pptx'
const TEMPLATE_LABEL = 'template'
const OUTPUT_FILENAME = 'Output.pptx'

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
          mediaDir: workingDirectory,
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
        const imagePaths = await this.buildImagePaths(configuration.presentation, workingDirectory)
        this.generatePresentation(automizer, configuration, imagePaths)
        await automizer.write(OUTPUT_FILENAME)

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

  private async buildImagePaths(definition: PowerpointPresentationDefinition, workingDirectory: string) {
    // eslint-disable-next-line no-console
    console.log({ definition, workingDirectory })
    return await new Promise<Record<string, string>>((resolve) => resolve({}))
    // const imageOriginalPaths = definition.slides
    //   .flatMap((slide) => slide.parts)
    //   .map((partDefinition) => partDefinition.content)
    //   .filter((partDefinition): partDefinition is PowerpointPicturePartContent => partDefinition.type === 'picture')
    //   .map((image) => image.path)
    //   .filter((value, index, array) => array.indexOf(value) === index)
    // return Object.fromEntries(
    //   await Promise.all(
    //     imageOriginalPaths.map(async (image) => {
    //       const imageNameInWorkingDirectory = path.basename(image)
    //       await copyFile(image, path.join(workingDirectory, imageNameInWorkingDirectory))
    //       return [image, imageNameInWorkingDirectory]
    //     }),
    //   ),
    // ) as Record<string, string>
  }

  private async generateEmptyPresentation(outputPath: string, metadata: PresentationMetadata) {
    await pptx.compose(async (pres: Presentation) => {
      pres.title(metadata.title).author(metadata.author).company(metadata.company).subject(metadata.subject)
      await pres.layout('LAYOUT_WIDE').addSlide()
    })
    await pptx.save(outputPath)
  }

  private generatePresentation(
    automizer: Automizer,
    configuration: PowerpointGenerationConfiguration,
    imagePaths: Record<string, string>,
  ) {
    const presentation = automizer.loadRoot(EMPTY_FILENAME).load(TEMPLATE_FILENAME, TEMPLATE_LABEL)
    for (const name of Object.values(imagePaths)) {
      presentation.loadMedia(name)
    }
    presentation.addMaster(TEMPLATE_LABEL, 1, (master) => {
      this.fillPartContent(configuration.template.master.elements, master, imagePaths)
    })
    for (const slideConfiguration of configuration.presentation.slides) {
      presentation.addSlide(TEMPLATE_LABEL, slideConfiguration.layoutSlide, (slide) => {
        this.fillPartContent(slideConfiguration.content, slide, imagePaths)
      })
    }
  }

  private fillPartContent(
    parts: TemplateElementDefinition[],
    object: IMaster | ISlide,
    imagePaths: Record<string, string>,
  ) {
    for (const part of parts) {
      if (part.type === 'text') {
        object.modifyElement({ name: part.creationId, creationId: part.creationId }, setSingleLineText(part.text))
      } else if (part.type === 'textBlock') {
        object.modifyElement({ name: part.creationId, creationId: part.creationId }, setTextBlock(part.lines))
      } else {
        object.modifyElement(
          { name: part.creationId, creationId: part.creationId },
          ModifyImageHelper.setRelationTarget(imagePaths[part.path] as string) as (
            element: XmlElement | undefined,
            arg1: XmlElement | undefined,
          ) => void,
        )
      }

      // object.removeElement({ name: part.creationId, creationId: part.creationId })
    }
  }
}
