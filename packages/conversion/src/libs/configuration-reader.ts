import { readFile } from 'node:fs/promises'

import YAML from 'yaml'

import { PowerpointTemplateConfigurationSchema } from './configuration.js'

export class TemplateConfigurationReader {
  public async readConfiguration(configurationFile: string) {
    const fileContent = await readFile(configurationFile, 'utf8')
    return PowerpointTemplateConfigurationSchema.parse(YAML.parse(fileContent))
  }
}
