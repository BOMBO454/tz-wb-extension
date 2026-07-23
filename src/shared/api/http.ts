export class HttpError extends Error {
  readonly status: number
  readonly url: string

  constructor(status: number, url: string, message?: string) {
    super(message ?? `HTTP ${status} for ${url}`)
    this.name = 'HttpError'
    this.status = status
    this.url = url
  }
}

export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError
}

export async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...init?.headers,
    },
  })

  if (!response.ok) {
    throw new HttpError(response.status, url)
  }

  return (await response.json()) as T
}

export async function getArrayBuffer(url: string, init?: RequestInit): Promise<ArrayBuffer> {
  const response = await fetch(url, init)

  if (!response.ok) {
    throw new HttpError(response.status, url)
  }

  return response.arrayBuffer()
}

export async function getText(url: string, init?: RequestInit): Promise<string> {
  const response = await fetch(url, init)

  if (!response.ok) {
    throw new HttpError(response.status, url)
  }

  return response.text()
}

export async function headOk(url: string, init?: RequestInit): Promise<boolean> {
  try {
    const response = await fetch(url, { ...init, method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Checks whether a small resource exists.
 * HEAD first; on failure/non-OK falls back to GET (playlist probes only).
 */
export async function resourceExists(url: string, init?: RequestInit): Promise<boolean> {
  if (await headOk(url, init)) {
    return true
  }

  try {
    const response = await fetch(url, {
      ...init,
      method: 'GET',
      headers: {
        ...init?.headers,
        Range: 'bytes=0-0',
      },
    })
    // 200 or 206 both mean the object is there
    if (response.ok || response.status === 206) {
      // Drain body so the connection can be reused
      await response.arrayBuffer().catch(() => null)
      return true
    }
    return false
  } catch {
    return false
  }
}
