import type { HostRange } from '@/shared/api/wb/types'
import { headOk } from '@/shared/api/http'
import { VIDEO_QUALITIES } from '@/shared/config/wb'
import type { VideoQuality } from '@/shared/config/wb'
import { productVideoUrl } from '@/shared/lib/media/product-video-url'

export type ResolvedVideo = {
  quality: VideoQuality
  url: string
}

/** Probes HLS playlists from highest quality down; first HEAD 200 wins. */
export async function resolveBestVideo(
  nm: number,
  videoRanges: HostRange[],
): Promise<ResolvedVideo | null> {
  for (const quality of VIDEO_QUALITIES) {
    const url = productVideoUrl({ nm, ranges: videoRanges, quality })
    if (!url) {
      continue
    }

    if (await headOk(url)) {
      return { quality, url }
    }
  }

  return null
}
