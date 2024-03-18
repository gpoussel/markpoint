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
  slides: PowerpointSlide[]
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
    return {
      masterTextElements: await this.readTextElementsFromMasterFile(jsZip),
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

  async readTextElementsFromMasterFile(jsZip: JSZip): Promise<PowerpointSlideTextElement[]> {
    const masterFile = jsZip.files['ppt/slideMasters/slideMaster1.xml']
    if (!masterFile) {
      return []
    }
    const masterContent = await masterFile.async('text')
    const domParser = new DOMParser()
    const document = domParser.parseFromString(masterContent)
    return map(document.getElementsByTagName('p:sp'), (shape) => {
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
}
