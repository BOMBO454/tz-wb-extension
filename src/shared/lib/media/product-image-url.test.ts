import { describe, expect, it } from 'vitest'

import {
  buildProductImageUrls,
  productImageUrl,
} from '@/shared/lib/media/product-image-url'

import type { HostRange } from '@/shared/api/wb/types'

const ranges: HostRange[] = [
  { vol_range_from: 0, vol_range_to: 9999, host: 'basket-12.wbbasket.ru' },
]

describe('productImageUrl', () => {
  it('builds URL with vol/part from nm', () => {
    const nm = 604174866
    const url = productImageUrl({ nm, ranges, size: 'big', index: 1 })
    // vol = floor(604174866 / 1e5) = 6041
    // part = floor(604174866 / 1e3) = 604174
    expect(url).toBe(
      'https://basket-12.wbbasket.ru/vol6041/part604174/604174866/images/big/1.webp',
    )
  })

  it('returns undefined without host', () => {
    expect(
      productImageUrl({ nm: 1, ranges: [], size: 'big', index: 1 }),
    ).toBeUndefined()
  })
})

describe('buildProductImageUrls', () => {
  it('builds one URL per pic index starting at 1', () => {
    const urls = buildProductImageUrls(100_000, 2, ranges, 'c246x328')
    expect(urls).toHaveLength(2)
    expect(urls[0]).toContain('/images/c246x328/1.webp')
    expect(urls[1]).toContain('/images/c246x328/2.webp')
  })
})
