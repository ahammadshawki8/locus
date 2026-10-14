const test = require('node:test')
const assert = require('node:assert')
const path = require('path')

const { checkPrintable } = require('./tl5')
const { buildScene } = require('../../core/scene')

const root = path.join(__dirname, '..', '..', '..')
const spec = require(path.join(root, 'examples', 'projectile.json'))
const layout = require(path.join(root, 'examples', 'projectile.layout.json'))
const profile = require('../../core/profiles/fdm-3d-v1.json')

const withRules = (tl5, bedMm = profile.bedMm) => ({ ...profile, bedMm, rules: { ...profile.rules, 'TL-5': { ...profile.rules['TL-5'], ...tl5 } } })

test('the projectile fits the bed and every line is wide enough; height is not checked while the profile has no minimum', () => {
  const result = checkPrintable(buildScene(spec, layout, profile), profile)
  assert.strictEqual(result.passed, true)
  assert.deepStrictEqual(result.violations, [])
  assert.match(result.note, /height not checked/)
})

test('a plate bigger than the bed fails with the measured size and the bed size', () => {
  const scene = buildScene(spec, { ...layout, xScaleMm: 40 }, profile) // 20 + 5 * 40 = 220 mm wide
  const result = checkPrintable(scene, profile)
  assert.strictEqual(result.passed, false)
  assert.strictEqual(result.violations.length, 1)
  const [v] = result.violations
  assert.strictEqual(v.measuredMm, 220)
  assert.strictEqual(v.requiredMm, profile.bedMm.x)
  assert.deepStrictEqual(v.subject, ['plate'])
  assert.match(v.message, /Too big for the printer/)
})

test('a plate that fits only when turned 90 degrees on the bed passes', () => {
  const scene = buildScene(spec, layout, profile) // 145 x 98.125 mm
  assert.strictEqual(checkPrintable(scene, withRules({}, { x: 100, y: 150 })).passed, true)
  assert.strictEqual(checkPrintable(scene, withRules({}, { x: 100, y: 140 })).passed, false)
})

test('a line thinner than the profile minimum fails, at the line', () => {
  const scene = buildScene(spec, layout, profile)
  const curve = scene.lines.find((l) => l.id === 'curve')
  curve.widthMm = 0.8
  const [v] = checkPrintable(scene, profile).violations
  assert.deepStrictEqual(v.subject, ['curve'])
  assert.strictEqual(v.measuredMm, 0.8)
  assert.strictEqual(v.requiredMm, profile.rules['TL-5'].minLineWidthMm)
  const mid = curve.points[Math.floor(curve.points.length / 2)]
  assert.deepStrictEqual(v.at, { xMm: mid[0], yMm: mid[1] })
})

test('braille dots smaller than the minimum feature width fail, at the label', () => {
  const scene = buildScene(spec, layout, profile)
  const label = scene.labels[0]
  label.dotDiameterMm = 1.0
  const [v] = checkPrintable(scene, profile).violations
  assert.deepStrictEqual(v.subject, [label.id])
  assert.strictEqual(v.measuredMm, 1.0)
  assert.match(v.message, /braille dots/)
  assert.deepStrictEqual(v.at, { xMm: label.dots[0][0], yMm: label.dots[0][1] })
})

test('once the profile sets a minimum height, lower features fail', () => {
  const scene = buildScene(spec, layout, profile) // grid lines are 0.4 mm high
  const result = checkPrintable(scene, withRules({ minFeatureHeightMm: 0.45 })) // braille dots are 0.48 mm
  assert.ok(result.violations.length > 0)
  assert.ok(result.violations.every((v) => v.subject[0].startsWith('grid-') && v.measuredMm === 0.4))
  assert.strictEqual(result.note, undefined)
})
