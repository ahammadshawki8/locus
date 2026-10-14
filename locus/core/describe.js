// Plain-language learner description. Every number here comes from computed values; guard-description checks that.
const { formatPolynomial } = require('./polynomial')

const LIMITATION = 'Note: automated checks do not certify that a reader will understand this graphic by touch.'

/** Round to 2 decimals; prefix "about" when rounding changed the value. */
const formatNumber = (value) => {
  const rounded = Math.round(value * 100) / 100
  const text = String(rounded === 0 ? 0 : rounded)
  return Math.abs(rounded - value) > 1e-9 ? `about ${text}` : text
}

const sentenceFor = (point, coeffs) => {
  const at = `x = ${formatNumber(point.x)}, y = ${formatNumber(point.y)}`
  switch (point.mark) {
    case 'vertex': {
      const leading = coeffs.find((c) => c !== 0)
      return `The ${leading < 0 ? 'highest' : 'lowest'} point (vertex) is at ${at}.`
    }
    case 'turning-points': return `A turning point is at ${at}.`
    case 'y-intercept': return `The curve crosses the y-axis at y = ${formatNumber(point.y)}.`
    default: return `The curve crosses the x-axis at x = ${formatNumber(point.x)}.`
  }
}

const describe = (spec, { points, missing }) => {
  const { coeffs, domain } = spec.graph
  return [
    `This tactile graph shows ${formatPolynomial(coeffs)}, for x from ${formatNumber(domain.min)} to ${formatNumber(domain.max)}.`,
    ...points.map((p) => sentenceFor(p, coeffs)),
    ...missing.map((m) => `The ${m.mark} was requested but is not on this graph: ${m.reason}.`),
    LIMITATION
  ].join('\n') + '\n'
}

module.exports = { describe, formatNumber }
