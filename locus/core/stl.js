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
    // Two copies of one point can fall either side of a rounding step and get two ids. Weld them first, with a
    // tolerance that grows each pass: the union can leave a cluster of copies a few micrometres apart.
    tris = weldOpenVertices(tris, left, V, WELD_MM[Math.min(pass, WELD_MM.length - 1)])
    left = openEdges(tris)
    if (!left.length) break
    tris = closeTJunctions(tris, left, V, id)
  }
  tris = fillSliverHoles(tris, openEdges(tris), V)
  return { V, tris, openBefore: open.length, openAfter: openEdges(tris).length }
}

const SLIVER_MM = 1e-2 // a hole narrower than 10 micrometres is rounding left by the union, not a missing part

/** Close each loop of open edges with at most 4 edges that is narrower than SLIVER_MM, by a fan in reverse order. */
const fillSliverHoles = (tris, open, V) => {
  const next = new Map(open)
  const done = new Set()
  const fill = []
  for (const [start] of open) {
    if (done.has(start)) continue
    const loop = [start]
    for (let v = next.get(start); v !== undefined && v !== start && loop.length <= 4; v = next.get(v)) loop.push(v)
    loop.forEach((v) => done.add(v))
    if (loop.length < 3 || loop.length > 4 || next.get(loop[loop.length - 1]) !== start) continue
    const area = loop.slice(1, -1).reduce((sum, b, i) => {
      const [A, B, C] = [V[loop[0]], V[b], V[loop[i + 2]]]
      const u = [0, 1, 2].map((k) => B[k] - A[k])
      const w = [0, 1, 2].map((k) => C[k] - A[k])
      return sum + Math.hypot(u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]) / 2
    }, 0)
    const longest = Math.max(...loop.map((a, i) => Math.hypot(...[0, 1, 2].map((k) => V[a][k] - V[loop[(i + 1) % loop.length]][k]))))
    if (2 * area / longest >= SLIVER_MM) continue // width of the hole across its longest edge
    const back = [...loop].reverse()
    for (let i = 1; i + 1 < back.length; i++) fill.push([back[0], back[i], back[i + 1]])
  }
  return fill.length ? [...tris, ...fill] : tris
}

// Copies of one point this close are one point to any printer (layer and nozzle sizes are around 100 micrometres).
const WELD_MM = [2e-3, 5e-3, 1e-2]

/**
 * Give every vertex within `tol` of an open-edge vertex, directly or through other such vertices, that vertex's id,
 * and drop triangles that collapse. The near copies need not be on an open edge themselves: a centre fan can leave
 * slivers between several copies of one point, where only one copy has an open edge.
 */
const weldOpenVertices = (tris, open, V, tol) => {
  const ids = [...new Set(open.flat())].sort((a, b) => a - b)
  const used = [...new Set(tris.flat())]
  const near = (a, b) => Math.hypot(...[0, 1, 2].map((k) => V[a][k] - V[b][k])) < tol
  const to = new Map()
  for (const a of ids) {
    if (to.has(a)) continue
    const cluster = [a]
    for (let i = 0; i < cluster.length; i++) {
      for (const b of used) {
        if (b !== a && !to.has(b) && near(cluster[i], b)) { to.set(b, a); cluster.push(b) }
      }
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

module.exports = { toBinaryStl, writeBinaryStl, watertightTriangles, fillSliverHoles, readTriangleCount, countOpenEdges, readBounds }
