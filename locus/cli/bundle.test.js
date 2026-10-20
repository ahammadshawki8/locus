// End to end in a throwaway git repo, as the CI jobs run it: the intake agent's commit (print A layout), the fixer's
// commit (print B layout), then render, touchcheck, the three guards and `locus bundle` on their real output.
const test = require('node:test')
const assert = require('node:assert')
const { execFileSync, spawnSync } = require('child_process')
const crypto = require('crypto')
const fs = require('fs')
const os = require('os')
const path = require('path')

const { validateManifest } = require('../core/validate')

const cli = path.join(__dirname, 'index.js')
const prints = path.join(__dirname, '..', '..', 'tools', 'prints')
const { version: generatorVersion } = require('../package.json')
const spec = { ...JSON.parse(fs.readFileSync(path.join(prints, 'spec.json'), 'utf8')), requestId: 12 }
const json = (o) => JSON.stringify(o, null, 2) + '\n'

const AGENT = { GIT_AUTHOR_NAME: 'locus-request', GIT_AUTHOR_EMAIL: 'service_account_group_121124982_aaaa1111@noreply.gitlab.com' }
const PERSON = { GIT_AUTHOR_NAME: 'A Person', GIT_AUTHOR_EMAIL: 'person@example.org' }
// Each flow session ends its commit messages with a Locus-Session trailer; the bundle reads them from git.
const PROJECT = 'https://gitlab.example/group/showcase'
const SESSION = (id) => `${PROJECT}/-/automate/agent-sessions/${id}`
const trailer = (id) => `Locus-Session: ${SESSION(id)}`
// The throwaway repo is not the pipeline's repo: drop GitLab's CI_* variables (branch, base, commit, pipeline) and
// RELEASE_MODE, which the runner sets for the real checkout.
const HOST_ENV = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('CI_') && k !== 'RELEASE_MODE'))

const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'locus-bundle-'))
const env = (who, extra = {}) => ({ ...HOST_ENV, ...who, GIT_COMMITTER_NAME: who.GIT_AUTHOR_NAME, GIT_COMMITTER_EMAIL: who.GIT_AUTHOR_EMAIL, ...extra })
const git = (who, ...args) => execFileSync('git', args, { cwd: repo, env: env(who), encoding: 'utf8' }).trim()
const write = (file, content) => {
  fs.mkdirSync(path.dirname(path.join(repo, file)), { recursive: true })
  fs.writeFileSync(path.join(repo, file), content)
}
const commit = (who, ...paragraphs) => {
  git(who, 'add', '-A')
  git(who, 'commit', '-q', ...paragraphs.flatMap((p) => ['-m', p]))
}
const locus = (args, extra) => spawnSync(process.execPath, [cli, ...args], { cwd: repo, encoding: 'utf8', env: env(PERSON, extra) })
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(repo, file), 'utf8'))
const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(path.join(repo, file))).digest('hex')

// What the render, touchcheck and guard-* jobs do for requests/12, attempt `attempt`. Returns touchcheck's exit code.
const pipeline = (attempt) => {
  fs.rmSync(path.join(repo, 'out', 'guards'), { recursive: true, force: true })
  assert.strictEqual(locus(['requests/12', '--out', 'out/12']).status, 0)
  const checked = locus(['touchcheck', 'requests/12', '--out', 'out/12', '--attempt', String(attempt)]).status
  for (const args of [['scope'], ['maths', 'requests/12', '--out', 'out/12'], ['description', 'requests/12', '--out', 'out/12']]) {
    const result = locus(['guard', ...args, '--base', 'main'])
    assert.strictEqual(result.status, 0, result.stdout + result.stderr)
  }
  return checked
}

test.before(() => {
  git(PERSON, 'init', '-q', '-b', 'main')
  git(PERSON, 'config', 'core.autocrlf', 'false')
  write('README.md', 'base\n')
  write('.gitignore', 'out/\n')
  commit(PERSON, 'base')
  git(PERSON, 'checkout', '-q', '-b', 'graph/12')
  write('requests/12/spec.json', json(spec))
  write('requests/12/request.lock.json', json({ graph: spec.graph, mark: spec.mark }))
  write('requests/12/layout.json', fs.readFileSync(path.join(prints, 'layout-A.json'), 'utf8'))
  commit(AGENT, 'Request 12: spec and default layout (attempt 1)', trailer(101))
  write('requests/12/notes.txt', 'a note\n')
  commit(PERSON, 'A person cannot add a session', trailer(999))
  git(PERSON, 'rm', '-q', 'requests/12/notes.txt')
  commit(PERSON, 'Remove the note')
  write('requests/12/layout.json', fs.readFileSync(path.join(prints, 'layout-B.json'), 'utf8'))
  commit(AGENT, 'Hide the grid, stretch y, move labels (attempt 2)', trailer(101))
})

