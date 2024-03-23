interface Part<S, T> {
  splitter: S
  subparts: T[]
}
interface SplitPartReturnType<S, T> {
  initialParts: T[]
  parts: Part<S, T>[]
}

/**
 * Splits an array into parts, using a predicate to determine the split points.
 * @param array The array to split
 * @param splitPredicate The predicate to determine the split points
 */
export function splitParts<T, S extends T>(
  array: T[],
  splitPredicate: (element: T) => element is S,
): SplitPartReturnType<S, T> {
  const parts: Part<S, T>[] = []
  const initialParts: T[] = []

  for (const [, element] of array.entries()) {
    const isSplitPoint = splitPredicate(element)
    if (isSplitPoint) {
      parts.push({ splitter: element, subparts: [] })
    } else {
      const lastPart = parts.at(-1)
      if (lastPart) {
        lastPart.subparts.push(element)
      } else {
        initialParts.push(element)
      }
    }
  }
  return { initialParts, parts }
}

type ExtractFirstReturnType<T, B extends boolean> = B extends true ? T : T | undefined

/**
 * Try to extract the first element of an array based on a predicate.
 * @param array The array to search
 * @param predicate The predicate to match
 * @param mandatory Whether the element is mandatory
 */
export function extractFirst<T, R extends T, B extends boolean>(
  array: T[],
  predicate: (element: T) => element is R,
  mandatory: B,
): ExtractFirstReturnType<R, B> {
  const firstElement = array[0]
  if (!firstElement) {
    if (mandatory) {
      throw new Error('Array is empty')
    }
    return undefined as ExtractFirstReturnType<R, B>
  }
  if (!predicate(firstElement)) {
    if (mandatory) {
      throw new Error('First element does not match predicate')
    }
    return undefined as ExtractFirstReturnType<R, B>
  }
  return array.shift() as R
}
