const test = require('node:test')
const assert = require('node:assert')
const path = require('path')

const { buildScene } = require('./scene')
const { labelText } = require('./labels')
const { toBraille } = require('./braille')

const root = path.join(__dirname, '..', '..')
const spec = require(path.join(root, 'examples', 'projectile.json'))
const layout = require(path.join(root, 'examples', 'projectile.layout.json'))
const profile = require('./profiles/fdm-3d-v1.json')
const gap = profile.rules['TL-2'].minLabelGapMm
const near = (a, b, eps = 1e-9) => Math.abs(a - b) < eps

test('label text: the value a reader needs for each kind of mark, rounded to 2 decimals', () => {
  assert.strictEqual(labelText({ mark: 'vertex', x: 2, y: 3 }), '2,3')
  assert.strictEqual(labelText({ mark: 'turning-points', x: -1, y: 0.5 }), '-1,0.5')
  assert.strictEqual(labelText({ mark: 'y-intercept', x: 0, y: 1 }), '1')
  assert.strictEqual(labelText({ mark: 'x-intercept+', x: 2 + Math.sqrt(6), y: 0 }), '4.45')
  assert.strictEqual(labelText({ mark: 'x-intercepts', x: -1e-12, y: 0 }), '0')
})

test('inline mode: one braille label per mark, up and right of the dot by the TL-2 gap', () => {
  const scene = buildScene(spec, layout, profile)
  assert.strictEqual(scene.labelMode, 'inline')
  assert.strictEqual(scene.key, null)
  assert.deepStrictEqual(scene.labels.map((l) => [l.kind, l.for, l.text]), [
    ['mark', 'vertex', '2,3'], ['mark', 'y-intercept', '1'], ['mark', 'x-intercept+', '4.45']
  ])
  for (const label of scene.labels) {
    const mark = scene.marks.find((m) => m.id === label.for)
    const r = mark.diameterMm / 2
    assert.strictEqual(label.braille, toBraille(label.text))
    assert.ok(near(label.xMm, mark.xMm + r + gap) && near(label.yMm, mark.yMm + r + gap))
    for (const [x, y] of label.dots) {
      assert.ok(x > label.xMm && x < label.xMm + label.widthMm && y > label.yMm && y < label.yMm + label.heightMm)
    }
  }
})

test('labelOffsets move a label (and its dots) from its default place', () => {
  const plain = buildScene(spec, layout, profile).labels.find((l) => l.for === 'vertex')
  const moved = buildScene(spec, { ...layout, labelOffsets: { vertex: { dxMm: -20, dyMm: -15 } } }, profile).labels.find((l) => l.for === 'vertex')
  assert.ok(near(moved.xMm, plain.xMm - 20) && near(moved.yMm, plain.yMm - 15))
  assert.ok(near(moved.dots[0][0], plain.dots[0][0] - 20))
})

test('key mode: each mark gets a letter, and a key below the plot lists letter and value', () => {
  const scene = buildScene(spec, { ...layout, labelMode: 'key' }, profile)
  assert.strictEqual(scene.labelMode, 'key')
  const marks = scene.labels.filter((l) => l.kind === 'mark')
  assert.deepStrictEqual(marks.map((l) => l.text), ['a', 'b', 'c'])
  assert.deepStrictEqual(scene.key.entries, [
    { letter: 'a', for: 'vertex', text: '2,3' }, { letter: 'b', for: 'y-intercept', text: '1' }, { letter: 'c', for: 'x-intercept+', text: '4.45' }
  ])
  const rows = scene.labels.filter((l) => l.kind === 'key')
  assert.deepStrictEqual(rows.map((l) => l.text), ['a 2,3', 'b 1', 'c 4.45'])
  // rows read top to bottom, start at the left margin, and sit clear of every raised line and mark by the TL-2 gap
  assert.ok(rows[0].yMm > rows[1].yMm && rows[1].yMm > rows[2].yMm)
  assert.ok(rows.every((l) => near(l.xMm, profile.geometry.marginMm)))
  const lowest = Math.min(
    ...scene.lines.flatMap((l) => l.points.map(([, y]) => y - l.widthMm / 2)),
    ...scene.marks.map((m) => m.yMm - m.diameterMm / 2)
  )
  assert.ok(rows[0].yMm + rows[0].heightMm <= lowest - gap + 1e-9)
})

test('key mode makes the plate taller by the key, and keeps the plot itself the same size', () => {
  const inline = buildScene(spec, layout, profile)
  const keyed = buildScene(spec, { ...layout, labelMode: 'key' }, profile)
  assert.ok(keyed.plate.heightMm > inline.plate.heightMm)
  assert.strictEqual(keyed.plate.widthMm, inline.plate.widthMm)
  const span = (s) => { const c = s.lines.find((l) => l.id === 'curve').points; return c[c.length - 1][0] - c[0][0] }
  assert.strictEqual(span(keyed), span(inline))
})
