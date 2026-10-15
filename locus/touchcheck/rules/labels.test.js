const test = require('node:test')
const assert = require('node:assert')
const path = require('path')

const { checkLabelGap, checkLabelOverlap } = require('./labels')
const { buildScene } = require('../../core/scene')
const { loadProfile } = require('../../core/profiles')

const prints = path.join(__dirname, '..', '..', '..', 'tools', 'prints')
const spec = require(path.join(prints, 'spec.json'))
const layoutA = require(path.join(prints, 'layout-A.json'))
const layoutB = require(path.join(prints, 'layout-B.json'))
const profile = loadProfile('fdm-handheld-v1')
const { minLabelClearanceMm, minLabelPointClearanceMm } = profile.rules

const scene = (layout) => JSON.parse(JSON.stringify(buildScene(spec, layout, profile, { brailleIdNumber: 2 })))
const label = (id, box) => ({ id, kind: 'mark', for: null, box })
const synthetic = (labels, lines = [], marks = []) => ({ labels, lines, marks })

test('TL-2: a label box closer to a line than the profile clearance fails, measured from the line edge', () => {
  const lines = [{ id: 'axis', kind: 'axis', points: [[0, 0], [50, 0]], widthMm: 1.0 }]
  const result = checkLabelGap(synthetic([label('l', [10, 4, 16, 10])], lines), profile)
  assert.strictEqual(result.passed, false)
  assert.deepStrictEqual(result.violations.map((v) => [v.subject, v.measuredMm, v.requiredMm]), [[['l', 'axis'], 3.5, minLabelClearanceMm]])
})

test('TL-2: a label needs the smaller point clearance from every point mark, its own included', () => {
  const marks = [{ id: 'vertex', xMm: 0, yMm: 0, diameterMm: 3 }]
  const near = checkLabelGap(synthetic([label('l', [4, -3, 10, 3])], [], marks), profile)
  assert.deepStrictEqual(near.violations.map((v) => [v.subject, v.measuredMm, v.requiredMm]), [[['l', 'vertex'], 2.5, minLabelPointClearanceMm]])
  assert.strictEqual(checkLabelGap(synthetic([label('l', [5, -3, 11, 3])], [], marks), profile).passed, true)
})

test('TL-2 on print A: label b sits on the curve; on print B every label clears', () => {
  const a = checkLabelGap(scene(layoutA), profile)
  assert.strictEqual(a.passed, false)
  assert.ok(a.violations.some((v) => v.subject[0] === 'label-y-intercept' && v.subject[1] === 'curve' && v.measuredMm < 0))
  const b = checkLabelGap(scene(layoutB), profile)
  assert.strictEqual(b.passed, true, JSON.stringify(b.violations))
})

test('TL-2 checks the braille ID and key rows like any other label', () => {
  const keyed = scene({ ...layoutB, labelMode: 'key' })
  const result = checkLabelGap(keyed, profile)
  const ids = new Set(result.violations.map((v) => v.subject[0]))
  assert.ok(keyed.labels.some((l) => l.kind === 'braille-id'))
  assert.ok([...ids].every((id) => keyed.labels.some((l) => l.id === id)))
})

test('TL-3: overlapping label boxes fail with the overlap depth; touching boxes do not', () => {
  const result = checkLabelOverlap(synthetic([label('a', [0, 0, 6, 6]), label('b', [4, 1, 10, 7])]))
  assert.deepStrictEqual(result.violations.map((v) => [v.subject, v.measuredMm]), [[['a', 'b'], 2]])
  assert.strictEqual(checkLabelOverlap(synthetic([label('a', [0, 0, 6, 6]), label('b', [6, 0, 12, 6])])).passed, true)
})

test('TL-3 passes on prints A and B', () => {
  assert.strictEqual(checkLabelOverlap(scene(layoutA)).passed, true)
  assert.strictEqual(checkLabelOverlap(scene(layoutB)).passed, true)
})
