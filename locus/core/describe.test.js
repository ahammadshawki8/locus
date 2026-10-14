const test = require('node:test')
const assert = require('node:assert')
const path = require('path')

const { describe, formatNumber } = require('./describe')
const { computeMarks } = require('./marks')

const spec = require(path.join(__dirname, '..', '..', 'examples', 'projectile.json'))

test('formatNumber rounds to 2 decimals and says "about" when it rounded', () => {
  assert.strictEqual(formatNumber(2), '2')
  assert.strictEqual(formatNumber(-0.5), '-0.5')
  assert.strictEqual(formatNumber(2 + Math.sqrt(6)), 'about 4.45')
  assert.strictEqual(formatNumber(1e-12), '0')
})

test('projectile description states the equation, domain and every mark with computed values', () => {
  const text = describe(spec, computeMarks(spec))
  assert.match(text, /y = -0\.5x\^2 \+ 2x \+ 1/)
  assert.match(text, /x from -0\.5 to 4\.5/)
  assert.match(text, /highest point \(vertex\) is at x = 2, y = 3/)
  assert.match(text, /crosses the y-axis at y = 1/)
  assert.match(text, /crosses the x-axis at x = about 4\.45/)
  assert.match(text, /do not certify/)
})

test('a missing mark is stated, not hidden', () => {
  const narrow = { ...spec, graph: { ...spec.graph, domain: { min: 1, max: 4 } } }
  assert.match(describe(narrow, computeMarks(narrow)), /y-intercept was requested but is not on this graph/)
})
