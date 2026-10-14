const test = require('node:test')
const assert = require('node:assert')

const { checkLabelGap, checkLabelOverlap } = require('./labels')
const profile = require('../../core/profiles/fdm-3d-v1.json')
const { minLabelGapMm } = profile.rules['TL-2']

// A 1-cell label is about 3.8 x 6.1 mm; the rules only use the box.
const label = (id, xMm, yMm, extra = {}) => ({ id, kind: 'mark', for: null, text: 'a', xMm, yMm, widthMm: 3.78, heightMm: 6.12, dots: [], ...extra })
const line = (id, points, widthMm = 1.2) => ({ id, kind: 'axis', points, widthMm, heightMm: 0.8 })
const mark = (id, xMm, yMm) => ({ id, mark: id, xMm, yMm, diameterMm: 4, heightMm: 1.6 })
const sceneOf = ({ lines = [], marks = [], labels = [] }) => ({ plate: { widthMm: 100, heightMm: 100 }, lines, marks, labels })

test('TL-2 and TL-3 pass as not applicable while a scene has no labels, and say so', () => {
  for (const [check, id] of [[checkLabelGap, 'TL-2'], [checkLabelOverlap, 'TL-3']]) {
    const result = check(sceneOf({}), profile)
    assert.strictEqual(result.id, id)
    assert.strictEqual(result.passed, true)
    assert.deepStrictEqual(result.violations, [])
    assert.strictEqual(result.note, 'not applicable: no labels yet')
  }
})

test('TL-2: a label at least the gap clear of every line passes', () => {
  // line along y = 50 (edge at 50.6); label bottom at 57.0 -> 6.4 mm clear
  const result = checkLabelGap(sceneOf({ lines: [line('x-axis', [[0, 50], [100, 50]])], labels: [label('l1', 40, 57)] }), profile)
  assert.deepStrictEqual(result.violations, [])
  assert.strictEqual(result.passed, true)
})

test('TL-2: a label closer to a line than the gap fails, measured from the box to the raised edge', () => {
  const result = checkLabelGap(sceneOf({ lines: [line('x-axis', [[0, 50], [100, 50]])], labels: [label('l1', 40, 53.6)] }), profile)
  assert.strictEqual(result.passed, false)
  const [v] = result.violations
  assert.strictEqual(v.measuredMm, 3)
  assert.strictEqual(v.requiredMm, minLabelGapMm)
  assert.deepStrictEqual(v.subject, ['l1', 'x-axis'])
  assert.match(v.message, /This label touches a line/)
  assert.ok(v.at.yMm > 50 && v.at.yMm < 53.6)
})

test('TL-2: a line through a label measures 0', () => {
  const [v] = checkLabelGap(sceneOf({ lines: [line('curve', [[0, 0], [100, 100]], 2)], labels: [label('l1', 48, 48)] }), profile).violations
  assert.strictEqual(v.measuredMm, 0)
})

test("TL-2: other marks count, the label's own mark does not", () => {
  // own mark 2.2 mm clear of the label, the other mark 3.2 mm clear
  const marks = [mark('vertex', 30, 30), mark('y-intercept', 42, 36)]
  const own = checkLabelGap(sceneOf({ marks, labels: [label('label-vertex', 33, 33, { for: 'vertex' })] }), profile)
  assert.deepStrictEqual(own.violations.map((v) => v.subject), [['label-vertex', 'y-intercept']])
  assert.match(own.violations[0].message, /This label touches a marked point/)
})

test('TL-2: a label that runs off the plate fails by how far it runs off', () => {
  const [v] = checkLabelGap(sceneOf({ labels: [label('l1', 98, 10)] }), profile).violations
  assert.match(v.message, /This label runs off the plate/)
  assert.strictEqual(v.measuredMm, 1.78)
  assert.strictEqual(v.requiredMm, 0)
  assert.deepStrictEqual(v.subject, ['l1', 'plate'])
})

test('TL-3: overlapping labels fail by how much they overlap; touching but separate boxes pass', () => {
  const overlap = checkLabelOverlap(sceneOf({ labels: [label('l1', 10, 10), label('l2', 12, 12)] }), profile)
  assert.strictEqual(overlap.passed, false)
  const [v] = overlap.violations
  assert.deepStrictEqual(v.subject, ['l1', 'l2'])
  assert.strictEqual(v.measuredMm, 1.78)
  assert.strictEqual(v.requiredMm, 0)
  assert.match(v.message, /These labels overlap/)
  assert.ok(checkLabelOverlap(sceneOf({ labels: [label('l1', 10, 10), label('l2', 13.78, 10)] }), profile).passed)
})
