const test = require('node:test')
const assert = require('node:assert')

const { toBraille, dotsOf, cellBox, brailleDots } = require('./braille')

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

test('cellBox and brailleDots use the profile cell size, centred on the given point (tools/prints/prints.js)', () => {
  const b = { dotDiameterMm: 1.5, dotPitchMm: 2.5, cellPitchMm: 6.2 }
  assert.deepStrictEqual(cellBox(2, b), { w: 6.2 + 2.5 + 1.5, h: 2 * 2.5 + 1.5 })
  const dots = brailleDots('⠼⠁', 50, 50, b) // number sign + a: the braille ID "1"
  assert.strictEqual(dots.length, 4 + 1)
  const left = 50 - (6.2 + 2.5 + 1.5) / 2 + 0.75
  const top = 50 + (2 * 2.5 + 1.5) / 2 - 0.75
  assert.deepStrictEqual(dots[0], [left, top - 2 * 2.5]) // dot 3 of the number sign: bottom-left
  assert.deepStrictEqual(dots[4], [left + 6.2, top]) // dot 1 of a: top-left of the second cell
})
