/**
 * Runs async tasks over items with a fixed concurrency pool.
 * Keeps result order aligned with input.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
  onProgress?: (done: number, total: number) => void,
): Promise<R[]> {
  if (items.length === 0) {
    return []
  }

  const limit = Math.max(1, Math.min(concurrency, items.length))
  const results = Array.from<R>({ length: items.length })
  let nextIndex = 0
  let done = 0

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const current = nextIndex
      nextIndex += 1
      const item = items[current]
      if (item === undefined) {
        continue
      }
      results[current] = await mapper(item, current)
      done += 1
      onProgress?.(done, items.length)
    }
  }

  await Promise.all(Array.from({ length: limit }, () => worker()))
  return results
}
