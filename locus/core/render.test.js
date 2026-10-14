const test = require('node:test')
const assert = require('node:assert')
const path = require('path')

const { render } = require('./render')
const { toBinaryStl, readTriangleCount, countOpenEdges } = require('./stl')

const root = path.join(__dirname, '..', '..')
const spec = require(path.join(root, 'examples', 'projectile.json'))
const layout = require(path.join(root, 'examples', 'projectile.layout.json'))

test('render produces a printable STL, an SVG preview and a description from one scene', () => {
  const out = render(spec, layout)
  assert.ok(readTriangleCount(out.stl) > 100)
  const { widthMm, heightMm } = out.scene.plate
  assert.match(out.svg, new RegExp(`width="${widthMm}mm" height="${heightMm}mm"`))
  assert.match(out.svg, /class="curve"/)
  assert.match(out.svg, /data-mark="vertex"/)
  assert.match(out.description, /vertex/)
})

test('render bounding box matches the plate and stays on the print bed', () => {
  const out = render(spec, layout)
  const [[x0, y0, z0], [x1, y1]] = out.bounds
  const { widthMm, heightMm } = out.scene.plate
  assert.ok(Math.abs(x0) < 1e-6 && Math.abs(y0) < 1e-6 && Math.abs(z0) < 1e-6)
  assert.ok(Math.abs(x1 - widthMm) < 1e-6 && Math.abs(y1 - heightMm) < 1e-6)
  const { bedMm } = require('./profiles/fdm-3d-v1.json')
  assert.ok(x1 <= bedMm.x && y1 <= bedMm.y)
})

test('every printed shell is watertight (no open edges)', () => {
  const out = render(spec, { ...layout, showGrid: true })
  assert.strictEqual(out.solids.length, 1 + out.scene.lines.length + out.scene.marks.length)
  out.solids.forEach((solid, i) => assert.strictEqual(countOpenEdges(toBinaryStl(solid)), 0, `shell ${i}`))
})
