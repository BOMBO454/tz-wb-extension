import type { UpstreamsResponse, WbProduct } from '@/shared/api/wb/types'

import {
  parseCardDetailResponse,
  parseUpstreamsResponse,
} from '@/shared/api/wb/guards'
import { WB_CARD_QUERY, WB_ENDPOINTS } from '@/shared/config/wb'
import { AppError } from '@/shared/api/errors'
import { getJson } from '@/shared/api/http'

export async function fetchCardByNm(
  nm: number,
  signal?: AbortSignal,
): Promise<WbProduct> {
  const params = new URLSearchParams({
    appType: String(WB_CARD_QUERY.appType),
    curr: WB_CARD_QUERY.curr,
    dest: String(WB_CARD_QUERY.dest),
    spp: String(WB_CARD_QUERY.spp),
    lang: WB_CARD_QUERY.lang,
    nm: String(nm),
  })

  const raw = await getJson<unknown>(
    `${WB_ENDPOINTS.cardDetail}?${params.toString()}`,
    { signal },
  )

  const data = parseCardDetailResponse(raw)
  const product = data.products[0]
  if (!product) {
    throw new AppError('CARD_NOT_FOUND', `Карточка с артикулом ${nm} не найдена`)
  }

  return product
}

export async function fetchUpstreams(signal?: AbortSignal): Promise<UpstreamsResponse> {
  const raw = await getJson<unknown>(WB_ENDPOINTS.upstreams, { signal })
  return parseUpstreamsResponse(raw)
}
