// Polynomials as coefficient arrays, highest degree first: [a, b, c, d] is a*x^3 + b*x^2 + c*x + d.
// Plain arithmetic only: nothing from a request is ever evaluated as code.

const ZERO = 1e-9

const trim = (coeffs) => {
  let i = 0
  while (i < coeffs.length - 1 && coeffs[i] === 0) i++
  return coeffs.slice(i)
}

const degree = (coeffs) => trim(coeffs).length - 1

const evaluate = (coeffs, x) => coeffs.reduce((acc, c) => acc * x + c, 0)

const derivative = (coeffs) => {
  const n = coeffs.length - 1
  if (n === 0) return [0]
  return coeffs.slice(0, n).map((c, i) => c * (n - i))
}

const bisect = (coeffs, a, b) => {
  let fa = evaluate(coeffs, a)
  for (let i = 0; i < 200 && a !== b; i++) {
    const m = (a + b) / 2
    const fm = evaluate(coeffs, m)
    if (fm === 0) return m
    if ((fa < 0) === (fm < 0)) {
      a = m
      fa = fm
    } else {
      b = m
    }
  }
  return (a + b) / 2
}

/**
 * Real roots in [min, max], ascending. The critical points split the interval into monotone pieces, so each piece
 * holds at most one sign change; touching roots (double roots) are found at the critical points themselves.
 * A constant polynomial has no isolated roots, so it returns [] (even for y = 0).
 */
const realRootsIn = (coeffs, min, max) => {
  const c = trim(coeffs)
  if (c.length === 1) return []
  const breaks = [min, ...realRootsIn(derivative(c), min, max), max]
  const roots = []
  const push = (x) => {
    if (!roots.length || Math.abs(x - roots[roots.length - 1]) > 1e-7) roots.push(x)
  }
  for (let i = 0; i < breaks.length; i++) {
    const a = breaks[i]
    const fa = evaluate(c, a)
    if (Math.abs(fa) < ZERO) push(a)
    if (i === breaks.length - 1) break
    const b = breaks[i + 1]
    const fb = evaluate(c, b)
    if (Math.abs(fa) >= ZERO && Math.abs(fb) >= ZERO && (fa < 0) !== (fb < 0)) push(bisect(c, a, b))
  }
  return roots
}

const formatCoefficient = (value) => String(Number(value.toFixed(6)))

/** Plain ASCII equation, e.g. "y = -0.5x^2 + 2x + 1". */
const formatPolynomial = (coeffs) => {
  const n = coeffs.length - 1
  const terms = []
  coeffs.forEach((c, i) => {
    if (c === 0) return
    const power = n - i
    const variable = power === 0 ? '' : power === 1 ? 'x' : `x^${power}`
    const magnitude = Math.abs(c) === 1 && power > 0 ? '' : formatCoefficient(Math.abs(c))
    const sign = c < 0 ? '-' : '+'
    terms.push(terms.length ? ` ${sign} ${magnitude}${variable}` : `${sign === '-' ? '-' : ''}${magnitude}${variable}`)
  })
  return `y = ${terms.length ? terms.join('') : '0'}`
}

module.exports = { degree, evaluate, derivative, realRootsIn, formatPolynomial, trim }
