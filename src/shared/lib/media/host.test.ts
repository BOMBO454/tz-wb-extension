import { describe, expect, it } from 'vitest'

import { extractRangeHosts, findHostByVol } from '@/shared/lib/media/host'

import type { HostRange } from '@/shared/api/wb/types'

const ranges: HostRange[] = [
  { vol_range_from: 0, vol_range_to: 143, host: 'videonme-01.wbbasket.ru' },
  { vol_range_from: 144, vol_range_to: 287, host: 'videonme-02.wbbasket.ru' },
]

describe('findHostByVol', () => {
  it('returns host for matching range', () => {
    expect(findHostByVol(ranges, 0)).toBe('videonme-01.wbbasket.ru')
    expect(findHostByVol(ranges, 143)).toBe('videonme-01.wbbasket.ru')
    expect(findHostByVol(ranges, 200)).toBe('videonme-02.wbbasket.ru')
  })

  it('skips host-only mod entries', () => {
    expect(
      findHostByVol([{ host: 'mod-only.example' }, ...ranges], 10),
    ).toBe('videonme-01.wbbasket.ru')
  })

  it('returns undefined when out of range', () => {
    expect(findHostByVol(ranges, 9999)).toBeUndefined()
  })
})

describe('extractRangeHosts', () => {
  it('prefers method=range entry', () => {
    const hosts = extractRangeHosts([
      { method: 'mod', hosts: [{ host: 'mod.example' }] },
      { method: 'range', hosts: ranges },
    ])
    expect(hosts).toEqual(ranges)
  })

  it('returns empty for mod-only maps (no vol bounds)', () => {
    expect(
      extractRangeHosts([{ method: 'mod', hosts: [{ host: 'mod.example' }] }]),
    ).toEqual([])
  })

  it('returns empty array for missing map', () => {
    expect(extractRangeHosts()).toEqual([])
    expect(extractRangeHosts([])).toEqual([])
  })
})
