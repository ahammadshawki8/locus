const test = require('node:test')
const assert = require('node:assert')
const path = require('path')

const { render } = require('./render')
const { readTriangleCount, watertightTriangles } = require('./stl')

const prints = path.join(__dirname, '..', '..', 'tools', 'prints')
const spec = require(path.join(prints, 'spec.json'))
const layoutA = require(path.join(prints, 'layout-A.json'))
const layoutB = require(path.join(prints, 'layout-B.json'))

test('render produces a watertight STL, an SVG preview and a description from one scene', () => {
  const out = render(spec, layoutB)
  assert.ok(readTriangleCount(out.stl) > 1000)
  assert.strictEqual(watertightTriangles(out.solid).openAfter, 0) // the prints' check: every edge paired
  assert.match(out.svg, /width="100mm" height="100mm"/)
  assert.match(out.svg, /class="curve"/)
  assert.match(out.svg, /class="orientation"/)
  assert.match(out.svg, /data-mark="vertex"/)
  assert.match(out.description, /vertex/)
})

test('the solid is the 100 x 100 mm plate, 3.6 mm at the tallest feature (the point domes)', () => {
  const [[x0, y0, z0], [x1, y1, z1]] = render(spec, layoutA).bounds
  assert.ok([x0, y0, z0].every((v) => Math.abs(v) < 1e-6))
  assert.ok(Math.abs(x1 - 100) < 1e-6 && Math.abs(y1 - 100) < 1e-6)
  assert.ok(Math.abs(z1 - 3.6) < 1e-6)
})

test('the SVG preview draws every braille dot and carries the print text for sighted helpers', () => {
  const out = render(spec, { ...layoutB, labelMode: 'key' })
  for (const label of out.scene.labels) {
    const open = `<g class="braille" data-label="${label.id}">`
    const start = out.svg.indexOf(open)
    assert.ok(start >= 0, label.id)
    const group = out.svg.slice(start, out.svg.indexOf('</g>', start))
    assert.strictEqual((group.match(/<circle/g) || []).length, label.dots.length)
    assert.ok(group.includes(`<title>${label.text}</title>`))
  }
})

test('a mesh where one point got two ids (print B with the grid on) is welded and still closes', () => {
  const out = render(spec, { ...layoutB, showGrid: true })
  assert.strictEqual(watertightTriangles(out.solid).openAfter, 0)
})
