/**
 * Runs async tasks over items with a fixed concurrency pool.
 * Keeps result order aligned with input.
 * Honors AbortSignal between tasks (in-flight mapper still owns its own signal).
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
  options?: {
    onProgress?: (done: number, total: number) => void
    signal?: AbortSignal
  },
): Promise<R[]> {
  if (items.length === 0) {
    return []
  }

  const onProgress = options?.onProgress
  const signal = options?.signal
  const limit = Math.max(1, Math.min(concurrency, items.length))
  const results = Array.from<R>({ length: items.length })
  let nextIndex = 0
  let done = 0

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      signal?.throwIfAborted()

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
