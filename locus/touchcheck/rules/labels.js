// TL-2 (label clearance): every braille label box (point letters, key rows, the braille ID) is at least
// `minLabelClearanceMm` clear of every raised line edge and at least `minLabelPointClearanceMm` clear of every point
// mark, its own included (docs/contracts.md §2; tools/prints/prints.js). TL-3 (label overlap): no two label boxes
// overlap (projectLocus.md §10).
const { polyline, nearestToRect, clampToRect, dist } = require('../geometry')

const round2 = (v) => Math.round(v * 100) / 100
const midpoint = (p, q) => ({ xMm: round2((p[0] + q[0]) / 2), yMm: round2((p[1] + q[1]) / 2) })

const checkLabelGap = (scene, profile) => {
  const { minLabelClearanceMm: lineGap, minLabelPointClearanceMm: pointGap } = profile.rules
  const lines = scene.lines.map((l) => ({ ...l, pl: polyline(l.points) }))
  const violations = []
  let closest = Infinity

  for (const label of scene.labels) {
    for (const line of lines) {
      const hit = nearestToRect(label.box, line.pl)
      const gap = hit.distance - line.widthMm / 2
      closest = Math.min(closest, gap - lineGap)
      if (gap < lineGap - 1e-9) {
        violations.push({ message: 'This label touches a line: a fingertip feels them as one', measuredMm: round2(gap), requiredMm: lineGap, at: midpoint(hit.rectPoint, hit.linePoint), subject: [label.id, line.id] })
      }
    }
    for (const mark of scene.marks) {
      const centre = [mark.xMm, mark.yMm]
      const near = clampToRect(label.box, centre)
      const gap = dist(near, centre) - mark.diameterMm / 2
      closest = Math.min(closest, gap - pointGap)
      if (gap < pointGap - 1e-9) {
        violations.push({ message: 'This label touches a marked point', measuredMm: round2(gap), requiredMm: pointGap, at: midpoint(near, centre), subject: [label.id, mark.id] })
      }
    }
  }

  const passed = violations.length === 0
  return {
    id: 'TL-2',
    passed,
    violations,
    summary: passed
      ? `${scene.labels.length} labels at least ${lineGap} mm from every line and ${pointGap} mm from every point; tightest ${round2(closest)} mm to spare`
      : `${violations.length} ${violations.length === 1 ? 'place' : 'places'} where a label is too close to a line or point`
  }
}

const checkLabelOverlap = (scene) => {
  const violations = []
  for (let i = 0; i < scene.labels.length; i++) {
    for (let j = i + 1; j < scene.labels.length; j++) {
      const a = scene.labels[i].box
      const b = scene.labels[j].box
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
