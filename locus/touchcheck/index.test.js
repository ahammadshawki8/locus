const test = require('node:test')
const assert = require('node:assert')
const path = require('path')

const { touchcheck, reportLine, MESSAGES } = require('./index')
const { buildScene } = require('../core/scene')
const { loadProfile } = require('../core/profiles')
const { validateTouchcheckReport } = require('../core/validate')
const remedies = require('./remedies.json')

const prints = path.join(__dirname, '..', '..', 'tools', 'prints')
const spec = require(path.join(prints, 'spec.json'))
const specC = require(path.join(prints, 'spec-C.json'))
const layoutA = require(path.join(prints, 'layout-A.json'))
const layoutB = require(path.join(prints, 'layout-B.json'))
const layoutC = require(path.join(prints, 'layout-C.json'))
const profile = loadProfile('fdm-handheld-v1')

// touchcheck reads scene.json, so test on the JSON form of the scene
const sceneJson = (s, l, id) => JSON.parse(JSON.stringify(buildScene(s, l, profile, { brailleIdNumber: id })))
const check = (s, l, id, options = {}) => touchcheck(sceneJson(s, l, id), profile, { requested: s.mark, ...options })

test('the report follows docs/contracts.md §4: request, attempt, profile, pass and one result per rule or failure', () => {
  const { report } = check(spec, layoutA, 1, { requestId: 12, attempt: 1 })
  assert.deepStrictEqual(validateTouchcheckReport(report), [])
  assert.deepStrictEqual(Object.keys(report), ['requestId', 'attempt', 'profileId', 'pass', 'results'])
  assert.strictEqual(report.requestId, 12)
  assert.strictEqual(report.attempt, 1)
  assert.strictEqual(report.profileId, 'fdm-handheld-v1')
  assert.deepStrictEqual([...new Set(report.results.map((r) => r.rule))], ['TL-1', 'TL-2', 'TL-3', 'TL-4', 'TL-5'])
})

test('print A (the default layout, attempt 1) fails TL-1, TL-2 and TL-5, as tools/prints/README.md says', () => {
  const { report } = check(spec, layoutA, 1)
  assert.strictEqual(report.pass, false)
  assert.deepStrictEqual([...new Set(report.results.filter((r) => !r.pass).map((r) => r.rule))], ['TL-1', 'TL-2', 'TL-5'])
  const tl1 = report.results.find((r) => r.rule === 'TL-1')
  assert.deepStrictEqual(tl1, {
    rule: 'TL-1', pass: false, message: MESSAGES['TL-1'], measuredMm: 0, requiredMm: 3.2, at: [52, 45], allowedFixes: ['rescale-x', 'rescale-y', 'hide-grid']
  })
})

test('prints B and C pass every rule', () => {
  for (const [s, l, id] of [[spec, layoutB, 2], [specC, layoutC, 3]]) {
    const { report } = check(s, l, id)
    assert.strictEqual(report.pass, true)
    assert.deepStrictEqual(report.results, ['TL-1', 'TL-2', 'TL-3', 'TL-4', 'TL-5'].map((rule) => ({ rule, pass: true })))
  }
})

test('every failing result carries its rule\'s plain words and allowed fixes from remedies.json', () => {
  const { report } = check(spec, layoutA, 1)
  for (const r of report.results.filter((x) => !x.pass)) {
    assert.strictEqual(r.message, MESSAGES[r.rule])
    assert.deepStrictEqual(r.allowedFixes, remedies.rules[r.rule].map((f) => f.id))
  }
})

test('the log line is LOCUS_REPORT and the report as JSON on one line', () => {
  const { report } = check(spec, layoutB, 2)
  const line = reportLine(report)
  assert.ok(line.startsWith('LOCUS_REPORT {'))
  assert.ok(!line.includes('\n'))
  assert.deepStrictEqual(JSON.parse(line.slice('LOCUS_REPORT '.length)), report)
})

test('a scene rendered for another profile is refused', () => {
  assert.throws(() => touchcheck({ ...sceneJson(spec, layoutA, 1), profileId: 'other' }, profile), /profile/)
})
