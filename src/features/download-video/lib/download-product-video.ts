import {
  concatUint8Arrays,
  remuxTsToMp4,
} from '@/shared/lib/download/remux-ts-to-mp4'
import { getArrayBuffer, getText } from '@/shared/api/http'
import { AppError } from '@/shared/api/errors'
import { mapWithConcurrency } from '@/shared/lib/download/fetch-with-concurrency'
import { saveBlob } from '@/shared/lib/download/save-blob'
import { withRetry } from '@/shared/lib/download/retry'

import type { DownloadProgress } from '@/shared/lib/download/progress'

type DownloadProductVideoParams = {
  playlistUrl: string
  nm: number
  quality: string
  concurrency?: number
  signal?: AbortSignal
  onProgress?: (progress: NonNullable<DownloadProgress>) => void
}

/** Non-comment lines in m3u8 are segment URIs (relative or absolute). */
export function parseM3u8Segments(playlist: string): string[] {
  return playlist
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
}

export function resolveSegmentUrls(playlistUrl: string, segmentNames: string[]): string[] {
  const playlistBase = playlistUrl.replace(/[^/]+$/, '')
  return segmentNames.map((name) => new URL(name, playlistBase).href)
}

async function fetchTsSegments(
  segmentUrls: string[],
  concurrency: number,
  signal: AbortSignal | undefined,
  onProgress?: (progress: NonNullable<DownloadProgress>) => void,
): Promise<Uint8Array[]> {
  return mapWithConcurrency(
    segmentUrls,
    concurrency,
    async (url) =>
      new Uint8Array(
        await withRetry(() => getArrayBuffer(url, { signal }), { attempts: 3, signal }),
      ),
    {
      signal,
      onProgress: (done, total) => {
        onProgress?.({ done, total, phase: 'fetch' })
      },
    },
  )
}

function toMp4Blob(mp4Bytes: Uint8Array): Blob {
  // Plain ArrayBuffer for BlobPart (not SharedArrayBuffer view)
  const copy = new Uint8Array(mp4Bytes.byteLength)
  copy.set(mp4Bytes)
  return new Blob([copy.buffer], { type: 'video/mp4' })
}

/**
 * Client-only: HLS VOD (TS segments) → remux fMP4 (mux.js) → browser download.
 */
export async function downloadProductVideo({
  playlistUrl,
  nm,
  quality,
  concurrency = 3,
  signal,
  onProgress,
}: DownloadProductVideoParams): Promise<void> {
  signal?.throwIfAborted()

  const playlist = await withRetry(
    () => getText(playlistUrl, { signal }),
    { attempts: 3, signal },
  )
  const segmentNames = parseM3u8Segments(playlist)

  if (segmentNames.length === 0) {
    throw new AppError('EMPTY_PLAYLIST', 'В playlist нет сегментов')
  }

  onProgress?.({ done: 0, total: segmentNames.length, phase: 'fetch' })

  const segmentUrls = resolveSegmentUrls(playlistUrl, segmentNames)
  const parts = await fetchTsSegments(segmentUrls, concurrency, signal, onProgress)
  const tsBytes = concatUint8Arrays(parts)

  signal?.throwIfAborted()
  onProgress?.({ done: segmentNames.length, total: segmentNames.length, phase: 'remux' })

  let mp4Bytes: Uint8Array
  try {
    mp4Bytes = remuxTsToMp4(tsBytes)
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown'
    throw new AppError(
      'REMUX_FAILED',
      `Не удалось remux TS → MP4 в браузере: ${reason}`,
      error,
    )
  }

  signal?.throwIfAborted()
  saveBlob(toMp4Blob(mp4Bytes), `wb-${nm}-${quality}.mp4`)
}
