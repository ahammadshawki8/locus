// docs/contracts.md D3/D4: locus/core reproduces the prototype prints A, B and C from their spec + layout files.
// Every triangle must have exactly the same vertices, in the same order, as tools/prints/ (compared as the float32
// bytes in the file). The stored normals are skipped: for print C our turning points are exact (x = 1 and 3) where
// prints.js found them numerically, so a few sliver triangles get a different normal from float64 noise below float32
// precision. Slicers recompute normals from the vertices.
const test = require('node:test')
const assert = require('node:assert')
const fs = require('fs')
const path = require('path')

const { render } = require('./render')
const { validateSpec, validateLayout } = require('./validate')

const prints = path.join(__dirname, '..', '..', 'tools', 'prints')
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(prints, file), 'utf8'))

// Same builds as tools/prints/prints.js: the braille ID on each plate is the print's number (1, 2, 3).
const builds = [
  { file: 'graph-A-attempt1', spec: 'spec.json', layout: 'layout-A.json', id: 1 },
  { file: 'graph-B-corrected', spec: 'spec.json', layout: 'layout-B.json', id: 2 },
  { file: 'graph-C-cubic', spec: 'spec-C.json', layout: 'layout-C.json', id: 3 }
]

for (const b of builds) {
  test(`print ${b.file}: same STL as the prototype print`, () => {
    const spec = readJson(b.spec)
    const layout = readJson(b.layout)
    assert.deepStrictEqual([...validateSpec(spec), ...validateLayout(layout)], [])
    const { stl } = render(spec, layout, undefined, { brailleIdNumber: b.id })
    const printed = fs.readFileSync(path.join(prints, `${b.file}.stl`))
    assert.strictEqual(stl.length, printed.length)
    assert.strictEqual(stl.readUInt32LE(80), printed.readUInt32LE(80))
    for (let o = 84; o < stl.length; o += 50) {
      const vertices = [o + 12, o + 48] // three vertices; skips the normal (12 bytes) and the attribute (2 bytes)
      if (!stl.subarray(...vertices).equals(printed.subarray(...vertices))) assert.fail(`${b.file}: triangle ${(o - 84) / 50} differs from tools/prints`)
    }
  })
}

test('the profile default layout is print A\'s layout (D4)', () => {
  const example = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'examples', 'projectile.layout.json'), 'utf8'))
  assert.deepStrictEqual(example, readJson('layout-A.json'))
})
