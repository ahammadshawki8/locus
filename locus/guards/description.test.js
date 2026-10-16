const test = require('node:test')
const assert = require('node:assert')
const path = require('path')

const { checkDescription } = require('./description')
const { render } = require('../core/render')

const prints = path.join(__dirname, '..', '..', 'tools', 'prints')
const spec = { ...require(path.join(prints, 'spec.json')), requestId: 12 }
const specC = { ...require(path.join(prints, 'spec-C.json')), requestId: 13 }
const layoutB = require(path.join(prints, 'layout-B.json'))
const layoutC = require(path.join(prints, 'layout-C.json'))

const factsOf = (s, l) => {
  const { scene, description } = render(s, l)
  return { description, facts: { lock: { graph: s.graph, mark: s.mark }, scene: JSON.parse(JSON.stringify(scene)), requestId: s.requestId } }
}

test('the generated descriptions for prints B and C pass: every number is a computed value', () => {
  for (const [s, l] of [[spec, layoutB], [specC, layoutC]]) {
    const { description, facts } = factsOf(s, l)
    const result = checkDescription(description, facts)
    assert.deepStrictEqual(result.errors, [])
    assert.ok(result.numbers >= 8)
  }
})

test('a wrong number fails, with its line', () => {
  const { description, facts } = factsOf(spec, layoutB)
  const wrong = description.replace('x = 2, y = 3', 'x = 2, y = 3.5')
  assert.deepStrictEqual(checkDescription(wrong, facts).errors, ['"3.5" (line 3) is not a computed value'])
})

test('a rounded value must say "about"', () => {
  const { description, facts } = factsOf(spec, layoutB)
  assert.match(description, /about 4\.45/)
  assert.deepStrictEqual(checkDescription(description.replace('about 4.45', '4.45'), facts).errors, ['"4.45" is rounded; say "about 4.45"'])
})

test('free text by an agent is checked the same way, including powers and the braille ID', () => {
  const { facts } = factsOf(spec, layoutB)
  assert.strictEqual(checkDescription('The curve y = -0.5x^2 + 2x + 1 peaks at 3. Braille ID 12.', facts).pass, true)
  assert.deepStrictEqual(checkDescription('It is a curve like x^3.', facts).errors, ['"^3" is not a power of the locked polynomial'])
  assert.deepStrictEqual(checkDescription('Braille ID 21.', facts).errors, ['"21" (line 1) is not a computed value'])
})
