const test = require('node:test')
const assert = require('node:assert')
const fs = require('fs')
const os = require('os')
const path = require('path')

const { replyNote, runReply } = require('./reply')
const { gitlab } = require('./gitlab')
const { LIMITATIONS } = require('../core/bundle')

const manifest = { artifactId: 'graph-7-v1', brailleId: 'G7', requestIssue: 7, touchcheck: { pass: true, attempts: 2 }, limitations: LIMITATIONS }
const env = (over = {}) => ({ CI_API_V4_URL: 'https://gitlab.example/api/v4', CI_PROJECT_ID: '9', LOCUS_GITLAB_TOKEN: 'pat', ...over })

const releaseDir = (released) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'locus-reply-'))
  fs.writeFileSync(path.join(dir, 'released.json'), JSON.stringify({ released }))
  for (const tag of released) {
    fs.mkdirSync(path.join(dir, tag))
    fs.writeFileSync(path.join(dir, tag, 'manifest.json'), JSON.stringify({ ...manifest, artifactId: tag }))
  }
  return dir
}

const fake = () => {
  const calls = []
  const fetchImpl = async (url, init) => {
    calls.push({ method: init.method, route: url.replace('https://gitlab.example/api/v4/projects/9', ''), headers: init.headers, body: JSON.parse(init.body) })
    return { ok: true, status: 201, text: async () => '{}' }
  }
  return { calls, api: gitlab({ apiUrl: 'https://gitlab.example/api/v4', projectId: '9', jobToken: 'job', token: 'pat', fetchImpl }) }
}

test('the reply is the contracts §8 note, marked automated, with links that work signed out', () => {
  assert.strictEqual(replyNote({ manifest, siteUrl: 'https://locus.example/', apiUrl: 'https://gitlab.example/api/v4', projectId: '9' }), [
    'Automated message from the Locus pipeline.',
    '',
    'Your graph is ready: https://locus.example/graphs/graph-7-v1/',
    'Download (print at 100% scale): https://gitlab.example/api/v4/projects/9/packages/generic/locus-graphs/graph-7-v1/graph.stl',
    'Checks passed: TL-1 to TL-5 (after 2 attempts)',
    'Braille ID on the plate: G7',
    'Note: automated checks measure spacing and size; they do not certify that a learner can understand the graphic.'
  ].join('\n'))
})

test('it notes and closes each released request with the personal token', async () => {
  const { calls, api } = fake()
  assert.strictEqual(await runReply(['https://locus.example', releaseDir(['graph-7-v1'])], env(), api), 0)
  assert.deepStrictEqual(calls.map((c) => `${c.method} ${c.route}`), ['POST /issues/7/notes', 'PUT /issues/7'])
  assert.ok(calls.every((c) => c.headers['PRIVATE-TOKEN'] === 'pat'))
  assert.deepStrictEqual(calls[1].body, { state_event: 'close' })
})

test('nothing released, the freeze, or no token: no note is posted', async () => {
  const { calls, api } = fake()
  assert.strictEqual(await runReply(['https://locus.example', releaseDir([])], env(), api), 0)
  assert.strictEqual(await runReply(['https://locus.example', releaseDir(['graph-7-v1'])], env({ JUDGING_FREEZE: 'true' }), api), 0)
  assert.strictEqual(await runReply(['https://locus.example', releaseDir(['graph-7-v1'])], env({ LOCUS_GITLAB_TOKEN: '' }), api), 1)
  assert.strictEqual(calls.length, 0)
})
