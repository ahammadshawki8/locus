// TL-1 line gap: every two raised lines keep at least `minLineGapMm` of clear space between their edges, except where
// they really meet. How a real meeting is told apart from lines running together: docs/decisions.md (2026-10-14).
const { polyline, nearestOnPolyline, boundsGap, intersections, sideOf, dist } = require('../geometry')

const MESSAGE = 'These lines are too close: a fingertip feels one line'
const STEP_MM = 0.5 // sampling step along each line
const SIDE_PROBE_MM = 1 // how far either side of a crossing we look to see whether a line passes through

const round2 = (v) => Math.round(v * 100) / 100
const midpoint = (p, q) => ({ xMm: round2((p[0] + q[0]) / 2), yMm: round2((p[1] + q[1]) / 2) })

/** Does `line` pass from one side of `other`'s local direction to the other at arc positions (s, sOther)? */
const passesThrough = (line, s, other, sOther) => {
  const origin = other.pl.pointAt(sOther)
  const dir = other.pl.directionAt(sOther)
  return sideOf(line.pl.pointAt(s - SIDE_PROBE_MM), origin, dir) * sideOf(line.pl.pointAt(s + SIDE_PROBE_MM), origin, dir) < 0
}

/**
 * Real meetings of lines A and B: crossings (each line passes from one side of the other to the other) and joins (an
 * end of one line touches the other). A tangent touch is not a real meeting: the lines run together there.
 * @returns {{sA: number, sB: number}[]} arc positions of each meeting on A and on B
 */
const realMeetings = (A, B, halfSum) => {
  const meetings = []
  const isEnd = (line, s) => s < 1e-6 || s > line.pl.length - 1e-6

  for (const { sA, sB } of intersections(A.pl, B.pl)) {
    if (isEnd(A, sA) || isEnd(B, sB)) continue // an end on the other line is a join, handled below
    if (passesThrough(A, sA, B, sB) && passesThrough(B, sB, A, sA)) meetings.push({ sA, sB })
  }

  const joins = (from, to, flip) => {
    for (const s of [0, from.pl.length]) {
      const hit = nearestOnPolyline(from.pl.pointAt(s), to.pl)
      if (hit.distance > halfSum) continue // raised ends do not touch: not a join (the end check measures it)
      meetings.push(flip ? { sA: hit.s, sB: s } : { sA: s, sB: hit.s })
    }
  }
  joins(A, B, false)
  joins(B, A, true)
  return meetings
}

/**
 * Walk along `line` away from a meeting at s0 while the gap to the other line keeps growing, until it reaches `minGap`.
 * That stretch is close only because the lines meet. Where the gap stops growing first, the lines run together and the
 * rest is measured as usual.
 * @returns {[number, number]} excused arc interval on `line`
 */
const departure = (line, gapTo, s0, minGap) => {
  const walk = (dir) => {
    let s = s0
    let gap = gapTo(line.pl.pointAt(s0))
    for (;;) {
      const next = s + dir * STEP_MM
      if (next < 0 || next > line.pl.length) return dir < 0 ? 0 : line.pl.length
      const nextGap = gapTo(line.pl.pointAt(next))
      if (nextGap >= minGap) return next
      if (nextGap <= gap + 1e-9) return s
      s = next
      gap = nextGap
    }
  }
  return [walk(-1), walk(1)]
}

const clusters = (candidates, linkMm) => {
  const groups = []
  const seen = new Set()
  for (let i = 0; i < candidates.length; i++) {
    if (seen.has(i)) continue
    const group = [candidates[i]]
    seen.add(i)
    for (let k = 0; k < group.length; k++) {
      for (let j = 0; j < candidates.length; j++) {
        if (!seen.has(j) && dist(group[k].mid, candidates[j].mid) <= linkMm) {
          seen.add(j)
          group.push(candidates[j])
        }
      }
    }
    groups.push(group)
  }
  return groups
}

