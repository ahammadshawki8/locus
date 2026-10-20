const test = require('node:test')
const assert = require('node:assert')

const { evaluate, derivative, degree, realRootsIn, formatPolynomial } = require('./polynomial')

const projectile = [0, -0.5, 2, 1] // y = -0.5x² + 2x + 1
const near = (actual, expected, eps = 1e-9) => assert.ok(Math.abs(actual - expected) < eps, `${actual} != ${expected}`)
const nearAll = (actual, expected) => {
  assert.strictEqual(actual.length, expected.length, `${JSON.stringify(actual)} vs ${JSON.stringify(expected)}`)
  actual.forEach((a, i) => near(a, expected[i]))
}

test('evaluate uses highest-degree-first coefficients', () => {
  assert.strictEqual(evaluate(projectile, 0), 1)
  assert.strictEqual(evaluate(projectile, 2), 3)
  assert.strictEqual(evaluate([1, 0, 0, 0], -2), -8)
})

test('degree ignores leading zeros', () => {
  assert.strictEqual(degree(projectile), 2)
  assert.strictEqual(degree([0, 0, 0, 5]), 0)
  assert.strictEqual(degree([0]), 0)
})

test('derivative', () => {
  assert.deepStrictEqual(derivative([1, -3, 0, 2]), [3, -6, 0])
  assert.strictEqual(evaluate(derivative(projectile), 2), 0)
  assert.deepStrictEqual(derivative([7]), [0])
})

test('real roots of the projectile are 2 ± √6', () => {
  nearAll(realRootsIn(projectile, -0.5, 4.5), [2 - Math.sqrt(6), 2 + Math.sqrt(6)])
  nearAll(realRootsIn(projectile, 0, 4.5), [2 + Math.sqrt(6)])
})

test('real roots: double root, cubic, none, constant, endpoint', () => {
  nearAll(realRootsIn([1, 0, 0], -3, 3), [0])
  nearAll(realRootsIn([1, 0, -1, 0], -3, 3), [-1, 0, 1])
  nearAll(realRootsIn([1, 0, 1], -3, 3), [])
  nearAll(realRootsIn([0, 0, 0, 0], -3, 3), [])
  nearAll(realRootsIn([1, -2], 2, 5), [2])
})

test('formatPolynomial writes plain ASCII', () => {
  assert.strictEqual(formatPolynomial(projectile), 'y = -0.5x^2 + 2x + 1')
  assert.strictEqual(formatPolynomial([1, 0, -1, 0]), 'y = x^3 - x')
  assert.strictEqual(formatPolynomial([0, 0, 0, 0]), 'y = 0')
  assert.strictEqual(formatPolynomial([-1, 3]), 'y = -x + 3')
})
