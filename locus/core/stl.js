// Watertight binary STL from a JSCAD geom3, as tools/prints/prints.js writes the prototype prints.
const { geometries } = require('@jscad/modeling')

// The union leaves T-junctions: a vertex of one face sitting in the middle of a neighbour's edge.
// There is no gap, but the edges don't pair up, and some slicers then report the mesh as broken.
// Fix: add those vertices to the neighbour's outline, then triangulate each face from its centre.
const watertightTriangles = (geom) => {
  const polys = geometries.geom3.toPolygons(geom).map((p) => p.vertices)
  const ids = new Map()
  const V = []
  const id = (v) => { const k = v.map((c) => Math.round(c * 1e4)).join(','); if (!ids.has(k)) { ids.set(k, V.length); V.push(v) } return ids.get(k) }
  const faces = polys.map((vs) => vs.map(id))
  const open = openEdges(faces)
  let tris = closeTJunctions(faces, open, V, id)
  // Splitting a face from its centre can leave a new T-junction where two fixes meet. Repeat on what is left
  // (the prototype prints never need this; their meshes close in one pass).
  for (let pass = 0; pass < MAX_EXTRA_PASSES; pass++) {
    let left = openEdges(tris)
    if (!left.length) break
    // Two copies of one point can fall either side of a rounding step and get two ids. Weld them first.
    tris = weldOpenVertices(tris, left, V)
    left = openEdges(tris)
    if (!left.length) break
    tris = closeTJunctions(tris, left, V, id)
  }
  return { V, tris, openBefore: open.length, openAfter: openEdges(tris).length }
}

const WELD_MM = 1e-3 // same tolerance as a T-junction

/** Give open-edge vertices closer than WELD_MM one id, and drop triangles that collapse. */
const weldOpenVertices = (tris, open, V) => {
  const ids = [...new Set(open.flat())].sort((a, b) => a - b)
  const to = new Map()
  for (let i = 0; i < ids.length; i++) {
    if (to.has(ids[i])) continue
    for (let j = i + 1; j < ids.length; j++) {
      if (!to.has(ids[j]) && Math.hypot(...[0, 1, 2].map((k) => V[ids[i]][k] - V[ids[j]][k])) < WELD_MM) to.set(ids[j], ids[i])
    }
  }
  if (!to.size) return tris
  return tris.map((t) => t.map((v) => to.get(v) ?? v)).filter(([a, b, c]) => a !== b && b !== c && a !== c)
}

const MAX_EXTRA_PASSES = 3

const openEdges = (fs) => {
  const E = new Set()
  for (const f of fs) for (let i = 0; i < f.length; i++) E.add(f[i] + ',' + f[(i + 1) % f.length])
  return [...E].filter((e) => { const [a, b] = e.split(','); return !E.has(b + ',' + a) }).map((e) => e.split(',').map(Number))
}

// One pass: put every open-edge vertex that lies inside another open edge into that edge's face, then triangulate.
const closeTJunctions = (faces, open, V, id) => {
  const candidates = [...new Set(open.flat())]
  const insertOn = new Map() // "a,b" -> vertex ids strictly inside edge a->b, ordered from a
  for (const [a, b] of open) {
    const A = V[a]
    const B = V[b]
    const d = [B[0] - A[0], B[1] - A[1], B[2] - A[2]]
    const L2 = d[0] * d[0] + d[1] * d[1] + d[2] * d[2]
    const hits = []
    for (const c of candidates) {
      if (c === a || c === b) continue
      const P = V[c]
      const t = ((P[0] - A[0]) * d[0] + (P[1] - A[1]) * d[1] + (P[2] - A[2]) * d[2]) / L2
      if (t <= 1e-6 || t >= 1 - 1e-6) continue
      const q = [A[0] + t * d[0] - P[0], A[1] + t * d[1] - P[1], A[2] + t * d[2] - P[2]]
      if (Math.hypot(...q) < 1e-3) hits.push([t, c])
    }
    if (hits.length) insertOn.set(a + ',' + b, hits.sort((x, y) => x[0] - y[0]).map(([, c]) => c))
  }
  const tris = []
  for (const f of faces) {
    const ring = f.flatMap((a, i) => [a, ...(insertOn.get(a + ',' + f[(i + 1) % f.length]) ?? [])])
    if (ring.length === f.length) {
      for (let i = 1; i + 1 < f.length; i++) tris.push([f[0], f[i], f[i + 1]]) // convex face: plain fan
    } else {
      const c = id([0, 1, 2].map((k) => f.reduce((s, a) => s + V[a][k], 0) / f.length)) // centre of a convex face
      for (let i = 0; i < ring.length; i++) tris.push([c, ring[i], ring[(i + 1) % ring.length]])
    }
  }
  return tris
}

const writeBinaryStl = ({ V, tris }, header) => {
  const buf = Buffer.alloc(84 + 50 * tris.length)
  buf.write(header.slice(0, 80), 0, 'ascii')
  buf.writeUInt32LE(tris.length, 80)
  tris.forEach(([a, b, c], i) => {
    const [A, B, C] = [V[a], V[b], V[c]]
    const u = [B[0] - A[0], B[1] - A[1], B[2] - A[2]]
    const w = [C[0] - A[0], C[1] - A[1], C[2] - A[2]]
    const n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]]
    const len = Math.hypot(...n) || 1
    const o = 84 + 50 * i
    ;[...n.map((x) => x / len), ...A, ...B, ...C].forEach((x, k) => buf.writeFloatLE(x, o + 4 * k))
  })
  return buf
}

/** Binary STL (millimetres) of one solid. Throws if the mesh still has an unpaired edge after the T-junction fix. */
const toBinaryStl = (solid, header = 'Locus') => {
  const mesh = watertightTriangles(solid)
  if (mesh.openAfter !== 0) throw new Error(`mesh still has ${mesh.openAfter} unpaired edges`)
  return writeBinaryStl(mesh, header)
}

const readTriangleCount = (buffer) => buffer.readUInt32LE(80)

/** Number of mesh edges not shared by exactly two triangles. 0 means the STL is closed. */
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

/** Extent of a binary STL from its vertices: { min: [x, y, z], max: [x, y, z] } in the file's units (millimetres). */
const readBounds = (buffer) => {
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (let t = 0; t < readTriangleCount(buffer); t++) {
    for (let k = 0; k < 3; k++) {
      for (let j = 0; j < 3; j++) {
        const v = buffer.readFloatLE(84 + 50 * t + 12 + k * 12 + j * 4)
        min[j] = Math.min(min[j], v)
        max[j] = Math.max(max[j], v)
      }
    }
  }
  return { min, max }
}

module.exports = { toBinaryStl, watertightTriangles, readTriangleCount, countOpenEdges, readBounds }
