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

export async function headOk(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}
