const test = require('node:test')
const assert = require('node:assert')

const { checkScope, agentOf } = require('./scope')

const REQUEST = { authorName: 'ai-locus-request-transcend', authorEmail: 'service-account-1@noreply.gitlab.example' }
const OPS = { authorName: 'ai-locus-ops-transcend', authorEmail: 'service-account-2@noreply.gitlab.example' }
const PERSON = { authorName: 'Mohammad Ashfaqul Hasan', authorEmail: 'ashfaq@example.org' }
let n = 0
const commit = (who, ...paths) => ({ sha: `c${++n}`, merge: false, ...who, paths: paths.map((p) => (typeof p === 'string' ? { status: 'M', path: p } : p)) })
const add = (path) => ({ status: 'A', path })
const violationsOf = (result) => result.violations.map((v) => v.reason)

test('a commit is an agent\'s when its author name or email local part matches the flow pattern', () => {
  assert.strictEqual(agentOf(REQUEST), 'locus-request')
  assert.strictEqual(agentOf({ authorName: 'Bot', authorEmail: 'ai-locus-ops-transcend@example.org' }), 'locus-ops')
  assert.strictEqual(agentOf(PERSON), null)
})

test('intake: the first commit on graph/<iid> writes spec, lock and layout; the fixer then changes layout only', () => {
  const result = checkScope({
    branch: 'graph/12',
    commits: [
      commit(REQUEST, add('requests/12/spec.json'), add('requests/12/request.lock.json'), add('requests/12/layout.json')),
      commit(REQUEST, 'requests/12/layout.json'),
      commit(REQUEST, 'requests/12/layout.json')
    ]
  })
  assert.deepStrictEqual(result.violations, [])
  assert.strictEqual(result.pass, true)
  assert.strictEqual(result.agentCommits, 3)
})

test('the fixer may not touch the spec, the lock, the rules or another request', () => {
  const result = checkScope({
    branch: 'graph/12',
    commits: [
      commit(REQUEST, add('requests/12/spec.json'), add('requests/12/request.lock.json'), add('requests/12/layout.json')),
      commit(REQUEST, 'requests/12/spec.json'),
      commit(REQUEST, 'locus/touchcheck/rules/tl1.js'),
      commit(REQUEST, 'requests/13/layout.json')
    ]
  })
  assert.strictEqual(result.pass, false)
  assert.deepStrictEqual(result.violations.map((v) => [v.sha, v.path]), [
    [result.violations[0].sha, 'requests/12/spec.json'],
    [result.violations[1].sha, 'locus/touchcheck/rules/tl1.js'],
    [result.violations[2].sha, 'requests/13/layout.json']
  ])
})

test('intake may not write outside requests/<iid>/, not even in its first commit', () => {
  const result = checkScope({ branch: 'graph/12', commits: [commit(REQUEST, add('requests/12/spec.json'), 'profiles/fdm-handheld-v1.json')] })
  assert.deepStrictEqual(result.violations.map((v) => v.path), ['profiles/fdm-handheld-v1.json'])
})

test('an agent may not delete files', () => {
  const result = checkScope({ branch: 'graph/12', commits: [commit(REQUEST, { status: 'D', path: 'requests/12/layout.json' })] })
  assert.match(violationsOf(result)[0], /delete/)
})

test('locus-request may commit only on graph/<iid>', () => {
  const result = checkScope({ branch: 'main', commits: [commit(REQUEST, 'requests/12/layout.json')] })
  assert.match(violationsOf(result)[0], /only on graph\/<iid>/)
})

test('release guard: on rollback/<n> only deploy/gcp/production-revision', () => {
  assert.strictEqual(checkScope({ branch: 'rollback/7', commits: [commit(OPS, 'deploy/gcp/production-revision')] }).pass, true)
  const bad = checkScope({ branch: 'rollback/7', commits: [commit(OPS, 'deploy/gcp/production-revision', '.gitlab-ci.yml')] })
  assert.deepStrictEqual(bad.violations.map((v) => v.path), ['.gitlab-ci.yml'])
})

test('regression detective: on revert/<sha> only paths the named commit changed (guard-revert checks the content)', () => {
  const pathsOf = (sha) => (sha === 'abc1234' ? [{ status: 'M', path: 'locus/core/scene.js' }] : [])
  assert.strictEqual(checkScope({ branch: 'revert/abc1234', commits: [commit(OPS, 'locus/core/scene.js')], pathsOf }).pass, true)
  const bad = checkScope({ branch: 'revert/abc1234', commits: [commit(OPS, 'locus/core/scene.js', 'locus/touchcheck/remedies.json')], pathsOf })
  assert.deepStrictEqual(bad.violations.map((v) => v.path), ['locus/touchcheck/remedies.json'])
})

test('regression detective: the inverse of an added file is its delete, and only that delete is allowed', () => {
  const pathsOf = () => [{ status: 'A', path: 'locus/core/new.js' }, { status: 'M', path: 'locus/core/scene.js' }]
  const del = (path) => commit(OPS, { status: 'D', path })
  assert.strictEqual(checkScope({ branch: 'revert/abc1234', commits: [del('locus/core/new.js')], pathsOf }).pass, true)
  const bad = checkScope({ branch: 'revert/abc1234', commits: [del('locus/core/scene.js')], pathsOf })
  assert.match(violationsOf(bad)[0], /may not delete/)
})

test('locus-ops may not commit on any other branch (the impact reviewer only writes MR notes)', () => {
  const result = checkScope({ branch: 'graph/12', commits: [commit(OPS, 'requests/12/layout.json')] })
  assert.match(violationsOf(result)[0], /rollback\/<n> or revert\/<sha>/)
})

test('people\'s commits are not checked here (CODEOWNERS and protected branches cover them), but are counted', () => {
  const result = checkScope({ branch: 'graph/12', commits: [commit(PERSON, 'locus/touchcheck/rules/tl1.js')] })
  assert.strictEqual(result.pass, true)
  assert.strictEqual(result.personCommits, 1)
  assert.strictEqual(result.agentCommits, 0)
})
