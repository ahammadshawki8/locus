const test = require('node:test')
const assert = require('node:assert')

const { nearestOnPolyline, nearestToRect, polyline, intersections, angleBetweenDeg } = require('./geometry')

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

test('nearestToRect: distance from a box to a polyline, 0 when the line passes through the box', () => {
  const box = [0, 0, 10, 5]
  const above = nearestToRect(box, polyline([[-5, 8], [20, 8]]))
  assert.ok(near(above.distance, 3))
  assert.strictEqual(above.rectPoint[1], 5)
  assert.strictEqual(above.linePoint[1], 8)
  const corner = nearestToRect(box, polyline([[13, 9], [20, 2]])) // diagonal past the top-right corner
  assert.ok(near(corner.distance, 7 / Math.SQRT2)) // the line is x + y = 22
  assert.deepStrictEqual(corner.rectPoint, [10, 5])
  assert.ok(near(corner.linePoint[0], 13.5) && near(corner.linePoint[1], 8.5))
  assert.strictEqual(nearestToRect(box, polyline([[-5, 2], [20, 3]])).distance, 0)
  assert.strictEqual(nearestToRect(box, polyline([[2, 1], [3, 2]])).distance, 0) // wholly inside
})

test('angleBetweenDeg folds to 0..90 degrees', () => {
  assert.ok(near(angleBetweenDeg([1, 0], [0, 1]), 90))
  assert.ok(near(angleBetweenDeg([1, 0], [-1, 1]), 45))
  assert.ok(near(angleBetweenDeg([1, 0], [-1, 0]), 0))
})
