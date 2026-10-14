// Checks that committed fixtures and config follow docs/contracts.md.
const test = require('node:test')
const assert = require('node:assert')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const { validateManifest, validateLayout } = require('./core/validate')

const root = path.join(__dirname, '..')
const bundleDir = path.join(root, 'fixtures', 'bundle-sample')
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))
const ruleIds = ['TL-1', 'TL-2', 'TL-3', 'TL-4', 'TL-5']

test('sample bundle manifest is valid and marked as a fixture', () => {
  const manifest = readJson(path.join(bundleDir, 'manifest.json'))
  assert.deepStrictEqual(validateManifest(manifest), [])
  assert.strictEqual(manifest.fixture, true)
  assert.strictEqual(manifest.bundle, `graph-${manifest.requestId}-v${manifest.version}`)
  assert.strictEqual(manifest.brailleId, `L${manifest.requestId}-${manifest.version}`)
})

test('sample bundle hashes match its files, and the bundle holds exactly the contract files', () => {
  const manifest = readJson(path.join(bundleDir, 'manifest.json'))
  for (const [file, hash] of Object.entries(manifest.hashes)) {
    const actual = 'sha256:' + crypto.createHash('sha256').update(fs.readFileSync(path.join(bundleDir, file))).digest('hex')
    assert.strictEqual(actual, hash, file)
  }
  const files = fs.readdirSync(bundleDir).filter((f) => f !== 'README.md').sort()
  assert.deepStrictEqual(files, [...Object.keys(manifest.hashes), 'manifest.json'].sort())
})

test('sample touchcheck report lists all five rules in order', () => {
  const report = readJson(path.join(bundleDir, 'touchcheck-report.json'))
  assert.deepStrictEqual(report.rules.map((r) => r.id), ruleIds)
  assert.strictEqual(report.passed, report.rules.every((r) => r.passed))
})

test('remedies cover every rule, edit only layout keys, and TL-4 refuses', () => {
  const { rules } = readJson(path.join(__dirname, 'touchcheck', 'remedies.json'))
  assert.deepStrictEqual(Object.keys(rules).sort(), ruleIds)
  assert.deepStrictEqual(rules['TL-4'], [])
  const layoutKeys = Object.keys(readJson(path.join(__dirname, 'core', 'schema', 'layout.schema.json')).properties)
  for (const remedy of Object.values(rules).flat()) {
    for (const key of remedy.edits) assert.ok(layoutKeys.includes(key), `${remedy.id} edits ${key}`)
  }
})

test('every profile defines all five rules', () => {
  const dir = path.join(__dirname, 'core', 'profiles')
  for (const f of fs.readdirSync(dir)) {
    const profile = readJson(path.join(dir, f))
    assert.strictEqual(`${profile.id}.json`, f)
    assert.deepStrictEqual(Object.keys(profile.rules), ruleIds)
  }
})

test('example layout is valid', () => {
  assert.deepStrictEqual(validateLayout(readJson(path.join(root, 'examples', 'projectile.layout.json'))), [])
})

test('production-revision pointer is a single revision name or UNSET', () => {
  const value = fs.readFileSync(path.join(root, 'deploy', 'gcp', 'production-revision'), 'utf8')
  assert.match(value, /^(UNSET|[a-z][a-z0-9-]*)\n?$/)
})
