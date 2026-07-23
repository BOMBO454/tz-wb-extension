import JSZip from 'jszip'
import { getArrayBuffer } from '@/shared/api/http'
import { mapWithConcurrency } from '@/shared/lib/download/fetch-with-concurrency'
import { saveBlob } from '@/shared/lib/download/save-blob'

type DownloadPhotosZipParams = {
  urls: string[]
  nm: number
  concurrency?: number
  onProgress?: (done: number, total: number) => void
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
  onProgress,
}: DownloadPhotosZipParams): Promise<void> {
  if (urls.length === 0) {
    throw new Error('Не выбрано ни одного фото')
  }

  const zip = new JSZip()
  const folder = zip.folder(`wb-${nm}-photos`)
  if (!folder) {
    throw new Error('Не удалось создать ZIP')
  }

  const buffers = await mapWithConcurrency(
    urls,
    concurrency,
    async (url, index) => {
      const buffer = await getArrayBuffer(url)
      return { buffer, index, ext: extensionFromUrl(url) }
    },
    onProgress,
  )

  for (const item of buffers) {
    const name = `${String(item.index + 1).padStart(2, '0')}.${item.ext}`
    folder.file(name, item.buffer)
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  saveBlob(blob, `wb-${nm}-photos.zip`)
}
