import { describe, expect, it } from 'vitest'

import { productVideoUrl } from '@/shared/lib/media/product-video-url'

import type { HostRange } from '@/shared/api/wb/types'

const ranges: HostRange[] = [
  { vol_range_from: 0, vol_range_to: 143, host: 'videonme-01.wbbasket.ru' },
]

describe('productVideoUrl', () => {
  it('uses nm % 144 for vol and floor(nm/1e4) for part', () => {
    const nm = 604174866
    const url = productVideoUrl({ nm, ranges, quality: '1080p' })
    // vol = 604174866 % 144 = 114
    // part = floor(604174866 / 1e4) = 60417
    expect(url).toBe(
      'https://videonme-01.wbbasket.ru/vol114/part60417/604174866/hls/1080p/index.m3u8',
    )
  })

  it('does not use image vol formula', () => {
    const nm = 604174866
    const imageVol = Math.floor(nm / 1e5)
    const videoVol = nm % 144
    expect(imageVol).not.toBe(videoVol)

    const url = productVideoUrl({ nm, ranges, quality: '720p' })
    expect(url).toContain(`/vol${videoVol}/`)
    expect(url).not.toContain(`/vol${imageVol}/`)
  })
})
