import { describe, expect, it } from 'vitest'

import {
  parseM3u8Segments,
  resolveSegmentUrls,
} from '@/features/download-video/lib/download-product-video'

describe('parseM3u8Segments', () => {
  it('skips comments and empty lines', () => {
    const playlist = `#EXTM3U
#EXT-X-VERSION:3
#EXTINF:2.0,
seg000.ts
#EXTINF:2.0,
seg001.ts
#EXT-X-ENDLIST
`
    expect(parseM3u8Segments(playlist)).toEqual(['seg000.ts', 'seg001.ts'])
  })
})

describe('resolveSegmentUrls', () => {
  it('resolves relative segment names against playlist base', () => {
    const playlistUrl =
      'https://cdn.example/vol1/part2/123/hls/1080p/index.m3u8'
    expect(resolveSegmentUrls(playlistUrl, ['seg0.ts', 'https://other/abs.ts'])).toEqual([
      'https://cdn.example/vol1/part2/123/hls/1080p/seg0.ts',
      'https://other/abs.ts',
    ])
  })
})
