import type { Root } from 'mdast'
import { describe, it } from 'vitest'

import { extractTitle } from '../libs/title.js'

describe('extractTitle', () => {
  it('should throw an error if the tree is empty', ({ expect }) => {
    const tree: Root = { type: 'root', children: [] }
    expect(() => extractTitle(tree)).toThrowError(/empty/)
    expect(tree.children).toHaveLength(0)
  })

  it('should throw an error if the first document element is not a heading', ({ expect }) => {
    const tree: Root = {
      type: 'root',
      children: [{ type: 'paragraph', children: [{ type: 'text', value: 'Some content' }] }],
    }
    expect(() => extractTitle(tree)).toThrowError(/match predicate/)
    expect(tree.children).toHaveLength(1)
  })

  it('should throw an error if the first heading is not a level 1 heading', ({ expect }) => {
    const tree: Root = {
      type: 'root',
      children: [{ type: 'heading', depth: 2, children: [{ type: 'text', value: 'Title' }] }],
    }
    expect(() => extractTitle(tree)).toThrowError(/match predicate/)
  })

  it('should throw an error if the first heading has no child', ({ expect }) => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'heading',
          depth: 1,
          children: [],
        },
      ],
    }
    expect(() => extractTitle(tree)).toThrowError(/exactly one child/)
  })

  it('should throw an error if the first heading has more than one child', ({ expect }) => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'heading',
          depth: 1,
          children: [
            { type: 'text', value: 'Title' },
            { type: 'text', value: 'and follow-up' },
          ],
        },
      ],
    }
    expect(() => extractTitle(tree)).toThrowError(/exactly one child/)
  })

  it('should throw an error if the first heading contains no text', ({ expect }) => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'heading',
          depth: 1,
          children: [{ type: 'strong', children: [{ type: 'text', value: 'Title' }] }],
        },
      ],
    }
    expect(() => extractTitle(tree)).toThrowError(/must be plain text/)
  })

  it('should extract and return the title from the first heading', ({ expect }) => {
    const tree: Root = {
      type: 'root',
      children: [
        { type: 'heading', depth: 1, children: [{ type: 'text', value: 'Title' }] },
        { type: 'paragraph', children: [{ type: 'text', value: 'Some content' }] },
      ],
    }
    const result = extractTitle(tree)
    expect(result).toBe('Title')
    expect(tree.children).toHaveLength(1)
    expect(tree.children[0]?.type).toBe('paragraph')
  })
})
