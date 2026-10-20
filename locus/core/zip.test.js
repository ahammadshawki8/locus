const test = require('node:test')
const assert = require('node:assert')
const { spawnSync } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')
const zlib = require('zlib')

const { crc32, toZip } = require('./zip')

const when = new Date(Date.UTC(2026, 9, 16, 12, 34, 56))
const entries = () => [
  { name: 'graph-12-v1/README.txt', data: Buffer.from('Print at 100% scale.\n') },
  { name: 'graph-12-v1/graph.stl', data: Buffer.alloc(5000, 7) }
]

// A reader written from the format, not from zip.js: walk the central directory, inflate each entry.
const readZip = (buf) => {
  const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]))
  const count = buf.readUInt16LE(eocd + 10)
  let at = buf.readUInt32LE(eocd + 16)
  const out = []
  for (let i = 0; i < count; i++) {
    assert.strictEqual(buf.readUInt32LE(at), 0x02014b50)
    const nameLength = buf.readUInt16LE(at + 28)
    const local = buf.readUInt32LE(at + 42)
    const entry = {
      method: buf.readUInt16LE(at + 10),
      time: buf.readUInt16LE(at + 12),
      date: buf.readUInt16LE(at + 14),
      crc: buf.readUInt32LE(at + 16),
      size: buf.readUInt32LE(at + 24),
      name: buf.subarray(at + 46, at + 46 + nameLength).toString('ascii')
    }
    assert.strictEqual(buf.readUInt32LE(local), 0x04034b50)
    const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28)
    entry.data = zlib.inflateRawSync(buf.subarray(start, start + buf.readUInt32LE(at + 20)))
    out.push(entry)
    at += 46 + nameLength + buf.readUInt16LE(at + 30) + buf.readUInt16LE(at + 32)
  }
  return out
}

test('crc32 gives the standard check value', () => {
  assert.strictEqual(crc32(Buffer.from('123456789')), 0xcbf43926)
  assert.strictEqual(crc32(Buffer.alloc(0)), 0)
})

test('toZip writes deflated entries that read back with their names, sizes, CRCs and the given time', () => {
  const read = readZip(toZip(entries(), when))
  assert.deepStrictEqual(read.map((e) => e.name), entries().map((e) => e.name))
  for (const [i, e] of read.entries()) {
    assert.strictEqual(e.method, 8)
    assert.deepStrictEqual(e.data, entries()[i].data)
    assert.strictEqual(e.size, entries()[i].data.length)
    assert.strictEqual(e.crc, crc32(entries()[i].data))
    assert.strictEqual(e.date, ((2026 - 1980) << 9) | (10 << 5) | 16)
    assert.strictEqual(e.time, (12 << 11) | (34 << 5) | (56 / 2))
  }
})

test('the same files and time give the same zip bytes', () => {
  assert.deepStrictEqual(toZip(entries(), when), toZip(entries(), when))
})

const hasUnzip = spawnSync('unzip', ['-v'], { encoding: 'utf8' }).status === 0
test('Info-ZIP unzip accepts the archive', { skip: !hasUnzip && 'unzip not installed' }, () => {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'locus-zip-')), 'test.zip')
  fs.writeFileSync(file, toZip(entries(), when))
  const result = spawnSync('unzip', ['-t', file], { encoding: 'utf8' })
  assert.strictEqual(result.status, 0, result.stdout + result.stderr)
  assert.match(result.stdout, /No errors detected/)
})
