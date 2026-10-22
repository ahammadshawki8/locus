// Seeded bad fixtures fail correctly (and the good one passes). Each fixtures/touchcheck/<name>/ holds a request
// (spec.json + layout.json) and expected.json with the rule it was seeded to break and the exact set of rules that fail.
const test = require('node:test')
const assert = require('node:assert')
const fs = require('fs')
const path = require('path')

const { touchcheck } = require('./index')
const { render } = require('../core/render')
const { loadProfile } = require('../core/profiles')
const { validateSpec, validateLayout, validateTouchcheckReport } = require('../core/validate')

const dir = path.join(__dirname, '..', '..', 'fixtures', 'touchcheck')
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'))
const names = fs.readdirSync(dir).filter((f) => fs.statSync(path.join(dir, f)).isDirectory())

test('there is a seeded fixture for every rule TL-1..TL-5, and a good one', () => {
  const seeded = names.map((n) => readJson(path.join(dir, n, 'expected.json')).seeded)
  assert.deepStrictEqual([...new Set(seeded)].sort(), [null, 'TL-1', 'TL-2', 'TL-3', 'TL-4', 'TL-5'].sort())
})

for (const name of names) {
  test(`fixture ${name} fails exactly the expected rules`, () => {
    const spec = readJson(path.join(dir, name, 'spec.json'))
    const layout = readJson(path.join(dir, name, 'layout.json'))
    const expected = readJson(path.join(dir, name, 'expected.json'))
    assert.strictEqual(expected.fixture, true)
    assert.deepStrictEqual([...validateSpec(spec), ...validateLayout(layout)], [])

    const { scene } = render(spec, layout)
    const { report } = touchcheck(JSON.parse(JSON.stringify(scene)), loadProfile(spec.profileId), { requested: spec.mark, requestId: spec.requestId })
    assert.deepStrictEqual(validateTouchcheckReport(report), [])
    assert.deepStrictEqual([...new Set(report.results.filter((r) => !r.pass).map((r) => r.rule))], expected.fails)
    if (expected.seeded) assert.ok(expected.fails.includes(expected.seeded))
    assert.strictEqual(report.pass, expected.fails.length === 0)
  })
}
