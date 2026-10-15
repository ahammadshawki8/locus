// TL-5 printable: every raised feature lies on the plate with at least `edgeMarginMm` to spare, and none is thinner
// than `minFeatureWidthMm` (docs/contracts.md §2; tools/prints/prints.js). The plate is the profile's fixed plate.
const round2 = (v) => Math.round(v * 100) / 100

const lineBox = (l) => {
  const xs = l.points.map(([x]) => x)
  const ys = l.points.map(([, y]) => y)
  const r = l.widthMm / 2
  return [Math.min(...xs) - r, Math.min(...ys) - r, Math.max(...xs) + r, Math.max(...ys) + r]
}

const checkPrintable = (scene, profile) => {
  const { edgeMarginMm, minFeatureWidthMm } = profile.rules
  const { widthMm: W, heightMm: H } = scene.plate
  const features = [
    ...scene.lines.map((l) => ({ id: l.id, box: lineBox(l), widthMm: l.widthMm, what: 'this line' })),
    ...scene.marks.map((m) => {
      const r = m.diameterMm / 2
      return { id: m.id, box: [m.xMm - r, m.yMm - r, m.xMm + r, m.yMm + r], widthMm: m.diameterMm, what: 'this point' }
    }),
    ...scene.labels.map((l) => ({ id: l.id, box: l.box, widthMm: l.dotDiameterMm, what: 'these braille dots' }))
  ]

  const violations = []
  let tightest = Infinity
  for (const f of features) {
    const [x0, y0, x1, y1] = f.box
    const cx = (x0 + x1) / 2
    const cy = (y0 + y1) / 2
    const sides = [[x0, [x0, cy]], [y0, [cx, y0]], [W - x1, [x1, cy]], [H - y1, [cx, y1]]]
    const [edge, at] = sides.reduce((a, b) => (b[0] < a[0] ? b : a))
    tightest = Math.min(tightest, edge)
    if (edge < edgeMarginMm - 1e-9) {
      violations.push({ message: `Too close to the edge of the plate${edge < 0 ? ' (runs off it)' : ''}`, measuredMm: round2(edge), requiredMm: edgeMarginMm, at: { xMm: round2(at[0]), yMm: round2(at[1]) }, subject: [f.id, 'plate'] })
    }
    if (f.widthMm < minFeatureWidthMm) {
      violations.push({ message: `Too thin: ${f.what} may not print or be felt`, measuredMm: f.widthMm, requiredMm: minFeatureWidthMm, at: { xMm: round2(cx), yMm: round2(cy) }, subject: [f.id] })
    }
  }

  const thinnest = Math.min(...features.map((f) => f.widthMm))
  return {
    id: 'TL-5',
    passed: violations.length === 0,
    violations,
    summary: `Plate ${W} x ${H} mm; closest feature ${round2(tightest)} mm from the edge (needs ${edgeMarginMm}); thinnest ${thinnest} mm (needs ${minFeatureWidthMm})`
  }
}

module.exports = { checkPrintable }
