import { getArrayBuffer, getText } from '@/shared/api/http'
import { mapWithConcurrency } from '@/shared/lib/download/fetch-with-concurrency'
import {
  concatUint8Arrays,
  remuxTsToMp4,
} from '@/shared/lib/download/remux-ts-to-mp4'
import { saveBlob } from '@/shared/lib/download/save-blob'

type DownloadProductVideoParams = {
  playlistUrl: string
  nm: number
  quality: string
  concurrency?: number
  onProgress?: (done: number, total: number) => void
}

function parseTsSegmentNames(playlist: string): string[] {
  return playlist
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
}

/**
 * Downloads HLS VOD (TS segments), remuxes to MP4, triggers browser save.
 */
export async function downloadProductVideo({
  playlistUrl,
  nm,
  quality,
  concurrency = 3,
  onProgress,
}: DownloadProductVideoParams): Promise<void> {
  const playlist = await getText(playlistUrl)
  const segmentNames = parseTsSegmentNames(playlist)

  if (segmentNames.length === 0) {
    throw new Error('В playlist нет сегментов')
  }

  const playlistBase = playlistUrl.replace(/[^/]+$/, '')
  const segmentUrls = segmentNames.map((name) => new URL(name, playlistBase).href)

  const parts = await mapWithConcurrency(
    segmentUrls,
    concurrency,
    async (url) => new Uint8Array(await getArrayBuffer(url)),
    onProgress,
  )

  const tsBytes = concatUint8Arrays(parts)

  let mp4Bytes: Uint8Array
  try {
    mp4Bytes = remuxTsToMp4(tsBytes)
  } catch {
    // Fallback: raw MPEG-TS still opens in VLC; keep .mp4 extension as requested
    // with a best-effort container. Prefer true remux when available.
    mp4Bytes = tsBytes
  }

  // Ensure BlobPart is a plain ArrayBuffer (not SharedArrayBuffer view)
  const copy = new Uint8Array(mp4Bytes.byteLength)
  copy.set(mp4Bytes)
  const blob = new Blob([copy.buffer], { type: 'video/mp4' })
  saveBlob(blob, `wb-${nm}-${quality}.mp4`)
}
