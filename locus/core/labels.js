// Braille labels for marked points. Inline mode puts each value next to its dot; key mode puts a letter there and lists
// letter + value in a key below the plot. Default label place: up and right of the dot by the profile's TL-2 gap;
// layout.labelOffsets moves it from there (the fixer's "move-label" fix).
const { toBraille, cellLayout } = require('./braille')

const KEY_LETTERS = 'abcdefghijklmnopqrstuvwxyz'

const value = (v) => {
  const rounded = Math.round(v * 100) / 100
  return String(rounded === 0 ? 0 : rounded)
}

/** The short print text of a mark's label: what a reader needs to know about that point. */
const labelText = (point) => {
  switch (point.mark) {
    case 'vertex':
    case 'turning-points': return `${value(point.x)},${value(point.y)}`
    case 'y-intercept': return value(point.y)
    default: return value(point.x)
  }
}

const makeLabel = (props, text, xMm, yMm, cellSize) => {
  const braille = toBraille(text)
  const { widthMm, heightMm, dots } = cellLayout(braille, cellSize)
  return {
    ...props,
    text,
    braille,
    xMm,
    yMm,
    widthMm,
    heightMm,
    dots: dots.map(([x, y]) => [xMm + x, yMm + y]),
    dotDiameterMm: cellSize.dotDiameterMm,
    dotHeightMm: cellSize.dotHeightMm
  }
}

/** Height of the key area under the plot, so the key's top row is TL-2 clear of the lowest raised feature. */
const keyHeightMm = (count, profile) => {
  if (!count) return 0
  const g = profile.geometry
  const b = g.braille
  const clearance = Math.max(g.curve.widthMm / 2, g.axis.widthMm / 2, g.grid.widthMm / 2, g.mark.diameterMm / 2)
  return (count - 1) * b.lineSpacingMm + (2 * b.dotSpacingMm + b.dotDiameterMm) + profile.rules['TL-2'].minLabelGapMm + clearance
}

/**
 * @param {object[]} marks scene marks (with xMm, yMm, diameterMm)
 * @returns {{ labels: object[], key: null | { entries: {letter, for, text}[] } }}
 */
const buildLabels = (marks, layout, profile) => {
  const g = profile.geometry
  const gap = profile.rules['TL-2'].minLabelGapMm
  const keyed = layout.labelMode === 'key'
  if (keyed && marks.length > KEY_LETTERS.length) throw new Error(`key mode supports up to ${KEY_LETTERS.length} marks`)

  const labels = marks.map((m, i) => {
    const offset = layout.labelOffsets[m.id] || { dxMm: 0, dyMm: 0 }
    const r = m.diameterMm / 2
    const text = keyed ? KEY_LETTERS[i] : labelText(m)
    return makeLabel({ id: `label-${m.id}`, kind: 'mark', for: m.id }, text, m.xMm + r + gap + offset.dxMm, m.yMm + r + gap + offset.dyMm, g.braille)
  })
  if (!keyed) return { labels, key: null }

  const entries = marks.map((m, i) => ({ letter: KEY_LETTERS[i], for: m.id, text: labelText(m) }))
  const rows = entries.map((e, k) =>
    makeLabel({ id: `key-${e.letter}`, kind: 'key', for: e.for }, `${e.letter} ${e.text}`, g.marginMm, g.marginMm + (entries.length - 1 - k) * g.braille.lineSpacingMm, g.braille))
  return { labels: [...labels, ...rows], key: { entries } }
}

module.exports = { labelText, buildLabels, keyHeightMm }
