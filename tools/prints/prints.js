// Locus prototype prints (MIT).
// Builds the two demo graphs for one request as STL files:
//   graph-A-attempt1.stl  : the profile's default layout (what the intake agent writes first)
//   graph-B-corrected.stl : the corrected layout, using only allowed fixes (hide grid, rescale y, move labels)
//   graph-C-cubic.stl     : a second request (a cubic with two turning points), corrected layout only
// Every feature is described once (lines, domes, braille labels). The same description is used to
// build the solid and to measure it, so the reported numbers are the numbers that get printed.
// All values are real millimetres. Print at 100% scale.

const fs = require('fs')
const path = require('path')
const { primitives, booleans, transforms, extrusions, expansions, geometries } = require('@jscad/modeling')

// ---- Request (same shape as requests/<iid>/spec.json) ----
let SPEC // set per build below

// ---- Profile fdm-handheld-v1 (docs/contracts.md §2) ----
const PROFILE = {
  plateMm: [100, 100],
  baseThicknessMm: 2,
  curve: { widthMm: 1.2, heightMm: 1.0 },
  axis: { widthMm: 1.0, heightMm: 0.7 },
  grid: { widthMm: 1.0, heightMm: 0.5 },
  tick: { widthMm: 1.0, heightMm: 0.7, lengthMm: 4 },
  point: { diameterMm: 3.0, heightMm: 1.6 },
  braille: { dotDiameterMm: 1.5, dotHeightMm: 0.8, dotPitchMm: 2.5, cellPitchMm: 6.2 },
  rules: { minLineGapMm: 3.2, minLabelClearanceMm: 6.4, minLabelPointClearanceMm: 3.2, minFeatureWidthMm: 1.0, edgeMarginMm: 3, crossingExclusionMaxMm: 15 }
}

const TOP = PROFILE.baseThicknessMm
const EPS = 0.01

// ---- Maths ----
const f = (x) => SPEC.graph.coeffs.reduce((acc, c) => acc * x + c, 0)
const df = (x) => { const h = 1e-6; return (f(x + h) - f(x - h)) / (2 * h) }
let X0, X1

function bisect (g, a, b) {
  for (let i = 0; i < 100; i++) { const m = (a + b) / 2; (g(a) * g(m) <= 0) ? (b = m) : (a = m) }
  return (a + b) / 2
}
// Every markable point, keyed by mark name. Turning points are numbered left to right.
function marks () {
  const out = {}
  let turning = 0
  const n = 2000
  for (let i = 0; i < n; i++) {
    const a = X0 + (X1 - X0) * i / n
    const b = X0 + (X1 - X0) * (i + 1) / n
    if ((df(a) >= 0) !== (df(b) >= 0)) { const x = bisect(df, a, b); out.vertex = [x, f(x)]; out['turning-point-' + (++turning)] = [x, f(x)] }
    if ((f(a) >= 0) !== (f(b) >= 0) && b > 0) { const x = bisect(f, a, b); out['x-intercept+'] = [x, 0] }
  }
  if (X0 <= 0 && X1 >= 0) out['y-intercept'] = [0, f(0)]
  return out
}

// ---- Braille (Grade 1) ----
const BRAILLE = { a: [1], b: [1, 2], c: [1, 4], '#': [3, 4, 5, 6] }
// Requested marks → the point names they cover ('turning-points' covers every turning point)
const expandMarks = (ms) => SPEC.mark.flatMap((m) => m === 'turning-points' ? Object.keys(ms).filter((k) => k.startsWith('turning-point-')) : [m])
const cellBox = (cells) => {
  const { dotDiameterMm: d, dotPitchMm: p, cellPitchMm: cp } = PROFILE.braille
  return { w: (cells - 1) * cp + p + d, h: 2 * p + d }
}
// Dots for text whose bounding box is centred on (cx, cy)
function brailleDots (text, cx, cy) {
  const { dotDiameterMm: d, dotPitchMm: p, cellPitchMm: cp } = PROFILE.braille
  const { w, h } = cellBox(text.length)
  const left = cx - w / 2 + d / 2
  const top = cy + h / 2 - d / 2
  return [...text].flatMap((ch, c) => BRAILLE[ch].map((n) => [
    left + c * cp + (n <= 3 ? 0 : p),
    top - ((n - 1) % 3) * p
  ]))
}

