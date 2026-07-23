import type {
  CardDetailResponse,
  HostRange,
  RouteMapEntry,
  UpstreamsResponse,
  WbProduct,
} from '@/shared/api/wb/types'

import { AppError } from '@/shared/api/errors'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isHostRange(value: unknown): value is HostRange {
  if (!isRecord(value)) {
    return false
  }
  return (
    typeof value.vol_range_from === 'number' &&
    typeof value.vol_range_to === 'number' &&
    typeof value.host === 'string' &&
    value.host.length > 0
  )
}

function isRouteMapEntry(value: unknown): value is RouteMapEntry {
  if (!isRecord(value)) {
    return false
  }
  if (typeof value.method !== 'string') {
    return false
  }
  if (!Array.isArray(value.hosts)) {
    return false
  }
  return value.hosts.every(isHostRange)
}

function isRouteMap(value: unknown): value is RouteMapEntry[] {
  return Array.isArray(value) && value.every(isRouteMapEntry)
}

export function parseWbProduct(value: unknown): WbProduct {
  if (!isRecord(value)) {
    throw new AppError('INVALID_PRODUCT', 'Некорректный формат карточки товара')
  }

  const id = value.id
  const name = value.name
  const brand = value.brand
  const pics = value.pics

  if (typeof id !== 'number' || !Number.isFinite(id) || id <= 0) {
    throw new AppError('INVALID_PRODUCT', 'В карточке отсутствует корректный артикул')
  }
  if (typeof name !== 'string') {
    throw new AppError('INVALID_PRODUCT', 'В карточке отсутствует название')
  }
  if (typeof brand !== 'string') {
    throw new AppError('INVALID_PRODUCT', 'В карточке отсутствует бренд')
  }
  if (typeof pics !== 'number' || !Number.isFinite(pics) || pics < 0) {
    throw new AppError('INVALID_PRODUCT', 'В карточке отсутствует число фото')
  }

  return {
    id,
    name,
    brand,
    pics: Math.floor(pics),
    ...(typeof value.supplier === 'string' ? { supplier: value.supplier } : {}),
    ...(typeof value.reviewRating === 'number' ? { reviewRating: value.reviewRating } : {}),
    ...(typeof value.viewFlags === 'number' ? { viewFlags: value.viewFlags } : {}),
  }
}

export function parseCardDetailResponse(value: unknown): CardDetailResponse {
  if (!isRecord(value) || !Array.isArray(value.products)) {
    throw new AppError('INVALID_CARD_RESPONSE', 'Некорректный ответ API карточки')
  }

  return {
    products: value.products.map(parseWbProduct),
  }
}

export function parseUpstreamsResponse(value: unknown): UpstreamsResponse {
  if (!isRecord(value) || !isRecord(value.origin) || !isRecord(value.recommend)) {
    throw new AppError('INVALID_UPSTREAMS', 'Некорректный ответ CDN upstreams')
  }

  const originMedia = value.origin.mediabasket_route_map
  const originVideo = value.origin.videonme_route_map
  const recommendMedia = value.recommend.mediabasket_route_map
  const recommendVideo = value.recommend.videonme_route_map

  if (
    !isRouteMap(originMedia) ||
    !isRouteMap(originVideo) ||
    !isRouteMap(recommendMedia) ||
    !isRouteMap(recommendVideo)
  ) {
    throw new AppError('INVALID_UPSTREAMS', 'В upstreams отсутствуют route map')
  }

  const staticMap = value.origin.staticbasket_route_map

  return {
    recommend: {
      mediabasket_route_map: recommendMedia,
      videonme_route_map: recommendVideo,
    },
    origin: {
      mediabasket_route_map: originMedia,
      videonme_route_map: originVideo,
      ...(isRouteMap(staticMap) ? { staticbasket_route_map: staticMap } : {}),
    },
    ...(typeof value.metrics_url === 'string' ? { metrics_url: value.metrics_url } : {}),
  }
}
