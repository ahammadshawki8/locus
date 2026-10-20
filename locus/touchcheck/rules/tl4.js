// TL-4 inventory: both axes, the curve, every requested mark with its braille label, and (in key mode) a key that lists
// every keyed mark. No allowed fix (remedies.json): a missing feature is never "fixed" by deleting the request for it.
const MESSAGE = 'Something requested is missing'

const onPlate = (scene, x, y) => x >= 0 && y >= 0 && x <= scene.plate.widthMm && y <= scene.plate.heightMm

/**
 * @param {object} options.requested the spec's `mark` list; defaults to what the scene drew or reported missing
 */
const checkInventory = (scene, profile, { requested } = {}) => {
  const wanted = requested || [...new Set([...scene.marks.map((m) => m.mark), ...scene.missing.map((m) => m.mark)])]
  const violations = []
  const present = []
  const missing = (subject, what, detail, at = null) =>
    violations.push({ message: `${MESSAGE}: ${what} (${detail})`, measuredMm: null, requiredMm: null, at, subject: [subject] })

  for (const [id, kind] of [['x-axis', 'axis'], ['y-axis', 'axis'], ['curve', 'curve']]) {
    const line = scene.lines.find((l) => (kind === 'curve' ? l.kind === 'curve' : l.id === id))
    if (!line || line.points.length < 2) missing(id, id, 'not drawn')
    else present.push({ subject: id, at: { xMm: line.points[0][0], yMm: line.points[0][1] } })
  }

  for (const mark of wanted) {
    const drawn = scene.marks.filter((m) => m.mark === mark)
    const off = drawn.find((m) => !onPlate(scene, m.xMm, m.yMm))
    if (off) missing(mark, mark, 'off the plate', { xMm: off.xMm, yMm: off.yMm })
    else if (drawn.length) drawn.forEach((m) => present.push({ subject: m.id, at: { xMm: m.xMm, yMm: m.yMm } }))
    else {
      const known = scene.missing.find((m) => m.mark === mark)
      missing(mark, mark, known ? known.reason : 'not drawn')
    }
  }

  // Every drawn mark carries a braille label (the spec always asks for braille-grade1).
  for (const m of scene.marks) {
    if (!scene.labels.some((l) => l.kind === 'mark' && l.for === m.id)) missing(`label-${m.id}`, `braille label for ${m.id}`, 'not drawn', { xMm: m.xMm, yMm: m.yMm })
  }

  // Key mode: the key lists every keyed mark, and each entry is drawn as a key row.
  const keyed = scene.labelMode === 'key'
  if (keyed && !scene.key) missing('key', 'the key', 'not drawn')
  if (keyed && scene.key) {
    for (const m of scene.marks) {
      const entry = scene.key.entries.find((e) => e.for === m.id)
      if (!entry) missing(`key-${m.id}`, `key entry for ${m.id}`, 'not in the key')
      else if (!scene.labels.some((l) => l.kind === 'key' && l.id === `key-${entry.letter}`)) missing(`key-${entry.letter}`, `key entry for ${m.id}`, 'not drawn')
    }
  }

  const passed = violations.length === 0
  return {
    id: 'TL-4',
    passed,
    violations,
    summary: passed
      ? `Everything requested is there: ${present.map((p) => p.subject).join(', ')}, each mark with its braille label${keyed ? ', and the key' : ''}`
      : `Missing: ${violations.map((v) => v.subject[0]).join(', ')}`,
    present
  }
}

module.exports = { checkInventory }
