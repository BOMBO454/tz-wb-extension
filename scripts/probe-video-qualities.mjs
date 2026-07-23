const nm = Number(process.argv[2] || 604174866)
const vol = nm % 144
const part = Math.floor(nm / 1e4)
const up = await (await fetch('https://cdn.wbbasket.ru/api/v3/upstreams')).json()
const hosts = up.origin.videonme_route_map.find((m) => m.method === 'range').hosts
const host = hosts.find((h) => vol >= h.vol_range_from && vol <= h.vol_range_to).host
console.log({ host, vol, part, nm })

for (const q of ['1440p', '1080p', '720p', '480p', '360p']) {
  const url = `https://${host}/vol${vol}/part${part}/${nm}/hls/${q}/index.m3u8`
  const r = await fetch(url)
  const text = await r.text()
  console.log(q, r.status, text.slice(0, 120).replace(/\n/g, ' | '))
}
