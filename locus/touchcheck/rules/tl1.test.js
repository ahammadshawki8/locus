const test = require('node:test')
const assert = require('node:assert')
const path = require('path')

const { checkLineGap } = require('./tl1')
const { buildScene } = require('../../core/scene')
const { loadProfile } = require('../../core/profiles')

const prints = path.join(__dirname, '..', '..', '..', 'tools', 'prints')
const spec = require(path.join(prints, 'spec.json'))
const layoutA = require(path.join(prints, 'layout-A.json'))
const layoutB = require(path.join(prints, 'layout-B.json'))
const profile = loadProfile('fdm-handheld-v1')
const { minLineGapMm } = profile.rules

// Synthetic scenes: a grid line 1.0 mm wide and a curve 1.2 mm wide, so the clear gap is the centre distance - 1.1 mm.
const grid = (id, points) => ({ id, kind: 'grid', points, widthMm: 1.0, heightMm: 0.5 })
const curve = (points, id = 'curve') => ({ id, kind: 'curve', points, widthMm: 1.2, heightMm: 1.0 })
const sceneOf = (...lines) => ({ lines })

test('the curve running parallel to a line closer than the minimum gap fails, measured edge to edge', () => {
  const result = checkLineGap(sceneOf(grid('a', [[0, 0], [50, 0]]), curve([[0, 3], [50, 3]])), profile)
  assert.strictEqual(result.passed, false)
  assert.strictEqual(result.violations.length, 1)
  const [v] = result.violations
  assert.strictEqual(v.measuredMm, 1.9)
  assert.strictEqual(v.requiredMm, minLineGapMm)
  assert.deepStrictEqual(v.subject, ['curve', 'a'])
  assert.match(v.message, /too close/)
  assert.ok(v.at.yMm > 0 && v.at.yMm < 3)
})

test('the curve at least the minimum gap from a line passes', () => {
  const result = checkLineGap(sceneOf(grid('a', [[0, 0], [50, 0]]), curve([[0, 4.4], [50, 4.4]])), profile)
  assert.strictEqual(result.passed, true)
  assert.deepStrictEqual(result.violations, [])
})

test('only the curve is checked: two other lines close together are not a TL-1 problem (projectLocus.md §10)', () => {
  const result = checkLineGap(sceneOf(grid('a', [[0, 0], [50, 0]]), grid('b', [[0, 2], [50, 2]]), curve([[0, 30], [50, 30]])), profile)
  assert.deepStrictEqual(result.violations, [])
})

test('right-angle, 45 degree and shallow crossings are real crossings', () => {
  const t = Math.tan((17 * Math.PI) / 180)
  for (const pts of [[[25, -20], [25, 20]], [[5, -20], [45, 20]], [[0, -50 * t], [100, 50 * t]]]) {
    const result = checkLineGap(sceneOf(grid('a', [[0, 0], [100, 0]]), curve(pts)), profile)
    assert.deepStrictEqual(result.violations, [], JSON.stringify(pts))
  }
})

test('a curve that crosses and then runs alongside the line fails where it stops moving away', () => {
  const result = checkLineGap(sceneOf(grid('a', [[0, 0], [100, 0]]), curve([[40, -20], [50, 2], [100, 2]])), profile)
  assert.strictEqual(result.violations.length, 1)
  assert.strictEqual(result.violations[0].measuredMm, 0.9)
  assert.ok(result.violations[0].at.xMm > 50)
})

test('a curve that touches a line without crossing it (tangent) fails with 0 mm', () => {
  const arch = []
  for (let x = -30; x <= 30; x += 0.5) arch.push([x, -(x * x) / 50])
  const result = checkLineGap(sceneOf(grid('flat', [[-30, 0], [30, 0]]), curve(arch)), profile)
  assert.strictEqual(result.violations.length, 1)
  assert.strictEqual(result.violations[0].measuredMm, 0)
  assert.ok(Math.abs(result.violations[0].at.xMm) < 1)
})

test('a line that ends on the curve (T-join) is a real meeting', () => {
  const result = checkLineGap(sceneOf(grid('a', [[25, 0], [25, 30]]), curve([[0, 0], [50, 0]])), profile)
  assert.deepStrictEqual(result.violations, [])
})

test('a line that ends just short of the curve fails: a fingertip cannot tell if they join', () => {
  const result = checkLineGap(sceneOf(grid('a', [[25, 3], [25, 30]]), curve([[0, 0], [50, 0]])), profile)
  assert.strictEqual(result.violations.length, 1)
  assert.strictEqual(result.violations[0].measuredMm, 1.9)
})

test('a curve that crosses a line and stops just past it is excused: that stretch is unavoidable (tools/prints)', () => {
  const result = checkLineGap(sceneOf(grid('a', [[0, 0], [50, 0]]), curve([[25, 30], [25, -2]])), profile)
  assert.deepStrictEqual(result.violations, [])
})

test('print A fails TL-1 where the grid line y = 3 runs along the curve at the vertex', () => {
  const scene = buildScene(spec, layoutA, profile)
  const result = checkLineGap(scene, profile)
  assert.strictEqual(result.passed, false)
  assert.deepStrictEqual(result.violations.map((v) => v.subject), [['curve', 'grid-y-3']])
  const vertex = scene.marks.find((m) => m.id === 'vertex')
  const [v] = result.violations
  assert.strictEqual(v.measuredMm, 0)
  assert.ok(Math.hypot(v.at.xMm - vertex.xMm, v.at.yMm - vertex.yMm) < 1)
})

test('print B passes TL-1 (grid hidden, y stretched): closest gap 3.44 mm, as measured on the prints', () => {
  const result = checkLineGap(buildScene(spec, layoutB, profile), profile)
  assert.strictEqual(result.passed, true)
  assert.ok(Math.abs(result.closestPassed.measuredMm - 3.44) < 0.01, `closest ${result.closestPassed.measuredMm}`)
})
