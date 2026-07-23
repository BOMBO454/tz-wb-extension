import { readFileSync } from 'node:fs';

const upstreams = JSON.parse(readFileSync('./upstreams.json', 'utf8'));
const nm = 604174866;
const vol = nm % 144;
const part = Math.floor(nm / 1e4);
const ranges = upstreams.origin.videonme_route_map[0].hosts;
const route = ranges.find(
  (r) => vol >= r.vol_range_from && vol <= r.vol_range_to,
);
const base = `https://${route.host}/vol${vol}/part${part}/${nm}`;

const candidates = [
  `${base}/hls/1440p/1.ts`,
  `${base}/mp4/1440p.mp4`,
  `${base}/mp4/video.mp4`,
  `${base}/video/1440p.mp4`,
  `${base}/1440p.mp4`,
];

for (const url of candidates) {
  const res = await fetch(url, { method: 'HEAD' });
  console.log(res.status, res.headers.get('content-type'), url);
}

// download first ts and check if we can remux simply
const m3u8 = await (await fetch(`${base}/hls/1440p/index.m3u8`)).text();
const segs = m3u8
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'));
console.log('segments', segs);

const buffers = [];
for (const seg of segs) {
  const u = new URL(seg, `${base}/hls/1440p/`).href;
  const ab = await (await fetch(u)).arrayBuffer();
  buffers.push(new Uint8Array(ab));
  console.log('seg', seg, ab.byteLength);
}
const total = buffers.reduce((s, b) => s + b.length, 0);
const out = new Uint8Array(total);
let offset = 0;
for (const b of buffers) {
  out.set(b, offset);
  offset += b.length;
}
console.log('total bytes', total, 'starts with', [...out.slice(0, 4)]);
