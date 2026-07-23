/**
 * mux.js fMP4 init uses duration = 0xFFFFFFFF ("unknown") in mvhd/tkhd/mdhd.
 * Many players treat that as a real value → ~13h at 90kHz timescale.
 * Patch durations from known media length (seconds).
 */

function readU32(view: DataView, offset: number): number {
  return view.getUint32(offset, false)
}

function writeU32(view: DataView, offset: number, value: number): void {
  view.setUint32(offset, value >>> 0, false)
}

function readU64(view: DataView, offset: number): number {
  const hi = view.getUint32(offset, false)
  const lo = view.getUint32(offset + 4, false)
  return hi * 2 ** 32 + lo
}

function clampU32Duration(timescale: number, durationSec: number): number {
  if (!Number.isFinite(timescale) || timescale <= 0 || !Number.isFinite(durationSec)) {
    return 0
  }
  const raw = Math.round(durationSec * timescale)
  // keep below unknown-sentinel
  return Math.min(Math.max(0, raw), 0xfffffffe)
}

type BoxInfo = {
  type: string
  /** Start of 8-byte header */
  headerOffset: number
  /** Start of box payload (after size+type, or after 64-bit size) */
  contentOffset: number
  /** End exclusive */
  end: number
}

function iterateBoxes(
  view: DataView,
  start: number,
  end: number,
  visit: (box: BoxInfo) => void,
): void {
  let offset = start

  while (offset + 8 <= end) {
    let size = readU32(view, offset)
    const type = String.fromCharCode(
      view.getUint8(offset + 4),
      view.getUint8(offset + 5),
      view.getUint8(offset + 6),
      view.getUint8(offset + 7),
    )
    let headerSize = 8

    if (size === 1) {
      if (offset + 16 > end) {
        break
      }
      size = readU64(view, offset + 8)
      headerSize = 16
    } else if (size === 0) {
      size = end - offset
    }

    if (size < headerSize || offset + size > end) {
      break
    }

    const contentOffset = offset + headerSize
    const boxEnd = offset + size
    visit({ type, headerOffset: offset, contentOffset, end: boxEnd })

    if (
      type === 'moov' ||
      type === 'trak' ||
      type === 'mdia' ||
      type === 'minf' ||
      type === 'stbl' ||
      type === 'mvex' ||
      type === 'moof' ||
      type === 'traf'
    ) {
      iterateBoxes(view, contentOffset, boxEnd, visit)
    }

    offset = boxEnd
  }
}

/**
 * Writes real duration into mvhd / tkhd / mdhd (and mehd if present).
 * Mutates a copy of `bytes` and returns it.
 */
export function patchMp4Duration(bytes: Uint8Array, durationSec: number): Uint8Array {
  if (!(durationSec > 0) || !Number.isFinite(durationSec)) {
    return bytes
  }

  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  const view = new DataView(copy.buffer, copy.byteOffset, copy.byteLength)

  iterateBoxes(view, 0, copy.byteLength, (box) => {
    if (box.type === 'mvhd' || box.type === 'mdhd') {
      const version = view.getUint8(box.contentOffset)
      if (version === 1) {
        const timescale = readU32(view, box.contentOffset + 20)
        writeU32(view, box.contentOffset + 24, 0)
        writeU32(view, box.contentOffset + 28, clampU32Duration(timescale, durationSec))
      } else {
        const timescale = readU32(view, box.contentOffset + 12)
        writeU32(
          view,
          box.contentOffset + 16,
          clampU32Duration(timescale, durationSec),
        )
      }
      return
    }

    if (box.type === 'tkhd') {
      const version = view.getUint8(box.contentOffset)
      // Use movie timescale 90k when unknown; tkhd duration is in movie timescale.
      // We read mvhd timescale separately is hard here — patch with 90k default
      // and also re-patch tkhd after scanning mvhd below if needed.
      // Prefer: store timescale from a first-pass; for simplicity use 90000
      // then a second write when we see mvhd.
      if (version === 1) {
        // duration is 64-bit at content+28
        writeU32(view, box.contentOffset + 28, 0)
        writeU32(
          view,
          box.contentOffset + 32,
          clampU32Duration(90_000, durationSec),
        )
      } else {
        writeU32(
          view,
          box.contentOffset + 20,
          clampU32Duration(90_000, durationSec),
        )
      }
      return
    }

    if (box.type === 'mehd') {
      const version = view.getUint8(box.contentOffset)
      // fragment_duration is in movie timescale
      if (version === 1) {
        writeU32(view, box.contentOffset + 4, 0)
        writeU32(
          view,
          box.contentOffset + 8,
          clampU32Duration(90_000, durationSec),
        )
      } else {
        writeU32(
          view,
          box.contentOffset + 4,
          clampU32Duration(90_000, durationSec),
        )
      }
    }
  })

  // Second pass: tkhd duration must use actual mvhd timescale
  let movieTimescale = 90_000
  iterateBoxes(view, 0, copy.byteLength, (box) => {
    if (box.type === 'mvhd') {
      const version = view.getUint8(box.contentOffset)
      movieTimescale =
        version === 1
          ? readU32(view, box.contentOffset + 20)
          : readU32(view, box.contentOffset + 12)
    }
  })

  iterateBoxes(view, 0, copy.byteLength, (box) => {
    if (box.type !== 'tkhd') {
      return
    }
    const version = view.getUint8(box.contentOffset)
    const duration = clampU32Duration(movieTimescale, durationSec)
    if (version === 1) {
      writeU32(view, box.contentOffset + 28, 0)
      writeU32(view, box.contentOffset + 32, duration)
    } else {
      writeU32(view, box.contentOffset + 20, duration)
    }
  })

  iterateBoxes(view, 0, copy.byteLength, (box) => {
    if (box.type !== 'mehd') {
      return
    }
    const version = view.getUint8(box.contentOffset)
    const duration = clampU32Duration(movieTimescale, durationSec)
    if (version === 1) {
      writeU32(view, box.contentOffset + 4, 0)
      writeU32(view, box.contentOffset + 8, duration)
    } else {
      writeU32(view, box.contentOffset + 4, duration)
    }
  })

  return copy
}

/** Sum #EXTINF durations from an m3u8 playlist (seconds). */
export function parseM3u8TotalDurationSec(playlist: string): number {
  let total = 0
  for (const line of playlist.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('#EXTINF:')) {
      continue
    }
    const value = trimmed.slice('#EXTINF:'.length).split(',')[0]
    const sec = Number(value)
    if (Number.isFinite(sec) && sec > 0) {
      total += sec
    }
  }
  return total
}
