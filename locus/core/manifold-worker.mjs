// Child process of manifold.js. Reads { plate, parts: [{ vert, tri }] } as JSON on stdin, unions the parts with
// Manifold, cuts the result to the plate's footprint when it sticks out, and writes { vert, tri } as JSON on stdout.
// Exits 1 with the reason on stderr when a part is not a closed solid or Manifold reports an error.
import Module from 'manifold-3d'

const chunks = []
for await (const chunk of process.stdin) chunks.push(chunk)
const { plate, parts } = JSON.parse(Buffer.concat(chunks).toString('utf8'))

const wasm = await Module()
wasm.setup()
const { Manifold, Mesh } = wasm

const fail = (message) => {
  process.stderr.write(message + '\n')
  process.exit(1)
}

const solids = parts.map(({ vert, tri }, i) => {
  const mesh = new Mesh({ numProp: 3, vertProperties: Float32Array.from(vert), triVerts: Uint32Array.from(tri) })
  mesh.merge()
  let solid
  try {
    solid = new Manifold(mesh)
  } catch (error) {
    fail(`part ${i} is not a closed solid: ${error.message || error}`)
  }
  if (solid.status() !== 'NoError') fail(`part ${i}: ${solid.status()}`)
  return solid
})

// Cut to the plate's footprint (and nothing below z = 0) when the solid sticks out, as clipToPlate does.
const clip = (solid) => {
  const { min, max } = solid.boundingBox()
  const tol = 1e-6
  if (min[0] >= -tol && min[1] >= -tol && min[2] >= -tol && max[0] <= plate.widthMm + tol && max[1] <= plate.heightMm + tol) return solid
  return solid.intersect(Manifold.cube([plate.widthMm, plate.heightMm, max[2] + 2]))
}

// STL holds float32 positions only, and stl.js's countOpenEdges compares them to 4 decimals. Manifold works in doubles,
// so two things that are fine in its mesh are open edges there:
// - a zero-length edge: two vertices joined by an edge at one position (an edge shorter than float32 resolves). These
//   are one point: `points` maps each vertex to its point, and the output drops the triangles that collapse.
// - a pinch: separate points at one position, where surfaces touch along a line or at a point (for example a steep
//   curve's outline touching itself); there an edge is shared by four triangles. Each pinch is fused with a filler
//   FILL_MM wide, far below what a printer makes (layers are about 0.1 mm).
const FILL_MM = 0.02
const MAX_FILL_ROUNDS = 3
const points = (mesh) => {
  const p = mesh.vertProperties
  const t = mesh.triVerts
  const key = (v) => [0, 1, 2].map((k) => p[3 * v + k].toFixed(4)).join(',')
  const root = Array.from({ length: p.length / 3 }, (_, v) => v)
  const find = (v) => (root[v] === v ? v : (root[v] = find(root[v])))
  for (let i = 0; i < t.length; i += 3) {
    for (let k = 0; k < 3; k++) {
      const [a, b] = [t[i + k], t[i + (k + 1) % 3]]
      if (key(a) === key(b)) root[find(a)] = find(b)
    }
  }
  return { p, t, key, find }
}

const pinchFillers = (mesh) => {
  const { p, t, key, find } = points(mesh)
  const rootsAt = new Map()
  for (let v = 0; v < p.length / 3; v++) rootsAt.set(key(v), (rootsAt.get(key(v)) || new Set()).add(find(v)))
  const pinched = (v) => rootsAt.get(key(v)).size > 1
  const corners = (v) => {
    const r = FILL_MM / 2
    const out = []
    for (const dx of [-r, r]) for (const dy of [-r, r]) for (const dz of [-r, r]) out.push([p[3 * v] + dx, p[3 * v + 1] + dy, p[3 * v + 2] + dz])
    return out
  }
  const fillers = []
  const done = new Set()
  for (let i = 0; i < t.length; i += 3) {
    for (let k = 0; k < 3; k++) {
      const [a, b] = [t[i + k], t[i + (k + 1) % 3]]
      if (!pinched(a)) continue
      if (pinched(b) && key(a) !== key(b)) {
        const edge = [key(a), key(b)].sort().join('|')
        if (!done.has(edge)) { done.add(edge); fillers.push(Manifold.hull([...corners(a), ...corners(b)])) }
      }
      if (!done.has(key(a))) { done.add(key(a)); fillers.push(Manifold.hull(corners(a))) }
    }
  }
  return fillers
}

let union = clip(Manifold.union(solids))
for (let round = 0; round < MAX_FILL_ROUNDS; round++) {
  const fillers = pinchFillers(union.getMesh())
  if (!fillers.length) break
  union = clip(Manifold.union([union, ...fillers]))
}
if (union.status() !== 'NoError') fail(`union: ${union.status()}`)

const out = union.getMesh()
if (out.numProp !== 3) fail(`unexpected mesh with ${out.numProp} properties per vertex`)
const { t, find } = points(out)
const tri = []
for (let i = 0; i < t.length; i += 3) {
  const [a, b, c] = [find(t[i]), find(t[i + 1]), find(t[i + 2])]
  if (a !== b && b !== c && a !== c) tri.push(a, b, c)
}
process.stdout.write(JSON.stringify({ vert: Array.from(out.vertProperties), tri }))
