import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'

const require = createRequire(import.meta.url)
const muxjs = require('mux.js')

const nm = Number(process.argv[2] || 604174866)
const quality = process.argv[3] || '1440p'
const vol = nm % 144
const part = Math.floor(nm / 1e4)
const up = await (await fetch('https://cdn.wbbasket.ru/api/v3/upstreams')).json()
const hosts = up.origin.videonme_route_map.find((m) => m.method === 'range').hosts
const host = hosts.find((h) => vol >= h.vol_range_from && vol <= h.vol_range_to).host
const base = `https://${host}/vol${vol}/part${part}/${nm}/hls/${quality}`
const playlist = await (await fetch(`${base}/index.m3u8`)).text()
const segs = playlist
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'))

let durationSec = 0
for (const line of playlist.split(/\r?\n/)) {
  if (line.startsWith('#EXTINF:')) {
    durationSec += Number(line.slice(8).split(',')[0])
  }
}
console.log({ durationSec, segs: segs.length })

const parts = []
for (const seg of segs) {
  const buf = new Uint8Array(await (await fetch(new URL(seg, `${base}/`).href)).arrayBuffer())
  parts.push(buf)
}
const total = parts.reduce((s, p) => s + p.length, 0)
const ts = new Uint8Array(total)
let o = 0
for (const p of parts) {
  ts.set(p, o)
  o += p.length
}

const transmuxer = new muxjs.mp4.Transmuxer({ keepOriginalTimestamps: false })
let init = null
const chunks = []
transmuxer.on('data', (segment) => {
  if (segment.initSegment?.byteLength && !init) init = new Uint8Array(segment.initSegment)
  chunks.push(new Uint8Array(segment.data))
})
transmuxer.push(ts)
transmuxer.flush()

const mediaSize = chunks.reduce((s, c) => s + c.length, 0)
const raw = new Uint8Array(init.length + mediaSize)
raw.set(init, 0)
let off = init.length
for (const c of chunks) {
  raw.set(c, off)
  off += c.length
}

// Inline patch (same idea as TS)
function readU32(view, offset) {
  return view.getUint32(offset, false)
}
function writeU32(view, offset, value) {
  view.setUint32(offset, value >>> 0, false)
}
function clamp(timescale, sec) {
  return Math.min(Math.max(0, Math.round(sec * timescale)), 0xfffffffe)
}
function iterate(view, start, end, visit) {
  let offset = start
  while (offset + 8 <= end) {
    let size = readU32(view, offset)
    const type = String.fromCharCode(
      view.getUint8(offset + 4),
      view.getUint8(offset + 5),
      view.getUint8(offset + 6),
      view.getUint8(offset + 7),
    )
    let header = 8
    if (size === 1) {
      size = readU32(view, offset + 8) * 2 ** 32 + readU32(view, offset + 12)
      header = 16
    } else if (size === 0) size = end - offset
    if (size < header || offset + size > end) break
    const content = offset + header
    const boxEnd = offset + size
    visit(type, content, boxEnd)
    if (['moov', 'trak', 'mdia', 'minf', 'stbl', 'mvex'].includes(type)) {
      iterate(view, content, boxEnd, visit)
    }
    offset = boxEnd
  }
}

const patched = new Uint8Array(raw)
const view = new DataView(patched.buffer)
let movieTs = 90000
iterate(view, 0, patched.length, (type, content) => {
  if (type === 'mvhd' || type === 'mdhd') {
    const version = view.getUint8(content)
    const timescale = version === 1 ? readU32(view, content + 20) : readU32(view, content + 12)
    if (type === 'mvhd') movieTs = timescale
    const dur = clamp(timescale, durationSec)
    if (version === 1) {
      writeU32(view, content + 24, 0)
      writeU32(view, content + 28, dur)
    } else writeU32(view, content + 16, dur)
  }
})
iterate(view, 0, patched.length, (type, content) => {
  if (type !== 'tkhd') return
  const version = view.getUint8(content)
  const dur = clamp(movieTs, durationSec)
  if (version === 1) {
    writeU32(view, content + 28, 0)
    writeU32(view, content + 32, dur)
  } else writeU32(view, content + 20, dur)
})

function inspectDuration(buf, label) {
  const v = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
  iterate(v, 0, buf.length, (type, content) => {
    if (type === 'mvhd' || type === 'mdhd') {
      const version = v.getUint8(content)
      const timescale = version === 1 ? readU32(v, content + 20) : readU32(v, content + 12)
      const duration = version === 1 ? readU32(v, content + 28) : readU32(v, content + 16)
      console.log(label, type, { timescale, duration, sec: duration / timescale })
    }
  })
}

inspectDuration(raw, 'raw')
inspectDuration(patched, 'patched')
writeFileSync('test-duration-fixed.mp4', patched)
console.log('wrote test-duration-fixed.mp4', patched.length)
