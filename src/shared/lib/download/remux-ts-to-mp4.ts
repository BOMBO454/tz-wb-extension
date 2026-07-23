import muxjs from 'mux.js'

/**
 * Remuxes concatenated MPEG-TS into fMP4 using mux.js transmuxer.
 * Result is playable in modern browsers / VLC as .mp4.
 */
export function remuxTsToMp4(tsBytes: Uint8Array): Uint8Array {
  const transmuxer = new muxjs.mp4.Transmuxer({ keepOriginalTimestamps: true })
  const chunks: Uint8Array[] = []
  const initParts: Uint8Array[] = []
  let remuxError: unknown

  transmuxer.on('data', (segment) => {
    if (segment.initSegment && segment.initSegment.byteLength > 0) {
      initParts.push(new Uint8Array(segment.initSegment))
    }
    chunks.push(new Uint8Array(segment.data))
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

  if (initParts.length === 0 || chunks.length === 0) {
    throw new Error('Remux не вернул init/media segments')
  }

  const init = concatUint8Arrays(initParts)
  const mediaSize = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0)
  const output = new Uint8Array(init.byteLength + mediaSize)
  output.set(init, 0)

  let offset = init.byteLength
  for (const chunk of chunks) {
    output.set(chunk, offset)
    offset += chunk.byteLength
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
