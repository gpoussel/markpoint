import path from 'node:path'

import { DOMParser } from '@xmldom/xmldom'
import type JSZip from 'jszip'
import { Automizer } from 'pptx-automizer'
import type { PresTemplate } from 'pptx-automizer/dist/interfaces/pres-template'

import { getText, map } from './utils/xml-utils.js'

export interface PowerpointSlideTextElement {
  id: string
  name: string
  text?: string
}

export interface PowerpointSlide {
  id: number
  number: number
  name: string
  textElements: PowerpointSlideTextElement[]
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
    const masterFile = await readFile(jsZip, 'ppt/slideMasters/slideMaster1.xml')
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
          .filter((e) => e.type === 'sp' && e.hasTextBody)
          .map((element) => {
            return {
              id: element.id,
              name: element.name,
            }
          }),
      }
    })
  }

  findTextElementsFromMasterFile(masterFileDocument: Document): PowerpointSlideTextElement[] {
    return map(masterFileDocument.getElementsByTagName('p:sp'), (shape) => {
      const shapeProperties = shape.getElementsByTagName('p:cNvPr')
      if (shapeProperties.length === 1) {
        const shapeName = shapeProperties[0]?.getAttribute('name')
        const shapeId = shapeProperties[0]?.getAttribute('id')

        if (shapeName && shapeId) {
          return {
            id: shapeId,
            name: shapeName,
            text: getText(shape),
          }
        }
      }
      return undefined
    })
  }

  async readLayoutSlides(jsZip: JSZip, masterFileDocument: Document): Promise<PowerpointLayoutSlide[]> {
    const layoutRefIds = map(masterFileDocument.getElementsByTagName('p:sldLayoutId'), (layoutId) => {
      return layoutId.getAttribute('r:id')
    })
    const masterRefDocument = await readFile(jsZip, 'ppt/slideMasters/_rels/slideMaster1.xml.rels')
    const masterRefMapping = map(masterRefDocument.getElementsByTagName('Relationship'), (relationship) => {
      const id = relationship.getAttribute('Id')
      const layoutFile = relationship.getAttribute('Target')?.replace('../', 'ppt/')
      return {
        id,
        layoutFile,
      }
    })
    const result = await Promise.all(
      layoutRefIds.map(async (refId) => {
        const layoutFilePath = masterRefMapping.find((mapping) => mapping.id === refId)?.layoutFile
        if (!layoutFilePath) {
          return
        }
        const layoutFile = await readFile(jsZip, layoutFilePath)
        const nameTag = layoutFile.getElementsByTagName('p:cSld')
        return nameTag[0]?.getAttribute('name')
      }),
    )
    return result.filter((item): item is string => !!item).map((name, i) => ({ name, number: i + 1 }))
  }
}
