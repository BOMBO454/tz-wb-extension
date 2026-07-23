import { HttpError } from '@/shared/api/http'
import { isAbortError } from '@/shared/api/errors'

export type RetryOptions = {
  /** Attempts including the first try. Default 3. */
  attempts?: number
  /** Delay before retry n (1-based retry index). */
  delayMs?: (retryIndex: number) => number
  signal?: AbortSignal
  shouldRetry?: (error: unknown) => boolean
}

function defaultShouldRetry(error: unknown): boolean {
  if (isAbortError(error)) {
    return false
  }
  if (error instanceof HttpError) {
    return error.status === 408 || error.status === 429 || error.status >= 500
  }
  // Network failures (TypeError from fetch in browsers)
  return error instanceof TypeError
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    const abortError = () =>
      signal?.reason instanceof Error
        ? signal.reason
        : new DOMException('Aborted', 'AbortError')

    if (signal?.aborted) {
      reject(abortError())
      return
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)

    const onAbort = () => {
      clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
      reject(abortError())
    }

    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

/** Runs async `fn` with limited retries for transient failures. */
export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const attempts = Math.max(1, options.attempts ?? 3)
  const shouldRetry = options.shouldRetry ?? defaultShouldRetry
  const delayMs = options.delayMs ?? ((retryIndex) => 200 * retryIndex)

  let lastError: unknown

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    options.signal?.throwIfAborted()

    try {
      return await fn(attempt)
    } catch (error) {
      lastError = error
      const isLast = attempt >= attempts
      if (isLast || !shouldRetry(error)) {
        throw error
      }
      await wait(delayMs(attempt), options.signal)
    }
  }

  throw lastError
}
