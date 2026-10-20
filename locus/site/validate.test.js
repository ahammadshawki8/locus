const test = require('node:test')
const assert = require('node:assert')

const { validateSite } = require('./validate')
const { sha256 } = require('../core/bundle')

const stl = Buffer.from('solid g')
const site = (over = {}) => ({
  '/build-info.json': JSON.stringify({ commit: 'abc', graphs: ['graph-7-v1'] }),
  '/': '<html>',
  '/graphs/graph-7-v1/': '<html>',
  '/graphs/graph-7-v1/manifest.json': JSON.stringify({ hashes: { 'graph.stl': sha256(stl) } }),
  '/graphs/graph-7-v1/graph.stl': stl,
  ...over
})

const serve = (files) => async (url) => {
  const body = files[url.replace('https://staging.example', '')]
  if (body === undefined) return { ok: false, status: 404 }
  return { ok: true, status: 200, arrayBuffer: async () => Buffer.from(body) }
}

test('a site built from this commit, with every page and hash right, passes', async () => {
  const r = await validateSite('https://staging.example/', { expectCommit: 'abc', fetchImpl: serve(site()) })
  assert.strictEqual(r.pass, true, JSON.stringify(r.checks))
  assert.strictEqual(r.checks.length, 5)
})

test('an old build, a missing page or a changed file each fail with what went wrong', async () => {
  const old = await validateSite('https://staging.example', { expectCommit: 'def', fetchImpl: serve(site()) })
  assert.deepStrictEqual(old.checks.filter((c) => !c.pass).map((c) => c.what), ['the site was built from this commit'])
  const missing = await validateSite('https://staging.example', { fetchImpl: serve(site({ '/graphs/graph-7-v1/': undefined })) })
  assert.deepStrictEqual(missing.checks.filter((c) => !c.pass).map((c) => [c.what, c.detail]), [['graph-7-v1: page loads', 'HTTP 404']])
  const changed = await validateSite('https://staging.example', { fetchImpl: serve(site({ '/graphs/graph-7-v1/graph.stl': 'other' })) })
  assert.deepStrictEqual(changed.checks.filter((c) => !c.pass).map((c) => c.what), ['graph-7-v1: graph.stl matches its manifest hash'])
  const down = await validateSite('https://staging.example', { fetchImpl: serve({}) })
  assert.deepStrictEqual(down, { pass: false, checks: [{ what: 'build-info.json loads', pass: false, detail: 'HTTP 404' }] })
})
