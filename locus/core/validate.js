const fs = require('fs')
const path = require('path')
const Ajv2020 = require('ajv/dist/2020')

const { degree } = require('./polynomial')

const schemaDir = path.join(__dirname, 'schema')
const profileDir = path.join(__dirname, 'profiles')

const ajv = new Ajv2020({ allErrors: true, strict: true })
const load = (name) => ajv.compile(JSON.parse(fs.readFileSync(path.join(schemaDir, name), 'utf8')))
const validators = {
  spec: load('spec.schema.json'),
  layout: load('layout.schema.json'),
  manifest: load('manifest.schema.json')
}

const formatErrors = (errors) => (errors || []).map((e) => `${e.instancePath || '/'} ${e.message}`)

const profileExists = (profileId) => fs.existsSync(path.join(profileDir, `${profileId}.json`))

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
  return errors
}

const validateLayout = (layout) => validators.layout(layout) ? [] : formatErrors(validators.layout.errors)

const validateManifest = (manifest) => validators.manifest(manifest) ? [] : formatErrors(validators.manifest.errors)

/**
 * Check that a spec still matches its request.lock.json (what guard-maths enforces on the spec side).
 * @returns {string[]} errors; empty when the locked fields are identical
 */
const checkLock = (spec, lock) => {
  const errors = []
  for (const key of ['schemaVersion', 'requestId', 'graph', 'mark']) {
    if (JSON.stringify(spec[key]) !== JSON.stringify(lock[key])) errors.push(`/${key} differs from request.lock.json`)
  }
  return errors
}

module.exports = { validateSpec, validateLayout, validateManifest, checkLock }
