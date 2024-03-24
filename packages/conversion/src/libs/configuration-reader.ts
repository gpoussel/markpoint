import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { PowerpointTemplateConfigurationSchema, type PowerpointTemplateConfiguration } from '@markpoint/shared'
import YAML from 'yaml'

export class TemplateConfigurationReader {
  public async readConfiguration(configurationFile: string): Promise<PowerpointTemplateConfiguration> {
    const fileContent = await readFile(configurationFile, 'utf8')
    const templateConfiguration = PowerpointTemplateConfigurationSchema.parse(YAML.parse(fileContent))
    templateConfiguration.baseFile = path.join(path.dirname(configurationFile), templateConfiguration.baseFile)
    return templateConfiguration
  }
}
