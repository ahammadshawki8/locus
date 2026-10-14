// Binary STL writer for one or more JSCAD geom3 solids. JSCAD polygons are convex, so a triangle fan is exact.
const { geometries } = require('@jscad/modeling')

const toBinaryStl = (solids, header = 'Locus') => {
  const triangles = []
  const polygons = [].concat(solids).flatMap((solid) => geometries.geom3.toPolygons(solid))
  for (const polygon of polygons) {
    const normal = geometries.poly3.plane(polygon)
    const v = polygon.vertices
    for (let i = 1; i < v.length - 1; i++) triangles.push([normal, v[0], v[i], v[i + 1]])
  }
  const buffer = Buffer.alloc(84 + 50 * triangles.length)
  buffer.write(header.slice(0, 80), 0, 'ascii')
  buffer.writeUInt32LE(triangles.length, 80)
  let offset = 84
  for (const [n, a, b, c] of triangles) {
    for (const value of [n[0], n[1], n[2], ...a, ...b, ...c]) {
      buffer.writeFloatLE(value, offset)
      offset += 4
    }
    buffer.writeUInt16LE(0, offset)
    offset += 2
  }
  return buffer
}

const readTriangleCount = (buffer) => buffer.readUInt32LE(80)

/** Number of mesh edges not shared by exactly two triangles. 0 means every shell in the STL is closed. */
const countOpenEdges = (buffer) => {
  const edges = new Map()
  const key = (p) => p.map((v) => v.toFixed(4)).join(',')
  for (let t = 0; t < readTriangleCount(buffer); t++) {
    const offset = 84 + 50 * t + 12
    const v = [0, 1, 2].map((k) => key([0, 1, 2].map((j) => buffer.readFloatLE(offset + k * 12 + j * 4))))
    for (let k = 0; k < 3; k++) {
      const [a, b] = [v[k], v[(k + 1) % 3]].sort()
      edges.set(`${a}|${b}`, (edges.get(`${a}|${b}`) || 0) + 1)
    }
  }
  return [...edges.values()].filter((count) => count !== 2).length
}

module.exports = { toBinaryStl, readTriangleCount, countOpenEdges }
