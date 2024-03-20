/* eslint-disable unicorn/prefer-dom-node-append */
import { copyFile, rm } from 'node:fs/promises'
import path from 'node:path'

import PPTX, { type Presentation } from 'nodejs-pptx'
import {
  Automizer,
  ModifyImageHelper,
  ModifyTextHelper,
  type IMaster,
  type XmlElement,
  type ISlide,
} from 'pptx-automizer'
import { withDir } from 'tmp-promise'

import { ATTRIBUTE_NAMES, ELEMENT_TAG_NAMES } from './opendocument.js'
import type {
  PowerpointGenerationSlideConfiguration,
  PowerpointGenerationTextPlaceholder,
  PowerpointGenerationImagePlaceholder,
  PowerpointGenerationMetadata,
  PowerpointGenerationConfiguration,
  PowerpointGenerationTextLines,
} from './types.js'
import { removeAllChild } from './utils/xml-utils.js'

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
        const imagePaths = await this.buildImagePaths(configuration.slides, workingDirectory)
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

  private async buildImagePaths(slides: PowerpointGenerationSlideConfiguration[], workingDirectory: string) {
    const imageOriginalPaths = slides
      .flatMap((slide) => slide.pictures ?? [])
      .map((image) => image.path)
      .filter((value, index, array) => array.indexOf(value) === index)

    return Object.fromEntries(
      await Promise.all(
        imageOriginalPaths.map(async (image) => {
          const imageNameInWorkingDirectory = path.basename(image)
          await copyFile(image, path.join(workingDirectory, imageNameInWorkingDirectory))
          return [image, imageNameInWorkingDirectory]
        }),
      ),
    ) as Record<string, string>
  }

  private async generateEmptyPresentation(outputPath: string, metadata: PowerpointGenerationMetadata) {
    await pptx.compose(async (pres: Presentation) => {
      pres.title(metadata.title).author(metadata.author).company(metadata.company).subject(metadata.subject)
      await pres.layout('LAYOUT_WIDE').addSlide()
    })
    await pptx.save(outputPath)
  }

  private applyTextChanges(textPlaceholders: PowerpointGenerationTextPlaceholder[], slide: IMaster | ISlide) {
    for (const masterText of textPlaceholders) {
      if (masterText.content.length === 0) {
        slide.removeElement({ creationId: masterText.creationId, name: masterText.creationId })
        continue
      }
      if (typeof masterText.content === 'string') {
        slide.modifyElement(
          { creationId: masterText.creationId, name: masterText.creationId },
          ModifyTextHelper.setText(masterText.content),
        )
      } else {
        slide.modifyElement(
          { creationId: masterText.creationId, name: masterText.creationId },
          (element: XmlElement) => {
            const textBodies = element.getElementsByTagName(ELEMENT_TAG_NAMES.shapeTextBody)
            if (textBodies.length === 1) {
              const textBody = textBodies[0] as Element
              removeAllChild(textBody, ELEMENT_TAG_NAMES.paragraph)
              for (const newParagraphConfig of masterText.content as PowerpointGenerationTextLines) {
                const newParagraph = textBody.ownerDocument.createElement(ELEMENT_TAG_NAMES.paragraph)
                if (newParagraphConfig.level > 0) {
                  const paragraphProperties = textBody.ownerDocument.createElement(
                    ELEMENT_TAG_NAMES.paragraphProperties,
                  )
                  paragraphProperties.setAttribute(ATTRIBUTE_NAMES.level, newParagraphConfig.level.toString())
                  newParagraph.appendChild(paragraphProperties)
                }
                const newRange = textBody.ownerDocument.createElement(ELEMENT_TAG_NAMES.range)
                const newRangeProperties = textBody.ownerDocument.createElement(ELEMENT_TAG_NAMES.rangeProperties)
                newRangeProperties.setAttribute(ATTRIBUTE_NAMES.lang, 'en-US')
                newRangeProperties.setAttribute(ATTRIBUTE_NAMES.dirty, '0')
                newRange.appendChild(newRangeProperties)
                const newText = textBody.ownerDocument.createElement(ELEMENT_TAG_NAMES.text)
                newText.textContent = newParagraphConfig.text
                newRange.appendChild(newText)
                newParagraph.appendChild(newRange)
                textBody.appendChild(newParagraph)
              }
            }
          },
        )
      }
    }
  }

  private applyImageChanges(
    imagePlaceholders: PowerpointGenerationImagePlaceholder[],
    imagePaths: Record<string, string>,
    slide: IMaster | ISlide,
  ) {
    for (const pictureConfiguration of imagePlaceholders) {
      slide.modifyElement(
        { creationId: pictureConfiguration.creationId, name: pictureConfiguration.creationId },
        ModifyImageHelper.setRelationTarget(imagePaths[pictureConfiguration.path] as string) as (
          element: XmlElement | undefined,
          arg1: XmlElement | undefined,
        ) => void,
      )
    }
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
      this.applyTextChanges(configuration.masterTexts, master)
    })
    for (const slideConfiguration of configuration.slides) {
      presentation.addSlide(TEMPLATE_LABEL, slideConfiguration.copyOnSlide, (slide) => {
        if (slideConfiguration.texts) {
          this.applyTextChanges(slideConfiguration.texts, slide)
        }
        if (slideConfiguration.pictures) {
          this.applyImageChanges(slideConfiguration.pictures, imagePaths, slide)
        }
      })
    }
  }
}
