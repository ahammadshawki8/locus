const test = require('node:test')
const assert = require('node:assert')
const { spawnSync } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

const { validateTouchcheckReport } = require('../core/validate')

const root = path.join(__dirname, '..', '..')
const cli = path.join(__dirname, 'index.js')
const run = (...args) => spawnSync(process.execPath, [cli, ...args], { cwd: root, encoding: 'utf8' })
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'locus-cli-'))
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'))
const logReport = (stdout) => JSON.parse(stdout.split('\n').find((l) => l.startsWith('LOCUS_REPORT ')).slice('LOCUS_REPORT '.length))

test('the demo request at the default layout (print A) fails touchcheck: report, overlay and LOCUS_REPORT line, exit 1', () => {
  const out = tmp()
  assert.strictEqual(run('examples/projectile.json', '--out', out).status, 0)
  const result = run('touchcheck', 'examples/projectile.json', '--out', out)
  assert.strictEqual(result.status, 1, result.stderr)
  assert.match(result.stdout, /TL-1 failed/)
  const report = readJson(path.join(out, 'touchcheck-report.json'))
  assert.deepStrictEqual(validateTouchcheckReport(report), [])
  assert.strictEqual(report.pass, false)
  assert.strictEqual(report.attempt, 1)
  assert.deepStrictEqual(logReport(result.stdout), report)
  assert.match(fs.readFileSync(path.join(out, 'overlay.svg'), 'utf8'), /<circle class="violation"/)
})

test('touchcheck on a request folder at print B passes and records the attempt number', () => {
  const request = path.join('fixtures', 'touchcheck', 'good-print-b')
  const out = tmp()
  assert.strictEqual(run(request, '--out', out).status, 0)
  const result = run('touchcheck', request, '--out', out, '--attempt', '2')
  assert.strictEqual(result.status, 0, result.stdout + result.stderr)
  const report = readJson(path.join(out, 'touchcheck-report.json'))
  assert.strictEqual(report.pass, true)
  assert.strictEqual(report.attempt, 2)
  assert.deepStrictEqual(logReport(result.stdout), report)
})

test('touchcheck before render explains what to run and exits 2', () => {
  const result = run('touchcheck', 'examples/projectile.json', '--out', tmp())
  assert.strictEqual(result.status, 2)
  assert.match(result.stderr, /scene\.json not found/)
})

test('a bad --attempt is refused', () => {
  assert.strictEqual(run('touchcheck', 'examples/projectile.json', '--attempt', '0').status, 64)
})
