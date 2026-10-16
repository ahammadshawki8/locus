// End to end in a throwaway git repo that carries its own copy of locus/ and profiles/, so each commit has its own
// generator code, as on main: graph 12 (print B) is released as graph-12-v1, then a person's commit, between unrelated
// ones, makes the curve thinner than the profile allows. library-recheck finds graph 12 failing, bisect-regression
// names that commit, its exact inverse passes guard-revert (and library-impact shows graph 12 passing again), and
// near-inverses are blocked.
const test = require('node:test')
const assert = require('node:assert')
const { execFileSync, spawnSync } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

const root = path.join(__dirname, '..', '..')
const prints = path.join(root, 'tools', 'prints')
const spec = { ...JSON.parse(fs.readFileSync(path.join(prints, 'spec.json'), 'utf8')), requestId: 12 }
const json = (o) => JSON.stringify(o, null, 2) + '\n'

const PERSON = { GIT_AUTHOR_NAME: 'A Person', GIT_AUTHOR_EMAIL: 'person@example.org' }
const OPS = { GIT_AUTHOR_NAME: 'ai-locus-ops-transcend', GIT_AUTHOR_EMAIL: 'ai-locus-ops-transcend@noreply.example' }
// The throwaway repo is not the pipeline's repo: drop GitLab's CI_* variables (branch, base, commit, pipeline) and
// RELEASE_MODE, which the runner sets for the real checkout.
const HOST_ENV = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('CI_') && k !== 'RELEASE_MODE'))
// The copied code has no node_modules of its own: it finds ajv and @jscad/modeling in this checkout's.
const NODE_PATH = path.join(root, 'locus', 'node_modules')

const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'locus-monitor-'))
const env = (who) => ({ ...HOST_ENV, ...who, GIT_COMMITTER_NAME: who.GIT_AUTHOR_NAME, GIT_COMMITTER_EMAIL: who.GIT_AUTHOR_EMAIL, NODE_PATH })
const git = (who, ...args) => execFileSync('git', args, { cwd: repo, env: env(who), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
const write = (file, content) => {
  fs.mkdirSync(path.dirname(path.join(repo, file)), { recursive: true })
  fs.writeFileSync(path.join(repo, file), content)
}
const read = (file) => fs.readFileSync(path.join(repo, file), 'utf8')
const commit = (who, message) => {
  git(who, 'add', '-A')
  git(who, 'commit', '-q', '-m', message)
  return git(who, 'rev-parse', 'HEAD')
}
// The repo's own CLI, so the code that runs is the code of the checked-out commit.
const locus = (...args) => spawnSync(process.execPath, [path.join(repo, 'locus', 'cli', 'index.js'), ...args], { cwd: repo, encoding: 'utf8', env: env(PERSON) })
const logLine = (stdout, prefix) => {
  const line = stdout.split('\n').find((l) => l.startsWith(prefix))
  assert.ok(line, `no ${prefix}line in:\n${stdout}`)
  return JSON.parse(line.slice(prefix.length))
}

const SCENE = 'locus/core/scene.js'
const CURVE = "lines.push(line('curve', 'curve', curveMm))"
const THIN_CURVE = "lines.push(line('curve', 'curve', curveMm, { ...profile.curve, widthMm: 0.6 }))"
const sha = {}

test.before(() => {
  git(PERSON, 'init', '-q', '-b', 'main')
  git(PERSON, 'config', 'core.autocrlf', 'false')
  const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '--', 'locus', 'profiles'], { cwd: root, encoding: 'utf8' })
    .split('\n').filter(Boolean).filter((f) => fs.existsSync(path.join(root, f)))
  for (const f of files) write(f, fs.readFileSync(path.join(root, f)))
  write('.gitignore', 'node_modules/\n/out/\n')
  write('README.md', 'Locus\n')
  sha.code = commit(PERSON, 'Locus code')

  write('requests/12/spec.json', json(spec))
  write('requests/12/request.lock.json', json({ graph: spec.graph, mark: spec.mark }))
  write('requests/12/layout.json', fs.readFileSync(path.join(prints, 'layout-B.json'), 'utf8'))
  // Request 14 was never released (and its default layout fails touchcheck): the re-check must leave it alone.
  write('requests/14/spec.json', json({ ...spec, requestId: 14 }))
  write('requests/14/request.lock.json', json({ graph: spec.graph, mark: spec.mark }))
  write('requests/14/layout.json', fs.readFileSync(path.join(prints, 'layout-A.json'), 'utf8'))
  sha.release = commit(PERSON, 'Merge graph/12 and graph/14')
  git(PERSON, 'tag', 'graph-12-v1')

  write('README.md', 'Locus: tactile maths graphs\n')
  sha.docs = commit(PERSON, 'Describe Locus in the README')
  assert.ok(read(SCENE).includes(CURVE), `${SCENE} no longer has the line this test seeds the regression in`)
  write(SCENE, read(SCENE).replace(CURVE, THIN_CURVE))
  sha.regression = commit(PERSON, 'Thinner curve line for faster prints')
  write('README.md', 'Locus: tactile maths graphs, made by an agent\n')
  commit(PERSON, 'README wording')
  write('docs/notes.md', 'notes\n')
  sha.head = commit(PERSON, 'Add notes')
})

