const test = require('node:test')
const assert = require('node:assert')

const { latestReleases, failuresOf } = require('./shipped')

test('a shipped graph is the newest release tag graph-<iid>-v<n> of each request', () => {
  const tags = ['graph-12-v1', 'graph-12-v3', 'graph-12-v2', 'graph-7-v1', 'graph-0-v1', 'v1.0.0', 'graph-12-v0', 'graph-x-v1', 'graph-12-v2-rc']
  assert.deepStrictEqual(latestReleases(tags), [
    { requestId: 0, version: 1, tag: 'graph-0-v1' },
    { requestId: 7, version: 1, tag: 'graph-7-v1' },
    { requestId: 12, version: 3, tag: 'graph-12-v3' }
  ])
  assert.deepStrictEqual(latestReleases([]), [])
})

test('the failures of a touchcheck report are its failing results, as the report wrote them', () => {
  const report = {
    pass: false,
    results: [
      { rule: 'TL-1', pass: true },
      { rule: 'TL-5', pass: false, message: 'Too big for the printer / features too thin', measuredMm: 0.6, requiredMm: 1, at: [10, 20], allowedFixes: ['reduce-scale'] }
    ]
  }
  assert.deepStrictEqual(failuresOf(report), [
    { rule: 'TL-5', message: 'Too big for the printer / features too thin', measuredMm: 0.6, requiredMm: 1, at: [10, 20] }
  ])
})
