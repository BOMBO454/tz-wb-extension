import JSZip from 'jszip'

import { AppError } from '@/shared/api/errors'
import { getArrayBuffer } from '@/shared/api/http'
import { mapWithConcurrency } from '@/shared/lib/download/fetch-with-concurrency'
import { saveBlob } from '@/shared/lib/download/save-blob'
import { withRetry } from '@/shared/lib/download/retry'

import type { DownloadProgress } from '@/shared/lib/download/progress'

type DownloadPhotosZipParams = {
  urls: string[]
  nm: number
  concurrency?: number
  signal?: AbortSignal
  onProgress?: (progress: NonNullable<DownloadProgress>) => void
}

function extensionFromUrl(url: string): string {
  const pathname = new URL(url).pathname
  const match = pathname.match(/\.([a-zA-Z0-9]+)$/)
  return match?.[1]?.toLowerCase() ?? 'webp'
}

export async function downloadPhotosZip({
  urls,
  nm,
  concurrency = 4,
  signal,
  onProgress,
}: DownloadPhotosZipParams): Promise<void> {
  if (urls.length === 0) {
    throw new AppError('NO_PHOTOS_SELECTED', 'Не выбрано ни одного фото')
  }

  signal?.throwIfAborted()

  const zip = new JSZip()
  const folder = zip.folder(`wb-${nm}-photos`)
  if (!folder) {
    throw new AppError('ZIP_CREATE_FAILED', 'Не удалось создать ZIP')
  }

  onProgress?.({ done: 0, total: urls.length, phase: 'fetch' })

  const buffers = await mapWithConcurrency(
    urls,
    concurrency,
    async (url, index) => {
      const buffer = await withRetry(
        () => getArrayBuffer(url, { signal }),
        { attempts: 3, signal },
      )
      return { buffer, index, ext: extensionFromUrl(url) }
    },
    {
      signal,
      onProgress: (done, total) => {
        onProgress?.({ done, total, phase: 'fetch' })
      },
    },
  )

  signal?.throwIfAborted()
  onProgress?.({ done: buffers.length, total: buffers.length, phase: 'zip' })

  for (const item of buffers) {
    const name = `${String(item.index + 1).padStart(2, '0')}.${item.ext}`
    folder.file(name, item.buffer)
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  signal?.throwIfAborted()
  saveBlob(blob, `wb-${nm}-photos.zip`)
}
