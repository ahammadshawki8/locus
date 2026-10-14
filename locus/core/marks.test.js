const test = require('node:test')
const assert = require('node:assert')

const { computeMarks } = require('./marks')

const spec = (graph, mark) => ({ graph: { type: 'polynomial', ...graph }, mark })
const projectile = { coeffs: [0, -0.5, 2, 1], domain: { min: -0.5, max: 4.5 } }
const near = (a, b) => Math.abs(a - b) < 1e-9

test('projectile marks: vertex, y-intercept, positive x-intercept', () => {
  const { points, missing } = computeMarks(spec(projectile, ['vertex', 'y-intercept', 'x-intercept+']))
  assert.deepStrictEqual(missing, [])
  assert.deepStrictEqual(points.map((p) => p.id), ['vertex', 'y-intercept', 'x-intercept+'])
  assert.ok(near(points[0].x, 2) && near(points[0].y, 3))
  assert.ok(near(points[1].x, 0) && near(points[1].y, 1))
  assert.ok(near(points[2].x, 2 + Math.sqrt(6)) && points[2].y === 0)
})

test('several points of one kind get numbered ids', () => {
  const { points } = computeMarks(spec({ coeffs: [1, 0, -1, 0], domain: { min: -2, max: 2 } }, ['x-intercepts', 'turning-points']))
  assert.deepStrictEqual(points.map((p) => p.id), ['x-intercepts#1', 'x-intercepts#2', 'x-intercepts#3', 'turning-points#1', 'turning-points#2'])
})

test('a requested mark that is outside the domain is reported missing, not dropped silently', () => {
  const { points, missing } = computeMarks(spec({ coeffs: [1, 0, 1], domain: { min: 1, max: 3 } }, ['y-intercept', 'x-intercepts', 'vertex']))
  assert.deepStrictEqual(points, [])
  assert.deepStrictEqual(missing.map((m) => m.mark), ['y-intercept', 'x-intercepts', 'vertex'])
})

test('x-intercept- picks negative roots only', () => {
  const { points } = computeMarks(spec(projectile, ['x-intercept-']))
  assert.strictEqual(points.length, 1)
  assert.ok(near(points[0].x, 2 - Math.sqrt(6)))
})
