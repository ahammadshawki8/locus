const test = require('node:test')
const assert = require('node:assert')

const { toBraille, dotsOf, cellLayout } = require('./braille')

test('letters use the standard Grade 1 cells', () => {
  assert.strictEqual(toBraille('abc'), '⠁⠃⠉')
  assert.strictEqual(toBraille('wxyz'), '⠺⠭⠽⠵')
})

test('every number starts with the number sign; digits reuse a-j', () => {
  assert.strictEqual(toBraille('1'), '⠼⠁')
  assert.strictEqual(toBraille('2,3'), '⠼⠃⠂⠼⠉')
  assert.strictEqual(toBraille('4.45'), '⠼⠙⠲⠙⠑')
  assert.strictEqual(toBraille('10'), '⠼⠁⠚')
})

test('minus is dots 5 + 36 before the number sign; capitals take dot 6', () => {
  assert.strictEqual(toBraille('-0.5'), '⠐⠤⠼⠚⠲⠑')
  assert.strictEqual(toBraille('L12-1'), '⠠⠇⠼⠁⠃⠤⠼⠁')
})

test('a space is the blank cell', () => {
  assert.strictEqual(toBraille('a 1'), '⠁⠀⠼⠁')
})

test('characters outside the table are refused, not guessed', () => {
  assert.throws(() => toBraille('π'), /no braille cell/)
})

test('dotsOf lists raised dot numbers of a cell', () => {
  assert.deepStrictEqual(dotsOf('⠼'), [3, 4, 5, 6])
  assert.deepStrictEqual(dotsOf('⠀'), [])
})

test('cellLayout places dot centres inside a box of the profile cell size, origin bottom-left', () => {
  const b = { dotDiameterMm: 1.44, dotSpacingMm: 2.34, cellSpacingMm: 6.2 }
  const { widthMm, heightMm, dots } = cellLayout('⠁⠿', b)
  assert.ok(Math.abs(widthMm - (6.2 + 2.34 + 1.44)) < 1e-9)
  assert.ok(Math.abs(heightMm - (2 * 2.34 + 1.44)) < 1e-9)
  assert.strictEqual(dots.length, 1 + 6)
  assert.deepStrictEqual(dots[0], [0.72, 0.72 + 2 * 2.34]) // dot 1: top-left of the first cell
})
