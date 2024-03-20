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

import type {
  PowerpointGenerationConfiguration,
  PowerpointListItem,
  PowerpointPartDefinition,
  PowerpointPicturePartContent,
  PowerpointPresentationDefinition,
  PowerpointTemplatePart,
  PresentationMetadata,
} from './generation/configuration.js'
import { ATTRIBUTE_NAMES, ELEMENT_TAG_NAMES } from './opendocument.js'
import { removeAllChild } from './utils/xml-utils.js'

const pptx = new PPTX.Composer()

const EMPTY_FILENAME = 'Empty.pptx'
const TEMPLATE_FILENAME = 'Template.pptx'
const TEMPLATE_LABEL = 'template'
const OUTPUT_FILENAME = 'Output.pptx'

const updateTextList = (items: PowerpointListItem[]) => {
  return (element: XmlElement) => {
    const textBodies = element.getElementsByTagName(ELEMENT_TAG_NAMES.shapeTextBody)
    if (textBodies.length === 1) {
      const textBody = textBodies[0] as Element
      removeAllChild(textBody, ELEMENT_TAG_NAMES.paragraph)
      for (const item of items) {
        const newParagraph = textBody.ownerDocument.createElement(ELEMENT_TAG_NAMES.paragraph)
        if (item.level > 0) {
          const paragraphProperties = textBody.ownerDocument.createElement(ELEMENT_TAG_NAMES.paragraphProperties)
          paragraphProperties.setAttribute(ATTRIBUTE_NAMES.level, item.level.toString())
          newParagraph.appendChild(paragraphProperties)
        }
        const newRange = textBody.ownerDocument.createElement(ELEMENT_TAG_NAMES.range)
        const newRangeProperties = textBody.ownerDocument.createElement(ELEMENT_TAG_NAMES.rangeProperties)
        newRangeProperties.setAttribute(ATTRIBUTE_NAMES.lang, 'en-US')
        newRangeProperties.setAttribute(ATTRIBUTE_NAMES.dirty, '0')
        newRange.appendChild(newRangeProperties)
        const newText = textBody.ownerDocument.createElement(ELEMENT_TAG_NAMES.text)
        newText.textContent = item.text
        newRange.appendChild(newText)
        newParagraph.appendChild(newRange)
        textBody.appendChild(newParagraph)
      }
    }
  }
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
    const imageOriginalPaths = [...definition.master, ...definition.slides.flatMap((slide) => slide.parts)]
      .map((partDefinition) => partDefinition.content)
      .filter((partDefinition): partDefinition is PowerpointPicturePartContent => partDefinition.type === 'picture')
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
      this.fillPartContent(configuration.template.masterParts, configuration.presentation.master, master, imagePaths)
    })
    for (const slideConfiguration of configuration.presentation.slides) {
      const layout = configuration.template.layouts.find((layout) => layout.name === slideConfiguration.layout)
      if (!layout) {
        throw new Error(`Layout '${slideConfiguration.layout}' not found in template`)
      }
      presentation.addSlide(TEMPLATE_LABEL, layout.baseSlideNumber, (slide) => {
        this.fillPartContent(layout.parts, slideConfiguration.parts, slide, imagePaths)
      })
    }
  }

  private fillPartContent(
    parts: PowerpointTemplatePart[],
    definitions: PowerpointPartDefinition[],
    object: IMaster | ISlide,
    imagePaths: Record<string, string>,
  ) {
    const processedElements = new Set<string>()
    for (const definition of definitions) {
      if (processedElements.has(definition.name)) {
        throw new Error(`Part '${definition.name}' is defined multiple times`)
      }

      const part = parts.find((part) => part.name === definition.name)
      if (!part) {
        throw new Error(`Part '${definition.name}' not found in template`)
      }

      switch (part.type) {
        case 'line': {
          if (definition.content.type !== 'line') {
            throw new Error(`Part '${definition.name}' should be a line`)
          }
          object.modifyElement(
            { name: part.creationId, creationId: part.creationId },
            ModifyTextHelper.setText(definition.content.text),
          )
          break
        }
        case 'picture': {
          if (definition.content.type !== 'picture') {
            throw new Error(`Part '${definition.name}' should be a picture`)
          }
          object.modifyElement(
            { name: part.creationId, creationId: part.creationId },
            ModifyImageHelper.setRelationTarget(imagePaths[definition.content.path] as string) as (
              element: XmlElement | undefined,
              arg1: XmlElement | undefined,
            ) => void,
          )
          break
        }
        case 'text': {
          if (definition.content.type !== 'list') {
            throw new Error(`Part '${definition.name}' should be a list`)
          }
          object.modifyElement(
            { name: part.creationId, creationId: part.creationId },
            updateTextList(definition.content.items),
          )
          break
        }
        default: {
          const _never: never = part.type
          throw new Error(`Part '${part.name}' has an unknown type`, _never)
        }
      }

      processedElements.add(definition.name)
    }

    for (const part of parts) {
      if (processedElements.has(part.name)) {
        continue
      }
      if (part.type === 'picture') {
        // We currently want to keep the picture from the template even when not set in the presentation
        continue
      }

      object.removeElement({ name: part.creationId, creationId: part.creationId })
    }
  }
}
