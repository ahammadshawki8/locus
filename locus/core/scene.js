// The scene is the single 2D description of a tactile graph, in plate millimetres with y up and the origin at the
// plate's bottom-left corner. STL, SVG and touchcheck all read the same scene, so what is checked is what is printed.
//
// Placement, feature sizes and tick rules are exactly those of tools/prints/prints.js (docs/contracts.md D3), so a
// request rendered with print A's, B's or C's spec + layout gives the same plate (locus/core/prints.test.js):
// - the domain minimum sits 12 mm from the left edge; the lower of the curve and the x-axis sits 20 mm from the bottom;
// - the x-axis runs 2 mm past the curve at both ends; the y-axis from 4 mm below the lowest point to half a unit above
//   the highest;
// - a tick (every whole unit, not 0) is left out when it would sit on a point mark or closer to the curve than the
//   minimum line gap;
// - grid lines (when shown) run at every whole unit except 0, across the axes' extent (vertical ones from the x-axis
//   up, or down when the whole curve is below it);
// - an orientation triangle sits in the top-left corner.
const { evaluate } = require('./polynomial')
const { computeMarks } = require('./marks')
const { buildLabels } = require('./labels')

const LEFT_MM = 12
const BOTTOM_MM = 20
const X_AXIS_OVERHANG_MM = 2
const Y_AXIS_BELOW_MM = 4
const Y_AXIS_ABOVE_UNITS = 0.5
const TICK_MARK_CLEARANCE_MM = 3
const CURVE_SAMPLES = 400
const RANGE_SAMPLES = 200
const ORIENTATION = { heightMm: 1, points: (H) => [[3, H - 8], [8, H - 3], [3, H - 3]] }

// Distance helpers, as in prints.js (the tick rule must decide exactly as it did for the prints).
const segDist = ([px, py], [ax, ay], [bx, by]) => {
  const dx = bx - ax
  const dy = by - ay
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}
const polyDist = (p, pts) => pts.slice(1).reduce((m, b, i) => Math.min(m, segDist(p, pts[i], b)), Infinity)
// Points along a polyline every 0.1 mm
const densify = (pts) => pts.slice(1).flatMap((b, i) => {
  const a = pts[i]
  const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.1))
  return Array.from({ length: n }, (_, k) => [a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n])
}).concat([pts[pts.length - 1]])

/**
 * @param {object} [options.brailleIdNumber] number embossed top-right; defaults to the request's issue number
 */
const buildScene = (spec, layout, profile, { brailleIdNumber = spec.requestId } = {}) => {
  const { coeffs, domain: { min: X0, max: X1 } } = spec.graph
  const f = (x) => evaluate(coeffs, x)
  const sample = (n) => Array.from({ length: n + 1 }, (_, i) => { const x = X0 + (X1 - X0) * i / n; return [x, f(x)] })
  const xs = layout.xScaleMm
  const ys = layout.yScaleMm
  const [W, H] = profile.plateMm

  // The x-axis is always drawn, so the lowest thing on the graph is the curve or the axis.
  const ys0 = Math.min(0, ...sample(RANGE_SAMPLES).map(([, y]) => y))
  const ys1 = Math.max(...sample(RANGE_SAMPLES).map(([, y]) => y))
  const ox = LEFT_MM - X0 * xs
  const oy = BOTTOM_MM - ys0 * ys
  const P = ([x, y]) => [ox + x * xs, oy + y * ys]

  const { points: markPoints, missing } = computeMarks(spec)
  const marks = markPoints.map((p) => {
    const [xMm, yMm] = P([p.x, p.y])
    return { ...p, xMm, yMm, diameterMm: profile.point.diameterMm, heightMm: profile.point.heightMm }
  })

  const line = (id, kind, points, size = profile[kind]) => ({ id, kind, points, widthMm: size.widthMm, heightMm: size.heightMm })
  const lines = []
  const xAxisL = P([X0, 0])[0] - X_AXIS_OVERHANG_MM
  const xAxisR = P([X1, 0])[0] + X_AXIS_OVERHANG_MM
  const yAxisB = P([0, ys0])[1] - Y_AXIS_BELOW_MM
  const yAxisT = P([0, ys1 + Y_AXIS_ABOVE_UNITS])[1]
  lines.push(line('x-axis', 'axis', [[xAxisL, oy], [xAxisR, oy]]))
  lines.push(line('y-axis', 'axis', [[ox, yAxisB], [ox, yAxisT]]))

  // Ticks are secondary: leave one out when it would sit on a mark or too close to the curve.
  const nearMark = ([x, y]) => marks.some((m) => Math.hypot(m.xMm - x, m.yMm - y) < TICK_MARK_CLEARANCE_MM)
  const curveMm = sample(CURVE_SAMPLES).map(P)
  const T = profile.tick
  const nearCurve = (pts) => densify(pts).some((p) => polyDist(p, curveMm) - profile.curve.widthMm / 2 - T.widthMm / 2 < profile.rules.minLineGapMm)
  for (let x = Math.ceil(X0); x <= Math.floor(X1); x++) {
    if (x === 0) continue
    const [px] = P([x, 0])
    const pts = [[px, oy - T.lengthMm / 2], [px, oy + T.lengthMm / 2]]
    if (!nearMark([px, oy]) && !nearCurve(pts)) lines.push(line(`tick-x-${x}`, 'tick', pts))
  }
  for (let y = Math.ceil(ys0); y <= Math.floor(ys1); y++) {
    if (y === 0) continue
    const [, py] = P([0, y])
    const pts = [[ox - T.lengthMm / 2, py], [ox + T.lengthMm / 2, py]]
    if (!nearMark([ox, py]) && !nearCurve(pts)) lines.push(line(`tick-y-${y}`, 'tick', pts))
  }

  if (layout.showGrid) {
    for (let y = Math.ceil(ys0); y <= Math.floor(ys1); y++) if (y !== 0) lines.push(line(`grid-y-${y}`, 'grid', [[xAxisL, P([0, y])[1]], [xAxisR, P([0, y])[1]]]))
    // Vertical grid lines rise from the x-axis; when the whole curve is below it, they hang from it instead.
    const [gridX0, gridX1] = yAxisT > oy ? [oy, yAxisT] : [yAxisB, oy]
    for (let x = Math.ceil(X0); x <= Math.floor(X1); x++) if (x !== 0) lines.push(line(`grid-x-${x}`, 'grid', [[P([x, 0])[0], gridX0], [P([x, 0])[0], gridX1]]))
  }

  lines.push(line('curve', 'curve', curveMm))

  const { labels, key } = buildLabels(marks, layout, profile, brailleIdNumber)

  return {
    profileId: profile.id,
    plate: { widthMm: W, heightMm: H, thicknessMm: profile.baseThicknessMm },
    origin: [ox, oy],
    range: { xMin: X0, xMax: X1, yMin: ys0, yMax: ys1 },
    lines,
    marks,
    missing,
    labelMode: layout.labelMode,
    labels,
    key,
    orientation: { points: ORIENTATION.points(H), heightMm: ORIENTATION.heightMm },
    brailleIdNumber
  }
}

module.exports = { buildScene }
