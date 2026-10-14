// overlay.svg: the SVG preview with every touchcheck result drawn on it. Red circle + plain words + measured value at
// each violation, green for checks that passed, and a legend below the plate listing all five rules.
const RED = '#c62828'
const GREEN = '#2e7d32'
const GREY = '#555555'
const FONT = 3 // mm
const LINE = 4.2 // legend line height, mm
const CIRCLE_R = 5
const PAD = 4
const CHAR_W = 0.56 // average glyph width as a fraction of the font size
const LIMITATION = 'Automated checks measure spacing and completeness. They do not certify that a reader will understand this graphic by touch.'

const round = (v) => Math.round(v * 100) / 100
const escapeXml = (text) => String(text).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c])
const textWidth = (text, size = FONT) => text.length * size * CHAR_W

const measureText = (ruleId, v) => {
  if (v.measuredMm == null) return ''
  if (ruleId === 'TL-1') return `${v.measuredMm} mm apart — needs ${v.requiredMm} mm`
  return `${v.measuredMm} mm — ${v.subject && v.subject[0] === 'plate' ? 'bed is' : 'needs'} ${v.requiredMm} mm`
}
const shortText = (ruleId, v) => {
  const head = ruleId === 'TL-1' ? 'Too close' : ruleId === 'TL-4' ? `Missing: ${(v.subject || []).join(', ')}` : v.message.split(':')[0]
  const measure = measureText(ruleId, v)
  return measure ? `${head}: ${measure}` : head
}
const subjectText = (v) => (v.subject || []).join(v.subject && v.subject.length === 2 ? ' and ' : ', ')

/** Place each label next to its circle without covering other labels or circles, inside the box [0, maxX] x [0, maxY]. */
const placeLabels = (spots, maxX, maxY) => {
  const boxes = spots.map((s) => [s.x - s.r, s.y - s.r, s.x + s.r, s.y + s.r])
  const overlaps = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3]
  const height = FONT * 1.25
  return spots.map((s) => {
    const w = textWidth(s.text)
    const candidates = []
    for (let k = 0; k <= 12; k++) {
      const shift = Math.ceil(k / 2) * LINE * (k % 2 ? -1 : 1)
      candidates.push(
        [s.x + s.r + 1, s.y - height / 2 + shift],
        [s.x - s.r - 1 - w, s.y - height / 2 + shift],
        [s.x - w / 2, s.y - s.r - 1 - height - k * LINE],
        [s.x - w / 2, s.y + s.r + 1 + k * LINE]
      )
    }
    const inside = candidates.filter(([x, y]) => x >= 0 && y >= 0 && x + w <= maxX && y + height <= maxY)
    const free = inside.find(([x, y]) => !boxes.some((b) => overlaps(b, [x, y, x + w, y + height])))
    const [x, y] = free || inside[0] || candidates[0]
    boxes.push([x, y, x + w, y + height])
    return { ...s, box: [x, y, x + w, y + height] }
  })
}

const drawSpot = (s, cls) => {
  const [x0, y0, x1, y1] = s.box
  const nx = Math.min(Math.max(s.x, x0), x1)
  const ny = Math.min(Math.max(s.y, y0), y1)
  const d = Math.hypot(nx - s.x, ny - s.y)
  const leader = d > s.r + 0.5
    ? `  <line x1="${round(s.x + ((nx - s.x) * s.r) / d)}" y1="${round(s.y + ((ny - s.y) * s.r) / d)}" x2="${round(nx)}" y2="${round(ny)}" stroke="${s.colour}" stroke-width="0.3"/>`
    : null
  return [
    `  <circle class="${cls}" cx="${round(s.x)}" cy="${round(s.y)}" r="${s.r}" fill="none" stroke="${s.colour}" stroke-width="0.8"/>`,
    leader,
    `  <text x="${round(x0)}" y="${round(y0 + FONT)}" font-family="sans-serif" font-size="${FONT}" fill="${s.colour}" stroke="#ffffff" stroke-width="0.6" paint-order="stroke">${escapeXml(s.text)}</text>`
  ].filter(Boolean)
}

/**
 * @param {string} previewSvg graph.svg from the render job
 * @param {object} scene the scene the report was measured on
 * @param {{report: object, results: object[]}} checked output of touchcheck()
 */
