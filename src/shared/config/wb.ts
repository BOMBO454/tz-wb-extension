/** Public / proxied Wildberries endpoints used by the app. */
export const WB_ENDPOINTS = {
  /** Proxied through Vite in dev to avoid CORS. */
  cardDetail: '/api/wb/card/cards/v4/detail',
  upstreams: 'https://cdn.wbbasket.ru/api/v3/upstreams',
} as const

export const WB_CARD_QUERY = {
  appType: 1,
  curr: 'rub',
  dest: -1257786,
  spp: 30,
  lang: 'ru',
} as const

export const IMAGE_SIZES = {
  preview: 'c246x328',
  download: 'big',
} as const

/** Prefer highest available quality first. */
export const VIDEO_QUALITIES = ['1440p', '1080p', '720p'] as const

export type VideoQuality = (typeof VIDEO_QUALITIES)[number]
