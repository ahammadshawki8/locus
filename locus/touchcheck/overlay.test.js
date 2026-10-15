const test = require('node:test')
const assert = require('node:assert')
const path = require('path')

const { touchcheck } = require('./index')
const { toOverlay } = require('./overlay')
const { render } = require('../core/render')

const root = path.join(__dirname, '..', '..')
const prints = path.join(root, 'tools', 'prints')
const spec = require(path.join(prints, 'spec.json'))
const layoutA = require(path.join(prints, 'layout-A.json'))
const layoutB = require(path.join(prints, 'layout-B.json'))
const profile = require('../core/profiles').loadProfile('fdm-handheld-v1')

const overlayFor = (l, id = 1) => {
  const { scene, svg } = render(spec, l, profile, { brailleIdNumber: id })
  const checked = touchcheck(JSON.parse(JSON.stringify(scene)), profile, { requested: spec.mark })
  return { ...checked, overlay: toOverlay(svg, scene, checked) }
}
const count = (text, pattern) => (text.match(pattern) || []).length

test('the overlay keeps the SVG preview and adds a red circle with the measured value at every violation', () => {
  const { results, overlay } = overlayFor(layoutA)
  assert.match(overlay, /^<svg [^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)
  assert.match(overlay, /<\/svg>\n$/)
  assert.match(overlay, /class="curve"/)
  assert.match(overlay, /data-mark="vertex"/)
  const located = results.flatMap((r) => r.violations).filter((v) => v.at)
  assert.strictEqual(count(overlay, /<circle class="violation"/g), located.length)
  assert.match(overlay, /Too close: 0 mm apart, needs 3\.2 mm/)
})

test('label and edge problems are circled in plain words', () => {
  const { overlay } = overlayFor(layoutA)
  assert.match(overlay, /Label -0\.6 mm from a line, needs 6\.4 mm/)
  assert.match(overlay, /2\.31 mm from the edge, needs 3 mm/)
  const overlapping = { ...layoutB, labelOffsets: { ...layoutB.labelOffsets, 'y-intercept': [32, 42] } }
  assert.match(overlayFor(overlapping, 2).overlay, /Labels overlap by/)
})

test('the overlay legend lists every rule in plain words and the limitation', () => {
  const { overlay } = overlayFor(layoutA)
  for (const id of ['TL-1', 'TL-2', 'TL-3', 'TL-4', 'TL-5']) assert.match(overlay, new RegExp(`${id} `))
  assert.match(overlay, /These lines are too close: a fingertip feels one line/)
  assert.match(overlay, /This label touches a line/)
  assert.match(overlay, /they do not certify that a learner can understand the graphic/)
  assert.match(overlay, /FAILED \(TL-1, TL-2, TL-5\)/)
})

test('print B: green passed checks and no red circles', () => {
  const { overlay } = overlayFor(layoutB, 2)
  assert.strictEqual(count(overlay, /<circle class="violation"/g), 0)
  assert.ok(count(overlay, /<circle class="passed"/g) > 0)
  assert.match(overlay, /PASSED/)
  assert.match(overlay, /mm apart, OK \(needs 3\.2 mm\)/)
})

test('overlay text is escaped and has no long dashes (H2)', () => {
  const { scene, svg } = render(spec, layoutA, profile)
  const checked = touchcheck(JSON.parse(JSON.stringify(scene)), profile, { requested: spec.mark })
  checked.results[3].violations.push({ message: 'Something requested is missing: <x> & "y"', measuredMm: null, requiredMm: null, at: null, subject: ['<x>'] })
  const overlay = toOverlay(svg, scene, checked)
  assert.ok(!overlay.includes('<x>'))
  assert.match(overlay, /&lt;x&gt; &amp; &quot;y&quot;/)
  for (const code of [0x2013, 0x2014, 0x2212]) assert.ok(!overlay.includes(String.fromCharCode(code)), `U+${code.toString(16)}`)
})
