const fs = require('fs')
const path = require('path')
const Ajv2020 = require('ajv/dist/2020')

const { degree } = require('./polynomial')
const { profileExists } = require('./profiles')

const schemaDir = path.join(__dirname, 'schema')

const ajv = new Ajv2020({ allErrors: true, strict: true })
const load = (name) => ajv.compile(JSON.parse(fs.readFileSync(path.join(schemaDir, name), 'utf8')))
const validators = {
  spec: load('spec.schema.json'),
  layout: load('layout.schema.json'),
  manifest: load('manifest.schema.json'),
  touchcheckReport: load('touchcheck-report.schema.json')
}

const formatErrors = (errors) => (errors || []).map((e) => `${e.instancePath || '/'} ${e.message}`)

/**
 * Validate a request spec (docs/contracts.md §1).
 * @returns {string[]} errors; empty when valid
 */
const validateSpec = (spec) => {
  if (!validators.spec(spec)) return formatErrors(validators.spec.errors)
  const errors = []
  if (spec.graph.domain.min >= spec.graph.domain.max) errors.push('/graph/domain min must be less than max')
  if (!profileExists(spec.profileId)) errors.push(`/profileId unknown profile "${spec.profileId}"`)
  if (spec.mark.includes('vertex') && degree(spec.graph.coeffs) !== 2) errors.push('/mark "vertex" needs a quadratic; use "turning-points"')
  if (spec.mark.includes('x-intercepts') && spec.mark.some((m) => m === 'x-intercept+' || m === 'x-intercept-')) {
    errors.push('/mark "x-intercepts" already marks every x-intercept; drop "x-intercept+" / "x-intercept-"')
  }
  return errors
}

const validateLayout = (layout) => validators.layout(layout) ? [] : formatErrors(validators.layout.errors)

/** Validate a bundle manifest (docs/contracts.md §5), including that its names agree with the issue number. */
const validateManifest = (manifest) => {
  if (!validators.manifest(manifest)) return formatErrors(validators.manifest.errors)
  const errors = []
  if (manifest.brailleId !== `G${manifest.requestIssue}`) errors.push('/brailleId must be G + requestIssue')
  if (!manifest.artifactId.startsWith(`graph-${manifest.requestIssue}-v`)) errors.push('/artifactId must be graph-<requestIssue>-v<n>')
  return errors
}

const RULES = ['TL-1', 'TL-2', 'TL-3', 'TL-4', 'TL-5']

/**
 * Validate a touchcheck report (docs/contracts.md §4): every rule has results, a rule either passes once or fails
 * in one or more places, and `pass` is true exactly when nothing failed.
 * @returns {string[]} errors; empty when valid
 */
const validateTouchcheckReport = (report) => {
  if (!validators.touchcheckReport(report)) return formatErrors(validators.touchcheckReport.errors)
  const errors = []
  for (const rule of RULES) {
    const results = report.results.filter((r) => r.rule === rule)
    if (!results.length) errors.push(`/results has no result for ${rule}`)
    else if (results.some((r) => r.pass) && results.length > 1) errors.push(`/results ${rule} passes once or fails in each place, not both`)
  }
  if (report.pass !== report.results.every((r) => r.pass)) errors.push('/pass must be true exactly when every result passed')
  return errors
}

/**
 * Check that a spec still matches its request.lock.json (what guard-maths enforces on the spec side).
 * @returns {string[]} errors; empty when the locked fields are identical
 */
const checkLock = (spec, lock) => {
  const errors = []
  for (const key of ['graph', 'mark']) {
    if (JSON.stringify(spec[key]) !== JSON.stringify(lock[key])) errors.push(`/${key} differs from request.lock.json`)
  }
  return errors
}

module.exports = { validateSpec, validateLayout, validateManifest, validateTouchcheckReport, checkLock }