// ---- Layout → features ----
function features (layout, id) {
  const xs = layout.xScaleMm
  const ys = layout.yScaleMm
  // The x-axis is always drawn, so the lowest thing on the graph is the curve or the axis
  const ys0 = Math.min(0, ...sample(200).map(([, y]) => y))
  const ys1 = Math.max(...sample(200).map(([, y]) => y))
  // Placement rule: domain.min sits 12 mm from the left edge; the lowest curve point (or the x-axis) sits 20 mm from the bottom.
  const ox = 12 - X0 * xs
  const oy = 20 - ys0 * ys
  const P = ([x, y]) => [ox + x * xs, oy + y * ys]

  const lines = []
  const domes = []
  const labels = []
  const A = PROFILE.axis
  const xAxisL = P([X0, 0])[0] - 2
  const xAxisR = P([X1, 0])[0] + 2
  const yAxisB = P([0, ys0])[1] - 4
  const yAxisT = P([0, ys1 + 0.5])[1]
  lines.push({ kind: 'x-axis', pts: [[xAxisL, oy], [xAxisR, oy]], ...A })
  lines.push({ kind: 'y-axis', pts: [[ox, yAxisB], [ox, yAxisT]], ...A })

  const ms = marks()
  const markNames = expandMarks(ms)
  const markPts = markNames.map((m) => P(ms[m]))
  const nearMark = ([x, y]) => markPts.some(([mx, my]) => Math.hypot(mx - x, my - y) < 3)

  // Ticks are secondary: leave one out when it would sit on a mark or too close to the curve
  const curveMm = sample(400).map(P)
  const nearCurve = (pts) => densify(pts).some((p) => polyDist(p, curveMm) - PROFILE.curve.widthMm / 2 - PROFILE.tick.widthMm / 2 < PROFILE.rules.minLineGapMm)
  const T = PROFILE.tick
  for (let x = Math.ceil(X0); x <= Math.floor(X1); x++) {
    if (x === 0) continue
    const [px] = P([x, 0])
    const pts = [[px, oy - T.lengthMm / 2], [px, oy + T.lengthMm / 2]]
    if (!nearMark([px, oy]) && !nearCurve(pts)) lines.push({ kind: 'tick', pts, widthMm: T.widthMm, heightMm: T.heightMm })
  }
  for (let y = Math.ceil(ys0); y <= Math.floor(ys1); y++) {
    if (y === 0) continue
    const [, py] = P([0, y])
    const pts = [[ox - T.lengthMm / 2, py], [ox + T.lengthMm / 2, py]]
    if (!nearMark([ox, py]) && !nearCurve(pts)) lines.push({ kind: 'tick', pts, widthMm: T.widthMm, heightMm: T.heightMm })
  }

  if (layout.showGrid) {
    const G = PROFILE.grid
    for (let y = Math.ceil(ys0); y <= Math.floor(ys1); y++) if (y !== 0) lines.push({ kind: 'grid', pts: [[xAxisL, P([0, y])[1]], [xAxisR, P([0, y])[1]]], ...G })
    for (let x = Math.ceil(X0); x <= Math.floor(X1); x++) if (x !== 0) lines.push({ kind: 'grid', pts: [[P([x, 0])[0], oy], [P([x, 0])[0], yAxisT]], ...G })
  }

  lines.push({ kind: 'curve', pts: sample(400).map(P), ...PROFILE.curve })

  for (const [i, m] of markNames.entries()) {
    const [x, y] = P(ms[m])
    domes.push({ kind: m, x, y, d: PROFILE.point.diameterMm, h: PROFILE.point.heightMm })
    const [dx, dy] = layout.labelOffsets[m] ?? layout.defaultLabelOffset
    const text = 'abcdefghij'[i] // labels a, b, c… in the order the marks were requested
    const { w, h } = cellBox(text.length)
    const cx = x + dx
    const cy = y + dy
    labels.push({ kind: m, text, box: [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2], dots: brailleDots(text, cx, cy) })
  }

  // Braille ID (number sign + digit), top-right corner
  const idText = '#' + 'jabcdefghi'[id] // braille digits 1-9, 0 are the letters a-i, j
  const { w: iw, h: ih } = cellBox(idText.length)
  const icx = PROFILE.plateMm[0] - 6 - iw / 2
  const icy = PROFILE.plateMm[1] - 6 - ih / 2
  labels.push({ kind: 'braille-id', text: idText, box: [icx - iw / 2, icy - ih / 2, icx + iw / 2, icy + ih / 2], dots: brailleDots(idText, icx, icy) })

  return { lines, domes, labels, markNames, origin: [ox, oy], marks: ms }
}

