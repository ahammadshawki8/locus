const { degree, evaluate, derivative, realRootsIn, trim } = require('./polynomial')

const STEP = 1e-6

const changesSign = (coeffs, x) => (evaluate(coeffs, x - STEP) < 0) !== (evaluate(coeffs, x + STEP) < 0)

// Point ids are what layout.labelOffsets is keyed by (docs/contracts.md §1, tools/prints/layout-C.json).
// A plural mark numbers its points left to right: turning-point-1, turning-point-2, x-intercept-1, ...
// A singular mark keeps its name; if it finds several points they are numbered after it: x-intercept+1, x-intercept+2.
const PLURAL = { 'turning-points': 'turning-point', 'x-intercepts': 'x-intercept' }

const pointId = (mark, i, count) => {
  if (PLURAL[mark]) return `${PLURAL[mark]}-${i + 1}`
  return count === 1 ? mark : `${mark}${i + 1}`
}

/**
 * Find every requested mark on the graph, in the order the spec asks for them.
 * @returns {{ points: {id, mark, x, y}[], missing: {mark, reason}[] }}
 *   `missing` lists requested marks that are not on this graph, so TL-4 and the description can say so.
 */
const computeMarks = (spec) => {
  const { coeffs, domain: { min, max } } = spec.graph
  const inDomain = (x) => x >= min && x <= max
  const roots = () => realRootsIn(coeffs, min, max)

  const finders = {
    vertex: () => {
      if (degree(coeffs) !== 2) return { xs: [], reason: 'only a quadratic has a vertex' }
      const [a, b] = trim(coeffs)
      const x = -b / (2 * a)
      return { xs: inDomain(x) ? [x] : [], reason: `the vertex (x = ${x}) is outside the domain` }
    },
    'turning-points': () => {
      const slope = derivative(coeffs)
      const xs = realRootsIn(slope, min, max).filter((x) => x > min && x < max && changesSign(slope, x))
      return { xs, reason: 'the curve has no turning point inside the domain' }
    },
    'y-intercept': () => ({ xs: inDomain(0) ? [0] : [], reason: 'x = 0 is outside the domain' }),
    'x-intercepts': () => ({ xs: roots(), reason: 'the curve does not cross the x-axis inside the domain' }),
    'x-intercept+': () => ({ xs: roots().filter((x) => x > 0), reason: 'the curve does not cross the positive x-axis inside the domain' }),
    'x-intercept-': () => ({ xs: roots().filter((x) => x < 0), reason: 'the curve does not cross the negative x-axis inside the domain' })
  }
  const onXAxis = new Set(['x-intercepts', 'x-intercept+', 'x-intercept-'])

  const points = []
  const missing = []
  for (const mark of spec.mark) {
    const { xs, reason } = finders[mark]()
    if (!xs.length) {
      missing.push({ mark, reason })
      continue
    }
    xs.forEach((x, i) => points.push({
      id: pointId(mark, i, xs.length),
      mark,
      x,
      y: onXAxis.has(mark) ? 0 : evaluate(coeffs, x)
    }))
  }
  return { points, missing }
}

module.exports = { computeMarks }
