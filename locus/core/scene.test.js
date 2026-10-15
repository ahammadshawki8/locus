const test = require('node:test')
const assert = require('node:assert')
const path = require('path')

const { buildScene } = require('./scene')
const { loadProfile } = require('./profiles')

const prints = path.join(__dirname, '..', '..', 'tools', 'prints')
const spec = require(path.join(prints, 'spec.json'))
const specC = require(path.join(prints, 'spec-C.json'))
const layoutA = require(path.join(prints, 'layout-A.json'))
const layoutB = require(path.join(prints, 'layout-B.json'))
const layoutC = require(path.join(prints, 'layout-C.json'))
const report = require(path.join(prints, 'report.json'))
const profile = loadProfile('fdm-handheld-v1')

const near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps

test('the plate is the profile plate (100 x 100 x 2 mm, contracts D1)', () => {
  assert.deepStrictEqual(buildScene(spec, layoutA, profile).plate, { widthMm: 100, heightMm: 100, thicknessMm: 2 })
})

test('placement rule: domain minimum 12 mm from the left, lowest of curve and x-axis 20 mm from the bottom', () => {
  for (const [s, l, name] of [[spec, layoutA, 'graph-A-attempt1'], [spec, layoutB, 'graph-B-corrected'], [specC, layoutC, 'graph-C-cubic']]) {
    const scene = buildScene(s, l, profile)
    const curve = scene.lines.find((x) => x.id === 'curve').points
    assert.ok(near(curve[0][0], 12), name)
    const lowest = Math.min(scene.origin[1], ...curve.map(([, y]) => y))
    assert.ok(Math.abs(lowest - 20) < 0.05, `${name}: lowest ${lowest}`)
    assert.deepStrictEqual(scene.origin.map((v) => Math.round(v * 10) / 10), report[name].origin, name)
  }
})

test('marks are where the prints put them', () => {
  const scene = buildScene(specC, layoutC, profile)
  assert.deepStrictEqual(scene.marks.map((m) => m.id), ['turning-point-1', 'turning-point-2', 'y-intercept'])
  for (const m of scene.marks) {
    const [x, y] = report['graph-C-cubic'].marks[m.id]
    assert.ok(near(m.x, x, 1e-3) && near(m.y, y, 1e-3), m.id)
  }
})

test('axes, ticks and the curve: features sized from the profile', () => {
  const scene = buildScene(spec, layoutB, profile)
  const byKind = (k) => scene.lines.filter((l) => l.kind === k)
  assert.deepStrictEqual(byKind('axis').map((l) => l.id), ['x-axis', 'y-axis'])
  assert.ok(byKind('axis').every((l) => l.widthMm === 1 && l.heightMm === 0.7))
  assert.ok(byKind('tick').every((l) => l.widthMm === 1 && l.heightMm === 0.7))
  assert.deepStrictEqual(byKind('curve').map((l) => [l.widthMm, l.heightMm, l.points.length]), [[1.2, 1, 401]])
  assert.ok(scene.marks.every((m) => m.diameterMm === 3 && m.heightMm === 1.6))
})

test('a tick is left out where it would sit on a point mark or too close to the curve', () => {
  const scene = buildScene(spec, layoutB, profile)
  const ticks = scene.lines.filter((l) => l.kind === 'tick').map((l) => l.id)
  assert.ok(!ticks.includes('tick-y-1'), 'y = 1 is the y-intercept point') // the curve crosses the y-axis there
  assert.ok(ticks.includes('tick-x-1'))
})

test('grid lines appear only when showGrid is true, at whole units except 0', () => {
  const grid = buildScene(spec, layoutA, profile).lines.filter((l) => l.kind === 'grid').map((l) => l.id)
  assert.deepStrictEqual(grid, ['grid-y-1', 'grid-y-2', 'grid-y-3', 'grid-x-1', 'grid-x-2', 'grid-x-3', 'grid-x-4'])
  assert.strictEqual(buildScene(spec, layoutB, profile).lines.filter((l) => l.kind === 'grid').length, 0)
})

test('the orientation triangle sits in the top-left corner', () => {
  assert.deepStrictEqual(buildScene(spec, layoutA, profile).orientation, { points: [[3, 92], [8, 97], [3, 97]], heightMm: 1 })
})

test('a requested mark outside the domain is carried as missing for TL-4', () => {
  const scene = buildScene({ ...spec, graph: { ...spec.graph, domain: { min: 1, max: 4.5 } } }, layoutA, profile)
  assert.deepStrictEqual(scene.missing.map((m) => m.mark), ['y-intercept'])
})
