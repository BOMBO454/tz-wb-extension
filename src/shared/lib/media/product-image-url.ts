import { findHostByVol } from '@/shared/lib/media/host'

import type { HostRange } from '@/shared/api/wb/types'

type ProductImageUrlParams = {
  nm: number
  ranges: HostRange[]
  size: string
  index: number
}

/**
 * Builds product image URL from basket routing map.
 * @see https://gist.github.com/sheldhur/50420d0b85b2c80bc02cf96550b50625
 */
export function productImageUrl({
  nm,
  ranges,
  size,
  index,
}: ProductImageUrlParams): string | undefined {
  const vol = Math.floor(nm / 1e5)
  const part = Math.floor(nm / 1e3)
  const host = findHostByVol(ranges, vol)

  if (!host) {
    return undefined
  }

  return `https://${host}/vol${vol}/part${part}/${nm}/images/${size}/${index}.webp`
}

export function buildProductImageUrls(
  nm: number,
  pics: number,
  ranges: HostRange[],
  size: string,
): string[] {
  const urls: string[] = []

  for (let index = 1; index <= pics; index += 1) {
    const url = productImageUrl({ nm, ranges, size, index })
    if (url) {
      urls.push(url)
    }
  }

  return urls
}
