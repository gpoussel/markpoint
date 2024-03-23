import type { Root } from 'mdast'
import { describe, it } from 'vitest'

import { extractFrontMatter } from '../libs/frontmatter.js'

describe('extractFrontMatter', () => {
  it('should return undefined if the document is empty', ({ expect }) => {
    const tree: Root = {
      type: 'root',
      children: [],
    }
    const result = extractFrontMatter(tree)
    expect(result).toBeUndefined()
    expect(tree.children).toHaveLength(0)
  })

  it('should return undefined if there is no YAML frontmatter', ({ expect }) => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              value: 'This is some content',
            },
          ],
        },
      ],
    }
    const result = extractFrontMatter(tree)
    expect(result).toBeUndefined()
    expect(tree.children).toHaveLength(1)
    expect(tree.children[0]?.type).toBe('paragraph')
  })

  it('should parse and return the frontmatter object if YAML frontmatter exists', ({ expect }) => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'yaml',
          value: 'company: Acme, Inc.\nauthor: John Doe',
        },
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              value: 'This is some content',
            },
          ],
        },
      ],
    }
    const result = extractFrontMatter(tree)
    expect(result).toEqual({
      company: 'Acme, Inc.',
      author: 'John Doe',
    })
    expect(tree.children).toHaveLength(1)
    expect(tree.children[0]?.type).toBe('paragraph')
  })
})
