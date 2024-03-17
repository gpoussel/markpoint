import path from 'node:path'

import { Automizer } from 'pptx-automizer'

export interface PowerpointMasterSlideTextElement {
  id: string
  name: string
}

export interface PowerpointMasterSlide {
  id: number
  number: number
  name: string
  textElements: PowerpointMasterSlideTextElement[]
}

export interface PowerpointMasterTemplate {
  masterSlides: PowerpointMasterSlide[]
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
    const slideIds = await pres.getTemplate(templateName).setCreationIds()
    return {
      masterSlides: slideIds.map((slideId) => {
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
      }),
    }
  }
}
