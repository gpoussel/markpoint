import { describe, it } from 'vitest'

import { splitParts, extractFirst } from '../libs/utils'

const elementIsThree = (element: number): element is number => element === 3

describe('splitParts', () => {
  it('should split the array into parts based on the splitPredicate (when acceptInitialParts is true)', ({
    expect,
  }) => {
    const result = splitParts([1, 2, 3, 4, 5, 3, 4, 6], elementIsThree, true)

    expect(result).toEqual({
      initialParts: [1, 2],
      parts: [
        { splitter: 3, subparts: [4, 5] },
        { splitter: 3, subparts: [4, 6] },
      ],
    })
  })

  it('should split the array into parts based on the splitPredicate (when acceptInitialParts is false)', ({
    expect,
  }) => {
    const result = splitParts([3, 4, 5, 3, 4, 6], elementIsThree, false)

    expect(result).toEqual({
      parts: [
        { splitter: 3, subparts: [4, 5] },
        { splitter: 3, subparts: [4, 6] },
      ],
    })
  })

  it('should throw an error if acceptInitialParts is false and there is an unexpected element', ({ expect }) => {
    expect(() => splitParts([1, 2, 3, 4, 5, 3, 4, 6], elementIsThree, false)).toThrowError()
  })
})

describe('extractFirst', () => {
  it('should extract the first element if it matches the predicate', ({ expect }) => {
    const array = [3, 4, 5]
    const result = extractFirst(array, elementIsThree, true)

    expect(result).toBe(3)
    expect(array).toEqual([4, 5])
  })

  it('should return undefined if the first element does not match the predicate and mandatory is false', ({
    expect,
  }) => {
    const array = [1, 2, 3, 4, 5]
    const result = extractFirst(array, elementIsThree, false)

    expect(result).toBeUndefined()
    expect(array).toEqual([1, 2, 3, 4, 5])
  })

  it('should throw an error if the first element does not match the predicate and mandatory is true', ({ expect }) => {
    const array = [1, 2, 3, 4, 5]

    expect(() => extractFirst(array, elementIsThree, true)).toThrowError()
  })

  it('should return undefined if the array is empty and mandatory is false', ({ expect }) => {
    const result = extractFirst([], elementIsThree, false)

    expect(result).toBeUndefined()
    expect([]).toEqual([])
  })

  it('should throw an error if the array is empty and mandatory is true', ({ expect }) => {
    expect(() => extractFirst([], elementIsThree, true)).toThrowError()
  })
})
