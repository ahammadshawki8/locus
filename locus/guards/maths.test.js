const test = require('node:test')
const assert = require('node:assert')
const path = require('path')

const { checkMaths, checkLockHistory } = require('./maths')
const { buildScene } = require('../core/scene')
const { loadProfile } = require('../core/profiles')

const prints = path.join(__dirname, '..', '..', 'tools', 'prints')
const spec = require(path.join(prints, 'spec.json'))
const specC = require(path.join(prints, 'spec-C.json'))
const layoutB = require(path.join(prints, 'layout-B.json'))
const layoutC = require(path.join(prints, 'layout-C.json'))
const profile = loadProfile('fdm-handheld-v1')

const lockOf = (s) => ({ graph: s.graph, mark: s.mark })
const sceneOf = (s, l) => JSON.parse(JSON.stringify(buildScene(s, l, profile)))
const clone = (o) => JSON.parse(JSON.stringify(o))

test('prints B and C: spec matches the lock and everything plotted is on the locked polynomial', () => {
  for (const [s, l] of [[spec, layoutB], [specC, layoutC]]) {
    assert.deepStrictEqual(checkMaths({ spec: s, lock: lockOf(s), scene: sceneOf(s, l), layout: l }), { pass: true, errors: [] })
  }
})

test('a spec that differs from its lock fails', () => {
  const changed = clone(spec)
  changed.graph.coeffs[3] = 2
  const { errors } = checkMaths({ spec: changed, lock: lockOf(spec), scene: sceneOf(spec, layoutB), layout: layoutB })
  assert.deepStrictEqual(errors, ['spec.json graph differs from request.lock.json'])
})

test('a scene rendered from other maths than the lock fails, point by point', () => {
  const other = clone(spec)
  other.graph.coeffs[3] = 1.5 // the whole curve 0.5 units higher
  const { errors } = checkMaths({ spec, lock: lockOf(spec), scene: sceneOf(other, layoutB), layout: layoutB })
  assert.ok(errors.some((e) => /curve point 0 is .* mm off the locked polynomial/.test(e)))
  assert.ok(errors.some((e) => /mark vertex is not on the locked curve/.test(e)))
})

test('a curve cut short of the locked domain fails', () => {
  const scene = sceneOf(spec, layoutB)
  scene.lines.find((l) => l.kind === 'curve').points.pop()
  assert.ok(checkMaths({ spec, lock: lockOf(spec), scene, layout: layoutB }).errors.some((e) => /not the locked domain/.test(e)))
})

test('a mark moved off its point fails, even if it is drawn where it claims to be', () => {
  const scene = sceneOf(spec, layoutB)
  const vertex = scene.marks.find((m) => m.id === 'vertex')
  vertex.x += 0.1
  vertex.y = 3 - 0.005 // on the curve, but not the top
  vertex.xMm = scene.origin[0] + vertex.x * layoutB.xScaleMm
  vertex.yMm = scene.origin[1] + vertex.y * layoutB.yScaleMm
  assert.deepStrictEqual(checkMaths({ spec, lock: lockOf(spec), scene, layout: layoutB }).errors, ['mark vertex is not where the slope is 0'])
})

test('lock history: written once in the first commit passes; any later change fails', () => {
  assert.deepStrictEqual(checkLockHistory({ existedAtBase: false, touchedBy: ['a1'], firstCommit: 'a1' }), [])
  assert.match(checkLockHistory({ existedAtBase: false, touchedBy: ['a1', 'b2'], firstCommit: 'a1' })[0], /changed after its first commit \(b2\)/)
  assert.match(checkLockHistory({ existedAtBase: false, touchedBy: ['b2'], firstCommit: 'a1' })[0], /first commit, not in b2/)
  assert.match(checkLockHistory({ existedAtBase: true, touchedBy: ['c3'], firstCommit: 'a1' })[0], /changed after it was first committed/)
  assert.deepStrictEqual(checkLockHistory({ existedAtBase: true, touchedBy: [], firstCommit: 'a1' }), [])
})
