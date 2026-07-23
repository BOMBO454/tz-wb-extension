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

/**
 * Host entry: always needs `host`.
 * `vol_range_*` are present on method=range; mod/geo maps often omit them.
 */
function isHostRange(value: unknown): value is HostRange {
  if (!isRecord(value)) {
    return false
  }
  if (typeof value.host !== 'string' || value.host.length === 0) {
    return false
  }
  if (
    value.vol_range_from !== undefined &&
    typeof value.vol_range_from !== 'number'
  ) {
    return false
  }
  if (value.vol_range_to !== undefined && typeof value.vol_range_to !== 'number') {
    return false
  }
  return true
}

function isRouteMapEntry(value: unknown): value is RouteMapEntry {
  if (!isRecord(value)) {
    return false
  }
  if (typeof value.method !== 'string') {
    return false
  }
  if (!Array.isArray(value.hosts) || value.hosts.length === 0) {
    return false
  }
  return value.hosts.every(isHostRange)
}

function isRouteMap(value: unknown): value is RouteMapEntry[] {
  return Array.isArray(value) && value.length > 0 && value.every(isRouteMapEntry)
}

function parseRouteMap(value: unknown): RouteMapEntry[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value.filter(isRouteMapEntry)
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

/**
 * Parses CDN upstreams. Real payload mixes:
 * - origin.* method=range with vol_range_from/to (what we use for nm→host)
 * - recommend.* method=mod with host-only entries (geo CDN, no vol ranges)
 *
 * We must not reject the whole response when recommend uses mod hosts.
 */
export function parseUpstreamsResponse(value: unknown): UpstreamsResponse {
  if (!isRecord(value) || !isRecord(value.origin)) {
    throw new AppError('INVALID_UPSTREAMS', 'Некорректный ответ CDN upstreams')
  }

  const recommend = isRecord(value.recommend) ? value.recommend : {}

  const originMedia = parseRouteMap(value.origin.mediabasket_route_map)
  const originVideo = parseRouteMap(value.origin.videonme_route_map)
  const recommendMedia = parseRouteMap(recommend.mediabasket_route_map)
  const recommendVideo = parseRouteMap(recommend.videonme_route_map)

  // Need at least one usable map for photos and for video routing
  const mediaOk = isRouteMap(originMedia) || isRouteMap(recommendMedia)
  const videoOk = isRouteMap(originVideo) || isRouteMap(recommendVideo)

  if (!mediaOk || !videoOk) {
    throw new AppError('INVALID_UPSTREAMS', 'В upstreams отсутствуют route map')
  }

  const staticMap = parseRouteMap(value.origin.staticbasket_route_map)

  return {
    recommend: {
      mediabasket_route_map: recommendMedia,
      videonme_route_map: recommendVideo,
    },
    origin: {
      mediabasket_route_map: originMedia,
      videonme_route_map: originVideo,
      ...(staticMap.length > 0 ? { staticbasket_route_map: staticMap } : {}),
    },
    ...(typeof value.metrics_url === 'string' ? { metrics_url: value.metrics_url } : {}),
  }
}
