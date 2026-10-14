const test = require('node:test')
const assert = require('node:assert')

const { checkLabelGap, checkLabelOverlap } = require('./labels')
const profile = require('../../core/profiles/fdm-3d-v1.json')

test('TL-2 and TL-3 pass as not applicable while a scene has no labels, and say so', () => {
  for (const [check, id] of [[checkLabelGap, 'TL-2'], [checkLabelOverlap, 'TL-3']]) {
    const result = check({ labels: [] }, profile)
    assert.strictEqual(result.id, id)
    assert.strictEqual(result.passed, true)
    assert.deepStrictEqual(result.violations, [])
    assert.strictEqual(result.note, 'not applicable: no labels yet')
  }
})

test('TL-2 and TL-3 fail rather than pass unchecked if a scene has labels before the checks exist', () => {
  for (const check of [checkLabelGap, checkLabelOverlap]) {
    const result = check({ labels: [{ id: 'vertex' }] }, profile)
    assert.strictEqual(result.passed, false)
    assert.strictEqual(result.violations.length, 1)
    assert.strictEqual(result.violations[0].at, null)
    assert.match(result.note, /not built yet/)
  }
})
