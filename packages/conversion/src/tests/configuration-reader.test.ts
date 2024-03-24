import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

import { describe, it } from 'vitest'

import { TemplateConfigurationReader } from '..'

describe('TemplateConfigurationReader', () => {
  const templateConfiguration = new TemplateConfigurationReader()
  describe('readConfiguration', async () => {
    const validFixtures = join(__dirname, '__fixtures__', 'valid')
    const validFiles = await readdir(validFixtures)
    for (const file of validFiles) {
      it(`should read the valid/${file} configuration file and return the parsed content`, async ({ expect }) => {
        const result = await templateConfiguration.readConfiguration(join(__dirname, '__fixtures__', 'valid', file))

        // Update result to avoid snapshot mismatches due to different file paths
        expect(result.baseFile).toMatch(/example\.pptx$/)
        result.baseFile = '../example.pptx'

        expect(result).toMatchSnapshot()
      })
    }

    const invalidFixtures = join(__dirname, '__fixtures__', 'invalid')
    const invalidFiles = await readdir(invalidFixtures)
    for (const file of invalidFiles) {
      it(`should read the invalid/${file} configuration file and throw an error`, async ({ expect }) => {
        await expect(() =>
          templateConfiguration.readConfiguration(join(__dirname, '__fixtures__', 'invalid', file)),
        ).rejects.toThrow()
      })
    }
  })
})
