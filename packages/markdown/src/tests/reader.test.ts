import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

import { describe, it } from 'vitest'

import { MarkdownReader } from '../'

describe('MarkdownReader', () => {
  const reader = new MarkdownReader()
  describe('read', async () => {
    const validFixtures = join(__dirname, '__fixtures__', 'valid')
    const validFiles = await readdir(validFixtures)
    for (const file of validFiles) {
      it(`should read the valid/${file} markdown file and return the parsed content`, async ({ expect }) => {
        const result = await reader.read(join(__dirname, '__fixtures__', 'valid', file))

        expect(result).toMatchSnapshot()
      })
    }

    const invalidFixtures = join(__dirname, '__fixtures__', 'invalid')
    const invalidFiles = await readdir(invalidFixtures)
    for (const file of invalidFiles) {
      it(`should read the invalid/${file} markdown file and throw an error`, async ({ expect }) => {
        await expect(() => reader.read(join(__dirname, '__fixtures__', 'invalid', file))).rejects.toThrow(
          /Markdown error:/,
        )
      })
    }
  })
})
