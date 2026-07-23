import muxjs from 'mux.js'

import { patchMp4Duration } from '@/shared/lib/download/patch-mp4-duration'

export type RemuxTsToMp4Options = {
  /**
   * Media duration in seconds (from m3u8 EXTINF sum).
   * Required for correct player duration — mux.js writes 0xFFFFFFFF otherwise.
   */
  durationSec?: number
}

/**
 * Remuxes concatenated MPEG-TS into fMP4 using mux.js transmuxer.
 * Patches moov duration fields so players do not show ~13h (0xFFFFFFFF / 90kHz).
 */
export function remuxTsToMp4(
  tsBytes: Uint8Array,
  options: RemuxTsToMp4Options = {},
): Uint8Array {
  // Rebase timestamps to 0 — original PTS often confuse progressive playback.
  const transmuxer = new muxjs.mp4.Transmuxer({ keepOriginalTimestamps: false })
  const mediaChunks: Uint8Array[] = []
  const initParts: Uint8Array[] = []
  let remuxError: unknown

  transmuxer.on('data', (segment) => {
    if (segment.initSegment && segment.initSegment.byteLength > 0 && initParts.length === 0) {
      initParts.push(new Uint8Array(segment.initSegment))
    }
    mediaChunks.push(new Uint8Array(segment.data))
  })

  transmuxer.on('error', (err) => {
    remuxError = err
  })

  // mux.js expects a plain ArrayBuffer-backed Uint8Array
  const input =
    tsBytes.byteOffset === 0 && tsBytes.byteLength === tsBytes.buffer.byteLength
      ? tsBytes
      : tsBytes.slice()

  transmuxer.push(input)
  transmuxer.flush()
  transmuxer.dispose()

  if (remuxError) {
    throw remuxError instanceof Error
      ? remuxError
      : new Error('Не удалось remux TS → MP4')
  }

  const initSegment = initParts[0]
  if (!initSegment || mediaChunks.length === 0) {
    throw new Error('Remux не вернул init/media segments')
  }

  const mediaSize = mediaChunks.reduce((sum, chunk) => sum + chunk.byteLength, 0)
  const output = new Uint8Array(initSegment.byteLength + mediaSize)
  output.set(initSegment, 0)

  let offset = initSegment.byteLength
  for (const chunk of mediaChunks) {
    output.set(chunk, offset)
    offset += chunk.byteLength
  }

  if (options.durationSec !== undefined && options.durationSec > 0) {
    return patchMp4Duration(output, options.durationSec)
  }

  return output
}

export function concatUint8Arrays(parts: readonly Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.byteLength, 0)
  const result = new Uint8Array(total)
  let offset = 0

  for (const part of parts) {
    result.set(part, offset)
    offset += part.byteLength
  }

  return result
}