const checkPair = (A, B, minGap) => {
  const halfSum = (A.widthMm + B.widthMm) / 2
  const gapTo = (target) => (p) => nearestOnPolyline(p, target.pl).distance - halfSum

  const meetings = realMeetings(A, B, halfSum)
  const excusedA = meetings.map(({ sA }) => departure(A, gapTo(B), sA, minGap))
  const excusedB = meetings.map(({ sB }) => departure(B, gapTo(A), sB, minGap))
  const excused = (intervals, s) => intervals.some(([lo, hi]) => s >= lo && s <= hi)

  const candidates = []
  let closest = null
  const measure = (p, target) => {
    const hit = nearestOnPolyline(p, target.pl)
    return { gap: hit.distance - halfSum, p, q: hit.point, mid: [(p[0] + hit.point[0]) / 2, (p[1] + hit.point[1]) / 2] }
  }

  // Along each line, outside the stretches excused by real meetings.
  for (const [line, other, intervals] of [[A, B, excusedA], [B, A, excusedB]]) {
    for (const { point, s } of line.pl.sample(STEP_MM)) {
      if (excused(intervals, s)) continue
      const m = measure(point, other)
      if (m.gap < minGap) candidates.push(m)
      else if (!closest || m.gap < closest.gap) closest = m
    }
  }

  // Every line end either joins the other line (raised edges touch) or stays minGap clear of it. An end in between,
  // including a short stub just past a crossing, is felt as a bump: the reader cannot tell whether the lines join.
  for (const [line, other] of [[A, B], [B, A]]) {
    for (const s of [0, line.pl.length]) {
      const m = measure(line.pl.pointAt(s), other)
      if (m.gap > 0 && m.gap < minGap) candidates.push(m)
    }
  }

  const violations = clusters(candidates, minGap + A.widthMm + B.widthMm).map((group) => {
    const worst = group.reduce((a, b) => (b.gap < a.gap ? b : a))
    return { message: MESSAGE, measuredMm: round2(Math.max(0, worst.gap)), requiredMm: minGap, at: midpoint(worst.p, worst.q), subject: [A.id, B.id] }
  })
  return { violations, meetings: meetings.length, closest: closest && { ...closest, subject: [A.id, B.id] } }
}

/** TL-1 on a scene (docs/contracts.md §5) with the profile's rule values. */
const checkLineGap = (scene, profile) => {
  const { minLineGapMm: minGap } = profile.rules['TL-1']
  const lines = scene.lines.map((l) => ({ ...l, pl: polyline(l.points) }))
  const violations = []
  let meetings = 0
  let closest = null

  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      const A = lines[i]
      const B = lines[j]
      if (boundsGap(A.pl.bounds, B.pl.bounds) - (A.widthMm + B.widthMm) / 2 >= minGap) continue
      const pair = checkPair(A, B, minGap)
      violations.push(...pair.violations)
      meetings += pair.meetings
      if (pair.closest && (!closest || pair.closest.gap < closest.gap)) closest = pair.closest
    }
  }

  const closestPassed = closest && {
    measuredMm: round2(closest.gap), requiredMm: minGap, at: midpoint(closest.p, closest.q), subject: closest.subject
  }
  const passed = violations.length === 0
  const worst = violations.reduce((a, v) => Math.min(a, v.measuredMm), Infinity)
  return {
    id: 'TL-1',
    passed,
    violations,
    note: `Clear gap between raised edges, outside ${meetings} real crossings or joins (docs/decisions.md, 2026-10-14).`,
    summary: passed
      ? `Lines at least ${minGap} mm apart${closestPassed ? `; closest ${closestPassed.measuredMm} mm` : ''}`
      : `${violations.length} ${violations.length === 1 ? 'place' : 'places'} where lines are closer than ${minGap} mm; closest ${worst} mm`,
    closestPassed
  }
}

module.exports = { checkLineGap, MESSAGE }
