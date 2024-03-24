import type { MarkdownPresentation } from '@markpoint/markdown'

import type { PowerpointTemplateConfiguration } from './configuration.ts'

export class MarkpointConverter {
  public async convert(
    templateConfiguration: PowerpointTemplateConfiguration,
    presentation: MarkdownPresentation,
    outputFile: string,
  ): Promise<void> {
    // eslint-disable-next-line no-console
    console.log({ templateConfiguration, presentation, outputFile })
    return new Promise((resolve) => resolve())
  }
}
