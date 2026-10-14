const test = require('node:test')
const assert = require('node:assert')
const path = require('path')
const { measurements } = require('@jscad/modeling')

const { render } = require('./render')
const { toBinaryStl, readTriangleCount, countOpenEdges } = require('./stl')

const root = path.join(__dirname, '..', '..')
const spec = require(path.join(root, 'examples', 'projectile.json'))
const layout = require(path.join(root, 'examples', 'projectile.layout.json'))

test('render produces a printable STL, an SVG preview and a description from one scene', () => {
  const out = render(spec, layout)
  assert.ok(readTriangleCount(out.stl) > 100)
  const { widthMm, heightMm } = out.scene.plate
  assert.match(out.svg, new RegExp(`width="${widthMm}mm" height="${heightMm}mm"`))
  assert.match(out.svg, /class="curve"/)
  assert.match(out.svg, /data-mark="vertex"/)
  assert.match(out.description, /vertex/)
})

test('render bounding box is the plate, plus any braille label that runs off it (TL-2 reports that)', () => {
  const out = render(spec, layout)
  const [[x0, y0, z0], [x1, y1]] = out.bounds
  const { widthMm, heightMm } = out.scene.plate
  const dotEdges = out.scene.labels.flatMap((l) => l.dots.map(([x, y]) => [x + l.dotDiameterMm / 2, y + l.dotDiameterMm / 2]))
  assert.ok(Math.abs(x0) < 1e-6 && Math.abs(y0) < 1e-6 && Math.abs(z0) < 1e-6)
  assert.ok(Math.abs(x1 - Math.max(widthMm, ...dotEdges.map(([x]) => x))) < 1e-6)
  assert.ok(Math.abs(y1 - Math.max(heightMm, ...dotEdges.map(([, y]) => y))) < 1e-6)
  const { bedMm } = require('./profiles/fdm-3d-v1.json')
  assert.ok(x1 <= bedMm.x && y1 <= bedMm.y)
})

test('every printed shell is watertight (no open edges), braille dots included', () => {
  for (const labelMode of ['inline', 'key']) {
    const out = render(spec, { ...layout, showGrid: true, labelMode })
    const dots = out.scene.labels.reduce((n, l) => n + l.dots.length, 0)
    assert.ok(dots > 0)
    assert.strictEqual(out.solids.length, 1 + out.scene.lines.length + out.scene.marks.length + dots)
    out.solids.forEach((solid, i) => assert.strictEqual(countOpenEdges(toBinaryStl(solid)), 0, `${labelMode} shell ${i}`))
  }
})

test('braille dots are domes that rise the profile dot height above the plate', () => {
  const out = render(spec, layout)
  const { baseThicknessMm, braille } = require('./profiles/fdm-3d-v1.json').geometry
  const dotShells = out.solids.slice(1 + out.scene.lines.length + out.scene.marks.length)
  assert.ok(dotShells.length > 0)
  for (const shell of dotShells) {
    const [[, , z0], [, , z1]] = measurements.measureBoundingBox(shell)
    assert.ok(Math.abs(z1 - (baseThicknessMm + braille.dotHeightMm)) < 1e-6)
    assert.ok(z0 < baseThicknessMm) // the lower half sits inside the plate
  }
})

test('the SVG preview draws every braille dot and carries the print text for sighted helpers', () => {
  const out = render(spec, { ...layout, labelMode: 'key' })
  for (const label of out.scene.labels) {
    const open = `<g class="braille" data-label="${label.id}">`
    const start = out.svg.indexOf(open)
    assert.ok(start >= 0, label.id)
    const group = out.svg.slice(start, out.svg.indexOf('</g>', start))
    assert.strictEqual((group.match(/<circle/g) || []).length, label.dots.length)
    assert.ok(group.includes(`<title>${label.text}</title>`))
  }
})
