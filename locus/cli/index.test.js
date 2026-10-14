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

test('touchcheck on the rendered projectile writes the report and overlay and exits 1 (TL-1 fails)', () => {
  const out = tmp()
  assert.strictEqual(run('examples/projectile.json', '--out', out).status, 0)
  const result = run('touchcheck', 'examples/projectile.json', '--out', out)
  assert.strictEqual(result.status, 1, result.stderr)
  assert.match(result.stdout, /TL-1 failed/)
  const report = readJson(path.join(out, 'touchcheck-report.json'))
  assert.deepStrictEqual(validateTouchcheckReport(report), [])
  assert.strictEqual(report.passed, false)
  assert.match(fs.readFileSync(path.join(out, 'overlay.svg'), 'utf8'), /<circle class="violation"/)
})

test('touchcheck on a request folder whose layout uses only allowed fixes exits 0', () => {
  const request = tmp()
  const out = path.join(request, 'out')
  fs.copyFileSync(path.join(root, 'examples', 'projectile.json'), path.join(request, 'spec.json'))
  const layout = { ...readJson(path.join(root, 'examples', 'projectile.layout.json')), showGrid: false, yScaleMm: 40 }
  fs.writeFileSync(path.join(request, 'layout.json'), JSON.stringify(layout))
  assert.strictEqual(run(request, '--out', out).status, 0)
  const result = run('touchcheck', request, '--out', out)
  assert.strictEqual(result.status, 0, result.stdout + result.stderr)
  assert.strictEqual(readJson(path.join(out, 'touchcheck-report.json')).passed, true)
})

test('touchcheck before render explains what to run and exits 2', () => {
  const result = run('touchcheck', 'examples/projectile.json', '--out', tmp())
  assert.strictEqual(result.status, 2)
  assert.match(result.stderr, /scene\.json not found/)
})
