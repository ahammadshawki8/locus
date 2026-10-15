// The release bundle out/bundle/graph-<iid>-v<n>/ + .zip (docs/contracts.md §3) and its manifest (§5). Everything here
// is built from what the render, touchcheck and guard-* jobs wrote; the CLI (cli/bundle.js) gathers those outputs.
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const { toZip } = require('./zip')

// Contract §3 order; the zip lists the files in this order too.
const BUNDLE_FILES = ['graph.stl', 'graph.svg', 'overlay.svg', 'description.txt', 'touchcheck-report.json', 'manifest.json', 'README.txt']
const HASHED = ['graph.stl', 'graph.svg', 'description.txt']
const LIMITATIONS = 'Automated checks measure spacing and size; they do not certify that a learner can understand the graphic.'
const GUARDS = ['scope', 'maths', 'description']

const artifactName = (iid, n) => `graph-${iid}-v${n}`

const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex')

/**
 * The version of the next bundle of request `iid`, from the release tags `graph-<iid>-v<n>` that already exist.
 * @returns {{ latest: string|null, next: number }}
 */
const nextVersion = (iid, tags) => {
  const pattern = new RegExp(`^graph-${iid}-v([1-9][0-9]*)$`)
  const versions = tags.map((t) => pattern.exec(t)).filter(Boolean).map((m) => Number(m[1]))
  if (!versions.length) return { latest: null, next: 1 }
  const top = Math.max(...versions)
  return { latest: artifactName(iid, top), next: top + 1 }
}

/** Why this bundle must not be built: a graph that failed touchcheck or a guard is never released. */
const blockers = ({ report, guards }) => [
  ...(report.pass ? [] : [`touchcheck failed (attempt ${report.attempt}): no bundle for a graph that fails TL-1 to TL-5`]),
  ...GUARDS.filter((g) => guards[g].pass !== true).map((g) => `guard-${g} did not pass`)
]

/**
 * manifest.json (contracts §5) from job outputs.
 * @param {object} i.spec the request's spec.json
 * @param {object} i.profile the printer profile it was rendered with
 * @param {object} i.hashes sha256 of graph.stl, graph.svg and description.txt
 * @param {object} i.report touchcheck-report.json
 * @param {object} i.guards { scope, maths, description }: the guards' out/guards/*.json results
 * @param {string} i.sourceCommit the commit the pipeline ran on
 * @param {number} i.pipelineId the CI pipeline id (0 outside a pipeline)
 */
const buildManifest = (i) => ({
  artifactId: artifactName(i.spec.requestId, i.version),
  brailleId: `G${i.spec.requestId}`,
  requestIssue: i.spec.requestId,
  sourceCommit: i.sourceCommit,
  pipelineId: i.pipelineId,
  generatorVersion: i.generatorVersion,
  profile: { id: i.profile.id, version: i.profile.version },
  hashes: Object.fromEntries(HASHED.map((f) => [f, i.hashes[f]])),
  touchcheck: { pass: i.report.pass, attempts: i.report.attempt },
  guards: Object.fromEntries(GUARDS.map((g) => [g, i.guards[g].pass === true])),
  agentSessions: i.agentSessions,
  releaseMode: i.releaseMode,
  releaseTag: null,
  limitations: LIMITATIONS
})

const mm = (v) => v.toFixed(1)

/** README.txt: how to print, what each file is, and the limitations line. Plain ASCII (rule H2). */
const readmeText = ({ artifactId, brailleId, sizeMm, attempts }) => [
  `Locus tactile graph ${artifactId}`,
  `Braille ID on the plate: ${brailleId}`,
  '',
  'How to print',
  '- Open graph.stl in your slicer. The units are millimetres.',
  '- Print at 100% scale. Do not resize it: the touch checks measured the spacing at this size.',
  `  In the slicer the part must measure ${sizeMm.map(mm).join(' x ')} mm.`,
  '- Lay it flat on the bed, as it is in the file. The prototype prints used PLA, 0.12 to 0.16 mm layers and no supports.',
  '- Hold the plate with the triangle at the top-left. The braille ID is at the top-right.',
  '',
  'Files',
  '- graph.stl: the plate to 3D print',
  '- graph.svg: the same graph seen from above, in millimetres',
  '- overlay.svg: what the touch checks measured, drawn on the graph',
  '- description.txt: a text description of the graph for the learner',
  `- touchcheck-report.json: touch checks TL-1 to TL-5, passed after ${attempts} attempt${attempts === 1 ? '' : 's'}`,
  '- manifest.json: where this bundle came from: commit, pipeline, file hashes and checks',
  '',
  `Limitations: ${LIMITATIONS}`,
  ''
].join('\n')

/**
 * Write <root>/<artifactId>/ with the seven contract files, and <root>/<artifactId>.zip holding that folder.
 * An earlier bundle with the same name is replaced.
 * @param {object} files { name: Buffer } for every name in BUNDLE_FILES
 * @param {Date} modified the time stamped on the zip entries
 */
const writeBundle = (root, artifactId, files, modified) => {
  const missing = BUNDLE_FILES.filter((f) => !files[f])
  if (missing.length) throw new Error(`missing bundle file(s): ${missing.join(', ')}`)
  const dir = path.join(root, artifactId)
  const zip = `${dir}.zip`
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })
  for (const f of BUNDLE_FILES) fs.writeFileSync(path.join(dir, f), files[f])
  fs.writeFileSync(zip, toZip(BUNDLE_FILES.map((f) => ({ name: `${artifactId}/${f}`, data: files[f] })), modified))
  return { dir, zip }
}

module.exports = { BUNDLE_FILES, LIMITATIONS, artifactName, nextVersion, buildManifest, blockers, readmeText, sha256, writeBundle }
