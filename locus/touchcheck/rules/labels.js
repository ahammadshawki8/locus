// TL-2 (label gap): every braille label box is at least `minLabelGapMm` clear of every raised line edge and every other
// marked point, and lies on the plate. TL-3 (label overlap): no two label boxes overlap. A label's own mark is not
// counted against it (the label belongs next to it). Key rows are labels too.
const { polyline, nearestToRect, clampToRect, dist } = require('../geometry')

const NOT_APPLICABLE = 'not applicable: no labels yet'
const round2 = (v) => Math.round(v * 100) / 100
const midpoint = (p, q) => ({ xMm: round2((p[0] + q[0]) / 2), yMm: round2((p[1] + q[1]) / 2) })
const boxOf = (l) => [l.xMm, l.yMm, l.xMm + l.widthMm, l.yMm + l.heightMm]

const notApplicable = (id) => ({ id, passed: true, violations: [], note: NOT_APPLICABLE, summary: NOT_APPLICABLE })

const checkLabelGap = (scene, profile) => {
  if (!scene.labels.length) return notApplicable('TL-2')
  const minGap = profile.rules['TL-2'].minLabelGapMm
  const lines = scene.lines.map((l) => ({ ...l, pl: polyline(l.points) }))
  const violations = []
  let closest = Infinity

  for (const label of scene.labels) {
    const box = boxOf(label)
    const overhang = Math.max(-box[0], -box[1], box[2] - scene.plate.widthMm, box[3] - scene.plate.heightMm)
    if (overhang > 1e-9) {
      const [cx, cy] = clampToRect([0, 0, scene.plate.widthMm, scene.plate.heightMm], [(box[0] + box[2]) / 2, (box[1] + box[3]) / 2])
      violations.push({ message: 'This label runs off the plate', measuredMm: round2(overhang), requiredMm: 0, at: { xMm: round2(cx), yMm: round2(cy) }, subject: [label.id, 'plate'] })
    }
    for (const line of lines) {
      const hit = nearestToRect(box, line.pl)
      const gap = hit.distance - line.widthMm / 2
      closest = Math.min(closest, gap)
      if (gap < minGap - 1e-9) {
        violations.push({ message: 'This label touches a line: a fingertip feels them as one', measuredMm: round2(Math.max(0, gap)), requiredMm: minGap, at: midpoint(hit.rectPoint, hit.linePoint), subject: [label.id, line.id] })
      }
    }
    for (const mark of scene.marks) {
      if (label.kind === 'mark' && mark.id === label.for) continue
      const centre = [mark.xMm, mark.yMm]
      const near = clampToRect(box, centre)
      const gap = dist(near, centre) - mark.diameterMm / 2
      closest = Math.min(closest, gap)
      if (gap < minGap - 1e-9) {
        violations.push({ message: 'This label touches a marked point', measuredMm: round2(Math.max(0, gap)), requiredMm: minGap, at: midpoint(near, centre), subject: [label.id, mark.id] })
      }
    }
  }

  const passed = violations.length === 0
  const worst = violations.filter((v) => v.requiredMm === minGap).reduce((a, v) => Math.min(a, v.measuredMm), Infinity)
  return {
    id: 'TL-2',
    passed,
    violations,
    note: "Measured from each label's box to raised line edges and other marks; a label's own mark is not counted.",
    summary: passed
      ? `${scene.labels.length} labels on the plate, at least ${minGap} mm from every line and other mark${Number.isFinite(closest) ? `; closest ${round2(closest)} mm` : ''}`
      : `${violations.length} ${violations.length === 1 ? 'place' : 'places'} where a label is too close to a line or mark, or off the plate${Number.isFinite(worst) ? `; closest ${worst} mm` : ''}`
  }
}

const checkLabelOverlap = (scene) => {
  if (!scene.labels.length) return notApplicable('TL-3')
  const violations = []
  for (let i = 0; i < scene.labels.length; i++) {
    for (let j = i + 1; j < scene.labels.length; j++) {
      const a = boxOf(scene.labels[i])
      const b = boxOf(scene.labels[j])
      const lo = [Math.max(a[0], b[0]), Math.max(a[1], b[1])]
      const hi = [Math.min(a[2], b[2]), Math.min(a[3], b[3])]
      const overlap = Math.min(hi[0] - lo[0], hi[1] - lo[1])
      if (overlap > 1e-9) {
        violations.push({ message: 'These labels overlap', measuredMm: round2(overlap), requiredMm: 0, at: midpoint(lo, hi), subject: [scene.labels[i].id, scene.labels[j].id] })
      }
    }
  }
  const passed = violations.length === 0
  return {
    id: 'TL-3',
    passed,
    violations,
    summary: passed ? `No labels overlap (${scene.labels.length} labels)` : `${violations.length} ${violations.length === 1 ? 'pair' : 'pairs'} of labels overlap`
  }
}

module.exports = { checkLabelGap, checkLabelOverlap }
