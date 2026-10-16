const test = require('node:test')
const assert = require('node:assert')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { execFileSync } = require('node:child_process')

const { listCommits } = require('./git')
const { agentOf } = require('./scope')

test('listCommits reads the committer as well as the author', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'locus-git-'))
  const env = { ...process.env }
  for (const k of Object.keys(env)) if (/^(GIT_|CI_)/.test(k)) delete env[k]
  const run = (args, extra = {}) => execFileSync('git', args, { cwd: dir, env: { ...env, ...extra }, encoding: 'utf8' }).trim()
  run(['init', '-q', '-b', 'main'])
  run(['-c', 'user.name=Person', '-c', 'user.email=person@example.org', 'commit', '-q', '--allow-empty', '-m', 'base'])
  const base = run(['rev-parse', 'HEAD'])
  fs.writeFileSync(path.join(dir, 'a.txt'), 'a\n')
  run(['add', 'a.txt'])
  run(['commit', '-q', '-m', 'agent commit with a person as author'], {
    GIT_AUTHOR_NAME: 'Mohammad Ashfaqul Hasan',
    GIT_AUTHOR_EMAIL: 'ashfaq@example.org',
    GIT_COMMITTER_NAME: 'ai-locus-ops-transcend',
    GIT_COMMITTER_EMAIL: 'service-account-2@noreply.gitlab.example'
  })

  const [c] = listCommits(base, 'HEAD', dir)
  assert.strictEqual(c.authorName, 'Mohammad Ashfaqul Hasan')
  assert.strictEqual(c.committerName, 'ai-locus-ops-transcend')
  assert.strictEqual(c.committerEmail, 'service-account-2@noreply.gitlab.example')
  assert.strictEqual(agentOf(c), 'locus-ops')
  assert.deepStrictEqual(c.paths, [{ status: 'A', path: 'a.txt' }])
  fs.rmSync(dir, { recursive: true, force: true })
})
