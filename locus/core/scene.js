// The scene is the single 2D description of a tactile graph, in millimetres with y up and the origin at the plate's
// bottom-left corner. STL, SVG and touchcheck all read the same scene, so what is checked is what is printed.
const { evaluate } = require('./polynomial')
const { computeMarks } = require('./marks')
const { buildLabels, keyHeightMm } = require('./labels')

const wholeUnitsIn = (min, max) => {
  const units = []
  for (let k = Math.ceil(min); k <= Math.floor(max); k++) units.push(k)
  return units
}

const buildScene = (spec, layout, profile) => {
  const g = profile.geometry
  const { coeffs, domain } = spec.graph
  const { points: markPoints, missing } = computeMarks(spec)

  const samples = []
  for (let i = 0; i <= g.curveSamples; i++) {
    const x = domain.min + ((domain.max - domain.min) * i) / g.curveSamples
    samples.push([x, evaluate(coeffs, x)])
  }

  const ys = [...samples.map(([, y]) => y), ...markPoints.map((p) => p.y)]
  let yMin = Math.min(...ys)
  let yMax = Math.max(...ys)
  if (yMax - yMin < 1e-9) {
    yMin -= 1
    yMax += 1
  }
  const range = { xMin: domain.min, xMax: domain.max, yMin, yMax }

  // In key mode the key sits under the plot, so the plot moves up by the key's height.
  const plotBottomMm = g.marginMm + (layout.labelMode === 'key' ? keyHeightMm(markPoints.length, profile) : 0)
  const toMm = (x, y) => [
    g.marginMm + (x - range.xMin) * layout.xScaleMm,
    plotBottomMm + (y - range.yMin) * layout.yScaleMm
  ]

  const plate = {
    widthMm: 2 * g.marginMm + (range.xMax - range.xMin) * layout.xScaleMm,
    heightMm: plotBottomMm + g.marginMm + (range.yMax - range.yMin) * layout.yScaleMm,
    thicknessMm: g.baseThicknessMm
  }

  // Axes go through the origin when it is in range, otherwise along the plate's bottom / left data edge.
  const axisY = yMin <= 0 && yMax >= 0 ? 0 : yMin
  const axisX = range.xMin <= 0 && range.xMax >= 0 ? 0 : range.xMin

  const line = (id, kind, points) => ({ id, kind, points, widthMm: g[kind].widthMm, heightMm: g[kind].heightMm })

  const lines = []
  if (layout.showGrid) {
    for (const k of wholeUnitsIn(range.xMin, range.xMax)) {
      if (k !== axisX) lines.push(line(`grid-x-${k}`, 'grid', [toMm(k, yMin), toMm(k, yMax)]))
    }
    for (const k of wholeUnitsIn(yMin, yMax)) {
      if (k !== axisY) lines.push(line(`grid-y-${k}`, 'grid', [toMm(range.xMin, k), toMm(range.xMax, k)]))
    }
  }
  lines.push(line('x-axis', 'axis', [toMm(range.xMin, axisY), toMm(range.xMax, axisY)]))
  lines.push(line('y-axis', 'axis', [toMm(axisX, yMin), toMm(axisX, yMax)]))
  lines.push(line('curve', 'curve', samples.map(([x, y]) => toMm(x, y))))

  const marks = markPoints.map((p) => {
    const [xMm, yMm] = toMm(p.x, p.y)
    return { ...p, xMm, yMm, diameterMm: g.mark.diameterMm, heightMm: g.mark.heightMm }
  })

  const { labels, key } = buildLabels(marks, layout, profile)

  return { profileId: profile.id, plate, range, lines, marks, missing, labelMode: layout.labelMode, labels, key, toMm }
}

module.exports = { buildScene }
