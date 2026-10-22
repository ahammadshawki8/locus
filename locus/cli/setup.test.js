const test = require('node:test')
const assert = require('node:assert')

const { steps, nodeOk } = require('./setup')

test('setup installs, checks the flows, renders and touch-checks a shipped graph, then runs doctor', () => {
  const names = steps([]).map((s) => s.name)
  assert.deepStrictEqual(names, ['install', 'flows', 'render', 'touchcheck', 'doctor'])
  const touch = steps([]).find((s) => s.name === 'touchcheck')
  assert.deepStrictEqual(touch.args.slice(1), ['touchcheck', 'requests/4/', '--out', 'out/setup-graph-4'])
})

test('--test adds the full test suite; --project is passed on to doctor', () => {
  const s = steps(['--test', '--project', 'group/locus'])
  assert.ok(s.some((x) => x.name === 'tests'))
  assert.deepStrictEqual(s.find((x) => x.name === 'doctor').args.slice(-2), ['--project', 'group/locus'])
})

test('Node 20 or later is required', () => {
  assert.strictEqual(nodeOk('v20.11.0'), true)
  assert.strictEqual(nodeOk('v24.12.0'), true)
  assert.strictEqual(nodeOk('v18.19.0'), false)
})