test('locus bundle builds graph-12-v1 from the real render, touchcheck and guard output', () => {
  assert.strictEqual(pipeline(2), 0)
  const result = locus(['bundle', 'requests/12', '--out', 'out/12'], { CI_PIPELINE_ID: '777', CI_PROJECT_URL: PROJECT })
  assert.strictEqual(result.status, 0, result.stdout + result.stderr)
  assert.match(result.stdout, /graph-12-v1/)

  const dir = 'out/bundle/graph-12-v1'
  assert.deepStrictEqual(fs.readdirSync(path.join(repo, dir)).sort(),
    ['README.txt', 'description.txt', 'graph.stl', 'graph.svg', 'manifest.json', 'overlay.svg', 'touchcheck-report.json'])
  assert.ok(fs.existsSync(path.join(repo, 'out/bundle/graph-12-v1.zip')))

  const manifest = readJson(`${dir}/manifest.json`)
  assert.deepStrictEqual(validateManifest(manifest), [])
  assert.strictEqual(manifest.artifactId, 'graph-12-v1')
  assert.strictEqual(manifest.brailleId, 'G12')
  assert.strictEqual(manifest.sourceCommit, git(PERSON, 'rev-parse', 'HEAD'))
  assert.strictEqual(manifest.pipelineId, 777)
  assert.strictEqual(manifest.generatorVersion, generatorVersion)
  assert.deepStrictEqual(manifest.touchcheck, { pass: true, attempts: 2 })
  assert.deepStrictEqual(manifest.guards, { scope: true, maths: true, description: true })
  assert.strictEqual(manifest.releaseMode, 'hands-off')
  assert.strictEqual(manifest.releaseTag, null)
  // Both agent commits came from session 101; the person's trailer is not a session.
  assert.deepStrictEqual(manifest.agentSessions, [SESSION(101)])
  assert.match(result.stdout, /agent sessions: 1 \(from 2 agent commit\(s\)\)/)
  for (const f of ['graph.stl', 'graph.svg', 'description.txt']) {
    assert.strictEqual(manifest.hashes[f], sha256(`${dir}/${f}`), f)
    assert.strictEqual(manifest.hashes[f], sha256(`out/12/${f}`), f)
  }
  for (const f of ['touchcheck-report.json', 'overlay.svg']) assert.strictEqual(sha256(`${dir}/${f}`), sha256(`out/12/${f}`), f)
  assert.match(fs.readFileSync(path.join(repo, dir, 'README.txt'), 'utf8'), /100\.0 x 100\.0 x 3\.6 mm/)
})

test('once graph-12-v1 is tagged and the request is unchanged, there is nothing to bundle', () => {
  git(PERSON, 'tag', 'graph-12-v1')
  const result = locus(['bundle', 'requests/12', '--out', 'out/12'])
  assert.strictEqual(result.status, 0, result.stdout + result.stderr)
  assert.match(result.stdout, /unchanged since graph-12-v1/)
  assert.ok(!fs.existsSync(path.join(repo, 'out/bundle/graph-12-v2')))
})

test('a re-layout after a release becomes graph-12-v2', () => {
  write('requests/12/layout.json', JSON.stringify(JSON.parse(fs.readFileSync(path.join(prints, 'layout-B.json'), 'utf8'))) + '\n')
  commit(AGENT, 'Re-layout (attempt 3)', `Locus-Session: https://gitlab.example/other/project/-/automate/agent-sessions/5\n${trailer(202)}`)
  assert.strictEqual(pipeline(3), 0)
  const result = locus(['bundle', 'requests/12', '--out', 'out/12'], { CI_PROJECT_URL: PROJECT })
  assert.strictEqual(result.status, 0, result.stdout + result.stderr)
  const manifest = readJson('out/bundle/graph-12-v2/manifest.json')
  assert.strictEqual(manifest.artifactId, 'graph-12-v2')
  assert.deepStrictEqual(manifest.touchcheck, { pass: true, attempts: 3 })
  assert.strictEqual(manifest.pipelineId, 0)
  // Only the session that made v2, since the graph-12-v1 tag; a session of another project is left out, with a warning.
  assert.deepStrictEqual(manifest.agentSessions, [SESSION(202)])
  assert.match(result.stdout, /warning: .*not a session of this project: https:\/\/gitlab\.example\/other\/project/)
})

test('an agent commit without a Locus-Session trailer leaves agentSessions empty, with a warning', () => {
  git(PERSON, 'tag', 'graph-12-v2')
  write('requests/12/layout.json', JSON.stringify(JSON.parse(fs.readFileSync(path.join(prints, 'layout-B.json'), 'utf8')), null, 1) + '\n')
  commit(AGENT, 'Re-layout again (attempt 4)')
  assert.strictEqual(pipeline(4), 0)
  const result = locus(['bundle', 'requests/12', '--out', 'out/12'], { CI_PROJECT_URL: PROJECT })
  assert.strictEqual(result.status, 0, result.stdout + result.stderr)
  assert.deepStrictEqual(readJson('out/bundle/graph-12-v3/manifest.json').agentSessions, [])
  assert.match(result.stdout, /warning: 1 agent commit\(s\) since graph-12-v2 have no Locus-Session trailer/)
})

test('a graph that fails touchcheck is not bundled (exit 1)', () => {
  write('requests/12/layout.json', fs.readFileSync(path.join(prints, 'layout-A.json'), 'utf8'))
  commit(AGENT, 'Back to the default layout (attempt 5)')
  assert.strictEqual(pipeline(5), 1)
  const result = locus(['bundle', 'requests/12', '--out', 'out/12'])
  assert.strictEqual(result.status, 1)
  assert.match(result.stderr, /touchcheck failed \(attempt 5\)/)
  assert.ok(!fs.existsSync(path.join(repo, 'out/bundle/graph-12-v4')))
})

test('missing guard results fail closed (exit 2)', () => {
  const result = locus(['bundle', 'requests/12', '--out', 'out/12', '--guards', 'out/none'])
  assert.strictEqual(result.status, 2)
  assert.match(result.stderr, /scope\.json not found/)
})
