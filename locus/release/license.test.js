const test = require('node:test')
const assert = require('node:assert')
const path = require('path')

const { allowed, checkLicences, runtimePackages } = require('./license')

test('only permissive licences pass; an OR needs one allowed id, an AND needs all', () => {
  for (const ok of ['MIT', 'ISC', 'BSD-3-Clause', 'Apache-2.0', '(MIT OR GPL-3.0)', 'MIT AND ISC', { type: 'MIT' }]) assert.ok(allowed(ok), JSON.stringify(ok))
  for (const bad of ['GPL-3.0', 'AGPL-3.0-only', 'UNLICENSED', 'MIT AND GPL-3.0', '', null, undefined, { type: 'GPL-2.0' }]) assert.ok(!allowed(bad), JSON.stringify(bad))
})

test('runtime packages leave out dev dependencies and follow links to their folder', () => {
  const lock = {
    packages: {
      '': { name: 'root' },
      '../packages/modeling': { license: 'MIT' },
      'node_modules/@jscad/modeling': { resolved: '../packages/modeling', link: true },
      'node_modules/ajv': { version: '8.20.0' },
      'node_modules/ajv/node_modules/x': {},
      'node_modules/yaml': { dev: true }
    }
  }
  assert.deepStrictEqual(runtimePackages(lock, '/r').map((p) => [p.name, p.dir.split(path.sep).join('/')]), [
    ['@jscad/modeling', '/packages/modeling'],
    ['ajv', '/r/node_modules/ajv'],
    ['x', '/r/node_modules/ajv/node_modules/x']
  ])
})

test("Locus's own installed runtime dependencies all carry an allowed licence", () => {
  const results = checkLicences(path.join(__dirname, '..'))
  assert.ok(results.length >= 5)
  assert.deepStrictEqual(results.filter((r) => !r.pass), [])
  assert.ok(!results.some((r) => r.name === 'yaml'), 'dev dependency checked')
})
