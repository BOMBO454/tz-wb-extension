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
  const rangeMap = [
    {
      method: 'range',
      hosts: [
        { vol_range_from: 0, vol_range_to: 10, host: 'basket-01.example' },
      ],
    },
  ]

  /** Real CDN recommend maps: method=mod, host only (no vol ranges). */
  const modMap = [
    {
      method: 'mod',
      hosts: [{ host: 'mow-basket-cdn-02.geobasket.ru' }],
    },
  ]

  it('parses origin range + recommend mod (live CDN shape)', () => {
    const data = parseUpstreamsResponse({
      origin: {
        mediabasket_route_map: rangeMap,
        videonme_route_map: rangeMap,
      },
      recommend: {
        mediabasket_route_map: modMap,
        videonme_route_map: modMap,
      },
    })
    expect(data.origin.mediabasket_route_map[0]?.method).toBe('range')
    expect(data.recommend.mediabasket_route_map[0]?.method).toBe('mod')
    expect(data.recommend.mediabasket_route_map[0]?.hosts[0]?.host).toBe(
      'mow-basket-cdn-02.geobasket.ru',
    )
  })

  it('accepts origin-only when recommend is missing', () => {
    const data = parseUpstreamsResponse({
      origin: {
        mediabasket_route_map: rangeMap,
        videonme_route_map: rangeMap,
      },
    })
    expect(data.origin.videonme_route_map).toHaveLength(1)
    expect(data.recommend.mediabasket_route_map).toEqual([])
  })

  it('rejects when both media maps are empty', () => {
    expect(() =>
      parseUpstreamsResponse({
        origin: {
          mediabasket_route_map: [],
          videonme_route_map: rangeMap,
        },
        recommend: {
          mediabasket_route_map: [],
          videonme_route_map: rangeMap,
        },
      }),
    ).toThrow(AppError)
  })

  it('rejects broken top-level shape', () => {
    expect(() => parseUpstreamsResponse({})).toThrow(AppError)
  })
})