const toOverlay = (previewSvg, scene, { report, results }) => {
  const { widthMm: w, heightMm: h } = scene.plate
  const flipY = (yMm) => h - yMm
  const resultOf = (id) => results.find((r) => r.id === id) || {}
  const title = (previewSvg.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || ''
  const inner = previewSvg
    .slice(previewSvg.indexOf('>', previewSvg.indexOf('<svg')) + 1, previewSvg.lastIndexOf('</svg>'))
    .replace(/\s*<title>[\s\S]*?<\/title>/, '')

  // Violations, numbered in report order.
  let n = 0
  const numbered = report.rules.flatMap((rule) => rule.violations.map((v) => ({ n: ++n, ruleId: rule.id, v })))
  const redSpots = numbered.filter(({ v }) => v.at).map(({ n, ruleId, v }) => ({
    x: v.at.xMm, y: flipY(v.at.yMm), r: CIRCLE_R, colour: RED, text: `${n}. ${shortText(ruleId, v)}`
  }))

  // Checks that passed, where they have a place: the closest lines that were still far enough apart (TL-1), and every
  // requested mark that is present (TL-4).
  const greenSpots = []
  const tl1 = resultOf('TL-1')
  if (tl1.passed && tl1.closestPassed) {
    const c = tl1.closestPassed
    greenSpots.push({ x: c.at.xMm, y: flipY(c.at.yMm), r: CIRCLE_R, colour: GREEN, text: `Closest lines: ${c.measuredMm} mm apart — OK, needs ${c.requiredMm} mm` })
  }
  const markRings = (resultOf('TL-4').present || [])
    .map((p) => scene.marks.find((m) => m.id === p.subject))
    .filter(Boolean)
    .map((m) => `  <circle class="passed" cx="${round(m.xMm)}" cy="${round(flipY(m.yMm))}" r="${m.diameterMm / 2 + 1.5}" fill="none" stroke="${GREEN}" stroke-width="0.5"/>`)

  // Legend: one line per rule, the numbered violations under it, notes in grey, then the limitation.
  const legend = [{ text: `touchcheck, profile ${report.profileId}: ${report.passed ? 'PASSED' : `FAILED (${report.rules.filter((r) => !r.passed).map((r) => r.id).join(', ')})`}`, colour: report.passed ? GREEN : RED, bold: true }]
  for (const rule of report.rules) {
    const { summary } = resultOf(rule.id)
    legend.push({ text: `${rule.passed ? '✓' : '✗'} ${rule.id} ${summary || (rule.passed ? 'passed' : 'failed')}`, colour: rule.passed ? GREEN : RED })
    if (rule.note && rule.note !== summary) legend.push({ text: `     ${rule.note}`, colour: GREY, small: true })
    for (const { n: k, v } of numbered.filter((x) => x.ruleId === rule.id)) {
      const measure = measureText(rule.id, v)
      legend.push({ text: `     ${k}. ${subjectText(v)}: ${v.message}${measure ? ` (${measure})` : ''}${v.at ? '' : ' (no place on the plate)'}`, colour: RED, small: true })
    }
  }
  legend.push({ text: LIMITATION, colour: GREY, small: true })

  const legendWidth = Math.max(...legend.map((l) => textWidth(l.text, l.small ? FONT * 0.85 : FONT))) + 2 * PAD
  const width = round(Math.max(w, legendWidth))
  const height = round(h + PAD + legend.length * LINE + PAD)
  const placed = placeLabels([...redSpots, ...greenSpots], width, h)

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}mm" height="${height}mm" viewBox="0 0 ${width} ${height}">`,
    `  <title>${escapeXml(`touchcheck overlay: ${title}`)}</title>`,
    `  <rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff"/>`,
    `  <g class="preview">${inner}</g>`,
    ...(resultOf('TL-5').passed ? [`  <rect class="passed-plate" x="0" y="0" width="${round(w)}" height="${round(h)}" fill="none" stroke="${GREEN}" stroke-width="0.4" stroke-dasharray="2 1.5"/>`] : []),
    ...markRings,
    ...placed.flatMap((s) => drawSpot(s, s.colour === RED ? 'violation' : 'passed')),
    ...legend.map((l, i) =>
      `  <text x="${PAD}" y="${round(h + PAD + (i + 0.8) * LINE)}" font-family="sans-serif" font-size="${l.small ? FONT * 0.85 : FONT}"${l.bold ? ' font-weight="bold"' : ''} fill="${l.colour}">${escapeXml(l.text)}</text>`),
    '</svg>',
    ''
  ].join('\n')
}

module.exports = { toOverlay }
