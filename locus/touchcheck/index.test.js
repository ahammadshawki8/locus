const test = require('node:test')
const assert = require('node:assert')
const path = require('path')

const { touchcheck } = require('./index')
const { buildScene } = require('../core/scene')
const { validateTouchcheckReport } = require('../core/validate')

const root = path.join(__dirname, '..', '..')
const spec = require(path.join(root, 'examples', 'projectile.json'))
const layout = require(path.join(root, 'examples', 'projectile.layout.json'))
const profile = require('../core/profiles/fdm-3d-v1.json')

// touchcheck reads scene.json, so test on the JSON form of the scene (no toMm function)
const sceneJson = (l = layout) => JSON.parse(JSON.stringify(buildScene(spec, l, profile)))

test('the report lists all five rules in order and follows the contract schema', () => {
  const { report } = touchcheck(sceneJson(), profile, { requested: spec.mark })
  assert.deepStrictEqual(report.rules.map((r) => r.id), ['TL-1', 'TL-2', 'TL-3', 'TL-4', 'TL-5'])
  assert.deepStrictEqual(validateTouchcheckReport(report), [])
  assert.strictEqual(report.schemaVersion, 1)
  assert.strictEqual(report.profileId, 'fdm-3d-v1')
  assert.strictEqual(report.fixture, undefined)
})

test('the projectile example at its starting layout fails TL-1 (lines) and TL-2 (labels), and nothing else', () => {
  const { report } = touchcheck(sceneJson(), profile, { requested: spec.mark })
  assert.strictEqual(report.passed, false)
  assert.deepStrictEqual(report.rules.filter((r) => !r.passed).map((r) => r.id), ['TL-1', 'TL-2'])
  const tl2 = report.rules.find((r) => r.id === 'TL-2').violations
  assert.deepStrictEqual(tl2.map((v) => v.subject), [
    ['label-vertex', 'plate'], ['label-y-intercept', 'grid-x-1'], ['label-y-intercept', 'curve'], ['label-x-intercept+', 'plate']
  ])
})

test('passed is true only when every rule passed', () => {
  const good = require(path.join(root, 'fixtures', 'touchcheck', 'good-projectile-key', 'layout.json'))
  const { report } = touchcheck(sceneJson(good), profile, { requested: spec.mark })
  assert.ok(report.rules.every((r) => r.passed))
  assert.strictEqual(report.passed, true)
  const { report: failing } = touchcheck(sceneJson(), profile, { requested: spec.mark })
  assert.strictEqual(failing.passed, false)
})

test('a scene rendered for another profile is refused', () => {
  assert.throws(() => touchcheck({ ...sceneJson(), profileId: 'other' }, profile), /profile/)
})

test('the sample bundle report follows the same schema', () => {
  assert.deepStrictEqual(validateTouchcheckReport(require(path.join(root, 'fixtures', 'bundle-sample', 'touchcheck-report.json'))), [])
})
