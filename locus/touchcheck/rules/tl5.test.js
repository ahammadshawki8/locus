const test = require('node:test')
const assert = require('node:assert')
const path = require('path')

const { checkPrintable } = require('./tl5')
const { buildScene } = require('../../core/scene')
const { loadProfile } = require('../../core/profiles')

const prints = path.join(__dirname, '..', '..', '..', 'tools', 'prints')
const spec = require(path.join(prints, 'spec.json'))
const layoutA = require(path.join(prints, 'layout-A.json'))
const layoutB = require(path.join(prints, 'layout-B.json'))
const profile = loadProfile('fdm-handheld-v1')
const { edgeMarginMm, minFeatureWidthMm } = profile.rules

const scene = (layout) => JSON.parse(JSON.stringify(buildScene(spec, layout, profile, { brailleIdNumber: 1 })))

test('print A fails TL-5: label c is 2.3 mm from the right edge (needs 3), as measured on the prints', () => {
  const result = checkPrintable(scene(layoutA), profile)
  assert.strictEqual(result.passed, false)
  assert.deepStrictEqual(result.violations.map((v) => [v.subject, v.measuredMm, v.requiredMm]), [[['label-x-intercept+', 'plate'], 2.31, edgeMarginMm]])
})

test('print B passes TL-5: everything at least 5.5 mm from the edge', () => {
  const result = checkPrintable(scene(layoutB), profile)
  assert.strictEqual(result.passed, true)
  assert.match(result.summary, /closest feature 5\.5 mm from the edge/)
})

test('a graph scaled past the plate runs off it and fails (reduce-scale is the fix)', () => {
  const result = checkPrintable(scene({ ...layoutB, xScaleMm: 25 }), profile)
  assert.strictEqual(result.passed, false)
  assert.ok(result.violations.some((v) => v.subject[0] === 'x-axis' && v.measuredMm < 0 && /runs off/.test(v.message)))
})

test('a feature thinner than the profile minimum fails', () => {
  const s = scene(layoutB)
  s.lines[0].widthMm = minFeatureWidthMm - 0.2
  const result = checkPrintable(s, profile)
  assert.deepStrictEqual(result.violations.map((v) => [v.subject, v.measuredMm, v.requiredMm]), [[[s.lines[0].id], minFeatureWidthMm - 0.2, minFeatureWidthMm]])
})
