import type { UpstreamsResponse, WbProduct } from '@/shared/api/wb/types'
import { IMAGE_SIZES, VIDEO_QUALITIES, type VideoQuality } from '@/shared/config/wb'
import { headOk } from '@/shared/api/http'
import { extractRangeHosts } from '@/shared/lib/media/host'
import { buildProductImageUrls } from '@/shared/lib/media/product-image-url'
import { productVideoUrl } from '@/shared/lib/media/product-video-url'
import type { ProductMedia } from '@/entities/product/model/types'

async function resolveBestVideo(
  nm: number,
  videoRanges: ReturnType<typeof extractRangeHosts>,
): Promise<{ quality: VideoQuality; url: string } | null> {
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

export async function buildProductMedia(
  product: WbProduct,
  upstreams: UpstreamsResponse,
): Promise<ProductMedia> {
  const mediaRanges = extractRangeHosts(
    upstreams.origin.mediabasket_route_map ?? upstreams.recommend.mediabasket_route_map,
  )
  const videoRanges = extractRangeHosts(
    upstreams.origin.videonme_route_map ?? upstreams.recommend.videonme_route_map,
  )

  const previewUrls = buildProductImageUrls(
    product.id,
    product.pics,
    mediaRanges,
    IMAGE_SIZES.preview,
  )
  const downloadUrls = buildProductImageUrls(
    product.id,
    product.pics,
    mediaRanges,
    IMAGE_SIZES.download,
  )

  const video = await resolveBestVideo(product.id, videoRanges)

  return {
    nm: product.id,
    name: product.name,
    brand: product.brand,
    picsCount: product.pics,
    previewUrls,
    downloadUrls,
    hasVideo: Boolean(video),
    videoQuality: video?.quality ?? null,
    videoPlaylistUrl: video?.url ?? null,
    mediaRanges,
    videoRanges,
  }
}
