import type { HostRange } from '@/shared/api/wb/types'

export function findHostByVol(
  ranges: HostRange[],
  vol: number,
): string | undefined {
  const route = ranges.find(({ vol_range_from, vol_range_to, host }) => {
    if (typeof vol_range_from !== 'number' || typeof vol_range_to !== 'number') {
      return false
    }
    return vol >= vol_range_from && vol <= vol_range_to && host.length > 0
  })
  return route?.host
}

export function extractRangeHosts(
  routeMap?: Array<{ method: string; hosts: HostRange[] }>,
): HostRange[] {
  if (!routeMap?.length) {
    return []
  }

  // Prefer method=range (vol bounds). Fall back to first entry only if it has ranges.
  const rangeEntry = routeMap.find((entry) => entry.method === 'range')
  if (rangeEntry?.hosts?.length) {
    return rangeEntry.hosts
  }

  const first = routeMap[0]
  const hosts = first?.hosts ?? []
  const hasVolBounds = hosts.some(
    (h) => typeof h.vol_range_from === 'number' && typeof h.vol_range_to === 'number',
  )
  return hasVolBounds ? hosts : []
}
