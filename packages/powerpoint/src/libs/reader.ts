import path from 'node:path'

import { DOMParser } from '@xmldom/xmldom'
import type JSZip from 'jszip'
import { Automizer } from 'pptx-automizer'
import type { PresTemplate } from 'pptx-automizer/dist/interfaces/pres-template'
import type { ElementInfo } from 'pptx-automizer/dist/types/xml-types.js'

import {
  ELEMENT_TAG_NAMES,
  XML_FILE_NAMES,
  ATTRIBUTE_NAMES,
  SLIDE_ELEMENT_TYPES,
  EMU_PER_CENTIMETER,
} from './opendocument.js'
import type {
  PowerpointSlideTextElement,
  PowerpointMasterTemplate,
  PowerpointLayoutSlide,
  PowerpointLocation,
} from './types.js'
import { getElementByTagNameRecursive, getText, map } from './utils/xml-utils.js'

const DOM_PARSER = new DOMParser()
async function readFile(jsZip: JSZip, path: string): Promise<Document> {
  const file = jsZip.files[path]
  if (!file) {
    throw new Error(`Unable to find file in archive (${path})`)
  }
  const content = await file.async('text')
  return DOM_PARSER.parseFromString(content)
}

export class PowerpointReader {
  async read(templatePath: string): Promise<PowerpointMasterTemplate> {
    const automizer = new Automizer({
      templateDir: path.dirname(templatePath),
      removeExistingSlides: true,
      autoImportSlideMasters: true,
    })

    const templateName = 'Template'
    const pres = automizer.loadRoot(path.basename(templatePath)).load(path.basename(templatePath), templateName)
    const mainTemplate = pres.getTemplate(templateName)
    const jsZip = await pres.getJSZip()
    const masterFile = await readFile(jsZip, XML_FILE_NAMES.master1)
    return {
      masterTextElements: this.findTextElementsFromMasterFile(masterFile),
      layoutSlides: await this.readLayoutSlides(jsZip, masterFile),
      slides: await this.readSlides(mainTemplate),
    }
  }

  async readSlides(mainTemplate: PresTemplate) {
    const slideIds = await mainTemplate.setCreationIds()
    return slideIds.map((slideId) => {
      return {
        id: slideId.id,
        number: slideId.number,
        name: slideId.info.name,
        textElements: slideId.elements
          .filter((e) => e.type === SLIDE_ELEMENT_TYPES.shape && e.hasTextBody)
          .map((element) => {
            return {
              id: element.id,
              name: element.name,
              text: getText(element.getXmlElement()),
              ...this.getPosition(element),
            }
          }),
        pictures: slideId.elements
          .filter((e) => e.type === SLIDE_ELEMENT_TYPES.picture)
          .map((element) => {
            return {
              id: element.id,
              name: element.name,
              ...this.getPosition(element),
            }
          }),
      }
    })
  }

  findTextElementsFromMasterFile(masterFileDocument: Document): PowerpointSlideTextElement[] {
    return map(masterFileDocument.getElementsByTagName(ELEMENT_TAG_NAMES.shape), (shape) => {
      const shapeNonVisualProperties = getElementByTagNameRecursive(shape, ELEMENT_TAG_NAMES.nonVisualDrawingProperties)
      if (!shapeNonVisualProperties) {
        return undefined
      }
      const shapeName = shapeNonVisualProperties.getAttribute(ATTRIBUTE_NAMES.shapePropertiesName)
      const shapeId = shapeNonVisualProperties.getAttribute(ATTRIBUTE_NAMES.shapePropertiesId)
      if (!shapeName || !shapeId) {
        return undefined
      }
      const creationIdTag = getElementByTagNameRecursive(shapeNonVisualProperties, ELEMENT_TAG_NAMES.creationId)
      const creationId = creationIdTag?.getAttribute(ATTRIBUTE_NAMES.creationIdId) ?? undefined

      const offsetTag = getElementByTagNameRecursive(
        shape,
        ELEMENT_TAG_NAMES.shapeProperties,
        ELEMENT_TAG_NAMES.transform,
        ELEMENT_TAG_NAMES.offset,
      )
      const extentTag = getElementByTagNameRecursive(
        shape,
        ELEMENT_TAG_NAMES.shapeProperties,
        ELEMENT_TAG_NAMES.transform,
        ELEMENT_TAG_NAMES.extent,
      )
      return {
        id: shapeId,
        creationId,
        name: shapeName,
        text: getText(shape),
        ...this.getPositionFromOffsetExtent(offsetTag, extentTag),
      }
    })
  }

  getPosition(element: ElementInfo): PowerpointLocation {
    return {
      x: element.position.x / EMU_PER_CENTIMETER,
      y: element.position.y / EMU_PER_CENTIMETER,
      width: element.position.cx / EMU_PER_CENTIMETER,
      height: element.position.cy / EMU_PER_CENTIMETER,
    }
  }

  getPositionFromOffsetExtent(offset: Element | undefined, extent: Element | undefined): PowerpointLocation {
    return {
      x: Number.parseInt(offset?.getAttribute(ATTRIBUTE_NAMES.x) ?? '0') / EMU_PER_CENTIMETER,
      y: Number.parseInt(offset?.getAttribute(ATTRIBUTE_NAMES.y) ?? '0') / EMU_PER_CENTIMETER,
      width: Number.parseInt(extent?.getAttribute(ATTRIBUTE_NAMES.cx) ?? '0') / EMU_PER_CENTIMETER,
      height: Number.parseInt(extent?.getAttribute(ATTRIBUTE_NAMES.cy) ?? '0') / EMU_PER_CENTIMETER,
    }
  }

  async readLayoutSlides(jsZip: JSZip, masterFileDocument: Document): Promise<PowerpointLayoutSlide[]> {
    const layoutRefIds = map(masterFileDocument.getElementsByTagName(ELEMENT_TAG_NAMES.slideLayoutId), (layoutId) => {
      return layoutId.getAttribute(ATTRIBUTE_NAMES.slideLayoutIdId)
    })
    const masterRefDocument = await readFile(jsZip, XML_FILE_NAMES.master1Relationships)
    const masterRefMapping = map(
      masterRefDocument.getElementsByTagName(ELEMENT_TAG_NAMES.relationships),
      (relationship) => {
        const id = relationship.getAttribute(ATTRIBUTE_NAMES.relationshipId)
        const layoutFile = relationship.getAttribute(ATTRIBUTE_NAMES.relationshipTarget)?.replace('../', 'ppt/')
        return {
          id,
          layoutFile,
        }
      },
    )
    const result = await Promise.all(
      layoutRefIds.map(async (refId) => {
        const layoutFilePath = masterRefMapping.find((mapping) => mapping.id === refId)?.layoutFile
        if (!layoutFilePath) {
          return
        }
        const layoutFile = await readFile(jsZip, layoutFilePath)
        const nameTag = layoutFile.getElementsByTagName(ELEMENT_TAG_NAMES.slide)
        return nameTag[0]?.getAttribute(ATTRIBUTE_NAMES.slideName)
      }),
    )
    return result.filter((item): item is string => !!item).map((name, i) => ({ name, number: i + 1 }))
  }
}
