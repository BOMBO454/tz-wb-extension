import { productVideoUrl } from '@/shared/lib/media/product-video-url'
import { resourceExists } from '@/shared/api/http'
import { VIDEO_QUALITIES } from '@/shared/config/wb'

import type { HostRange } from '@/shared/api/wb/types'
import type { VideoQuality } from '@/shared/config/wb'

export type ResolvedVideo = {
  quality: VideoQuality
  url: string
}

/** Probes HLS playlists from highest quality down; first existing playlist wins. */
export async function resolveBestVideo(
  nm: number,
  videoRanges: HostRange[],
  signal?: AbortSignal,
): Promise<ResolvedVideo | null> {
  for (const quality of VIDEO_QUALITIES) {
    signal?.throwIfAborted()

    const url = productVideoUrl({ nm, ranges: videoRanges, quality })
    if (!url) {
      continue
    }

    if (await resourceExists(url, { signal })) {
      return { quality, url }
    }
  }

  return null
}
