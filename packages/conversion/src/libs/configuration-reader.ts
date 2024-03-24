import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { TemplateConfigurationSchema, type TemplateConfiguration } from '@markpoint/shared'
import YAML from 'yaml'

export class TemplateConfigurationReader {
  public async readConfiguration(configurationFile: string): Promise<TemplateConfiguration> {
    const fileContent = await readFile(configurationFile, 'utf8')
    const templateConfiguration = TemplateConfigurationSchema.parse(YAML.parse(fileContent))
    templateConfiguration.baseFile = path.join(path.dirname(configurationFile), templateConfiguration.baseFile)
    return templateConfiguration
  }
}
