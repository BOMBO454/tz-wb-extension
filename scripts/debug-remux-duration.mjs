import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'

const require = createRequire(import.meta.url)
const muxjs = require('mux.js')

const nm = Number(process.argv[2] || 604174866)
const quality = process.argv[3] || '720p'

const vol = nm % 144
const part = Math.floor(nm / 1e4)
const up = await (await fetch('https://cdn.wbbasket.ru/api/v3/upstreams')).json()
const hosts = up.origin.videonme_route_map.find((m) => m.method === 'range').hosts
const host = hosts.find((h) => vol >= h.vol_range_from && vol <= h.vol_range_to).host
const base = `https://${host}/vol${vol}/part${part}/${nm}/hls/${quality}`
const playlistUrl = `${base}/index.m3u8`
const playlist = await (await fetch(playlistUrl)).text()
console.log('playlist:\n', playlist.slice(0, 500))
const segs = playlist
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'))
console.log('segments', segs.length)

const parts = []
for (const seg of segs) {
  const url = new URL(seg, `${base}/`).href
  const buf = new Uint8Array(await (await fetch(url)).arrayBuffer())
  parts.push(buf)
}
const total = parts.reduce((s, p) => s + p.length, 0)
const ts = new Uint8Array(total)
let o = 0
for (const p of parts) {
  ts.set(p, o)
  o += p.length
}

function remux(options, label) {
  const t = new muxjs.mp4.Transmuxer(options)
  let init = null
  const chunks = []
  const metas = []
  t.on('data', (seg) => {
    if (seg.initSegment?.byteLength && !init) {
      init = new Uint8Array(seg.initSegment)
    }
    chunks.push(new Uint8Array(seg.data))
    metas.push({
      type: seg.type,
      dataLen: seg.data?.byteLength,
      pts: seg.pts,
      dts: seg.dts,
      baseMediaDecodeTime: seg.baseMediaDecodeTime,
    })
  })
  t.push(ts)
  t.flush()
  if (typeof t.dispose === 'function') {
    t.dispose()
  }
  console.log(label, 'metas', metas)
  if (!init || chunks.length === 0) {
    throw new Error(`${label}: no output`)
  }
  const mediaSize = chunks.reduce((s, c) => s + c.length, 0)
  const out = new Uint8Array(init.length + mediaSize)
  out.set(init, 0)
  let off = init.length
  for (const c of chunks) {
    out.set(c, off)
    off += c.length
  }
  return out
}

const keepTrue = remux({ keepOriginalTimestamps: true }, 'keep=true')
const keepFalse = remux({ keepOriginalTimestamps: false }, 'keep=false')
const defaultOpts = remux({}, 'default')

writeFileSync('test-keep-true.mp4', keepTrue)
writeFileSync('test-keep-false.mp4', keepFalse)
writeFileSync('test-default.mp4', defaultOpts)
console.log('sizes', {
  keepTrue: keepTrue.length,
  keepFalse: keepFalse.length,
  defaultOpts: defaultOpts.length,
})
