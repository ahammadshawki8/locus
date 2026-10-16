const test = require('node:test')
const assert = require('node:assert')
const fs = require('fs')
const os = require('os')
const path = require('path')

const { BUNDLE_FILES, LIMITATIONS, artifactName, nextVersion, buildManifest, blockers, readmeText, sessionUrls, sha256, writeBundle } = require('./bundle')
const { validateManifest } = require('./validate')
const { loadProfile } = require('./profiles')

const spec = { schemaVersion: 3, requestId: 12, profileId: 'fdm-handheld-v1' }
const report = (pass = true, attempt = 2) => ({ requestId: 12, attempt, profileId: 'fdm-handheld-v1', pass, results: [] })
const guards = (overrides = {}) => ({ scope: { pass: true }, maths: { pass: true }, description: { pass: true }, ...overrides })
const inputs = (overrides = {}) => ({
  spec,
  profile: loadProfile('fdm-handheld-v1'),
  hashes: { 'graph.stl': 'b'.repeat(64), 'graph.svg': 'c'.repeat(64), 'description.txt': 'd'.repeat(64) },
  report: report(),
  guards: guards(),
  sourceCommit: 'a'.repeat(40),
  pipelineId: 4242,
  generatorVersion: '0.1.0',
  version: 1,
  releaseMode: 'hands-off',
  agentSessions: [],
  ...overrides
})

test('artifact names are graph-<iid>-v<n>', () => {
  assert.strictEqual(artifactName(12, 3), 'graph-12-v3')
})

test('nextVersion counts only this request\'s release tags', () => {
  assert.deepStrictEqual(nextVersion(12, []), { latest: null, next: 1 })
  assert.deepStrictEqual(nextVersion(12, ['graph-12-v1', 'graph-12-v2', 'graph-1-v9', 'graph-120-v5', 'graph-12-vx', 'v1.0.0']), { latest: 'graph-12-v2', next: 3 })
  assert.deepStrictEqual(nextVersion(12, ['graph-12-v10', 'graph-12-v9']), { latest: 'graph-12-v10', next: 11 })
})

test('the manifest is contracts §5, in its field order, from the given job outputs', () => {
  const manifest = buildManifest(inputs())
  assert.deepStrictEqual(validateManifest(manifest), [])
  assert.deepStrictEqual(Object.keys(manifest), ['artifactId', 'brailleId', 'requestIssue', 'sourceCommit', 'pipelineId', 'generatorVersion', 'profile',
    'hashes', 'touchcheck', 'guards', 'agentSessions', 'releaseMode', 'releaseTag', 'limitations'])
  assert.strictEqual(manifest.artifactId, 'graph-12-v1')
  assert.strictEqual(manifest.brailleId, 'G12')
  assert.strictEqual(manifest.pipelineId, 4242)
  assert.deepStrictEqual(manifest.profile, { id: 'fdm-handheld-v1', version: 1 })
  assert.deepStrictEqual(manifest.touchcheck, { pass: true, attempts: 2 })
  assert.deepStrictEqual(manifest.guards, { scope: true, maths: true, description: true })
  assert.strictEqual(manifest.releaseTag, null)
  assert.strictEqual(manifest.limitations, LIMITATIONS)
})

test('a failed touchcheck or guard blocks the bundle, and says which', () => {
  assert.deepStrictEqual(blockers(inputs()), [])
  assert.deepStrictEqual(blockers(inputs({ report: report(false, 3) })), ['touchcheck failed (attempt 3): no bundle for a graph that fails TL-1 to TL-5'])
  assert.deepStrictEqual(blockers(inputs({ guards: guards({ maths: { pass: false } }) })), ['guard-maths did not pass'])
})

test('README.txt says how to print at 100% scale, the real size, the braille ID and the limitations line, in plain ASCII', () => {
  const text = readmeText({ artifactId: 'graph-12-v1', brailleId: 'G12', sizeMm: [100, 100, 3.6], attempts: 2 })
  assert.match(text, /Print at 100% scale/)
  assert.match(text, /100\.0 x 100\.0 x 3\.6 mm/)
  assert.match(text, /G12/)
  assert.match(text, /after 2 attempts/)
  assert.ok(text.includes(LIMITATIONS))
  for (const name of BUNDLE_FILES.filter((f) => f !== 'README.txt')) assert.ok(text.includes(name), name)
  assert.match(text, /^[\x20-\x7e\n]+$/)
  assert.match(readmeText({ artifactId: 'graph-12-v1', brailleId: 'G12', sizeMm: [100, 100, 3.6], attempts: 1 }), /after 1 attempt\b/)
})

test('sha256 is lowercase hex', () => {
  assert.strictEqual(sha256(Buffer.from('abc')), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
})

test('writeBundle writes the seven contract files and a zip with the same name', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'locus-bundle-'))
  const files = Object.fromEntries(BUNDLE_FILES.map((f) => [f, Buffer.from(`${f}\n`)]))
  const written = writeBundle(root, 'graph-12-v1', files, new Date(Date.UTC(2026, 9, 16)))
  assert.strictEqual(written.dir, path.join(root, 'graph-12-v1'))
  assert.strictEqual(written.zip, path.join(root, 'graph-12-v1.zip'))
  assert.deepStrictEqual(fs.readdirSync(written.dir).sort(), [...BUNDLE_FILES].sort())
  const zip = fs.readFileSync(written.zip)
  for (const f of BUNDLE_FILES) assert.ok(zip.includes(Buffer.from(`graph-12-v1/${f}`)), f)
  assert.throws(() => writeBundle(root, 'graph-12-v2', { 'graph.stl': Buffer.from('') }), /missing .*graph\.svg/)
})

test('sessionUrls keeps Duo session URLs of this project, once each, in order', () => {
  const project = 'https://gitlab.com/group/sub/showcase'
  const a = `${project}/-/automate/agent-sessions/101`
  const b = `${project}/-/automate/agent-sessions/202`
  assert.deepStrictEqual(sessionUrls([a, b, a], project), { urls: [a, b], rejected: [] })
  // Outside a pipeline there is no project URL: any GitLab agent session URL shape is kept.
  assert.deepStrictEqual(sessionUrls([` ${a} `], undefined), { urls: [a], rejected: [] })
  const others = [
    'https://gitlab.com/other/showcase/-/automate/agent-sessions/7', // another project
    `${project}/-/automate/agent-sessions/`, // no id
    `${project}/-/automate/agent-sessions/12x`,
    `${project}/-/issues/3`,
    `http://gitlab.com/group/sub/showcase/-/automate/agent-sessions/5`, // not https
    `${a} and more`,
    ''
  ]
  assert.deepStrictEqual(sessionUrls(others, project), { urls: [], rejected: others.filter(Boolean) })
  assert.deepStrictEqual(sessionUrls([`${project}/-/automate/agent-sessions/9`], `${project}/`).urls, [`${project}/-/automate/agent-sessions/9`])
})