function sample (n) {
  return Array.from({ length: n + 1 }, (_, i) => { const x = X0 + (X1 - X0) * i / n; return [x, f(x)] })
}

// ---- Geometry helpers for the checks ----
const segDist = ([px, py], [ax, ay], [bx, by]) => {
  const dx = bx - ax; const dy = by - ay
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}
const polyDist = (p, pts) => pts.slice(1).reduce((m, b, i) => Math.min(m, segDist(p, pts[i], b)), Infinity)
const boxDist = ([px, py], [x0, y0, x1, y1]) => Math.hypot(Math.max(x0 - px, 0, px - x1), Math.max(y0 - py, 0, py - y1))
// Dense points along a polyline (0.1 mm steps)
const densify = (pts) => pts.slice(1).flatMap((b, i) => {
  const a = pts[i]; const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.1))
  return Array.from({ length: n }, (_, k) => [a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n])
}).concat([pts[pts.length - 1]])
const r1 = (v) => Math.round(v * 10) / 10

// ---- touchcheck (prototype of rules TL-1..TL-5) ----
function check (F) {
  const R = PROFILE.rules
  const results = []
  const curve = F.lines.find((l) => l.kind === 'curve')
  const cpts = densify(curve.pts)

  // TL-1: curve vs every other line, ignoring the area around real crossings
  let tl1 = { gap: Infinity }
  for (const L of F.lines.filter((l) => l !== curve)) {
    const [a, b] = L.pts
    const horizontal = a[1] === b[1]
    // Signed offset across the line, or null when the point is beyond the line's ends
    const side = ([x, y]) => horizontal
      ? ((x >= Math.min(a[0], b[0]) && x <= Math.max(a[0], b[0])) ? y - a[1] : null)
      : ((y >= Math.min(a[1], b[1]) && y <= Math.max(a[1], b[1])) ? x - a[0] : null)
    // A crossing is a change of side. Touching the line and coming back (a tangent) is not a crossing.
    const crossings = []
    let lastSign = 0
    for (let i = 1; i < cpts.length; i++) {
      const s1 = side(cpts[i])
      if (s1 === null) { lastSign = 0; continue }
      const sign = Math.sign(s1)
      if (sign === 0) continue
      const crossed = lastSign !== 0 && sign !== lastSign
      lastSign = sign
      if (crossed) {
        // Near a real crossing two lines are always close. Skip the stretch where that is unavoidable:
        // the distance along the curve at which a crossing at this angle reaches the required gap.
        const [p0, p1] = [cpts[i - 1], cpts[i]]
        const ux = p1[0] - p0[0]; const uy = p1[1] - p0[1]
        const sinA = Math.abs(horizontal ? uy : ux) / Math.hypot(ux, uy)
        const radius = Math.min(R.crossingExclusionMaxMm, (R.minLineGapMm + curve.widthMm / 2 + L.widthMm / 2) / sinA + 1)
        crossings.push({ at: p1, radius })
      }
    }
    for (const p of cpts) {
      if (crossings.some((c) => Math.hypot(c.at[0] - p[0], c.at[1] - p[1]) < c.radius)) continue
      const gap = polyDist(p, L.pts) - curve.widthMm / 2 - L.widthMm / 2
      if (gap < tl1.gap) tl1 = { gap, at: p, with: L.kind }
    }
  }
  results.push({ rule: 'TL-1', pass: tl1.gap >= R.minLineGapMm, measuredMm: r1(tl1.gap), requiredMm: R.minLineGapMm, at: tl1.at.map(r1), with: tl1.with, message: 'These lines are too close: a fingertip feels one line' })

  // TL-2: every label vs every line (6.4 mm) and every point mark (3.2 mm)
  // Report the worst label relative to its own requirement
  let worst = { margin: Infinity }
  for (const lab of F.labels) {
    for (const L of F.lines) for (const p of densify(L.pts)) {
      const gap = boxDist(p, lab.box) - L.widthMm / 2
      if (gap - R.minLabelClearanceMm < worst.margin) worst = { margin: gap - R.minLabelClearanceMm, gap, need: R.minLabelClearanceMm, at: p, label: lab.text, with: L.kind }
    }
    for (const d of F.domes) {
      const gap = boxDist([d.x, d.y], lab.box) - d.d / 2
      if (gap - R.minLabelPointClearanceMm < worst.margin) worst = { margin: gap - R.minLabelPointClearanceMm, gap, need: R.minLabelPointClearanceMm, at: [d.x, d.y], label: lab.text, with: d.kind + ' point' }
    }
  }
  results.push({ rule: 'TL-2', pass: worst.margin >= 0, measuredMm: r1(worst.gap), requiredMm: worst.need, at: worst.at.map(r1), label: worst.label, with: worst.with, message: 'This label touches a line' })

  // TL-3: labels (including the braille ID) never overlap and keep the minimum gap
  let tl3 = { gap: Infinity }
  for (let i = 0; i < F.labels.length; i++) {
    for (let j = i + 1; j < F.labels.length; j++) {
      const [a0, b0, a1, b1] = F.labels[i].box; const [c0, d0, c1, d1] = F.labels[j].box
      const gap = Math.hypot(Math.max(c0 - a1, a0 - c1, 0), Math.max(d0 - b1, b0 - d1, 0))
      if (gap < tl3.gap) tl3 = { gap, between: [F.labels[i].text, F.labels[j].text] }
    }
  }
  results.push({ rule: 'TL-3', pass: tl3.gap >= R.minLineGapMm, measuredMm: r1(tl3.gap), requiredMm: R.minLineGapMm, between: tl3.between, message: 'These labels overlap' })

  // TL-4: inventory
  const have = { axes: F.lines.filter((l) => l.kind.endsWith('axis')).length === 2, curve: !!curve }
  for (const m of F.markNames) { have[m] = F.domes.some((d) => d.kind === m) && F.labels.some((l) => l.kind === m) }
  if (SPEC.mark.includes('turning-points') && !F.markNames.some((m) => m.startsWith('turning-point-'))) have['turning-points'] = false
  const missing = Object.entries(have).filter(([, v]) => !v).map(([k]) => k)
  results.push({ rule: 'TL-4', pass: missing.length === 0, missing, message: 'Something requested is missing' })

  // TL-5: everything on the plate with an edge margin; no feature thinner than the minimum
  const [W, H] = PROFILE.plateMm
  const xsAll = []; const ysAll = []
  for (const L of F.lines) for (const [x, y] of L.pts) { xsAll.push(x - L.widthMm / 2, x + L.widthMm / 2); ysAll.push(y - L.widthMm / 2, y + L.widthMm / 2) }
  for (const d of F.domes) { xsAll.push(d.x - d.d / 2, d.x + d.d / 2); ysAll.push(d.y - d.d / 2, d.y + d.d / 2) }
  for (const l of F.labels) { xsAll.push(l.box[0], l.box[2]); ysAll.push(l.box[1], l.box[3]) }
  const edge = Math.min(Math.min(...xsAll), Math.min(...ysAll), W - Math.max(...xsAll), H - Math.max(...ysAll))
  const minWidth = Math.min(...F.lines.map((l) => l.widthMm))
  results.push({ rule: 'TL-5', pass: edge >= PROFILE.rules.edgeMarginMm && minWidth >= PROFILE.rules.minFeatureWidthMm, edgeMarginMm: r1(edge), minFeatureWidthMm: minWidth, message: 'Too big for the plate / features too thin' })

  return { pass: results.every((r) => r.pass), results }
}

