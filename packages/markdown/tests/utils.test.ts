import { expect, describe, it } from 'vitest'

import { splitParts } from '../src/utils'

const elementIsThree = (element: number): element is number => element === 3

describe('splitParts', () => {
  it('should split the array into parts based on the splitPredicate (when acceptInitialParts is true)', () => {
    const result = splitParts([1, 2, 3, 4, 5, 3, 4, 6], elementIsThree, true)

    expect(result).toEqual({
      initialParts: [1, 2],
      parts: [
        { splitter: 3, subparts: [4, 5] },
        { splitter: 3, subparts: [4, 6] },
      ],
    })
  })

  it('should split the array into parts based on the splitPredicate (when acceptInitialParts is false)', () => {
    const result = splitParts([3, 4, 5, 3, 4, 6], elementIsThree, false)

    expect(result).toEqual({
      parts: [
        { splitter: 3, subparts: [4, 5] },
        { splitter: 3, subparts: [4, 6] },
      ],
    })
  })

  it('should throw an error if acceptInitialParts is false and there is an unexpected element', () => {
    expect(() => splitParts([1, 2, 3, 4, 5, 3, 4, 6], elementIsThree, false)).toThrowError()
  })
})
