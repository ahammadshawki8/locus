// `locus bundle <requests/<iid>>`: the entry point of the `bundle` CI job (docs/contracts.md §3, §5, §6).
//   locus bundle <requests/<iid>> [--out <render dir>] [--guards <dir>] [--bundle-dir <dir>] [--bundle-version <n>]
//                [--release-mode hands-off|supervised] [--agent-session <url>]...
// Reads only what the jobs wrote: the render output (graph.stl, graph.svg, description.txt), touchcheck's report and
// overlay, and out/guards/{scope,maths-<name>,description-<name>}.json. The commit is CI_COMMIT_SHA (else HEAD), the
// pipeline CI_PIPELINE_ID (else 0: built outside a pipeline), the release mode RELEASE_MODE (else hands-off).
// <n> is one more than the newest release tag graph-<iid>-v<n>; when the request folder is unchanged since that tag
// there is nothing new to bundle.
// Exit 0 = bundled (or nothing to bundle), 1 = refused (touchcheck or a guard failed), 2 = could not bundle (missing or
// stale input), 64 = usage.
const fs = require('fs')
const path = require('path')

const { git } = require('../guards/git')
const { buildManifest, blockers, nextVersion, readmeText, sha256, writeBundle, artifactName, LIMITATIONS } = require('../core/bundle')
const { readBounds } = require('../core/stl')
const { loadProfile } = require('../core/profiles')
const { validateManifest, validateTouchcheckReport } = require('../core/validate')
const { version: generatorVersion } = require('../package.json')

const RELEASE_MODES = ['hands-off', 'supervised']

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'))
const option = (args, name) => {
  const i = args.indexOf(name)
  return i >= 0 ? args.splice(i, 2)[1] : undefined
}
const options = (args, name) => {
  const values = []
  for (let v = option(args, name); v !== undefined; v = option(args, name)) values.push(v)
  return values
}

const cannotBundle = (dir, why) => {
  console.error(`bundle ${dir}: cannot bundle: ${why}`)
  return 2
}

const tryGit = (args) => {
  try {
    return git(args)
  } catch {
    return null
  }
}

/** true when `dir` has the same content at `ref` and at `commit`. */
const unchangedSince = (ref, commit, dir) => {
  try {
    git(['diff', '--quiet', ref, commit, '--', dir])
    return true
  } catch {
    return false
  }
}