// ---- Solid ----
const raisedPath = (pts, w, h) => transforms.translate([0, 0, TOP - EPS], extrusions.extrudeLinear({ height: h + EPS },
  expansions.expand({ delta: w / 2, corners: 'round', segments: 16 }, geometries.path2.fromPoints({ closed: false }, pts))))
const dome = (x, y, d, h) => transforms.translate([x, y, TOP], transforms.scale([1, 1, h / (d / 2)], primitives.sphere({ radius: d / 2, segments: 24 })))

function solid (F) {
  const [W, H] = PROFILE.plateMm
  const plate = extrusions.extrudeLinear({ height: TOP }, primitives.roundedRectangle({ size: [W, H], roundRadius: 3, center: [W / 2, H / 2] }))
  const corner = transforms.translate([0, 0, TOP - EPS], extrusions.extrudeLinear({ height: 1 + EPS }, primitives.polygon({ points: [[3, H - 8], [8, H - 3], [3, H - 3]] })))
  const B = PROFILE.braille
  return booleans.union(
    plate, corner,
    ...F.lines.map((l) => raisedPath(l.pts, l.widthMm, l.heightMm)),
    ...F.domes.map((d) => dome(d.x, d.y, d.d, d.h)),
    ...F.labels.flatMap((l) => l.dots.map(([x, y]) => dome(x, y, B.dotDiameterMm, B.dotHeightMm)))
  )
}

