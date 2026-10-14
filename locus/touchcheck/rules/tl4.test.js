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

test('without the spec, the requested list is what the scene drew or reported missing', () => {
  const s = buildScene({ ...spec, graph: { ...spec.graph, domain: { min: 1, max: 4.5 } } }, layout, profile)
  assert.deepStrictEqual(checkInventory(s, profile).violations.map((v) => v.subject), [['y-intercept']])
})
