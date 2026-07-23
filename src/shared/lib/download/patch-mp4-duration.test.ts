import { describe, expect, it } from 'vitest'

import {
  parseM3u8TotalDurationSec,
  patchMp4Duration,
} from '@/shared/lib/download/patch-mp4-duration'

describe('parseM3u8TotalDurationSec', () => {
  it('sums EXTINF durations', () => {
    const playlist = `#EXTM3U
#EXTINF:4.433,
1.ts
#EXTINF:2.6,
2.ts
#EXTINF:1.533,
3.ts
#EXT-X-ENDLIST
`
    expect(parseM3u8TotalDurationSec(playlist)).toBeCloseTo(8.566, 5)
  })

  it('returns 0 when no EXTINF', () => {
    expect(parseM3u8TotalDurationSec('#EXTM3U\n1.ts\n')).toBe(0)
  })
})

/** Minimal moov/mvhd v0 with unknown duration. */
function buildStubMp4(): Uint8Array {
  const parts: number[] = []

  function pushBox(type: string, payload: number[]) {
    const size = 8 + payload.length
    parts.push((size >>> 24) & 0xff, (size >>> 16) & 0xff, (size >>> 8) & 0xff, size & 0xff)
    for (let i = 0; i < 4; i++) {
      parts.push(type.charCodeAt(i))
    }
    parts.push(...payload)
  }

  // mvhd v0: version+flags(4) + ctime(4) + mtime(4) + timescale(4) + duration(4) + rest
  const mvhdPayload = Array.from({ length: 100 }, () => 0)
  // timescale at +12 = 90000
  mvhdPayload[12] = (90000 >>> 24) & 0xff
  mvhdPayload[13] = (90000 >>> 16) & 0xff
  mvhdPayload[14] = (90000 >>> 8) & 0xff
  mvhdPayload[15] = 90000 & 0xff
  // duration at +16 = 0xFFFFFFFF
  mvhdPayload[16] = 0xff
  mvhdPayload[17] = 0xff
  mvhdPayload[18] = 0xff
  mvhdPayload[19] = 0xff

  const mvhdSize = 8 + mvhdPayload.length
  const mvhd: number[] = [
    (mvhdSize >>> 24) & 0xff,
    (mvhdSize >>> 16) & 0xff,
    (mvhdSize >>> 8) & 0xff,
    mvhdSize & 0xff,
    ...'mvhd'.split('').map((c) => c.charCodeAt(0)),
    ...mvhdPayload,
  ]

  pushBox('moov', mvhd)
  return new Uint8Array(parts)
}

describe('patchMp4Duration', () => {
  it('replaces 0xFFFFFFFF duration with seconds * timescale', () => {
    const input = buildStubMp4()
    const out = patchMp4Duration(input, 11.432)
    const view = new DataView(out.buffer, out.byteOffset, out.byteLength)
    // moov header 8 + mvhd header 8 + duration at content+16
    const duration = view.getUint32(8 + 8 + 16, false)
    expect(duration).toBe(Math.round(11.432 * 90000))
    expect(duration).not.toBe(0xffffffff)
  })
})
