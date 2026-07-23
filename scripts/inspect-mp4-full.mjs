import { readFileSync } from 'node:fs'

function readU32(buf, off) {
  return buf.readUInt32BE(off)
}
function readU64(buf, off) {
  return buf.readUInt32BE(off) * 2 ** 32 + buf.readUInt32BE(off + 4)
}

function walk(buf, start, end, depth = 0) {
  let offset = start
  while (offset + 8 <= end) {
    let size = readU32(buf, offset)
    const type = buf.toString('ascii', offset + 4, offset + 8)
    let header = 8
    if (size === 1) {
      size = Number(readU64(buf, offset + 8))
      header = 16
    } else if (size === 0) {
      size = end - offset
    }
    if (size < header || offset + size > end + 1) break
    const indent = '  '.repeat(depth)
    const boxStart = offset + header
    const boxEnd = offset + size
    let extra = ''
    if (type === 'trun') {
      const version = buf[boxStart]
      const flags = (buf[boxStart + 1] << 16) | (buf[boxStart + 2] << 8) | buf[boxStart + 3]
      const sampleCount = readU32(buf, boxStart + 4)
      extra = ` v=${version} flags=0x${flags.toString(16)} samples=${sampleCount}`
      // sum sample durations if present (flag 0x100)
      if (flags & 0x100) {
        let p = boxStart + 8
        if (flags & 0x1) p += 4 // data_offset
        if (flags & 0x4) p += 4 // first_sample_flags
        let sum = 0
        const hasSize = flags & 0x200
        const hasFlags = flags & 0x400
        const hasCto = flags & 0x800
        for (let i = 0; i < sampleCount; i++) {
          sum += readU32(buf, p)
          p += 4
          if (hasSize) p += 4
          if (hasFlags) p += 4
          if (hasCto) p += 4
        }
        extra += ` durationSum=${sum}`
      }
    }
    if (type === 'mvex' || type === 'mehd' || type === 'trex') {
      extra = ' (fragment related)'
      if (type === 'mehd') {
        const version = buf[boxStart]
        const fragDur =
          version === 1 ? readU64(buf, boxStart + 4) : readU32(buf, boxStart + 4)
        extra += ` fragmentDuration=${fragDur}`
      }
    }
    console.log(`${indent}${type} size=${size}${extra}`)
    if (
      ['moov', 'trak', 'mdia', 'minf', 'stbl', 'moof', 'traf', 'mvex'].includes(type)
    ) {
      walk(buf, boxStart, boxEnd, depth + 1)
    }
    offset += size
  }
}

const file = process.argv[2] || 'test-keep-false.mp4'
const buf = readFileSync(file)
walk(buf, 0, buf.length)
