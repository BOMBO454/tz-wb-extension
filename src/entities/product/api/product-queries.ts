import { fetchCardByNm, fetchUpstreams } from '@/shared/api/wb/client'
import {
  queryOptions,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { buildProductMedia } from '@/entities/product/model/build-product-media'

import type { QueryClient } from '@tanstack/react-query'

const HOUR_MS = 1000 * 60 * 60
const CARD_STALE_MS = 1000 * 60 * 5
const MEDIA_STALE_MS = 1000 * 60 * 5

/** Hierarchical query keys (factory pattern). */
export const productKeys = {
  all: ['product'] as const,
  upstreams: () => ['wb', 'upstreams'] as const,
  cards: () => [...productKeys.all, 'card'] as const,
  card: (nm: number) => [...productKeys.cards(), nm] as const,
  mediaAll: () => [...productKeys.all, 'media'] as const,
  media: (nm: number) => [...productKeys.mediaAll(), nm] as const,
}

/**
 * Co-located queryOptions — single source for useQuery / prefetch / ensureQueryData.
 * @see https://tanstack.com/query/latest/docs/framework/react/guides/query-options
 */
export const productQueries = {
  upstreams: () =>
    queryOptions({
      queryKey: productKeys.upstreams(),
      queryFn: ({ signal }) => fetchUpstreams(signal),
      staleTime: HOUR_MS,
      gcTime: HOUR_MS * 6,
    }),

  card: (nm: number) =>
    queryOptions({
      queryKey: productKeys.card(nm),
      queryFn: ({ signal }) => fetchCardByNm(nm, signal),
      staleTime: CARD_STALE_MS,
    }),

  media: (nm: number) =>
    queryOptions({
      queryKey: productKeys.media(nm),
      queryFn: async ({ client, signal }) => {
        const [upstreams, product] = await Promise.all([
          client.ensureQueryData(productQueries.upstreams()),
          client.ensureQueryData(productQueries.card(nm)),
        ])

        return buildProductMedia(product, upstreams, signal)
      },
      staleTime: MEDIA_STALE_MS,
    }),
}

export function useUpstreamsQuery() {
  return useQuery(productQueries.upstreams())
}

export function useCardQuery(nm: number | null, enabled = true) {
  return useQuery({
    ...productQueries.card(nm ?? 0),
    enabled: enabled && nm !== null && nm > 0,
  })
}

/**
 * CDN maps + card → media URLs (photos + best HLS quality).
 * Dependencies filled via ensureQueryData so cache stays consistent.
 */
export function useProductMediaQuery(nm: number | null, enabled = true) {
  return useQuery({
    ...productQueries.media(nm ?? 0),
    enabled: enabled && nm !== null && nm > 0,
  })
}

/** Warm cache before modal opens (non-blocking). */
export function prefetchProductMedia(queryClient: QueryClient, nm: number) {
  return queryClient.prefetchQuery(productQueries.media(nm))
}

/** Hook form of prefetch — preferred at call sites. */
export function usePrefetchProductMedia() {
  const queryClient = useQueryClient()

  return (nm: number) => prefetchProductMedia(queryClient, nm)
}
