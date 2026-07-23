import { describe, expect, it } from 'vitest'

import {
  parseCardDetailResponse,
  parseUpstreamsResponse,
  parseWbProduct,
} from '@/shared/api/wb/guards'
import { AppError } from '@/shared/api/errors'

describe('parseWbProduct', () => {
  it('accepts valid product', () => {
    expect(
      parseWbProduct({ id: 1, name: 'Shoe', brand: 'X', pics: 3 }),
    ).toEqual({ id: 1, name: 'Shoe', brand: 'X', pics: 3 })
  })

  it('rejects missing id', () => {
    expect(() => parseWbProduct({ name: 'A', brand: 'B', pics: 1 })).toThrow(AppError)
  })
})

describe('parseCardDetailResponse', () => {
  it('parses products array', () => {
    const data = parseCardDetailResponse({
      products: [{ id: 10, name: 'N', brand: 'B', pics: 1 }],
    })
    expect(data.products).toHaveLength(1)
    expect(data.products[0]?.id).toBe(10)
  })

  it('rejects invalid shape', () => {
    expect(() => parseCardDetailResponse({})).toThrow(AppError)
  })
})

describe('parseUpstreamsResponse', () => {
  const routeMap = [
    {
      method: 'range',
      hosts: [{ vol_range_from: 0, vol_range_to: 10, host: 'h.example' }],
    },
  ]

  it('parses origin and recommend maps', () => {
    const data = parseUpstreamsResponse({
      origin: {
        mediabasket_route_map: routeMap,
        videonme_route_map: routeMap,
      },
      recommend: {
        mediabasket_route_map: routeMap,
        videonme_route_map: routeMap,
      },
    })
    expect(data.origin.mediabasket_route_map[0]?.hosts[0]?.host).toBe('h.example')
  })

  it('rejects broken maps', () => {
    expect(() =>
      parseUpstreamsResponse({
        origin: {},
        recommend: {},
      }),
    ).toThrow(AppError)
  })
})
