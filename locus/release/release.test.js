const test = require('node:test')
const assert = require('node:assert')
const fs = require('fs')
const os = require('os')
const path = require('path')

const { readBundles, runPublish, runRelease, releaseNotes, packageFileUrl } = require('./release')
const { gitlab } = require('./gitlab')
const { BUNDLE_FILES, writeBundle, LIMITATIONS } = require('../core/bundle')

const sha = 'c'.repeat(40)
const manifest = (iid, n, over = {}) => ({
  artifactId: `graph-${iid}-v${n}`,
  brailleId: `G${iid}`,
  requestIssue: iid,
  sourceCommit: sha,
  pipelineId: 77,
  generatorVersion: '0.1.0',
  profile: { id: 'fdm-handheld-v1', version: 1 },
  hashes: { 'graph.stl': 'b'.repeat(64), 'graph.svg': 'c'.repeat(64), 'description.txt': 'd'.repeat(64) },
  touchcheck: { pass: true, attempts: 2 },
  guards: { scope: true, maths: true, description: true },
  agentSessions: ['https://gitlab.example/g/p/-/automate/agent-sessions/9753341'],
  releaseMode: 'hands-off',
  releaseTag: null,
  limitations: LIMITATIONS,
  ...over
})

const bundleRoot = (...manifests) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'locus-release-'))
  for (const m of manifests) {
    const files = Object.fromEntries(BUNDLE_FILES.map((f) => [f, Buffer.from(f === 'manifest.json' ? JSON.stringify(m) : `${f} of ${m.artifactId}`)]))
    writeBundle(root, m.artifactId, files, new Date('2026-10-20T00:00:00Z'))
  }
  return root
}

const env = (over = {}) => ({
  CI_API_V4_URL: 'https://gitlab.example/api/v4',
  CI_PROJECT_ID: '9',
  CI_PROJECT_URL: 'https://gitlab.example/g/p',
  CI_COMMIT_SHA: sha,
  CI_JOB_TOKEN: 'job',
  ...over
})

const fake = (existing = []) => {
  const calls = []
  const fetchImpl = async (url, init) => {
    const route = url.replace('https://gitlab.example/api/v4/projects/9', '')
    calls.push({ method: init.method, route, headers: init.headers, body: init.body })
    if (init.method === 'GET' && route.startsWith('/releases/')) {
      const tag = decodeURIComponent(route.slice('/releases/'.length))
      return existing.includes(tag) ? { ok: true, status: 200, text: async () => '{}' } : { ok: false, status: 404, text: async () => '' }
    }
    return { ok: true, status: 201, text: async () => '{}' }
  }
  return { calls, api: gitlab({ apiUrl: 'https://gitlab.example/api/v4', projectId: '9', jobToken: 'job', token: 'pat', fetchImpl }) }
}

test('the bundles are read from the bundle job output, checked against the manifest schema, in request order', () => {
  const root = bundleRoot(manifest(12, 1), manifest(7, 2))
  assert.deepStrictEqual(readBundles(root).map((b) => b.artifactId), ['graph-7-v2', 'graph-12-v1'])
  assert.deepStrictEqual(readBundles(path.join(root, 'nothing-here')), [])
  fs.rmSync(path.join(root, 'graph-7-v2', 'graph.stl'))
  assert.throws(() => readBundles(root), /graph-7-v2: missing graph.stl/)
  assert.throws(() => readBundles(bundleRoot({ ...manifest(7, 1), brailleId: 'G8' })), /brailleId/)
})

test('publish-package uploads the zip and every contract file with the job token', async () => {
  const { calls, api } = fake()
  assert.strictEqual(await runPublish([bundleRoot(manifest(7, 1))], env(), api), 0)
  assert.deepStrictEqual(calls.map((c) => `${c.method} ${c.route}`), [
    'PUT /packages/generic/locus-graphs/graph-7-v1/graph-7-v1.zip',
    ...BUNDLE_FILES.map((f) => `PUT /packages/generic/locus-graphs/graph-7-v1/${f}`)
  ])
  assert.ok(calls.every((c) => c.headers['JOB-TOKEN'] === 'job' && !c.headers['PRIVATE-TOKEN']))
})

test('release tags this commit graph-<iid>-v<n>, links the package files and fills releaseTag', async () => {
  const { calls, api } = fake()
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'locus-release-out-'))
  assert.strictEqual(await runRelease([bundleRoot(manifest(7, 1)), out], env(), api), 0)
  const post = calls.find((c) => c.method === 'POST')
  const body = JSON.parse(post.body)
  assert.strictEqual(post.route, '/releases')
  assert.strictEqual(body.tag_name, 'graph-7-v1')
  assert.strictEqual(body.ref, sha)
  assert.deepStrictEqual(body.assets.links.map((l) => l.url.split('/').pop()), ['graph-7-v1.zip', 'graph.stl', 'graph.svg', 'description.txt', 'manifest.json'])
  const put = calls.find((c) => c.route.endsWith('/graph-7-v1/manifest.json'))
  assert.strictEqual(JSON.parse(put.body.toString()).releaseTag, 'graph-7-v1')
  assert.strictEqual(JSON.parse(fs.readFileSync(path.join(out, 'graph-7-v1', 'manifest.json'))).releaseTag, 'graph-7-v1')
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(path.join(out, 'released.json'))), { released: ['graph-7-v1'] })
})

test('an existing release is never made again, and a bundle from another commit is refused', async () => {
  const { calls, api } = fake(['graph-7-v1'])
  assert.strictEqual(await runRelease([bundleRoot(manifest(7, 1)), fs.mkdtempSync(path.join(os.tmpdir(), 'o-'))], env(), api), 0)
  assert.ok(!calls.some((c) => c.method !== 'GET'))
  const second = fake()
  assert.strictEqual(await runRelease([bundleRoot(manifest(7, 1, { sourceCommit: 'd'.repeat(40) })), fs.mkdtempSync(path.join(os.tmpdir(), 'o-'))], env(), second.api), 2)
  assert.ok(!second.calls.some((c) => c.method !== 'GET'))
})

test('during the judging freeze nothing is published or released', async () => {
  const { calls, api } = fake()
  const root = bundleRoot(manifest(7, 1))
  assert.strictEqual(await runPublish([root], env({ JUDGING_FREEZE: 'true' }), api), 0)
  assert.strictEqual(await runRelease([root], env({ JUDGING_FREEZE: 'true' }), api), 0)
  assert.strictEqual(calls.length, 0)
})

test('release notes state the checks, sessions and limitations in plain text', () => {
  const notes = releaseNotes({ ...manifest(7, 1), releaseTag: 'graph-7-v1' }, env())
  assert.match(notes, /Braille ID on the plate: G7/)
  assert.match(notes, /passed after 2 attempts/)
  assert.match(notes, /agent-sessions\/9753341/)
  assert.ok(notes.includes(LIMITATIONS))
  assert.ok(!new RegExp(`[${String.fromCharCode(0x2013, 0x2014, 0x2212)}]`).test(notes))
  assert.strictEqual(packageFileUrl('https://h/api/v4/', 9, 'graph-7-v1', 'graph.stl'), 'https://h/api/v4/projects/9/packages/generic/locus-graphs/graph-7-v1/graph.stl')
})
