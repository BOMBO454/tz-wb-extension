/** Host entry from route map. Range maps include vol bounds; mod maps often only `host`. */
export type HostRange = {
  host: string
  vol_range_from?: number
  vol_range_to?: number
}

export type RouteMapEntry = {
  method: 'range' | 'mod' | string
  hosts: HostRange[]
}

export type UpstreamsResponse = {
  recommend: {
    mediabasket_route_map: RouteMapEntry[]
    videonme_route_map: RouteMapEntry[]
  }
  origin: {
    mediabasket_route_map: RouteMapEntry[]
    videonme_route_map: RouteMapEntry[]
    staticbasket_route_map?: RouteMapEntry[]
  }
  metrics_url?: string
}

export type WbProduct = {
  id: number
  name: string
  brand: string
  pics: number
  supplier?: string
  reviewRating?: number
  viewFlags?: number
}

export type CardDetailResponse = {
  products: WbProduct[]
}
