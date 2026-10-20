const test = require('node:test')
const assert = require('node:assert')

const { plan, runAutoMerge } = require('./auto-merge')
const { gitlab } = require('./gitlab')

const sha = 'a'.repeat(40)
const env = (over = {}) => ({
  RELEASE_MODE: 'hands-off',
  CI_PIPELINE_SOURCE: 'merge_request_event',
  CI_MERGE_REQUEST_IID: '5',
  CI_MERGE_REQUEST_SOURCE_BRANCH_NAME: 'graph/7',
  CI_MERGE_REQUEST_TARGET_BRANCH_NAME: 'main',
  CI_DEFAULT_BRANCH: 'main',
  CI_COMMIT_SHA: sha,
  CI_PIPELINE_ID: '42',
  CI_PROJECT_PATH: 'g/p',
  CI_API_V4_URL: 'https://gitlab.example/api/v4',
  CI_PROJECT_ID: '9',
  CI_JOB_TOKEN: 'job',
  LOCUS_GITLAB_TOKEN: 'pat',
  ...over
})

/** A fake GitLab: records every call and answers from `routes` ("METHOD path" -> body). */
const fake = (routes) => {
  const calls = []
  const fetchImpl = async (url, init) => {
    const key = `${init.method} ${url.replace('https://gitlab.example/api/v4/projects/9', '')}`
    calls.push({ key, headers: init.headers, body: init.body && JSON.parse(init.body) })
    const body = routes[key]
    if (body === undefined) return { ok: false, status: 404, text: async () => 'not found' }
    return { ok: true, status: 200, text: async () => JSON.stringify(body) }
  }
  return { calls, api: gitlab({ apiUrl: 'https://gitlab.example/api/v4', projectId: '9', jobToken: 'job', token: 'pat', fetchImpl }) }
}

test('auto-merge merges only a graph/<iid> MR into the default branch, in hands-off mode, outside the freeze', () => {
  assert.deepStrictEqual(plan(env()), { merge: true, iid: 5, requestId: 7 })
  assert.match(plan(env({ RELEASE_MODE: 'supervised' })).reason, /supervised/)
  assert.match(plan(env({ JUDGING_FREEZE: 'true' })).reason, /JUDGING_FREEZE/)
  assert.match(plan(env({ CI_MERGE_REQUEST_SOURCE_BRANCH_NAME: 'feature/x' })).reason, /not graph/)
  assert.match(plan(env({ CI_MERGE_REQUEST_SOURCE_BRANCH_NAME: 'graph/07' })).reason, /not graph/)
  assert.match(plan(env({ CI_MERGE_REQUEST_TARGET_BRANCH_NAME: 'dev' })).reason, /default branch/)
  assert.match(plan(env({ CI_PIPELINE_SOURCE: 'push' })).reason, /not a merge request/)
})

test('it asks GitLab to merge when the pipeline succeeds, pinned to this commit, with the personal token', async () => {
  const { calls, api } = fake({
    'GET /merge_requests/5': { iid: 5, state: 'opened', sha, source_branch: 'graph/7', title: 'Tactile graph for #7' },
    'PUT /merge_requests/5/merge': { state: 'opened', merge_when_pipeline_succeeds: true }
  })
  assert.strictEqual(await runAutoMerge(env(), api), 0)
  const put = calls.find((c) => c.key.startsWith('PUT'))
  assert.strictEqual(put.headers['PRIVATE-TOKEN'], 'pat')
  assert.strictEqual(put.body.sha, sha)
  assert.strictEqual(put.body.auto_merge, true)
  assert.match(put.body.merge_commit_message, /^Merge graph\/7: Tactile graph for #7\n\nMerged by the auto-merge CI job \(hands-off\) once pipeline 42/)
})

test('it leaves alone an MR that moved on, closed, and refuses a draft or a conflict', async () => {
  for (const [mr, code] of [[{ state: 'opened', sha: 'b'.repeat(40) }, 0], [{ state: 'merged', sha }, 0], [{ state: 'opened', sha, draft: true }, 1], [{ state: 'opened', sha, has_conflicts: true }, 1]]) {
    const { calls, api } = fake({ 'GET /merge_requests/5': { iid: 5, ...mr } })
    assert.strictEqual(await runAutoMerge(env(), api), code, JSON.stringify(mr))
    assert.ok(!calls.some((c) => c.key.startsWith('PUT')), 'no merge call')
  }
})

test('hands-off without the token fails loudly instead of pretending; supervised needs no token', async () => {
  const { calls, api } = fake({})
  assert.strictEqual(await runAutoMerge(env({ LOCUS_GITLAB_TOKEN: '' }), api), 1)
  assert.strictEqual(await runAutoMerge(env({ LOCUS_GITLAB_TOKEN: '', RELEASE_MODE: 'supervised' }), api), 0)
  assert.strictEqual(calls.length, 0)
})

test('a refused merge is an error, not a pass', async () => {
  const { api } = fake({ 'GET /merge_requests/5': { iid: 5, state: 'opened', sha, source_branch: 'graph/7', title: 't' } })
  await assert.rejects(runAutoMerge(env(), api), /HTTP 404/)
})
