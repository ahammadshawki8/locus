// Checks that committed config and schemas follow docs/contracts.md v1.
const test = require('node:test')
const assert = require('node:assert')
const fs = require('fs')
const path = require('path')

const { validateManifest, validateLayout, validateSpec } = require('./core/validate')
const { profileDir } = require('./core/profiles')

const root = path.join(__dirname, '..')
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))
const ruleIds = ['TL-1', 'TL-2', 'TL-3', 'TL-4', 'TL-5']

// The §5 example, with real-shaped hashes and commit in place of the placeholders.
const manifest = () => ({
  artifactId: 'graph-12-v1',
  brailleId: 'G12',
  requestIssue: 12,
  sourceCommit: 'a'.repeat(40),
  pipelineId: 0,
  generatorVersion: '0.1.0',
  profile: { id: 'fdm-handheld-v1', version: 1 },
  hashes: { 'graph.stl': 'b'.repeat(64), 'graph.svg': 'c'.repeat(64), 'description.txt': 'd'.repeat(64) },
  touchcheck: { pass: true, attempts: 2 },
  guards: { scope: true, maths: true, description: true },
  agentSessions: ['<duo session url>'],
  releaseMode: 'hands-off',
  releaseTag: null,
  limitations: 'Automated checks measure spacing and size; they do not certify that a learner can understand the graphic.'
})

test('the manifest schema accepts the §5 example and ties artifactId and brailleId to the issue', () => {
  assert.deepStrictEqual(validateManifest(manifest()), [])
  assert.deepStrictEqual(validateManifest({ ...manifest(), brailleId: 'G13' }), ['/brailleId must be G + requestIssue'])
  assert.deepStrictEqual(validateManifest({ ...manifest(), artifactId: 'graph-13-v1' }), ['/artifactId must be graph-<requestIssue>-v<n>'])
  assert.notDeepStrictEqual(validateManifest({ ...manifest(), releaseMode: 'auto' }), [])
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

test('every profile in profiles/ has the §2 fields and rule values', () => {
  const files = fs.readdirSync(profileDir)
  assert.ok(files.includes('fdm-handheld-v1.json'))
  for (const f of files) {
    const profile = readJson(path.join(profileDir, f))
    assert.strictEqual(`${profile.id}.json`, f)
    assert.deepStrictEqual(Object.keys(profile), ['id', 'version', 'kind', 'plateMm', 'baseThicknessMm', 'curve', 'axis', 'grid', 'tick', 'point', 'braille', 'rules', 'source'])
    assert.deepStrictEqual(Object.keys(profile.rules), ['minLineGapMm', 'minLabelClearanceMm', 'minLabelPointClearanceMm', 'minFeatureWidthMm', 'edgeMarginMm'])
  }
})

test('the example is the demo request at the profile default layout (print A)', () => {
  assert.deepStrictEqual(validateSpec(readJson(path.join(root, 'examples', 'projectile.json'))), [])
  assert.deepStrictEqual(readJson(path.join(root, 'examples', 'projectile.json')), readJson(path.join(root, 'tools', 'prints', 'spec.json')))
  assert.deepStrictEqual(validateLayout(readJson(path.join(root, 'examples', 'projectile.layout.json'))), [])
})

test('production-revision pointer is a single revision name or UNSET', () => {
  const value = fs.readFileSync(path.join(root, 'deploy', 'gcp', 'production-revision'), 'utf8')
  assert.match(value, /^(UNSET|[a-z][a-z0-9-]*)\n?$/)
})
