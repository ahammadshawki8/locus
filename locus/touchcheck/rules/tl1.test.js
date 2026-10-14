const test = require('node:test')
const assert = require('node:assert')
const path = require('path')

const { checkLineGap } = require('./tl1')
const { buildScene } = require('../../core/scene')

const root = path.join(__dirname, '..', '..', '..')
const spec = require(path.join(root, 'examples', 'projectile.json'))
const layout = require(path.join(root, 'examples', 'projectile.layout.json'))
const profile = require('../../core/profiles/fdm-3d-v1.json')
const { minLineGapMm } = profile.rules['TL-1']

// Synthetic scenes: lines 1.2 mm wide, so the clear gap is the centre distance minus 1.2 mm.
const line = (id, points, widthMm = 1.2) => ({ id, kind: 'grid', points, widthMm, heightMm: 0.4 })
const sceneOf = (...lines) => ({ lines })

test('two parallel lines closer than the minimum gap fail, with the clear gap measured edge to edge', () => {
  const result = checkLineGap(sceneOf(line('a', [[0, 0], [50, 0]]), line('b', [[0, 3], [50, 3]])), profile)
  assert.strictEqual(result.passed, false)
  assert.strictEqual(result.violations.length, 1)
  const [v] = result.violations
  assert.strictEqual(v.measuredMm, 1.8)
  assert.strictEqual(v.requiredMm, minLineGapMm)
  assert.deepStrictEqual(v.subject, ['a', 'b'])
  assert.match(v.message, /too close/)
  assert.ok(v.at.yMm > 0 && v.at.yMm < 3)
})

test('two parallel lines at least the minimum gap apart pass', () => {
  const result = checkLineGap(sceneOf(line('a', [[0, 0], [50, 0]]), line('b', [[0, 4.4], [50, 4.4]])), profile)
  assert.strictEqual(result.passed, true)
  assert.deepStrictEqual(result.violations, [])
})

test('a right-angle crossing is a real crossing and is not a violation', () => {
  const result = checkLineGap(sceneOf(line('a', [[0, 0], [50, 0]]), line('b', [[25, -20], [25, 20]])), profile)
  assert.deepStrictEqual(result.violations, [])
})

test('a 45 degree crossing is a real crossing too', () => {
  const result = checkLineGap(sceneOf(line('a', [[0, 0], [50, 0]]), line('b', [[5, -20], [45, 20]])), profile)
  assert.deepStrictEqual(result.violations, [])
})

test('a steep crossing is real however steep: the excused stretch is only where the lines move apart', () => {
  // 17 degrees, like the projectile's curve meeting the y-axis once y is stretched
  const t = Math.tan((17 * Math.PI) / 180)
  const result = checkLineGap(sceneOf(line('a', [[0, 0], [100, 0]]), line('b', [[0, -50 * t], [100, 50 * t]])), profile)
  assert.deepStrictEqual(result.violations, [])
})

test('a line that crosses and then runs alongside the other fails where it stops moving away', () => {
  const result = checkLineGap(sceneOf(line('a', [[0, 0], [100, 0]]), line('b', [[40, -20], [50, 2], [100, 2]])), profile)
  assert.strictEqual(result.violations.length, 1)
  assert.strictEqual(result.violations[0].measuredMm, 0.8)
  assert.ok(result.violations[0].at.xMm > 50)
})

test('a line that touches another without crossing (tangent) is not a real crossing', () => {
  // a shallow arch whose top sits on the line y = 0
  const arch = []
  for (let x = -30; x <= 30; x += 0.5) arch.push([x, -(x * x) / 50])
  const result = checkLineGap(sceneOf(line('flat', [[-30, 0], [30, 0]]), line('arch', arch)), profile)
  assert.strictEqual(result.violations.length, 1)
  assert.strictEqual(result.violations[0].measuredMm, 0)
  assert.ok(Math.abs(result.violations[0].at.xMm) < 1)
})

test('a line that ends on another line (T-join) is a real meeting', () => {
  const result = checkLineGap(sceneOf(line('a', [[0, 0], [50, 0]]), line('b', [[25, 0], [25, 30]])), profile)
  assert.deepStrictEqual(result.violations, [])
})

test('a line that ends just short of another line fails: a fingertip cannot tell if they join', () => {
  const result = checkLineGap(sceneOf(line('a', [[0, 0], [50, 0]]), line('b', [[25, 3], [25, 30]])), profile)
  assert.strictEqual(result.violations.length, 1)
  assert.strictEqual(result.violations[0].measuredMm, 1.8)
})

test('a line that crosses another and stops just past it fails (a stub, not a crossing)', () => {
  const result = checkLineGap(sceneOf(line('a', [[0, 0], [50, 0]]), line('b', [[25, -3], [25, 30]])), profile)
  assert.strictEqual(result.violations.length, 1)
  assert.strictEqual(result.violations[0].measuredMm, 1.8)
  assert.deepStrictEqual(result.violations[0].subject, ['a', 'b'])
})

test('the projectile example fails TL-1 near both ends of the x-axis and where a grid line meets the vertex', () => {
  const scene = buildScene(spec, layout, profile)
  const result = checkLineGap(scene, profile)
  assert.strictEqual(result.passed, false)
  const curveAxis = result.violations.filter((v) => v.subject.includes('curve') && v.subject.includes('x-axis'))
  assert.strictEqual(curveAxis.length, 2)
  const xAxis = scene.lines.find((l) => l.id === 'x-axis').points
  const ends = [xAxis[0][0], xAxis[xAxis.length - 1][0]].sort((a, b) => a - b)
  const atX = curveAxis.map((v) => v.at.xMm).sort((a, b) => a - b)
  assert.ok(Math.abs(atX[0] - ends[0]) < 5 && Math.abs(atX[1] - ends[1]) < 5, `at ${atX} vs x-axis ends ${ends}`)
  // the curve ends 0.125 units = 3.125 mm (centre) below the x-axis: 3.125 - (2.0 + 1.2) / 2 = 1.525 mm clear
  for (const v of curveAxis) assert.ok(Math.abs(v.measuredMm - 1.525) < 0.01, `measured ${v.measuredMm}`)

  const vertex = scene.marks.find((m) => m.id === 'vertex')
  const atVertex = result.violations.find((v) => v.subject.includes('curve') && v.subject.includes('grid-y-3'))
  assert.ok(atVertex, 'grid-y-3 runs along the curve at the vertex')
  assert.strictEqual(atVertex.measuredMm, 0)
  assert.ok(Math.hypot(atVertex.at.xMm - vertex.xMm, atVertex.at.yMm - vertex.yMm) < 1)
})

test('the projectile passes TL-1 after allowed fixes only (hide the grid, stretch y)', () => {
  const scene = buildScene(spec, { ...layout, showGrid: false, yScaleMm: 40 }, profile)
  const result = checkLineGap(scene, profile)
  assert.deepStrictEqual(result.violations, [])
  assert.strictEqual(result.passed, true)
  assert.ok(result.closestPassed.measuredMm >= minLineGapMm)
})
