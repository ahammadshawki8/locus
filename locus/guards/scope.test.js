const test = require('node:test')
const assert = require('node:assert')

const { checkScope, agentOf } = require('./scope')

// What a flow's create_commit really records (locus-probe, 16 Oct (l)): the flow's display name as author and committer,
// and its service account's noreply email.
const SA = (hash) => `service_account_group_121124982_${hash}@noreply.gitlab.com`
const REQUEST = { authorName: 'locus-request', authorEmail: SA('aaaa1111'), committerName: 'locus-request', committerEmail: SA('aaaa1111') }
const OPS = { authorName: 'locus-ops', authorEmail: SA('bbbb2222'), committerName: 'locus-ops', committerEmail: SA('bbbb2222') }
const PERSON = { authorName: 'Mohammad Ashfaqul Hasan', authorEmail: 'ashfaq@example.org' }
let n = 0
const commit = (who, ...paths) => ({ sha: `c${++n}`, merge: false, ...who, paths: paths.map((p) => (typeof p === 'string' ? { status: 'M', path: p } : p)) })
const add = (path) => ({ status: 'A', path })
const violationsOf = (result) => result.violations.map((v) => v.reason)

test('a commit is an agent\'s when its author name or email local part matches the flow pattern', () => {
  assert.strictEqual(agentOf(REQUEST), 'locus-request')
  assert.strictEqual(agentOf({ authorName: 'Bot', authorEmail: 'locus-ops@example.org' }), 'locus-ops')
  // The service account's username (ai-<flow>-<group>) never appears in git; only the display name does.
  assert.strictEqual(agentOf({ authorName: 'locus-probe', authorEmail: SA('d83db293') }), null)
  assert.strictEqual(agentOf(PERSON), null)
})

// create_commit takes optional author_name and author_email, so a model can write a person's name as the author. The
// committer of an API commit is the account that called the API, which the model cannot set.
test('a commit is an agent\'s when its committer matches, even if the author is a person\'s name', () => {
  const spoofed = { ...PERSON, committerName: 'locus-ops', committerEmail: SA('bbbb2222') }
  assert.strictEqual(agentOf(spoofed), 'locus-ops')
  assert.strictEqual(agentOf({ ...PERSON, committerName: 'Shawki', committerEmail: 'locus-request@example.org' }), 'locus-request')
  assert.strictEqual(agentOf({ ...PERSON, committerName: PERSON.authorName, committerEmail: PERSON.authorEmail }), null)
})

test('an agent commit under a person\'s author name is still held to the agent\'s paths', () => {
  const spoofed = { ...PERSON, committerName: 'locus-request', committerEmail: SA('aaaa1111') }
  const result = checkScope({
    branch: 'graph/12',
    commits: [
      commit(REQUEST, add('requests/12/spec.json'), add('requests/12/request.lock.json'), add('requests/12/layout.json')),
      commit(spoofed, 'locus/touchcheck/rules/tl1.js')
    ]
  })
  assert.strictEqual(result.pass, false)
  assert.strictEqual(result.agentCommits, 2)
  assert.strictEqual(result.personCommits, 0)
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

// Fail closed: a flow created under another display name (or any other Duo flow) commits as a service account that
// matches no Locus flow. On an agent branch that is blocked, not counted as a person.
test('a GitLab service account that is not a Locus flow may not commit on graph/, revert/ or rollback/ branches', () => {
  const other = { authorName: 'Locus Request', authorEmail: SA('cccc3333'), committerName: 'Locus Request', committerEmail: SA('cccc3333') }
  for (const branch of ['graph/12', 'revert/abc1234', 'rollback/3']) {
    const result = checkScope({ branch, commits: [commit(other, 'requests/12/layout.json')] })
    assert.strictEqual(result.pass, false, branch)
    assert.match(violationsOf(result)[0], /service account "Locus Request" is not a Locus flow/, branch)
  }
  // Elsewhere (a person's branch a foundational Duo flow helped with) it is not guard-scope's business.
  const elsewhere = checkScope({ branch: 'feat/x', commits: [commit(other, 'README.md')] })
  assert.strictEqual(elsewhere.pass, true)
  assert.strictEqual(elsewhere.personCommits, 1)
})

// The default branch (21 Oct: the first merged request, graph/2, was blocked on main). Agent work arrives only through
// merges; GitLab credits the merge commit to the MR's author, here locus-request.
const { checkDefaultBranch, mergedBranch } = require('./scope')
const mergeOf = (who, subject, merged) => ({ sha: `m${++n}`, merge: true, subject, ...who, paths: [], merged })
const intake = (iid) => commit(REQUEST, add(`requests/${iid}/spec.json`), add(`requests/${iid}/request.lock.json`), add(`requests/${iid}/layout.json`))

test('a merge subject names its source branch: GitLab\'s default and the auto-merge job\'s', () => {
  assert.strictEqual(mergedBranch("Merge branch 'team-flow' into 'main'"), 'team-flow')
  assert.strictEqual(mergedBranch('Merge graph/2: Tactile graph for #2: y = -0.5x^2 + 2x + 1'), 'graph/2')
  assert.strictEqual(mergedBranch('Merge graph/2 by hand'), null)
  assert.strictEqual(mergedBranch('Fix the README'), null)
})

test('on main, a merged graph/<iid> is checked by the graph branch rules, whoever GitLab credits the merge to', () => {
  const merged = [intake(2), commit(REQUEST, 'requests/2/layout.json')]
  const ok = checkDefaultBranch({ branch: 'main', firstParent: [mergeOf(REQUEST, 'Merge graph/2: Tactile graph for #2', merged)] })
  assert.deepStrictEqual(violationsOf(ok), [])
  assert.strictEqual(ok.pass, true)
  assert.strictEqual(ok.agentCommits, 3)
  const people = checkDefaultBranch({ branch: 'main', firstParent: [mergeOf(PERSON, "Merge branch 'graph/2' into 'main'", merged), commit(PERSON, 'README.md')] })
  assert.strictEqual(people.pass, true)
})

test('on main, the fixer stays in layout.json and the intake in its own request, even after the merge', () => {
  const bad = checkDefaultBranch({ branch: 'main', firstParent: [mergeOf(REQUEST, 'Merge graph/2: t', [intake(2), commit(REQUEST, 'locus/touchcheck/rules/tl1.js')])] })
  assert.match(violationsOf(bad).join('\n'), /may not change this file here/)
  const other = checkDefaultBranch({ branch: 'main', firstParent: [mergeOf(REQUEST, 'Merge graph/2: t', [intake(3)])] })
  assert.strictEqual(other.pass, false)
})

test('on main, an agent commit straight on the branch, or an agent-credited merge of a person\'s branch, fails', () => {
  const direct = checkDefaultBranch({ branch: 'main', firstParent: [commit(REQUEST, 'requests/2/layout.json')] })
  assert.match(violationsOf(direct)[0], /only on graph\/<iid>, not on main/)
  const sneaky = checkDefaultBranch({ branch: 'main', firstParent: [mergeOf(REQUEST, "Merge branch 'feature' into 'main'", [commit(PERSON, 'locus/core/x.js')])] })
  assert.match(violationsOf(sneaky)[0], /must merge an agent branch, not feature/)
  const smuggled = checkDefaultBranch({ branch: 'main', firstParent: [mergeOf(PERSON, "Merge branch 'feature' into 'main'", [commit(REQUEST, 'requests/2/layout.json')])] })
  assert.match(violationsOf(smuggled)[0], /not on main/)
})
