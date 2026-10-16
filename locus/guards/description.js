// guard-description: every number in the learner description is a computed value (projectLocus.md §5, §11).
// The description may be written by an agent, so it is read as free text. Every number in it must be one of:
//   a coefficient of the locked polynomial (with or without its sign) or a power after "^" up to its degree;
//   an end of the locked domain;
//   the x or y of a marked point (from the rendered scene, which guard-maths has checked against the lock);
//   the braille ID number (the issue number).
// A number that only matches after rounding to 2 decimals must say so: "about 4.45". Numbers written as words are
// not checked (a known limit).
const NUMBER = /\^?-?\d+(?:\.\d+)?/g
const TOL = 1e-9

const round2 = (v) => Math.round(v * 100) / 100

const allowedValues = ({ lock, scene, requestId }) => {
  const { coeffs, domain } = lock.graph
  return [
    ...coeffs, ...coeffs.map(Math.abs),
    domain.min, domain.max,
    ...scene.marks.flatMap((m) => [m.x, m.y]),
    requestId
  ]
}

/**
 * @param {string} text description.txt
 * @param {object} facts.lock request.lock.json; facts.scene the rendered scene; facts.requestId the issue number
 * @returns {{ pass: boolean, errors: string[], numbers: number }}
 */
const checkDescription = (text, facts) => {
  const values = allowedValues(facts)
  const { coeffs } = facts.lock.graph
  const lead = coeffs.findIndex((c) => c !== 0)
  const degree = lead < 0 ? 0 : coeffs.length - 1 - lead // [0, -0.5, 2, 1] is a quadratic
  const errors = []
  let numbers = 0
  for (const match of text.matchAll(NUMBER)) {
    numbers++
    const token = match[0]
    if (token.startsWith('^')) {
      const power = Number(token.slice(1))
      if (!(Number.isInteger(power) && power >= 2 && power <= degree)) errors.push(`"${token}" is not a power of the locked polynomial`)
      continue
    }
    const n = Number(token)
    if (values.some((v) => Math.abs(v - n) < TOL)) continue
    if (values.some((v) => Math.abs(round2(v) - n) < TOL)) {
      if (!/about\s+$/.test(text.slice(Math.max(0, match.index - 8), match.index))) errors.push(`"${token}" is rounded; say "about ${token}"`)
      continue
    }
    const line = text.slice(0, match.index).split('\n').length
    errors.push(`"${token}" (line ${line}) is not a computed value`)
  }
  return { pass: errors.length === 0, errors, numbers }
}

module.exports = { checkDescription }
