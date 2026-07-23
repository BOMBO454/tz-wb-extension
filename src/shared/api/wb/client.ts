import { WB_CARD_QUERY, WB_ENDPOINTS } from '@/shared/config/wb'
import { getJson } from '@/shared/api/http'
import type { CardDetailResponse, UpstreamsResponse, WbProduct } from '@/shared/api/wb/types'

export async function fetchCardByNm(nm: number): Promise<WbProduct> {
  const params = new URLSearchParams({
    appType: String(WB_CARD_QUERY.appType),
    curr: WB_CARD_QUERY.curr,
    dest: String(WB_CARD_QUERY.dest),
    spp: String(WB_CARD_QUERY.spp),
    lang: WB_CARD_QUERY.lang,
    nm: String(nm),
  })

  const data = await getJson<CardDetailResponse>(
    `${WB_ENDPOINTS.cardDetail}?${params.toString()}`,
  )

  const product = data.products[0]
  if (!product) {
    throw new Error(`Карточка с артикулом ${nm} не найдена`)
  }

  return product
}

export async function fetchUpstreams(): Promise<UpstreamsResponse> {
  return getJson<UpstreamsResponse>(WB_ENDPOINTS.upstreams)
}
