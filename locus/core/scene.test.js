const test = require('node:test')
const assert = require('node:assert')
const path = require('path')

const { buildScene } = require('./scene')

const root = path.join(__dirname, '..', '..')
const spec = require(path.join(root, 'examples', 'projectile.json'))
const layout = require(path.join(root, 'examples', 'projectile.layout.json'))
const profile = require('./profiles/fdm-3d-v1.json')

const near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps

test('plate size is margins plus the scaled data range', () => {
  const scene = buildScene(spec, layout, profile)
  const { marginMm } = profile.geometry
  assert.ok(near(scene.plate.widthMm, 2 * marginMm + 5 * layout.xScaleMm))
  // y range: lowest sampled value at the domain ends is -0.125, highest is the vertex at 3
  assert.ok(near(scene.plate.heightMm, 2 * marginMm + (3 + 0.125) * layout.yScaleMm, 1e-3))
})

test('marks are placed in millimetres from the plate origin (y up)', () => {
  const scene = buildScene(spec, layout, profile)
  const vertex = scene.marks.find((m) => m.id === 'vertex')
  const { marginMm } = profile.geometry
  assert.ok(near(vertex.xMm, marginMm + (2 - -0.5) * layout.xScaleMm))
  assert.ok(near(vertex.yMm, marginMm + (3 - scene.range.yMin) * layout.yScaleMm))
})

test('axes sit on x = 0 and y = 0 when those are in range', () => {
  const scene = buildScene(spec, layout, profile)
  const xAxis = scene.lines.find((l) => l.id === 'x-axis')
  const yAxis = scene.lines.find((l) => l.id === 'y-axis')
  const origin = scene.toMm(0, 0)
  assert.ok(xAxis.points.every(([, y]) => near(y, origin[1])))
  assert.ok(yAxis.points.every(([x]) => near(x, origin[0])))
})

test('grid lines appear only when showGrid is true, at whole units, never on an axis', () => {
  const withGrid = buildScene(spec, { ...layout, showGrid: true }, profile)
  const without = buildScene(spec, { ...layout, showGrid: false }, profile)
  assert.strictEqual(without.lines.filter((l) => l.kind === 'grid').length, 0)
  const grid = withGrid.lines.filter((l) => l.kind === 'grid')
  assert.deepStrictEqual(grid.map((l) => l.id).sort(), ['grid-x-1', 'grid-x-2', 'grid-x-3', 'grid-x-4', 'grid-y-1', 'grid-y-2', 'grid-y-3'].sort())
})

test('the curve follows the polynomial and spans the domain', () => {
  const scene = buildScene(spec, layout, profile)
  const curve = scene.lines.find((l) => l.id === 'curve')
  assert.strictEqual(curve.points.length, profile.geometry.curveSamples + 1)
  assert.deepStrictEqual(curve.points[0], scene.toMm(-0.5, -0.125))
  assert.deepStrictEqual(curve.points[curve.points.length - 1], scene.toMm(4.5, -0.125))
})

test('a requested mark outside the domain is carried as missing for TL-4', () => {
  const scene = buildScene({ ...spec, graph: { ...spec.graph, domain: { min: 1, max: 4.5 } } }, layout, profile)
  assert.deepStrictEqual(scene.missing.map((m) => m.mark), ['y-intercept'])
})
