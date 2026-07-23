import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchCardByNm, fetchUpstreams } from '@/shared/api/wb/client'
import { buildProductMedia } from '@/entities/product/model/build-product-media'
import type { ProductMedia } from '@/entities/product/model/types'
import type { UpstreamsResponse, WbProduct } from '@/shared/api/wb/types'

const HOUR = 1000 * 60 * 60

export const productKeys = {
  all: ['product'] as const,
  upstreams: ['wb', 'upstreams'] as const,
  card: (nm: number) => [...productKeys.all, 'card', nm] as const,
  media: (nm: number) => [...productKeys.all, 'media', nm] as const,
}

export function useUpstreamsQuery() {
  return useQuery({
    queryKey: productKeys.upstreams,
    queryFn: fetchUpstreams,
    staleTime: HOUR,
    gcTime: HOUR * 6,
  })
}

export function useCardQuery(nm: number | null, enabled: boolean) {
  return useQuery({
    queryKey: productKeys.card(nm ?? 0),
    enabled: enabled && nm !== null && nm > 0,
    queryFn: () => {
      if (nm === null) {
        throw new Error('Артикул не задан')
      }
      return fetchCardByNm(nm)
    },
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Loads CDN maps + card, builds media URLs (photos + best HLS quality).
 * Uses ensureQueryData so isPending stays true while dependencies load.
 */
export function useProductMediaQuery(nm: number | null, enabled: boolean) {
  const queryClient = useQueryClient()
  const active = enabled && nm !== null && nm > 0

  return useQuery<ProductMedia>({
    queryKey: productKeys.media(nm ?? 0),
    enabled: active,
    queryFn: async () => {
      if (nm === null) {
        throw new Error('Артикул не задан')
      }

      const [upstreams, product] = await Promise.all([
        queryClient.ensureQueryData<UpstreamsResponse>({
          queryKey: productKeys.upstreams,
          queryFn: fetchUpstreams,
          staleTime: HOUR,
        }),
        queryClient.ensureQueryData<WbProduct>({
          queryKey: productKeys.card(nm),
          queryFn: () => fetchCardByNm(nm),
          staleTime: 1000 * 60 * 5,
        }),
      ])

      return buildProductMedia(product, upstreams)
    },
    staleTime: 1000 * 60 * 5,
  })
}
