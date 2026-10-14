// TL-2 (label gap) and TL-3 (label overlap). Braille labels are not built yet, so a scene has no labels and both rules
// are not applicable. If labels appear before these checks exist, the rules fail instead of passing unchecked.
const NOT_APPLICABLE = 'not applicable: no labels yet'

const labelRule = (id, message) => (scene) => {
  if (!scene.labels.length) return { id, passed: true, violations: [], note: NOT_APPLICABLE, summary: NOT_APPLICABLE }
  const note = `${scene.labels.length} labels found, but the ${id} check is not built yet`
  return {
    id,
    passed: false,
    violations: [{ message: `${message}: not checked yet`, measuredMm: null, requiredMm: null, at: null, subject: scene.labels.map((l) => l.id) }],
    note,
    summary: note
  }
}

module.exports = {
  checkLabelGap: labelRule('TL-2', 'This label touches a line'),
  checkLabelOverlap: labelRule('TL-3', 'These labels overlap')
}