test.after(() => fs.rmSync(repo, { recursive: true, force: true }))

test('library-recheck re-checks every shipped graph with the code at HEAD: graph 12 now fails TL-5', () => {
  const result = locus('recheck')
  assert.strictEqual(result.status, 1, result.stdout + result.stderr)
  const report = logLine(result.stdout, 'LOCUS_RECHECK ')
  assert.deepStrictEqual(JSON.parse(read('out/recheck/report.json')), report)
  assert.strictEqual(report.kind, 'recheck')
  assert.strictEqual(report.commit, sha.head)
  assert.strictEqual(report.pass, false)
  assert.deepStrictEqual(report.graphs.map((g) => [g.requestId, g.releaseTag, g.releaseCommit, g.pass]), [[12, 'graph-12-v1', sha.release, false]])
  const tl5 = report.graphs[0].failures.find((f) => f.rule === 'TL-5')
  assert.ok(tl5, JSON.stringify(report.graphs[0]))
  assert.strictEqual(tl5.measuredMm, 0.6)
})

test('bisect-regression names the first commit after the release with which graph 12 fails', () => {
  const result = locus('bisect')
  assert.strictEqual(result.status, 0, result.stdout + result.stderr)
  const report = logLine(result.stdout, 'LOCUS_BISECT ')
  assert.deepStrictEqual(JSON.parse(read('out/bisect/report.json')), report)
  assert.strictEqual(report.commit, sha.head)
  const [found] = report.regressions
  assert.strictEqual(found.requestId, 12)
  assert.strictEqual(found.goodCommit, sha.release)
  assert.strictEqual(found.firstBadCommit, sha.regression)
  assert.strictEqual(found.subject, 'Thinner curve line for faster prints')
  assert.deepStrictEqual(found.paths, [{ status: 'M', path: SCENE }])
  assert.strictEqual(found.revertBranch, `revert/${sha.regression}`)
  // both ends were tested first, then git bisect tested the named commit (bad) and the one before it (good)
  assert.deepStrictEqual(found.steps.slice(0, 2), [{ commit: sha.release, verdict: 'good' }, { commit: sha.head, verdict: 'bad' }])
  assert.ok(found.steps.some((s) => s.commit === sha.regression && s.verdict === 'bad'), JSON.stringify(found.steps))
  assert.ok(found.steps.some((s) => s.commit === sha.docs && s.verdict === 'good'), JSON.stringify(found.steps))
  assert.deepStrictEqual(report.commits.map((c) => [c.sha, c.graphs]), [[sha.regression, [12]]])
  // the bisect ran in its own worktree, which is gone; this checkout was not touched
  assert.strictEqual(git(PERSON, 'worktree', 'list').split('\n').length, 1)
  assert.strictEqual(git(PERSON, 'rev-parse', 'HEAD'), sha.head)
  assert.strictEqual(git(PERSON, 'status', '--porcelain'), '')
})

const freshRevertBranch = () => {
  git(PERSON, 'checkout', '-q', 'main')
  if (git(PERSON, 'branch', '--list', `revert/${sha.regression}`)) git(PERSON, 'branch', '-q', '-D', `revert/${sha.regression}`)
  git(PERSON, 'checkout', '-q', '-b', `revert/${sha.regression}`)
}

