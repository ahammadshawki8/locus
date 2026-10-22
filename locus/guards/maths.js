// guard-maths: the graph shows exactly the maths the teacher asked for (docs/contracts.md §1).
//   1. spec.json still equals request.lock.json (graph + mark).
//   2. request.lock.json was written once, in the branch's first commit, and never changed after (or not at all on
//      this branch, if it already existed at the base).
//   3. What was plotted lies on the locked polynomial: every curve point of the rendered scene, mapped back from plate
//      millimetres with the layout's scales, satisfies y = f(x), and spans the locked domain; every mark is the point it
//      claims to be (on the curve; slope 0 at a vertex or turning point; y = 0 at an x-intercept; x = 0 at the
//      y-intercept). This uses its own arithmetic, not locus/core, so a generator bug can't hide itself.
const MM_TOL = 1e-6
const UNIT_TOL = 1e-9

const horner = (coeffs, x) => coeffs.reduce((acc, c) => acc * x + c, 0)
const slope = (coeffs, x) => {
  const n = coeffs.length - 1
  return coeffs.slice(0, n).reduce((acc, c, i) => acc * x + c * (n - i), 0)
}

const checkLockMatches = (spec, lock) => ['graph', 'mark']
  .filter((key) => JSON.stringify(spec[key]) !== JSON.stringify(lock[key]))
  .map((key) => `spec.json ${key} differs from request.lock.json`)

/**
 * @param {boolean} history.existedAtBase the lock was already on the target branch
 * @param {string[]} history.touchedBy commits in base..head that changed the lock, oldest first
 * @param {string|null} history.firstCommit the branch's first commit after the base
 */
const checkLockHistory = ({ existedAtBase, touchedBy, firstCommit }) => {
  if (existedAtBase && touchedBy.length) return [`request.lock.json was changed after it was first committed (${touchedBy.join(', ')})`]
  if (!existedAtBase && touchedBy.length > 1) return [`request.lock.json was changed after its first commit (${touchedBy.slice(1).join(', ')})`]
  if (!existedAtBase && touchedBy.length === 1 && touchedBy[0] !== firstCommit) return [`request.lock.json must be written in the branch's first commit, not in ${touchedBy[0]}`]
  return []
}

const checkPlotted = (scene, lock, layout) => {
  const errors = []
  const { coeffs, domain } = lock.graph
  const [ox, oy] = scene.origin
  const xs = layout.xScaleMm
  const ys = layout.yScaleMm
  const toUnits = ([xm]) => (xm - ox) / xs

  const curve = scene.lines.find((l) => l.kind === 'curve')
  if (!curve) return ['the scene has no curve']
  curve.points.forEach(([xm, ym], i) => {
    const expected = oy + horner(coeffs, toUnits([xm])) * ys
    if (Math.abs(ym - expected) > MM_TOL) errors.push(`curve point ${i} is ${Math.abs(ym - expected).toFixed(6)} mm off the locked polynomial`)
  })
  const [first, last] = [curve.points[0], curve.points[curve.points.length - 1]].map(toUnits)
  if (Math.abs(first - domain.min) > UNIT_TOL || Math.abs(last - domain.max) > UNIT_TOL) {
    errors.push(`the curve runs from x = ${first} to ${last}, not the locked domain ${domain.min} to ${domain.max}`)
  }

  for (const m of scene.marks) {
    const where = `mark ${m.id}`
    if (!lock.mark.includes(m.mark)) errors.push(`${where}: "${m.mark}" was not requested`)
    if (Math.abs(m.xMm - (ox + m.x * xs)) > MM_TOL || Math.abs(m.yMm - (oy + m.y * ys)) > MM_TOL) errors.push(`${where} is not plotted at its own (x, y)`)
    if (m.x < domain.min - UNIT_TOL || m.x > domain.max + UNIT_TOL) errors.push(`${where} is outside the locked domain`)
    const fx = horner(coeffs, m.x)
    const scale = 1 + coeffs.reduce((s, c) => s + Math.abs(c), 0) * Math.max(1, Math.abs(m.x)) ** 3
    if (m.mark.startsWith('x-intercept')) {
      if (m.y !== 0 || Math.abs(fx) > 1e-9 * scale) errors.push(`${where} is not where the curve crosses y = 0`)
      if ((m.mark === 'x-intercept+' && !(m.x > 0)) || (m.mark === 'x-intercept-' && !(m.x < 0))) errors.push(`${where} is on the wrong side of x = 0`)
    } else {
      if (Math.abs(m.y - fx) > 1e-9 * scale) errors.push(`${where} is not on the locked curve`)
      if (m.mark === 'y-intercept' && m.x !== 0) errors.push(`${where} is not at x = 0`)
      if ((m.mark === 'vertex' || m.mark === 'turning-points') && Math.abs(slope(coeffs, m.x)) > 1e-7 * scale) errors.push(`${where} is not where the slope is 0`)
    }
  }
  return errors
}

/** @returns {{ pass: boolean, errors: string[] }} */
const checkMaths = ({ spec, lock, scene, layout, history }) => {
  const errors = [
    ...checkLockMatches(spec, lock),
    ...(history ? checkLockHistory(history) : []),
    ...checkPlotted(scene, lock, layout)
  ]
  return { pass: errors.length === 0, errors }
}

module.exports = { checkMaths, checkLockHistory, checkPlotted, checkLockMatches }
