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

test('the projectile example fails on TL-1 only; TL-2 and TL-3 say they are not applicable yet', () => {
  const { report } = touchcheck(sceneJson(), profile, { requested: spec.mark })
  assert.strictEqual(report.passed, false)
  const byId = Object.fromEntries(report.rules.map((r) => [r.id, r]))
  assert.strictEqual(byId['TL-1'].passed, false)
  assert.ok(byId['TL-1'].violations.length > 0)
  for (const id of ['TL-2', 'TL-3']) {
    assert.strictEqual(byId[id].passed, true)
    assert.strictEqual(byId[id].note, 'not applicable: no labels yet')
  }
  assert.strictEqual(byId['TL-4'].passed, true)
  assert.strictEqual(byId['TL-5'].passed, true)
})

test('passed is true only when every rule passed', () => {
  const { report } = touchcheck(sceneJson({ ...layout, showGrid: false, yScaleMm: 40 }), profile, { requested: spec.mark })
  assert.ok(report.rules.every((r) => r.passed))
  assert.strictEqual(report.passed, true)
})

test('a scene rendered for another profile is refused', () => {
  assert.throws(() => touchcheck({ ...sceneJson(), profileId: 'other' }, profile), /profile/)
})

test('the sample bundle report follows the same schema', () => {
  assert.deepStrictEqual(validateTouchcheckReport(require(path.join(root, 'fixtures', 'bundle-sample', 'touchcheck-report.json'))), [])
})
