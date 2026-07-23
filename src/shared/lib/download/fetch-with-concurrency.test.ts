import { describe, expect, it } from 'vitest'

import { mapWithConcurrency } from '@/shared/lib/download/fetch-with-concurrency'

describe('mapWithConcurrency', () => {
  it('preserves input order', async () => {
    const result = await mapWithConcurrency(
      [3, 1, 2],
      2,
      async (n) => {
        await new Promise((resolve) => setTimeout(resolve, n * 5))
        return n * 10
      },
    )
    expect(result).toEqual([30, 10, 20])
  })

  it('reports progress', async () => {
    const events: Array<[number, number]> = []
    await mapWithConcurrency([1, 2, 3], 1, async (n) => n, {
      onProgress: (done, total) => {
        events.push([done, total])
      },
    })
    expect(events).toEqual([
      [1, 3],
      [2, 3],
      [3, 3],
    ])
  })

  it('aborts between tasks', async () => {
    const controller = new AbortController()
    let started = 0

    const promise = mapWithConcurrency(
      [1, 2, 3, 4],
      1,
      async (n) => {
        started += 1
        if (n === 2) {
          controller.abort()
        }
        return n
      },
      { signal: controller.signal },
    )

    await expect(promise).rejects.toSatisfy(
      (err: unknown) => err instanceof Error && err.name === 'AbortError',
    )
    expect(started).toBeLessThanOrEqual(3)
  })
})