// ---- Watertight STL ----
// The union leaves T-junctions: a vertex of one face sitting in the middle of a neighbour's edge.
// There is no gap, but the edges don't pair up, and some slicers then report the mesh as broken.
// Fix: add those vertices to the neighbour's outline, then triangulate each face from its centre.
function watertightTriangles (geom) {
  const polys = geometries.geom3.toPolygons(geom).map((p) => p.vertices)
  const ids = new Map(); const V = []
  const id = (v) => { const k = v.map((c) => Math.round(c * 1e4)).join(','); if (!ids.has(k)) { ids.set(k, V.length); V.push(v) } return ids.get(k) }
  const faces = polys.map((vs) => vs.map(id))
  const openEdges = (fs) => {
    const E = new Set()
    for (const f of fs) for (let i = 0; i < f.length; i++) E.add(f[i] + ',' + f[(i + 1) % f.length])
    return [...E].filter((e) => { const [a, b] = e.split(','); return !E.has(b + ',' + a) }).map((e) => e.split(',').map(Number))
  }
  const open = openEdges(faces)
  const candidates = [...new Set(open.flat())]
  const insertOn = new Map() // "a,b" -> vertex ids strictly inside edge a->b, ordered from a
  for (const [a, b] of open) {
    const A = V[a]; const B = V[b]
    const d = [B[0] - A[0], B[1] - A[1], B[2] - A[2]]
    const L2 = d[0] * d[0] + d[1] * d[1] + d[2] * d[2]
    const hits = []
    for (const c of candidates) {
      if (c === a || c === b) continue
      const P = V[c]
      const t = ((P[0] - A[0]) * d[0] + (P[1] - A[1]) * d[1] + (P[2] - A[2]) * d[2]) / L2
      if (t <= 1e-6 || t >= 1 - 1e-6) continue
      const q = [A[0] + t * d[0] - P[0], A[1] + t * d[1] - P[1], A[2] + t * d[2] - P[2]]
      if (Math.hypot(...q) < 1e-3) hits.push([t, c])
    }
    if (hits.length) insertOn.set(a + ',' + b, hits.sort((x, y) => x[0] - y[0]).map(([, c]) => c))
  }
  const tris = []
  for (const f of faces) {
    const ring = f.flatMap((a, i) => [a, ...(insertOn.get(a + ',' + f[(i + 1) % f.length]) ?? [])])
    if (ring.length === f.length) {
      for (let i = 1; i + 1 < f.length; i++) tris.push([f[0], f[i], f[i + 1]]) // convex face: plain fan
    } else {
      const c = id([0, 1, 2].map((k) => f.reduce((s, a) => s + V[a][k], 0) / f.length)) // centre of a convex face
      for (let i = 0; i < ring.length; i++) tris.push([c, ring[i], ring[(i + 1) % ring.length]])
    }
  }
  return { V, tris, openBefore: open.length, openAfter: openEdges(tris).length }
}

