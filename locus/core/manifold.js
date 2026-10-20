// Fallback mesh step (docs/decisions.md 20 Oct 2026): when the JSCAD union leaves open edges that stl.js cannot close,
// Manifold (manifold-3d 3.2.1, Apache-2.0, https://github.com/elalish/manifold) unions the same JSCAD parts and returns
// a mesh that is closed by construction, cut to the plate's footprint as clipToPlate cuts the JSCAD solid. Manifold's
// WebAssembly loads only asynchronously, so it runs in a child process (manifold-worker.mjs) and render stays
// synchronous. Requests the JSCAD repair closes, prints A, B and C among them, never reach it (contracts D3).
const { spawnSync } = require('child_process')
const path = require('path')
const { geometries } = require('@jscad/modeling')

const WORKER = path.join(__dirname, 'manifold-worker.mjs')

// One JSCAD solid as flat vertex and triangle lists. JSCAD faces are convex, so a fan from the first vertex is exact;
// a primitive's faces share exact vertex coordinates, so equal coordinates are one vertex.
const toTriangles = (geom) => {
  const ids = new Map()
  const vert = []
  const tri = []
  const id = (v) => {
    const key = v.join(',')
    if (!ids.has(key)) { ids.set(key, vert.length / 3); vert.push(...v) }
    return ids.get(key)
  }
  for (const { vertices } of geometries.geom3.toPolygons(geom)) {
    const f = vertices.map(id)
    for (let i = 1; i + 1 < f.length; i++) tri.push(f[0], f[i], f[i + 1])
  }
  return { vert, tri }
}

/** Union of JSCAD parts by Manifold, cut to the plate: { V: [[x, y, z]], tris: [[a, b, c]] } as stl.js writes it. */
const manifoldMesh = (parts, { widthMm, heightMm }) => {
  const input = JSON.stringify({ plate: { widthMm, heightMm }, parts: parts.map(toTriangles) })
  const run = spawnSync(process.execPath, [WORKER], { input, encoding: 'utf8', maxBuffer: 1 << 28 })
  if (run.error || run.status !== 0) throw new Error(`manifold fallback failed: ${(run.stderr || '').trim() || run.error?.message}`)
  const { vert, tri } = JSON.parse(run.stdout)
  const V = []
  for (let i = 0; i < vert.length; i += 3) V.push([vert[i], vert[i + 1], vert[i + 2]])
  const tris = []
  for (let i = 0; i < tri.length; i += 3) tris.push([tri[i], tri[i + 1], tri[i + 2]])
  return { V, tris }
}

module.exports = { manifoldMesh, toTriangles }
