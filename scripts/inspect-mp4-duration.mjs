import { readFileSync } from 'node:fs'

/** Minimal ISO-BMFF box walker for duration fields. */
function readU32(buf, off) {
  return buf.readUInt32BE(off)
}

function readU64(buf, off) {
  // big-endian u64 as number (ok for durations we care about)
  const hi = buf.readUInt32BE(off)
  const lo = buf.readUInt32BE(off + 4)
  return hi * 2 ** 32 + lo
}

function walk(buf, start, end, path = '') {
  let offset = start
  while (offset + 8 <= end) {
    let size = readU32(buf, offset)
    const type = buf.toString('ascii', offset + 4, offset + 8)
    let header = 8
    if (size === 1) {
      size = readU64(buf, offset + 8)
      header = 16
    } else if (size === 0) {
      size = end - offset
    }
    if (size < header || offset + size > end) {
      break
    }

    const boxStart = offset + header
    const boxEnd = offset + size
    const fullPath = path ? `${path}/${type}` : type

    if (type === 'moov' || type === 'trak' || type === 'mdia' || type === 'minf' || type === 'stbl') {
      walk(buf, boxStart, boxEnd, fullPath)
    } else if (type === 'mvhd') {
      const version = buf[boxStart]
      if (version === 1) {
        const timescale = readU32(buf, boxStart + 20)
        const duration = readU64(buf, boxStart + 24)
        console.log(fullPath, { version, timescale, duration, sec: duration / timescale })
      } else {
        const timescale = readU32(buf, boxStart + 12)
        const duration = readU32(buf, boxStart + 16)
        console.log(fullPath, { version, timescale, duration, sec: duration / timescale })
      }
    } else if (type === 'tkhd') {
      const version = buf[boxStart]
      if (version === 1) {
        const duration = readU64(buf, boxStart + 28)
        console.log(fullPath, { version, duration })
      } else {
        const duration = readU32(buf, boxStart + 20)
        console.log(fullPath, { version, duration })
      }
    } else if (type === 'mdhd') {
      const version = buf[boxStart]
      if (version === 1) {
        const timescale = readU32(buf, boxStart + 20)
        const duration = readU64(buf, boxStart + 24)
        console.log(fullPath, { version, timescale, duration, sec: duration / timescale })
      } else {
        const timescale = readU32(buf, boxStart + 12)
        const duration = readU32(buf, boxStart + 16)
        console.log(fullPath, { version, timescale, duration, sec: duration / timescale })
      }
    } else if (type === 'moof' || type === 'traf') {
      walk(buf, boxStart, boxEnd, fullPath)
    } else if (type === 'tfdt') {
      const version = buf[boxStart]
      const base =
        version === 1 ? readU64(buf, boxStart + 4) : readU32(buf, boxStart + 4)
      console.log(fullPath, { version, baseMediaDecodeTime: base })
    } else if (type === 'mfhd' || type === 'tfhd' || type === 'trun') {
      // skip details
    }

    offset += size
  }
}

const file = process.argv[2] || 'test-keep-true.mp4'
const buf = readFileSync(file)
console.log('file', file, 'bytes', buf.length)
walk(buf, 0, buf.length)
