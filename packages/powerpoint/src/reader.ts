import path from 'node:path'

import { DOMParser } from '@xmldom/xmldom'
import type JSZip from 'jszip'
import { Automizer } from 'pptx-automizer'
import type { PresTemplate } from 'pptx-automizer/dist/interfaces/pres-template'

import { getText, map } from './utils/xml-utils.js'

const ELEMENT_TAG_NAMES = {
  creationId: 'a16:creationId',
  nonVisualDrawingProperties: 'p:cNvPr',
  relationships: 'Relationship',
  shape: 'p:sp',
  slide: 'p:cSld',
  slideLayoutId: 'p:sldLayoutId',
}

const XML_FILE_NAMES = {
  master1: 'ppt/slideMasters/slideMaster1.xml',
  master1Relationships: 'ppt/slideMasters/_rels/slideMaster1.xml.rels',
}

const ATTRIBUTE_NAMES = {
  creationIdId: 'id',
  id: 'Id',
  slideLayoutIdId: 'r:id',
  slideName: 'name',
  relationshipId: 'Id',
  relationshipTarget: 'Target',
  shapePropertiesId: 'id',
  shapePropertiesName: 'name',
}

const SLIDE_ELEMENT_TYPES = {
  shape: 'sp',
  picture: 'pic',
}

export interface PowerpointSlideTextElement {
  id: string
  creationId?: string | undefined
  name: string
  text?: string
}

export interface PowerpointSlidePictureElement {
  id: string
  name: string
  x: number
  y: number
  width: number
  height: number
}

export interface PowerpointSlide {
  id: number
  number: number
  name: string
  textElements: PowerpointSlideTextElement[]
  pictures: PowerpointSlidePictureElement[]
}

export interface PowerpointMasterTemplate {
  masterTextElements: PowerpointSlideTextElement[]
  layoutSlides: PowerpointLayoutSlide[]
  slides: PowerpointSlide[]
}

export interface PowerpointLayoutSlide {
  name: string
  number: number
}

const EMU_PER_CENTIMETER = 360_000

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
            }
          }),
        pictures: slideId.elements
          .filter((e) => e.type === SLIDE_ELEMENT_TYPES.picture)
          .map((element) => {
            return {
              id: element.id,
              name: element.name,
              x: element.position.x / EMU_PER_CENTIMETER,
              y: element.position.y / EMU_PER_CENTIMETER,
              width: element.position.cx / EMU_PER_CENTIMETER,
              height: element.position.cy / EMU_PER_CENTIMETER,
            }
          }),
      }
    })
  }

  findTextElementsFromMasterFile(masterFileDocument: Document): PowerpointSlideTextElement[] {
    return map(masterFileDocument.getElementsByTagName(ELEMENT_TAG_NAMES.shape), (shape) => {
      const shapeProperties = shape.getElementsByTagName(ELEMENT_TAG_NAMES.nonVisualDrawingProperties)
      if (shapeProperties.length === 1 && shapeProperties[0]) {
        const shapeName = shapeProperties[0].getAttribute(ATTRIBUTE_NAMES.shapePropertiesName)
        const shapeId = shapeProperties[0].getAttribute(ATTRIBUTE_NAMES.shapePropertiesId)

        const creationId =
          shapeProperties[0]
            .getElementsByTagName(ELEMENT_TAG_NAMES.creationId)[0]
            ?.getAttribute(ATTRIBUTE_NAMES.creationIdId) ?? undefined

        if (shapeName && shapeId) {
          return {
            id: shapeId,
            creationId,
            name: shapeName,
            text: getText(shape),
          }
        }
      }
      return undefined
    })
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
