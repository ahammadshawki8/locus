// End to end in a throwaway git repo: the intake agent's first commit, the fixer's layout commit, then a rogue commit.
// The guards run through the CLI exactly as the CI jobs call them.
const test = require('node:test')
const assert = require('node:assert')
const { execFileSync, spawnSync } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

const cli = path.join(__dirname, '..', 'cli', 'index.js')
const prints = path.join(__dirname, '..', '..', 'tools', 'prints')
const spec = { ...JSON.parse(fs.readFileSync(path.join(prints, 'spec.json'), 'utf8')), requestId: 12 }
const json = (o) => JSON.stringify(o, null, 2) + '\n'

const AGENT = { GIT_AUTHOR_NAME: 'ai-locus-request-transcend', GIT_AUTHOR_EMAIL: 'ai-locus-request-transcend@noreply.example' }
const PERSON = { GIT_AUTHOR_NAME: 'A Person', GIT_AUTHOR_EMAIL: 'person@example.org' }

const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'locus-guards-'))
// The throwaway repo is not the pipeline's repo: drop GitLab's CI_* variables (branch, base, commit, pipeline) and
// RELEASE_MODE, which the runner sets for the real checkout.
const HOST_ENV = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('CI_') && k !== 'RELEASE_MODE'))
const env = (who) => ({ ...HOST_ENV, ...who, GIT_COMMITTER_NAME: who.GIT_AUTHOR_NAME, GIT_COMMITTER_EMAIL: who.GIT_AUTHOR_EMAIL })
const git = (who, ...args) => execFileSync('git', args, { cwd: repo, env: env(who), encoding: 'utf8' })
const write = (file, content) => {
  fs.mkdirSync(path.dirname(path.join(repo, file)), { recursive: true })
  fs.writeFileSync(path.join(repo, file), content)
}
const commit = (who, message) => {
  git(who, 'add', '-A')
  git(who, 'commit', '-q', '-m', message)
}
const locus = (...args) => spawnSync(process.execPath, [cli, ...args], { cwd: repo, encoding: 'utf8', env: env(PERSON) })

test.before(() => {
  git(PERSON, 'init', '-q', '-b', 'main')
  write('README.md', 'base\n')
  commit(PERSON, 'base')
  git(PERSON, 'checkout', '-q', '-b', 'graph/12')
  write('requests/12/spec.json', json(spec))
  write('requests/12/request.lock.json', json({ graph: spec.graph, mark: spec.mark }))
  write('requests/12/layout.json', fs.readFileSync(path.join(prints, 'layout-A.json'), 'utf8'))
  commit(AGENT, 'Request 12: spec and default layout (attempt 1)')
  write('requests/12/layout.json', fs.readFileSync(path.join(prints, 'layout-B.json'), 'utf8'))
  commit(AGENT, 'Hide the grid, stretch y, move labels (attempt 2)')
  assert.strictEqual(locus('requests/12', '--out', 'out/12').status, 0)
})

test('the intake + fixer branch passes guard-scope, guard-maths and guard-description', () => {
  const scope = locus('guard', 'scope', '--base', 'main')
  assert.strictEqual(scope.status, 0, scope.stdout + scope.stderr)
  assert.match(scope.stdout, /2 commit\(s\) on graph\/12 .*: 2 by agents, 0 by people/)
  for (const guard of ['maths', 'description']) {
    const result = locus('guard', guard, 'requests/12', '--out', 'out/12', '--base', 'main')
    assert.strictEqual(result.status, 0, result.stdout + result.stderr)
  }
  assert.strictEqual(JSON.parse(fs.readFileSync(path.join(repo, 'out', 'guards', 'scope.json'), 'utf8')).pass, true)
})

test('an agent commit that edits the lock is blocked by guard-scope and guard-maths', () => {
  write('requests/12/request.lock.json', json({ graph: { ...spec.graph, coeffs: [0, -0.5, 2, 2] }, mark: spec.mark }))
  commit(AGENT, 'Change the maths')
  const scope = locus('guard', 'scope', '--base', 'main')
  assert.strictEqual(scope.status, 1)
  assert.match(scope.stdout, /requests\/12\/request\.lock\.json: locus-request may not change this file here/)
  const maths = locus('guard', 'maths', 'requests/12', '--out', 'out/12', '--base', 'main')
  assert.strictEqual(maths.status, 1)
  assert.match(maths.stdout, /spec\.json graph differs from request\.lock\.json/)
  assert.match(maths.stdout, /request\.lock\.json was changed after its first commit/)
})

test('a guard that cannot read its inputs fails closed (exit 2), it does not pass', () => {
  const result = locus('guard', 'maths', 'requests/12', '--out', 'out/missing', '--base', 'main')
  assert.strictEqual(result.status, 2)
  assert.match(result.stderr, /scene\.json not found/)
})

test('without --base or CI variables, the base is where the branch left main', () => {
  const { resolveBase } = require('./git')
  assert.strictEqual(resolveBase({ env: {}, cwd: repo }), git(PERSON, 'rev-parse', 'main').trim())
})
