// TL-5 printable: the plate fits the printer bed (either way round) and every raised feature is wide and high enough.
const round2 = (v) => Math.round(v * 100) / 100

const checkPrintable = (scene, profile) => {
  const { minLineWidthMm, minFeatureHeightMm } = profile.rules['TL-5']
  const { x: bedX, y: bedY } = profile.bedMm
  const { widthMm: w, heightMm: h } = scene.plate
  const violations = []

  const fits = (w <= bedX && h <= bedY) || (w <= bedY && h <= bedX)
  if (!fits) {
    if (w > bedX) violations.push({ message: `Too big for the printer: the plate is ${round2(w)} mm wide, the bed ${bedX} mm`, measuredMm: round2(w), requiredMm: bedX, at: { xMm: round2(w), yMm: round2(h / 2) }, subject: ['plate'] })
    if (h > bedY) violations.push({ message: `Too big for the printer: the plate is ${round2(h)} mm tall, the bed ${bedY} mm`, measuredMm: round2(h), requiredMm: bedY, at: { xMm: round2(w / 2), yMm: round2(h) }, subject: ['plate'] })
  }

  const features = [
    ...scene.lines.map((l) => {
      const [xMm, yMm] = l.points[Math.floor(l.points.length / 2)]
      return { id: l.id, widthMm: l.widthMm, heightMm: l.heightMm, at: { xMm, yMm } }
    }),
    ...scene.marks.map((m) => ({ id: m.id, widthMm: m.diameterMm, heightMm: m.heightMm, at: { xMm: m.xMm, yMm: m.yMm } })),
    ...scene.labels.filter((l) => l.dots.length).map((l) => ({
      id: l.id, what: 'these braille dots', widthMm: l.dotDiameterMm, heightMm: l.dotHeightMm, at: { xMm: l.dots[0][0], yMm: l.dots[0][1] }
    }))
  ]
  for (const f of features) {
    const what = f.what || 'this line'
    if (f.widthMm < minLineWidthMm) {
      violations.push({ message: `Too thin: ${what} may not print or be felt`, measuredMm: f.widthMm, requiredMm: minLineWidthMm, at: f.at, subject: [f.id] })
    }
    if (minFeatureHeightMm != null && f.heightMm < minFeatureHeightMm) {
      violations.push({ message: `Too low: ${what} may not be felt`, measuredMm: f.heightMm, requiredMm: minFeatureHeightMm, at: f.at, subject: [f.id] })
    }
  }

  const thinnest = Math.min(...features.map((f) => f.widthMm))
  const passed = violations.length === 0
  return {
    id: 'TL-5',
    passed,
    violations,
    ...(minFeatureHeightMm == null && { note: 'Feature height not checked: the profile sets no minimum until the calibration print (Gate 7b).' }),
    summary: `Plate ${round2(w)} x ${round2(h)} mm on a ${bedX} x ${bedY} mm bed; thinnest feature ${thinnest} mm (needs ${minLineWidthMm} mm)`
  }
}

module.exports = { checkPrintable }
