import { useQuery } from '@tanstack/react-query'
import { fetchCardByNm, fetchUpstreams } from '@/shared/api/wb/client'
import { buildProductMedia } from '@/entities/product/model/build-product-media'
import type { ProductMedia } from '@/entities/product/model/types'

export const productKeys = {
  all: ['product'] as const,
  media: (nm: number) => [...productKeys.all, 'media', nm] as const,
  upstreams: ['wb', 'upstreams'] as const,
}

export function useUpstreamsQuery() {
  return useQuery({
    queryKey: productKeys.upstreams,
    queryFn: fetchUpstreams,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 6,
  })
}

export function useProductMediaQuery(nm: number | null, enabled: boolean) {
  const upstreamsQuery = useUpstreamsQuery()

  return useQuery<ProductMedia>({
    queryKey: productKeys.media(nm ?? 0),
    enabled: enabled && nm !== null && nm > 0 && Boolean(upstreamsQuery.data),
    queryFn: async () => {
      if (nm === null) {
        throw new Error('Артикул не задан')
      }

      const upstreams = upstreamsQuery.data
      if (!upstreams) {
        throw new Error('CDN routing map is not loaded')
      }

      const product = await fetchCardByNm(nm)
      return buildProductMedia(product, upstreams)
    },
    staleTime: 1000 * 60 * 5,
  })
}
