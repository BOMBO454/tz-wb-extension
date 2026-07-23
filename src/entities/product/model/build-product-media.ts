import type { UpstreamsResponse, WbProduct } from '@/shared/api/wb/types'

import { buildProductImageUrls } from '@/shared/lib/media/product-image-url'
import { extractRangeHosts } from '@/shared/lib/media/host'
import { IMAGE_SIZES } from '@/shared/config/wb'
import { resolveBestVideo } from '@/entities/product/model/resolve-video'

import type { ProductMedia } from '@/entities/product/model/types'

export async function buildProductMedia(
  product: WbProduct,
  upstreams: UpstreamsResponse,
  signal?: AbortSignal,
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

  const video = await resolveBestVideo(product.id, videoRanges, signal)

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
  }
}
