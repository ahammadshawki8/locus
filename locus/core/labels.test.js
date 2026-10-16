const test = require('node:test')
const assert = require('node:assert')
const path = require('path')

const { buildScene } = require('./scene')
const { labelText } = require('./labels')
const { toBraille } = require('./braille')
const { loadProfile } = require('./profiles')

const prints = path.join(__dirname, '..', '..', 'tools', 'prints')
const spec = require(path.join(prints, 'spec.json'))
const layoutA = require(path.join(prints, 'layout-A.json'))
const layoutB = require(path.join(prints, 'layout-B.json'))
const profile = loadProfile('fdm-handheld-v1')
const near = (a, b, eps = 1e-9) => Math.abs(a - b) < eps
const centre = (l) => [(l.box[0] + l.box[2]) / 2, (l.box[1] + l.box[3]) / 2]

test('key row text: the value a reader needs for each kind of mark, rounded to 2 decimals', () => {
  assert.strictEqual(labelText({ mark: 'vertex', x: 2, y: 3 }), '2,3')
  assert.strictEqual(labelText({ mark: 'turning-points', x: -1, y: 0.5 }), '-1,0.5')
  assert.strictEqual(labelText({ mark: 'y-intercept', x: 0, y: 1 }), '1')
  assert.strictEqual(labelText({ mark: 'x-intercept+', x: 2 + Math.sqrt(6), y: 0 }), '4.45')
  assert.strictEqual(labelText({ mark: 'x-intercepts', x: -1e-12, y: 0 }), '0')
})

test('each marked point gets a letter in requested order, centred at the default offset (print A)', () => {
  const scene = buildScene(spec, layoutA, profile)
  const marks = scene.labels.filter((l) => l.kind === 'mark')
  assert.deepStrictEqual(marks.map((l) => [l.for, l.text, l.braille]), [
    ['vertex', 'a', toBraille('a')], ['y-intercept', 'b', toBraille('b')], ['x-intercept+', 'c', toBraille('c')]
  ])
  for (const label of marks) {
    const mark = scene.marks.find((m) => m.id === label.for)
    const [cx, cy] = centre(label)
    assert.ok(near(cx, mark.xMm + layoutA.defaultLabelOffset[0]) && near(cy, mark.yMm + layoutA.defaultLabelOffset[1]))
    for (const [x, y] of label.dots) assert.ok(x > label.box[0] && x < label.box[2] && y > label.box[1] && y < label.box[3])
  }
})

test('labelOffsets move a label from the point (print B)', () => {
  const scene = buildScene(spec, layoutB, profile)
  for (const [id, [dx, dy]] of Object.entries(layoutB.labelOffsets)) {
    const label = scene.labels.find((l) => l.for === id)
    const mark = scene.marks.find((m) => m.id === id)
    const [cx, cy] = centre(label)
    assert.ok(near(cx, mark.xMm + dx) && near(cy, mark.yMm + dy), id)
  }
})

test('the braille ID is the number sign + issue number, 6 mm in from the top-right corner', () => {
  const scene = buildScene({ ...spec, requestId: 12 }, layoutA, profile)
  const id = scene.labels.find((l) => l.kind === 'braille-id')
  assert.strictEqual(id.text, '12')
  assert.strictEqual(id.braille, toBraille('12'))
  assert.strictEqual(id.braille[0], toBraille('1')[0]) // number sign first
  assert.ok(near(id.box[2], 100 - 6) && near(id.box[3], 100 - 6))
})

test('key mode adds a key in the bottom-left corner: one row per letter with its value', () => {
  const scene = buildScene(spec, { ...layoutB, labelMode: 'key' }, profile)
  assert.deepStrictEqual(scene.key.entries, [
    { letter: 'a', for: 'vertex', text: '2,3' }, { letter: 'b', for: 'y-intercept', text: '1' }, { letter: 'c', for: 'x-intercept+', text: '4.45' }
  ])
  const rows = scene.labels.filter((l) => l.kind === 'key')
  assert.deepStrictEqual(rows.map((l) => l.text), ['a 2,3', 'b 1', 'c 4.45'])
  assert.ok(rows[0].box[1] > rows[1].box[1] && rows[1].box[1] > rows[2].box[1]) // read top to bottom
  assert.ok(rows.every((l) => near(l.box[0], 6)))
  assert.ok(near(rows[2].box[1], 6))
  // the point letters stay where they were
  assert.deepStrictEqual(scene.labels.filter((l) => l.kind === 'mark'), buildScene(spec, layoutB, profile).labels.filter((l) => l.kind === 'mark'))
})
