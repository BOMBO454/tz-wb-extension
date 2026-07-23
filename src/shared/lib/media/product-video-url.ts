import { findHostByVol } from '@/shared/lib/media/host'

import type { HostRange } from '@/shared/api/wb/types'
import type { VideoQuality } from '@/shared/config/wb'

type ProductVideoUrlParams = {
  nm: number
  ranges: HostRange[]
  quality: VideoQuality
  name?: string
}

/**
 * Builds HLS playlist URL for product video.
 * Routing vol uses nm % 144 (not floor(nm / 1e5) as for images).
 * @see https://gist.github.com/sheldhur/50420d0b85b2c80bc02cf96550b50625
 */
export function productVideoUrl({
  nm,
  ranges,
  quality,
  name = 'index.m3u8',
}: ProductVideoUrlParams): string | undefined {
  const vol = nm % 144
  const part = Math.floor(nm / 1e4)
  const host = findHostByVol(ranges, vol)

  if (!host) {
    return undefined
  }

  return `https://${host}/vol${vol}/part${part}/${nm}/hls/${quality}/${name}`
}