function binaryStl ({ V, tris }) {
  const buf = Buffer.alloc(84 + 50 * tris.length)
  buf.write('Locus prototype print, millimetres', 0)
  buf.writeUInt32LE(tris.length, 80)
  tris.forEach(([a, b, c], i) => {
    const [A, B, C] = [V[a], V[b], V[c]]
    const u = [B[0] - A[0], B[1] - A[1], B[2] - A[2]]; const w = [C[0] - A[0], C[1] - A[1], C[2] - A[2]]
    const n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]]
    const len = Math.hypot(...n) || 1
    const o = 84 + 50 * i
    ;[...n.map((x) => x / len), ...A, ...B, ...C].forEach((x, k) => buf.writeFloatLE(x, o + 4 * k))
  })
  return buf
}

// ---- Build ----
const builds = [
  { file: 'graph-A-attempt1', spec: 'spec.json', layout: 'layout-A.json', id: 1 },
  { file: 'graph-B-corrected', spec: 'spec.json', layout: 'layout-B.json', id: 2 },
  { file: 'graph-C-cubic', spec: 'spec-C.json', layout: 'layout-C.json', id: 3 }
]
const report = {}
for (const b of builds) {
  SPEC = JSON.parse(fs.readFileSync(path.join(__dirname, b.spec), 'utf8'))
  ;({ min: X0, max: X1 } = SPEC.graph.domain)
  const layout = JSON.parse(fs.readFileSync(path.join(__dirname, b.layout), 'utf8'))
  const F = features(layout, b.id)
  report[b.file] = { spec: SPEC, layout, origin: F.origin.map(r1), marks: Object.fromEntries(Object.entries(F.marks).map(([k, v]) => [k, v.map((n) => Math.round(n * 1000) / 1000)])), touchcheck: check(F) }
  const mesh = watertightTriangles(solid(F))
  if (mesh.openAfter !== 0) throw new Error(`${b.file}: mesh still has ${mesh.openAfter} unpaired edges`)
  fs.writeFileSync(path.join(__dirname, b.file + '.stl'), binaryStl(mesh))
  const tc = report[b.file].touchcheck
  console.log(`${b.file}.stl  touchcheck: ${tc.pass ? 'PASS' : 'FAIL'}  mesh: ${mesh.openBefore} T-junction edges fixed, watertight`)
  for (const r of tc.results) console.log('  ', r.rule, r.pass ? 'pass' : 'FAIL', JSON.stringify(r))
}
fs.writeFileSync(path.join(__dirname, 'report.json'), JSON.stringify(report, null, 2) + '\n')
