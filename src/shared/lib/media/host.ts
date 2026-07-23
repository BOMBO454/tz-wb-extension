import type { HostRange } from "@/shared/api/wb/types";

export function findHostByVol(
  ranges: HostRange[],
  vol: number,
): string | undefined {
  const route = ranges.find(
    ({ vol_range_from, vol_range_to }) =>
      vol >= vol_range_from && vol <= vol_range_to,
  );
  return route?.host;
}

export function extractRangeHosts(
  routeMap: Array<{ method: string; hosts: HostRange[] }> | undefined,
): HostRange[] {
  if (!routeMap?.length) {
    return [];
  }

  const rangeEntry =
    routeMap.find((entry) => entry.method === "range") ?? routeMap[0];
  return rangeEntry?.hosts ?? [];
}
