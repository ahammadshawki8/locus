const test = require('node:test')
const assert = require('node:assert')

const { nearestOnPolyline, polyline, intersections, angleBetweenDeg } = require('./geometry')

const near = (a, b, eps = 1e-9) => Math.abs(a - b) < eps

test('nearestOnPolyline finds the closest point and its arc position', () => {
  const pl = polyline([[0, 0], [10, 0], [10, 10]])
  const hit = nearestOnPolyline([12, 4], pl)
  assert.deepStrictEqual(hit.point, [10, 4])
  assert.ok(near(hit.distance, 2))
  assert.ok(near(hit.s, 14))
})

test('polyline pointAt and directionAt walk by arc length, clamped to the ends', () => {
  const pl = polyline([[0, 0], [10, 0], [10, 10]])
  assert.strictEqual(pl.length, 20)
  assert.deepStrictEqual(pl.pointAt(15), [10, 5])
  assert.deepStrictEqual(pl.pointAt(-3), [0, 0])
  assert.deepStrictEqual(pl.pointAt(99), [10, 10])
  assert.deepStrictEqual(pl.directionAt(5), [1, 0])
  assert.deepStrictEqual(pl.directionAt(15), [0, 1])
})

test('polyline samples are no further apart than the step and include both ends', () => {
  const pl = polyline([[0, 0], [10, 0]])
  const samples = pl.sample(0.5)
  assert.strictEqual(samples.length, 21)
  assert.deepStrictEqual(samples[0], { point: [0, 0], s: 0 })
  assert.deepStrictEqual(samples[20], { point: [10, 0], s: 10 })
})

test('intersections reports each meeting point once, even at a shared vertex', () => {
  const a = polyline([[-5, -5], [0, 0], [5, 5]])
  const b = polyline([[-5, 0], [5, 0]])
  const hits = intersections(a, b)
  assert.strictEqual(hits.length, 1)
  assert.deepStrictEqual(hits[0].point, [0, 0])
  assert.ok(near(hits[0].sA, Math.hypot(5, 5)))
  assert.ok(near(hits[0].sB, 5))
})

test('parallel lines do not intersect', () => {
  assert.deepStrictEqual(intersections(polyline([[0, 0], [10, 0]]), polyline([[0, 1], [10, 1]])), [])
})

test('angleBetweenDeg folds to 0..90 degrees', () => {
  assert.ok(near(angleBetweenDeg([1, 0], [0, 1]), 90))
  assert.ok(near(angleBetweenDeg([1, 0], [-1, 1]), 45))
  assert.ok(near(angleBetweenDeg([1, 0], [-1, 0]), 0))
})
