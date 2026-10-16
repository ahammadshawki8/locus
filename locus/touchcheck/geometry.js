// 2D helpers for touchcheck, in scene millimetres. Lines are polylines walked by arc length `s`.
const EPS = 1e-9

const sub = (a, b) => [a[0] - b[0], a[1] - b[1]]
const cross = (a, b) => a[0] * b[1] - a[1] * b[0]
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1])
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
const unit = (v) => {
  const n = Math.hypot(v[0], v[1])
  return n < EPS ? [0, 0] : [v[0] / n, v[1] / n]
}

/** A polyline with cumulative arc lengths, so points can be addressed by distance along the line. */
const polyline = (points) => {
  const cum = [0]
  for (let i = 1; i < points.length; i++) cum.push(cum[i - 1] + dist(points[i - 1], points[i]))
  const length = cum[cum.length - 1]

  const segmentAt = (s) => {
    let i = 1
    while (i < points.length - 1 && cum[i] < s) i++
    return i
  }
  const pointAt = (s) => {
    if (s <= 0) return points[0]
    if (s >= length) return points[points.length - 1]
    const i = segmentAt(s)
    const span = cum[i] - cum[i - 1]
    return span < EPS ? points[i] : lerp(points[i - 1], points[i], (s - cum[i - 1]) / span)
  }
  const directionAt = (s) => {
    const i = segmentAt(Math.min(Math.max(s, 0), length))
    return unit(sub(points[i], points[i - 1]))
  }
  const sample = (step) => {
    const n = Math.max(1, Math.ceil(length / step))
    const out = []
    for (let k = 0; k <= n; k++) {
      const s = k === n ? length : (length * k) / n
      out.push({ point: pointAt(s), s })
    }
    return out
  }
  const bounds = points.reduce(([x0, y0, x1, y1], [x, y]) => [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)],
    [Infinity, Infinity, -Infinity, -Infinity])
  return { points, cum, length, pointAt, directionAt, sample, bounds }
}

/** Closest point on a polyline to p, with its distance and arc position. */
const nearestOnPolyline = (p, pl) => {
  let best = { point: pl.points[0], distance: dist(p, pl.points[0]), s: 0 }
  for (let i = 1; i < pl.points.length; i++) {
    const a = pl.points[i - 1]
    const ab = sub(pl.points[i], a)
    const len2 = ab[0] * ab[0] + ab[1] * ab[1]
    const t = len2 < EPS ? 0 : Math.min(1, Math.max(0, ((p[0] - a[0]) * ab[0] + (p[1] - a[1]) * ab[1]) / len2))
    const point = t === 0 ? a : t === 1 ? pl.points[i] : lerp(a, pl.points[i], t)
    const d = dist(p, point)
    if (d < best.distance) best = { point, distance: d, s: pl.cum[i - 1] + t * (pl.cum[i] - pl.cum[i - 1]) }
  }
  return best
}

const nearestOnSegment = (p, a, b) => {
  const ab = sub(b, a)
  const len2 = ab[0] * ab[0] + ab[1] * ab[1]
  const t = len2 < EPS ? 0 : Math.min(1, Math.max(0, ((p[0] - a[0]) * ab[0] + (p[1] - a[1]) * ab[1]) / len2))
  return t === 0 ? a : t === 1 ? b : lerp(a, b, t)
}
const clampToRect = ([x0, y0, x1, y1], [x, y]) => [Math.min(Math.max(x, x0), x1), Math.min(Math.max(y, y0), y1)]

/** The part of segment ab inside the rect, by Liang-Barsky clipping; null when the segment misses the rect. */
const clipToRect = ([x0, y0, x1, y1], a, b) => {
  const d = sub(b, a)
  let lo = 0
  let hi = 1
  for (const [p, q] of [[-d[0], a[0] - x0], [d[0], x1 - a[0]], [-d[1], a[1] - y0], [d[1], y1 - a[1]]]) {
    if (Math.abs(p) < EPS) {
      if (q < 0) return null
    } else {
      const t = q / p
      if (p < 0) lo = Math.max(lo, t)
      else hi = Math.min(hi, t)
    }
  }
  return lo <= hi ? lerp(a, b, (lo + hi) / 2) : null
}

/** Closest points between an axis-aligned box [x0, y0, x1, y1] and a polyline; distance 0 when they overlap. */
const nearestToRect = (rect, pl) => {
  const [x0, y0, x1, y1] = rect
  const corners = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]
  let best = null
  const consider = (rectPoint, linePoint) => {
    const distance = dist(rectPoint, linePoint)
    if (!best || distance < best.distance) best = { distance, rectPoint, linePoint }
  }
  for (let i = 1; i < pl.points.length; i++) {
    const a = pl.points[i - 1]
    const b = pl.points[i]
    const inside = clipToRect(rect, a, b)
    if (inside) return { distance: 0, rectPoint: inside, linePoint: inside }
    consider(clampToRect(rect, a), a)
    consider(clampToRect(rect, b), b)
    for (const c of corners) consider(c, nearestOnSegment(c, a, b))
  }
  return best
}

/** Gap between two bounding boxes (0 when they overlap). */
const boundsGap = ([ax0, ay0, ax1, ay1], [bx0, by0, bx1, by1]) =>
  Math.hypot(Math.max(0, bx0 - ax1, ax0 - bx1), Math.max(0, by0 - ay1, ay0 - by1))

/** Points where two polylines' centrelines meet, each reported once. */
const intersections = (A, B) => {
  const hits = []
  for (let i = 1; i < A.points.length; i++) {
    const a0 = A.points[i - 1]
    const da = sub(A.points[i], a0)
    for (let j = 1; j < B.points.length; j++) {
      const b0 = B.points[j - 1]
      const db = sub(B.points[j], b0)
      const denom = cross(da, db)
      if (Math.abs(denom) < EPS) continue // parallel or degenerate: no single meeting point
      const w = sub(b0, a0)
      const t = cross(w, db) / denom
      const u = cross(w, da) / denom
      if (t < -EPS || t > 1 + EPS || u < -EPS || u > 1 + EPS) continue
      const point = lerp(a0, A.points[i], t)
      if (hits.some((h) => dist(h.point, point) < 1e-6)) continue
      hits.push({ point, sA: A.cum[i - 1] + t * (A.cum[i] - A.cum[i - 1]), sB: B.cum[j - 1] + u * (B.cum[j] - B.cum[j - 1]) })
    }
  }
  return hits
}

/** Angle between two directions, folded to 0..90 degrees. */
const angleBetweenDeg = (u, v) => {
  const c = Math.abs(u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v))
  return (Math.acos(Math.min(1, c)) * 180) / Math.PI
}

/** Which side of the line through `origin` along `dir` the point p lies on: -1, 0 or 1. */
const sideOf = (p, origin, dir) => {
  const c = cross(dir, sub(p, origin))
  return Math.abs(c) < 1e-9 ? 0 : Math.sign(c)
}

module.exports = { polyline, nearestOnPolyline, nearestToRect, clampToRect, boundsGap, intersections, angleBetweenDeg, sideOf, dist }