const runBundle = (args, env = process.env) => {
  const dir = args.shift()
  if (!dir) {
    console.error('usage: locus bundle <requests/<iid>> [--out <render dir>] [--guards <dir>] [--bundle-dir <dir>] [--bundle-version <n>] [--release-mode hands-off|supervised] [--agent-session <url>]')
    return 64
  }
  const name = path.basename(path.resolve(dir))
  const outDir = option(args, '--out') || path.join('out', name)
  const guardsDir = option(args, '--guards') || path.join('out', 'guards')
  const bundleRoot = option(args, '--bundle-dir') || path.join('out', 'bundle')
  const versionArg = option(args, '--bundle-version')
  const releaseMode = option(args, '--release-mode') || env.RELEASE_MODE || 'hands-off'
  const agentSessions = options(args, '--agent-session')
  if (!RELEASE_MODES.includes(releaseMode)) {
    console.error(`release mode must be ${RELEASE_MODES.join(' or ')}, not "${releaseMode}"`)
    return 64
  }
  if (versionArg !== undefined && !/^[1-9][0-9]*$/.test(versionArg)) {
    console.error('--bundle-version must be a whole number from 1')
    return 64
  }

  // Every input must exist: a bundle is never built from a partial set of job outputs.
  const inputs = {
    spec: path.join(dir, 'spec.json'),
    stl: path.join(outDir, 'graph.stl'),
    svg: path.join(outDir, 'graph.svg'),
    description: path.join(outDir, 'description.txt'),
    report: path.join(outDir, 'touchcheck-report.json'),
    overlay: path.join(outDir, 'overlay.svg'),
    scope: path.join(guardsDir, 'scope.json'),
    maths: path.join(guardsDir, `maths-${name}.json`),
    descriptionGuard: path.join(guardsDir, `description-${name}.json`)
  }
  const missing = Object.values(inputs).find((f) => !fs.existsSync(f))
  if (missing) return cannotBundle(dir, `${missing} not found (run render, touchcheck and the three guards first)`)

  const spec = readJson(inputs.spec)
  const report = readJson(inputs.report)
  const guards = { scope: readJson(inputs.scope), maths: readJson(inputs.maths), description: readJson(inputs.descriptionGuard) }
  if (/^[0-9]+$/.test(name) && Number(name) !== spec.requestId) return cannotBundle(dir, `folder ${name} holds requestId ${spec.requestId}`)
  const reportErrors = validateTouchcheckReport(report)
  if (reportErrors.length) return cannotBundle(dir, `${inputs.report} is not a valid report: ${reportErrors.join('; ')}`)
  if (report.requestId !== spec.requestId || report.profileId !== spec.profileId) {
    return cannotBundle(dir, `${inputs.report} is for request ${report.requestId} (${report.profileId}), not ${spec.requestId} (${spec.profileId}): run touchcheck again`)
  }

  const refused = blockers({ report, guards })
  if (refused.length) {
    for (const why of refused) console.error(`bundle ${dir}: refused: ${why}`)
    return 1
  }

  const sourceCommit = env.CI_COMMIT_SHA || tryGit(['rev-parse', 'HEAD'])
  if (!sourceCommit) return cannotBundle(dir, 'no source commit (set CI_COMMIT_SHA or run inside the git repository)')
  const committed = tryGit(['show', '-s', '--format=%ct', sourceCommit])
  if (!committed) return cannotBundle(dir, `commit ${sourceCommit} not found`)
  const pipelineId = env.CI_PIPELINE_ID ? Number(env.CI_PIPELINE_ID) : 0
  if (!Number.isInteger(pipelineId) || pipelineId < 0) return cannotBundle(dir, `CI_PIPELINE_ID "${env.CI_PIPELINE_ID}" is not a pipeline id`)

  let version = Number(versionArg)
  if (versionArg === undefined) {
    const tags = (tryGit(['tag', '-l', `graph-${spec.requestId}-v*`]) || '').split('\n').filter(Boolean)
    const { latest, next } = nextVersion(spec.requestId, tags)
    if (latest && unchangedSince(latest, sourceCommit, dir)) {
      console.log(`bundle ${dir}: unchanged since ${latest}; nothing to bundle`)
      return 0
    }
    version = next
  }
  if (tryGit(['status', '--porcelain', '--', dir])) {
    console.log(`  warning: ${dir} has uncommitted changes; sourceCommit ${sourceCommit.slice(0, 8)} does not describe them`)
  }

  const files = {
    'graph.stl': fs.readFileSync(inputs.stl),
    'graph.svg': fs.readFileSync(inputs.svg),
    'overlay.svg': fs.readFileSync(inputs.overlay),
    'description.txt': fs.readFileSync(inputs.description),
    'touchcheck-report.json': fs.readFileSync(inputs.report)
  }
  const hashes = Object.fromEntries(['graph.stl', 'graph.svg', 'description.txt'].map((f) => [f, sha256(files[f])]))
  const manifest = buildManifest({
    spec, profile: loadProfile(spec.profileId), hashes, report, guards, sourceCommit, pipelineId, generatorVersion, version, releaseMode, agentSessions
  })
  const manifestErrors = validateManifest(manifest)
  if (manifestErrors.length) return cannotBundle(dir, `manifest does not follow contracts §5: ${manifestErrors.join('; ')}`)

  const { min, max } = readBounds(files['graph.stl'])
  files['manifest.json'] = Buffer.from(JSON.stringify(manifest, null, 2) + '\n')
  files['README.txt'] = Buffer.from(readmeText({
    artifactId: manifest.artifactId, brailleId: manifest.brailleId, sizeMm: [0, 1, 2].map((k) => max[k] - min[k]), attempts: report.attempt
  }))
  const written = writeBundle(bundleRoot, artifactName(spec.requestId, version), files, new Date(Number(committed) * 1000))

  console.log(`bundle ${dir}: ${manifest.artifactId} (braille ID ${manifest.brailleId}) in ${written.dir} and ${written.zip}`)
  console.log(`  commit ${sourceCommit.slice(0, 8)}, pipeline ${pipelineId}, ${releaseMode}; touchcheck passed after ${report.attempt} attempt(s); guard-scope, guard-maths, guard-description passed`)
  console.log(`  ${LIMITATIONS}`)
  return 0
}

module.exports = { runBundle }
