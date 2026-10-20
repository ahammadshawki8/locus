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

let union = Manifold.union(solids)
const { min, max } = union.boundingBox()
const tol = 1e-6
if (min[0] < -tol || min[1] < -tol || max[0] > plate.widthMm + tol || max[1] > plate.heightMm + tol) {
  union = union.intersect(Manifold.cube([plate.widthMm, plate.heightMm, max[2] + 2]).translate([0, 0, -1]))
}
if (union.status() !== 'NoError') fail(`union: ${union.status()}`)

const out = union.getMesh()
if (out.numProp !== 3) fail(`unexpected mesh with ${out.numProp} properties per vertex`)
process.stdout.write(JSON.stringify({ vert: Array.from(out.vertProperties), tri: Array.from(out.triVerts) }))
