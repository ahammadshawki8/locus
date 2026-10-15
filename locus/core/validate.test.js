const test = require('node:test')
const assert = require('node:assert')
const fs = require('fs')
const path = require('path')

const { validateSpec, validateLayout, checkLock } = require('./validate')

const root = path.join(__dirname, '..', '..')
const readJson = (...p) => JSON.parse(fs.readFileSync(path.join(root, ...p), 'utf8'))

const projectile = () => readJson('examples', 'projectile.json')

test('every example spec is valid', () => {
  const files = fs.readdirSync(path.join(root, 'examples')).filter((f) => f.endsWith('.json') && !f.endsWith('.layout.json'))
  assert.ok(files.length > 0)
  for (const f of files) assert.deepStrictEqual(validateSpec(readJson('examples', f)), [], f)
})

test('spec rejects degree 4', () => {
  const spec = projectile()
  spec.graph.coeffs = [1, 0, 0, 0, 0]
  assert.notDeepStrictEqual(validateSpec(spec), [])
})

test('spec rejects string coefficients (no expressions reach the evaluator)', () => {
  const spec = projectile()
  spec.graph.coeffs = ['process.exit()', 1]
  assert.notDeepStrictEqual(validateSpec(spec), [])
})

test('spec rejects out-of-bounds coefficients and domains', () => {
  const big = projectile()
  big.graph.coeffs = [1e6]
  assert.notDeepStrictEqual(validateSpec(big), [])
  const wide = projectile()
  wide.graph.domain.max = 1000
  assert.notDeepStrictEqual(validateSpec(wide), [])
})

test('spec rejects an empty or reversed domain', () => {
  const spec = projectile()
  spec.graph.domain = { min: 2, max: 2 }
  assert.deepStrictEqual(validateSpec(spec), ['/graph/domain min must be less than max'])
})

test('spec rejects unknown fields, marks and profiles', () => {
  assert.notDeepStrictEqual(validateSpec({ ...projectile(), extra: true }), [])
  assert.notDeepStrictEqual(validateSpec({ ...projectile(), mark: ['asymptote'] }), [])
  assert.deepStrictEqual(validateSpec({ ...projectile(), profileId: 'nope-v1' }), ['/profileId unknown profile "nope-v1"'])
})

test('layout schema accepts a typical layout and rejects extra keys', () => {
  const layout = { xScaleMm: 16, yScaleMm: 16, labelMode: 'inline', labelOffsets: { vertex: [0, 10.75] }, defaultLabelOffset: [4.5, 6], showGrid: false }
  assert.deepStrictEqual(validateLayout(layout), [])
  assert.notDeepStrictEqual(validateLayout({ ...layout, labelOffsets: { vertex: { dxMm: 0, dyMm: 8 } } }), [])
  const { defaultLabelOffset, ...noDefault } = layout
  assert.notDeepStrictEqual(validateLayout(noDefault), [])
  assert.notDeepStrictEqual(validateLayout({ ...layout, coeffs: [1] }), [])
  assert.notDeepStrictEqual(validateLayout({ ...layout, xScaleMm: 0 }), [])
})

test('checkLock detects any change to the locked maths', () => {
  const spec = projectile()
  const lock = { graph: spec.graph, mark: spec.mark }
  assert.deepStrictEqual(checkLock(spec, lock), [])
  const changed = projectile()
  changed.graph.coeffs[3] = 2
  assert.deepStrictEqual(checkLock(changed, lock), ['/graph differs from request.lock.json'])
})

test('spec rejects a vertex mark on a graph that is not a quadratic', () => {
  const cubic = projectile()
  cubic.graph.coeffs = [1, 0, -1, 0]
  assert.deepStrictEqual(validateSpec(cubic), ['/mark "vertex" needs a quadratic; use "turning-points"'])
})

test('spec rejects x-intercepts together with x-intercept+ or x-intercept- (same points twice)', () => {
  assert.deepStrictEqual(validateSpec({ ...projectile(), mark: ['x-intercepts', 'x-intercept+'] }), ['/mark "x-intercepts" already marks every x-intercept; drop "x-intercept+" / "x-intercept-"'])
})

test('the prints specs and layouts are valid requests', () => {
  for (const f of ['spec.json', 'spec-C.json']) assert.deepStrictEqual(validateSpec(readJson('tools', 'prints', f)), [], f)
  for (const f of ['layout-A.json', 'layout-B.json', 'layout-C.json']) assert.deepStrictEqual(validateLayout(readJson('tools', 'prints', f)), [], f)
})
