// touchcheck: the five touch rules, measured on the rendered scene (docs/contracts.md §4, §5) with the values in the
// scene's printer profile. Passing means the spacing and completeness checks passed, not that a reader will
// understand the graphic by touch.
const { checkLineGap } = require('./rules/tl1')
const { checkLabelGap, checkLabelOverlap } = require('./rules/labels')
const { checkInventory } = require('./rules/tl4')
const { checkPrintable } = require('./rules/tl5')

/**
 * @param {object} scene scene.json from the render job
 * @param {object} profile the printer profile the scene was rendered for
 * @param {object} [options.requested] the spec's `mark` list, for TL-4
 * @returns {{ report: object, results: object[] }} the contract report and the full rule results (for the overlay)
 */
const touchcheck = (scene, profile, options = {}) => {
  if (scene.profileId !== profile.id) throw new Error(`scene was rendered for profile "${scene.profileId}", not "${profile.id}"`)
  const results = [
    checkLineGap(scene, profile),
    checkLabelGap(scene, profile),
    checkLabelOverlap(scene, profile),
    checkInventory(scene, profile, options),
    checkPrintable(scene, profile)
  ]
  const report = {
    schemaVersion: 1,
    profileId: profile.id,
    passed: results.every((r) => r.passed),
    rules: results.map(({ id, passed, violations, note }) => ({ id, passed, violations, ...(note && { note }) }))
  }
  return { report, results }
}

module.exports = { touchcheck }
