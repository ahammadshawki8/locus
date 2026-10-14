const test = require('node:test')
const assert = require('node:assert')
const path = require('path')

const { touchcheck } = require('./index')
const { toOverlay } = require('./overlay')
const { render } = require('../core/render')

const root = path.join(__dirname, '..', '..')
const spec = require(path.join(root, 'examples', 'projectile.json'))
const layout = require(path.join(root, 'examples', 'projectile.layout.json'))
const profile = require('../core/profiles/fdm-3d-v1.json')

const overlayFor = (l) => {
  const { scene, svg } = render(spec, l, profile)
  const checked = touchcheck(JSON.parse(JSON.stringify(scene)), profile, { requested: spec.mark })
  return { ...checked, overlay: toOverlay(svg, scene, checked) }
}
const count = (text, pattern) => (text.match(pattern) || []).length

test('the overlay keeps the SVG preview and adds a red circle with the measured value at every violation', () => {
  const { report, overlay } = overlayFor(layout)
  assert.match(overlay, /^<svg [^>]*xmlns="http:\/\/www.w3.org\/2000\/svg"/)
  assert.match(overlay, /<\/svg>\n$/)
  assert.match(overlay, /class="curve"/)
  assert.match(overlay, /data-mark="vertex"/)
  const located = report.rules.flatMap((r) => r.violations).filter((v) => v.at)
  assert.strictEqual(count(overlay, /<circle class="violation"/g), located.length)
  assert.match(overlay, /1\.53 mm apart — needs 3\.2 mm/)
  assert.match(overlay, /0 mm apart — needs 3\.2 mm/)
})

test('label problems are circled in plain words: too close to a line, off the plate, overlapping', () => {
  const { overlay } = overlayFor(layout)
  assert.match(overlay, /Label 0 mm from a line — needs 6\.4 mm/)
  assert.match(overlay, /Label off the plate by 4\.52 mm/)
  const tl3 = require(path.join(root, 'fixtures', 'touchcheck', 'tl3-labels-overlap', 'layout.json'))
  assert.match(overlayFor(tl3).overlay, /Labels overlap by 1\.78 mm/)
})

test('the overlay legend lists every rule in plain words and the limitation', () => {
  const { overlay } = overlayFor(layout)
  for (const id of ['TL-1', 'TL-2', 'TL-3', 'TL-4', 'TL-5']) assert.match(overlay, new RegExp(`${id} `))
  assert.match(overlay, /These lines are too close: a fingertip feels one line/)
  assert.match(overlay, /This label touches a line/)
  assert.match(overlay, /do not certify that a reader will understand this graphic by touch/)
  assert.match(overlay, /FAILED/)
})

test('after allowed fixes the overlay shows green passed checks and no red circles', () => {
  const { overlay } = overlayFor(require(path.join(root, 'fixtures', 'touchcheck', 'good-projectile-key', 'layout.json')))
  assert.strictEqual(count(overlay, /<circle class="violation"/g), 0)
  assert.ok(count(overlay, /<circle class="passed"/g) > 0)
  assert.match(overlay, /PASSED/)
  assert.match(overlay, /mm apart — OK, needs 3\.2 mm/)
})

test('overlay text is escaped', () => {
  const { scene, svg } = render(spec, layout, profile)
  const checked = touchcheck(JSON.parse(JSON.stringify(scene)), profile, { requested: spec.mark })
  checked.report.rules[3].violations.push({ message: 'Something requested is missing: <x> & "y"', measuredMm: null, requiredMm: null, at: null, subject: ['<x>'] })
  const overlay = toOverlay(svg, scene, checked)
  assert.ok(!overlay.includes('<x>'))
  assert.match(overlay, /&lt;x&gt; &amp; &quot;y&quot;/)
})
