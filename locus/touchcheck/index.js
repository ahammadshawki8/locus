// touchcheck: the five touch rules, measured on the rendered scene with the values in the scene's printer profile.
// Passing means the spacing and size checks passed, not that a learner can understand the graphic.
const { checkLineGap } = require('./rules/tl1')
const { checkLabelGap, checkLabelOverlap } = require('./rules/labels')
const { checkInventory } = require('./rules/tl4')
const { checkPrintable } = require('./rules/tl5')
const remedies = require('./remedies.json')

// Plain words per rule (projectLocus.md §10). These are the report's `message` and what the video shows.
const MESSAGES = {
  'TL-1': 'These lines are too close: a fingertip feels one line',
  'TL-2': 'This label touches a line',
  'TL-3': 'These labels overlap',
  'TL-4': 'Something requested is missing',
  'TL-5': 'Too big for the printer / features too thin'
}

const round1 = (v) => Math.round(v * 10) / 10

/** One report result per failing place, or one passing result per rule (docs/contracts.md §4). */
const toResults = (rule) => {
  if (rule.passed) return [{ rule: rule.id, pass: true }]
  const allowedFixes = remedies.rules[rule.id].map((r) => r.id)
  return rule.violations.map((v) => ({
    rule: rule.id,
    pass: false,
    message: MESSAGES[rule.id],
    ...(v.measuredMm != null && { measuredMm: round1(v.measuredMm) }),
    ...(v.requiredMm != null && { requiredMm: v.requiredMm }),
    ...(v.at && { at: [round1(v.at.xMm), round1(v.at.yMm)] }),
    allowedFixes
  }))
}

/**
 * @param {object} scene scene.json from the render job
 * @param {object} profile the printer profile the scene was rendered for
 * @param {object} [options.requested] the spec's `mark` list, for TL-4
 * @param {number} [options.requestId] the issue number (spec.requestId)
 * @param {number} [options.attempt] which layout attempt this is (1 = the intake agent's default layout)
 * @returns {{ report: object, results: object[] }} the contract report and the full rule results (for the overlay)
 */
const touchcheck = (scene, profile, { requested, requestId = 0, attempt = 1 } = {}) => {
  if (scene.profileId !== profile.id) throw new Error(`scene was rendered for profile "${scene.profileId}", not "${profile.id}"`)
  const results = [
    checkLineGap(scene, profile),
    checkLabelGap(scene, profile),
    checkLabelOverlap(scene, profile),
    checkInventory(scene, profile, { requested }),
    checkPrintable(scene, profile)
  ]
  const report = {
    requestId,
    attempt,
    profileId: profile.id,
    pass: results.every((r) => r.passed),
    results: results.flatMap(toResults)
  }
  return { report, results }
}

/** The one-line form agents read from the job log (docs/contracts.md §4, D8). */
const reportLine = (report) => `LOCUS_REPORT ${JSON.stringify(report)}`

module.exports = { touchcheck, reportLine, MESSAGES }
