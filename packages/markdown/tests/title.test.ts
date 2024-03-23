import type { Root } from 'mdast'
import { expect, describe, it } from 'vitest'

import { extractTitle } from '../src/title'

describe('extractTitle', () => {
  it('should throw an error if the tree is empty', () => {
    const tree: Root = { type: 'root', children: [] }
    expect(() => extractTitle(tree)).toThrowError()
    expect(tree.children).toHaveLength(0)
  })

  it('should throw an error if the first document element is not a heading', () => {
    const tree: Root = {
      type: 'root',
      children: [{ type: 'paragraph', children: [{ type: 'text', value: 'Some content' }] }],
    }
    expect(() => extractTitle(tree)).toThrowError()
    expect(tree.children).toHaveLength(1)
  })

  it('should throw an error if the first heading is not a level 1 heading', () => {
    const tree: Root = {
      type: 'root',
      children: [{ type: 'heading', depth: 2, children: [{ type: 'text', value: 'Title' }] }],
    }
    expect(() => extractTitle(tree)).toThrowError()
  })

  it('should throw an error if the first heading has no child', () => {
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
    expect(() => extractTitle(tree)).toThrowError()
  })

  it('should throw an error if the first heading has more than one child', () => {
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
    expect(() => extractTitle(tree)).toThrowError()
  })

  it('should throw an error if the first heading contains no text', () => {
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
    expect(() => extractTitle(tree)).toThrowError()
  })

  it('should extract and return the title from the first heading', () => {
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
    expect(tree.children[0].type).toBe('paragraph')
  })
})
