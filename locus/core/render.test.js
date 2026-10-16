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

// Requests a teacher could send (16 Oct (n)): the cubic for the second Gate 5 run left one open edge before the weld
// also merged near copies that are not on an open edge themselves. Each must render a closed STL.
const request = (coeffs, min, max, mark, requestId = 4) =>
  ({ schemaVersion: 3, requestId, graph: { type: 'polynomial', coeffs, domain: { min, max } }, mark, labels: 'braille-grade1', profileId: 'fdm-handheld-v1' })

test('ordinary requests that fit the plate render a closed STL, with and without the grid', () => {
  const requests = [
    request([0.5, 0, -1.5, 0], -2.2, 2.2, ['turning-points', 'x-intercepts']),
    request([1, -3, 0, 2], -1.5, 3.2, ['turning-points', 'y-intercept'], 9),
    request([0, -1, 0, 4], -2.5, 2.5, ['vertex', 'x-intercepts'], 9),
    request([0, 2, 0, -1], -1.2, 1.2, ['vertex', 'x-intercepts'], 9)
  ]
  for (const r of requests) {
    for (const showGrid of [true, false]) {
      const out = render(r, { ...layoutA, showGrid })
      assert.strictEqual(watertightTriangles(out.solid).openAfter, 0, `${JSON.stringify(r.graph.coeffs)} grid ${showGrid}`)
    }
  }
})

// A default layout can be wider than the plate (x from -3 to 3 at 16 mm per unit). TL-5 measures scene.json and fails
// it, with reduce-scale as the fix; the render job must not crash first, or the fixer gets no report.
test('a layout wider than the plate still renders: the STL is cut to the plate and closed, the scene keeps the overhang', () => {
  const wide = request([0, 0, 1, 1], -3, 3, ['y-intercept', 'x-intercepts'], 9)
  for (const showGrid of [true, false]) {
    const out = render(wide, { ...layoutA, showGrid })
    assert.strictEqual(watertightTriangles(out.solid).openAfter, 0, `grid ${showGrid}`)
    const [[x0, y0], [x1, y1]] = out.bounds
    assert.ok(x0 >= -1e-6 && y0 >= -1e-6 && x1 <= 100 + 1e-6 && y1 <= 100 + 1e-6, JSON.stringify(out.bounds))
    const right = Math.max(...out.scene.lines.flatMap((l) => l.points.map(([x]) => x)))
    assert.ok(right > 100, 'the scene still says where the curve really goes, so TL-5 can fail it')
  }
})

// A line (degree 1) is sampled at 401 collinear points; the union could not fuse the long collinear outline.
test('straight lines render a closed STL', () => {
  for (const [coeffs, min, max] of [[[0, 0, 1, 1], -2, 2], [[0, 0, 0.5, 1], -2, 3], [[0, 0, -1, 2], -1, 3]]) {
    const out = render(request(coeffs, min, max, ['y-intercept'], 9), layoutA)
    assert.strictEqual(watertightTriangles(out.solid).openAfter, 0, JSON.stringify(coeffs))
  }
})
