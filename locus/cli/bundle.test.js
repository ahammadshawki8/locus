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

const AGENT = { GIT_AUTHOR_NAME: 'ai-locus-request-transcend', GIT_AUTHOR_EMAIL: 'ai-locus-request-transcend@noreply.example' }
const PERSON = { GIT_AUTHOR_NAME: 'A Person', GIT_AUTHOR_EMAIL: 'person@example.org' }
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
const commit = (who, message) => {
  git(who, 'add', '-A')
  git(who, 'commit', '-q', '-m', message)
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
  commit(AGENT, 'Request 12: spec and default layout (attempt 1)')
  write('requests/12/layout.json', fs.readFileSync(path.join(prints, 'layout-B.json'), 'utf8'))
  commit(AGENT, 'Hide the grid, stretch y, move labels (attempt 2)')
})

test('locus bundle builds graph-12-v1 from the real render, touchcheck and guard output', () => {
  assert.strictEqual(pipeline(2), 0)
  const result = locus(['bundle', 'requests/12', '--out', 'out/12'], { CI_PIPELINE_ID: '777' })
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
  commit(AGENT, 'Re-layout (attempt 3)')
  assert.strictEqual(pipeline(3), 0)
  const result = locus(['bundle', 'requests/12', '--out', 'out/12'])
  assert.strictEqual(result.status, 0, result.stdout + result.stderr)
  const manifest = readJson('out/bundle/graph-12-v2/manifest.json')
  assert.strictEqual(manifest.artifactId, 'graph-12-v2')
  assert.deepStrictEqual(manifest.touchcheck, { pass: true, attempts: 3 })
  assert.strictEqual(manifest.pipelineId, 0)
})

test('a graph that fails touchcheck is not bundled (exit 1)', () => {
  write('requests/12/layout.json', fs.readFileSync(path.join(prints, 'layout-A.json'), 'utf8'))
  commit(AGENT, 'Back to the default layout (attempt 4)')
  assert.strictEqual(pipeline(4), 1)
  const result = locus(['bundle', 'requests/12', '--out', 'out/12'])
  assert.strictEqual(result.status, 1)
  assert.match(result.stderr, /touchcheck failed \(attempt 4\)/)
  assert.ok(!fs.existsSync(path.join(repo, 'out/bundle/graph-12-v3')))
})

test('missing guard results fail closed (exit 2)', () => {
  const result = locus(['bundle', 'requests/12', '--out', 'out/12', '--guards', 'out/none'])
  assert.strictEqual(result.status, 2)
  assert.match(result.stderr, /scope\.json not found/)
})
