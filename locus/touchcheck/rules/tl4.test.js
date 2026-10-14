const test = require('node:test')
const assert = require('node:assert')
const path = require('path')

const { checkInventory } = require('./tl4')
const { buildScene } = require('../../core/scene')

const root = path.join(__dirname, '..', '..', '..')
const spec = require(path.join(root, 'examples', 'projectile.json'))
const layout = require(path.join(root, 'examples', 'projectile.layout.json'))
const profile = require('../../core/profiles/fdm-3d-v1.json')

const scene = () => JSON.parse(JSON.stringify(buildScene(spec, layout, profile)))

test('the projectile has both axes, the curve and every requested mark', () => {
  const result = checkInventory(scene(), profile, { requested: spec.mark })
  assert.strictEqual(result.passed, true)
  assert.deepStrictEqual(result.violations, [])
  assert.deepStrictEqual(result.present.map((p) => p.subject), ['x-axis', 'y-axis', 'curve', 'vertex', 'y-intercept', 'x-intercept+'])
})

test('a requested mark that is not on the graph fails, with the reason in plain words and no place on the plate', () => {
  const s = buildScene({ ...spec, graph: { ...spec.graph, domain: { min: 1, max: 4.5 } } }, layout, profile)
  const result = checkInventory(s, profile, { requested: spec.mark })
  assert.strictEqual(result.passed, false)
  assert.strictEqual(result.violations.length, 1)
  const [v] = result.violations
  assert.deepStrictEqual(v.subject, ['y-intercept'])
  assert.strictEqual(v.at, null)
  assert.match(v.message, /^Something requested is missing: y-intercept \(x = 0 is outside the domain\)$/)
})

test('a requested mark that is neither drawn nor reported missing fails', () => {
  const s = scene()
  s.marks = s.marks.filter((m) => m.mark !== 'vertex')
  const [v] = checkInventory(s, profile, { requested: spec.mark }).violations
  assert.deepStrictEqual(v.subject, ['vertex'])
  assert.match(v.message, /vertex \(not drawn\)/)
})

test('a missing axis or curve fails', () => {
  const s = scene()
  s.lines = s.lines.filter((l) => l.id !== 'y-axis' && l.kind !== 'curve')
  const result = checkInventory(s, profile, { requested: spec.mark })
  assert.deepStrictEqual(result.violations.map((v) => v.subject), [['y-axis'], ['curve']])
})

test('a mark placed off the plate counts as missing, at its position', () => {
  const s = scene()
  s.marks[0].xMm = s.plate.widthMm + 5
  const [v] = checkInventory(s, profile, { requested: spec.mark }).violations
  assert.deepStrictEqual(v.subject, ['vertex'])
  assert.match(v.message, /off the plate/)
  assert.deepStrictEqual(v.at, { xMm: s.marks[0].xMm, yMm: s.marks[0].yMm })
})

test('a mark without its braille label fails', () => {
  const s = scene()
  s.labels = s.labels.filter((l) => l.for !== 'y-intercept')
  const [v] = checkInventory(s, profile, { requested: spec.mark }).violations
  assert.deepStrictEqual(v.subject, ['label-y-intercept'])
  assert.match(v.message, /braille label for y-intercept \(not drawn\)/)
})

test('key mode: the key must list every keyed mark, each with a key row', () => {
  const keyed = JSON.parse(JSON.stringify(buildScene(spec, { ...layout, labelMode: 'key' }, profile)))
  assert.deepStrictEqual(checkInventory(keyed, profile, { requested: spec.mark }).violations, [])
  assert.match(checkInventory(keyed, profile, { requested: spec.mark }).summary, /key/)

  const noRow = JSON.parse(JSON.stringify(keyed))
  noRow.labels = noRow.labels.filter((l) => l.id !== 'key-b')
  assert.deepStrictEqual(checkInventory(noRow, profile, { requested: spec.mark }).violations.map((v) => v.subject), [['key-b']])

  const noKey = JSON.parse(JSON.stringify(keyed))
  noKey.key = null
  assert.match(checkInventory(noKey, profile, { requested: spec.mark }).violations[0].message, /the key \(not drawn\)/)
})

test('without the spec, the requested list is what the scene drew or reported missing', () => {
  const s = buildScene({ ...spec, graph: { ...spec.graph, domain: { min: 1, max: 4.5 } } }, layout, profile)
  assert.deepStrictEqual(checkInventory(s, profile).violations.map((v) => v.subject), [['y-intercept']])
})
