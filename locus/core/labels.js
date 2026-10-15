// Braille labels on the plate, placed exactly as tools/prints/prints.js places them (docs/contracts.md D3):
// - each marked point gets a letter (a, b, c, ... in the order the marks were requested), its box centred at the
//   point plus layout.labelOffsets[pointId] (default: layout.defaultLabelOffset); moving it is the fixer's "move-label";
// - the braille ID (number sign + issue number) sits in the top-right corner, 6 mm in from both edges;
// - key mode adds a key in the bottom-left corner: one row per letter with the value it stands for.
const { toBraille, cellBox, brailleDots } = require('./braille')

const LETTERS = 'abcdefghijklmnopqrstuvwxyz'
const CORNER_INSET_MM = 6

const value = (v) => {
  const rounded = Math.round(v * 100) / 100
  return String(rounded === 0 ? 0 : rounded)
}

/** The value a key row gives for a mark: x,y for a vertex or turning point, y for the y-intercept, x for an x-intercept. */
const labelText = (point) => {
  switch (point.mark) {
    case 'vertex':
    case 'turning-points': return `${value(point.x)},${value(point.y)}`
    case 'y-intercept': return value(point.y)
    default: return value(point.x)
  }
}

/** A label whose box is centred on (cx, cy). `box` is [x0, y0, x1, y1] in plate mm. */
const makeLabel = (props, text, cx, cy, b) => {
  const braille = toBraille(text)
  const { w, h } = cellBox([...braille].length, b)
  return {
    ...props,
    text,
    braille,
    cx,
    cy,
    box: [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2],
    dots: brailleDots(braille, cx, cy, b),
    dotDiameterMm: b.dotDiameterMm,
    dotHeightMm: b.dotHeightMm
  }
}

/**
 * @param {object[]} marks scene marks (with xMm, yMm), in requested order
 * @param {number} brailleIdNumber the number embossed in the top-right corner (the request's issue number)
 * @returns {{ labels: object[], key: null | { entries: {letter, for, text}[] } }}
 */
const buildLabels = (marks, layout, profile, brailleIdNumber) => {
  const b = profile.braille
  const [W, H] = profile.plateMm
  if (marks.length > LETTERS.length) throw new Error(`labels support up to ${LETTERS.length} marked points`)

  const labels = marks.map((m, i) => {
    const [dx, dy] = layout.labelOffsets[m.id] ?? layout.defaultLabelOffset
    return makeLabel({ id: `label-${m.id}`, kind: 'mark', for: m.id }, LETTERS[i], m.xMm + dx, m.yMm + dy, b)
  })

  let key = null
  if (layout.labelMode === 'key') {
    const entries = marks.map((m, i) => ({ letter: LETTERS[i], for: m.id, text: labelText(m) }))
    const rowPitch = cellBox(1, b).h + profile.rules.minLineGapMm
    entries.forEach((e, k) => {
      const text = `${e.letter} ${e.text}`
      const { w, h } = cellBox([...toBraille(text)].length, b)
      const bottom = CORNER_INSET_MM + (entries.length - 1 - k) * rowPitch
      labels.push(makeLabel({ id: `key-${e.letter}`, kind: 'key', for: e.for }, text, CORNER_INSET_MM + w / 2, bottom + h / 2, b))
    })
    key = { entries }
  }

  const idText = String(brailleIdNumber)
  const { w: iw, h: ih } = cellBox([...toBraille(idText)].length, b)
  labels.push(makeLabel({ id: 'braille-id', kind: 'braille-id', for: null }, idText, W - CORNER_INSET_MM - iw / 2, H - CORNER_INSET_MM - ih / 2, b))

  return { labels, key }
}

module.exports = { labelText, buildLabels, LETTERS }
