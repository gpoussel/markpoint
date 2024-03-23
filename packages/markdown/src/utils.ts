interface Part<S, T> {
  splitter: S
  subparts: T[]
}
type SplitPartReturnType<S, T, B extends boolean> = B extends true
  ? { initialParts: T[]; parts: Part<S, T>[] }
  : { parts: Part<S, T>[] }

/**
 * Splits an array into parts, using a predicate to determine the split points.
 * If `acceptInitialParts` is true, the initial parts before the first split point are returned; otherwise this function throws an error.
 * @param array The array to split
 * @param splitPredicate The predicate to determine the split points
 * @param acceptInitialParts Whether to accept the initial parts before the first split point
 */
export function splitParts<T, B extends boolean, S extends T>(
  array: T[],
  splitPredicate: (element: T) => element is S,
  acceptInitialParts: B,
): SplitPartReturnType<S, T, B> {
  const parts: Part<S, T>[] = []
  const initialParts: T[] = []

  for (const [i, element] of array.entries()) {
    const isSplitPoint = splitPredicate(element)
    if (isSplitPoint) {
      parts.push({ splitter: element, subparts: [] })
    } else {
      const lastPart = parts.at(-1)
      if (lastPart) {
        lastPart.subparts.push(element)
      } else {
        if (!acceptInitialParts) {
          throw new Error(`Unexpected element at index ${i} (expected a split point)`)
        }
        initialParts.push(element)
      }
    }
  }
  return (acceptInitialParts ? { initialParts, parts } : { parts }) as SplitPartReturnType<S, T, B>
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