test('the exact inverse passes guard-revert and guard-scope, and library-impact shows graph 12 passing again', () => {
  freshRevertBranch()
  git(OPS, 'revert', '--no-edit', sha.regression)
  const revert = locus('guard', 'revert', '--base', 'main')
  assert.strictEqual(revert.status, 0, revert.stdout + revert.stderr)
  assert.strictEqual(JSON.parse(read('out/guards/revert.json')).target, sha.regression)
  const scope = locus('guard', 'scope', '--base', 'main')
  assert.strictEqual(scope.status, 0, scope.stdout + scope.stderr)

  const impact = locus('recheck', '--impact')
  assert.strictEqual(impact.status, 0, impact.stdout + impact.stderr)
  const report = logLine(impact.stdout, 'LOCUS_IMPACT ')
  assert.deepStrictEqual(JSON.parse(read('out/impact/report.json')), report)
  assert.strictEqual(report.kind, 'impact')
  assert.deepStrictEqual(report.graphs.map((g) => [g.requestId, g.pass]), [[12, true]])
})

test('a near-inverse is blocked by guard-revert, though its paths pass guard-scope', () => {
  freshRevertBranch()
  write(SCENE, git(PERSON, 'show', `${sha.regression}^:${SCENE}`).replace(CURVE, `${CURVE} // thick again`) + '\n')
  commit(OPS, 'Revert "Thinner curve line for faster prints"')
  const revert = locus('guard', 'revert', '--base', 'main')
  assert.strictEqual(revert.status, 1, revert.stdout + revert.stderr)
  assert.match(revert.stdout, /BLOCKED/)
  assert.match(revert.stdout, /locus\/core\/scene\.js: not restored to its content before/)
  assert.strictEqual(locus('guard', 'scope', '--base', 'main').status, 0)
})

test('an inverse with an extra file, or a second commit, is blocked', () => {
  freshRevertBranch()
  git(OPS, 'revert', '--no-edit', '--no-commit', sha.regression)
  write('README.md', 'reverted\n')
  commit(OPS, 'Revert "Thinner curve line for faster prints"')
  const extra = locus('guard', 'revert', '--base', 'main')
  assert.strictEqual(extra.status, 1)
  assert.match(extra.stdout, /README\.md: the inverse changes it, but .* did not/)

  freshRevertBranch()
  git(OPS, 'revert', '--no-edit', sha.regression)
  write('docs/notes.md', 'more notes\n')
  commit(OPS, 'More notes')
  const two = locus('guard', 'revert', '--base', 'main')
  assert.strictEqual(two.status, 1)
  assert.match(two.stdout, /exactly one commit.*holds 2/)
})

test('once a later commit changed the same file there is no exact inverse: even a clean git revert is blocked', () => {
  git(PERSON, 'checkout', '-q', 'main')
  write(SCENE, `// The scene, in plate millimetres.\n${read(SCENE)}`)
  commit(PERSON, 'Comment the scene')
  freshRevertBranch()
  git(OPS, 'revert', '--no-edit', sha.regression)
  const clean = locus('guard', 'revert', '--base', 'main')
  assert.strictEqual(clean.status, 1)
  assert.match(clean.stdout, /scene\.js: changed again after .*a person must revert this/)

  freshRevertBranch()
  write(SCENE, git(PERSON, 'show', `${sha.regression}^:${SCENE}`) + '\n')
  commit(OPS, 'Restore scene.js')
  assert.match(locus('guard', 'revert', '--base', 'main').stdout, /changed again after/)
})

test('bisect-regression names no commit when the graph also fails at its release commit', () => {
  git(PERSON, 'checkout', '-q', 'main')
  git(PERSON, 'tag', 'graph-12-v2', sha.regression)
  try {
    assert.strictEqual(locus('recheck').status, 1)
    const result = locus('bisect')
    assert.strictEqual(result.status, 1, result.stdout + result.stderr)
    const [entry] = logLine(result.stdout, 'LOCUS_BISECT ').regressions
    assert.strictEqual(entry.releaseTag, 'graph-12-v2')
    assert.strictEqual(entry.firstBadCommit, undefined)
    assert.match(entry.error, /fails at its release commit/)
  } finally {
    git(PERSON, 'tag', '-d', 'graph-12-v2')
  }
})

test('a guard-revert run off a revert/<sha> branch cannot check (exit 2)', () => {
  git(PERSON, 'checkout', '-q', 'main')
  const result = locus('guard', 'revert', '--base', 'main')
  assert.strictEqual(result.status, 2)
  assert.match(result.stderr, /not a revert\/<sha> branch/)
})
