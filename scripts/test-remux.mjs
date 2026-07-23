import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'

const require = createRequire(import.meta.url)
const muxjs = require('mux.js')

const nm = 604174866
const vol = nm % 144
const part = Math.floor(nm / 1e4)
const host = 'videonme-basket-10.wbbasket.ru'
const base = `https://${host}/vol${vol}/part${part}/${nm}/hls/1440p`
const playlist = await (await fetch(`${base}/index.m3u8`)).text()
const segs = playlist
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'))

const parts = []
for (const seg of segs) {
  const buf = new Uint8Array(await (await fetch(`${base}/${seg}`)).arrayBuffer())
  parts.push(buf)
}
const total = parts.reduce((s, p) => s + p.length, 0)
const ts = new Uint8Array(total)
let o = 0
for (const p of parts) {
  ts.set(p, o)
  o += p.length
}

const transmuxer = new muxjs.mp4.Transmuxer({ keepOriginalTimestamps: true })
const chunks = []
const inits = []
transmuxer.on('data', (segment) => {
  if (segment.initSegment?.byteLength) inits.push(new Uint8Array(segment.initSegment))
  chunks.push(new Uint8Array(segment.data))
})
transmuxer.push(ts)
transmuxer.flush()

const init = inits[0]
const mediaSize = chunks.reduce((s, c) => s + c.length, 0)
const out = new Uint8Array(init.length + mediaSize)
out.set(init, 0)
let off = init.length
for (const c of chunks) {
  out.set(c, off)
  off += c.length
}
writeFileSync('test-out.mp4', out)
console.log('wrote test-out.mp4', out.length, 'init', init.length, 'chunks', chunks.length)
