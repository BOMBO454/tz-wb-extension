import { readFileSync } from 'node:fs';

const upstreams = JSON.parse(readFileSync('./upstreams.json', 'utf8'));
const nm = 604174866;

// images
{
  const vol = Math.floor(nm / 1e5);
  const part = Math.floor(nm / 1e3);
  const ranges = upstreams.origin.mediabasket_route_map[0].hosts;
  const route = ranges.find(
    (r) => vol >= r.vol_range_from && vol <= r.vol_range_to,
  );
  const img = `https://${route.host}/vol${vol}/part${part}/${nm}/images/big/1.webp`;
  console.log('image', img);
  const res = await fetch(img, { method: 'HEAD' });
  console.log('image head', res.status, res.headers.get('content-type'));
}

// video
{
  const vol = nm % 144;
  const part = Math.floor(nm / 1e4);
  const ranges = upstreams.origin.videonme_route_map[0].hosts;
  const route = ranges.find(
    (r) => vol >= r.vol_range_from && vol <= r.vol_range_to,
  );
  console.log('video host', { vol, part, host: route.host });
  const base = `https://${route.host}/vol${vol}/part${part}/${nm}`;
  const candidates = [
    `${base}/hls/1440p/index.m3u8`,
    `${base}/hls/1080p/index.m3u8`,
    `${base}/hls/720p/index.m3u8`,
    `${base}/hls/master.m3u8`,
    `${base}/hls/index.m3u8`,
    `${base}/video.mp4`,
    `${base}/mp4/1080p.mp4`,
    `${base}/mp4/720p.mp4`,
  ];
  for (const url of candidates) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      console.log(res.status, url);
      if (res.ok) {
        const textRes = await fetch(url);
        const text = await textRes.text();
        console.log('body preview:', text.slice(0, 400));
      }
    } catch (e) {
      console.log('err', url, e.message);
    }
  }
}
