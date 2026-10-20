// `locus publish-package` and `locus release`: the `publish-package` and `release` CI jobs on the default branch
// (projectLocus.md S.4 step 7; docs/contracts.md §3, §5, §6, D5). Both read only what the `bundle` job wrote:
// out/bundle/graph-<iid>-v<n>/ (the seven contract files) and out/bundle/graph-<iid>-v<n>.zip.
//   publish-package: uploads each bundle to the generic Package Registry as package `locus-graphs`, version
//     graph-<iid>-v<n>, so the release, the site and the reply can link files that never expire.
//   release: creates tag graph-<iid>-v<n> on this commit and a GitLab release linking those files, and uploads the
//     manifest with `releaseTag` filled in (the bundle's copy keeps null, contracts §5).
// Both use CI_JOB_TOKEN only. With JUDGING_FREEZE=true nothing is published or released (H12). Exit 0 = done (or
// nothing new), 1 = GitLab refused, 2 = the bundle output is missing or invalid.
const fs = require('fs')
const path = require('path')

const { fromEnv, GitLabError } = require('./gitlab')
const { BUNDLE_FILES, LIMITATIONS } = require('../core/bundle')
const { validateManifest } = require('../core/validate')

const PACKAGE = 'locus-graphs'
const ARTIFACT = /^graph-([1-9][0-9]*|0)-v([1-9][0-9]*)$/

/** The bundles the bundle job wrote: [{ artifactId, dir, zip, manifest }], by request then version. */
const readBundles = (root) => {
  if (!fs.existsSync(root)) return []
  return fs.readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isDirectory() && ARTIFACT.test(e.name))
    .map((e) => {
      const dir = path.join(root, e.name)
      const missing = BUNDLE_FILES.filter((f) => !fs.existsSync(path.join(dir, f)))
      const zip = `${dir}.zip`
      if (!fs.existsSync(zip)) missing.push(`${e.name}.zip`)
      if (missing.length) throw new Error(`${e.name}: missing ${missing.join(', ')}`)
      const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'))
      const errors = validateManifest(manifest)
      if (errors.length) throw new Error(`${e.name}: manifest.json ${errors.join('; ')}`)
      if (manifest.artifactId !== e.name) throw new Error(`${e.name}: manifest.json says ${manifest.artifactId}`)
      return { artifactId: e.name, dir, zip, manifest }
    })
    .sort((a, b) => a.manifest.requestIssue - b.manifest.requestIssue || a.artifactId.localeCompare(b.artifactId, 'en', { numeric: true }))
}

/** Where a published file lives (`api` is CI_API_V4_URL); it downloads signed out from a public project. */
const packageFileUrl = (api, projectId, artifactId, file) =>
  `${api.replace(/\/+$/, '')}/projects/${projectId}/packages/generic/${PACKAGE}/${artifactId}/${file}`

/** The files a bundle publishes, in upload order: the zip, then each contract file. */
const publishedFiles = (bundle) => [
  { name: `${bundle.artifactId}.zip`, file: bundle.zip },
  ...BUNDLE_FILES.map((f) => ({ name: f, file: path.join(bundle.dir, f) }))
]

const frozen = (env, job) => {
  if (env.JUDGING_FREEZE !== 'true') return false
  console.log(`${job}: JUDGING_FREEZE is on: nothing is published or released during judging`)
  return true
}

const runPublish = async (args, env = process.env, api = fromEnv(env)) => {
  if (frozen(env, 'publish-package')) return 0
  const root = args[0] || path.join('out', 'bundle')
  let bundles
  try {
    bundles = readBundles(root)
  } catch (err) {
    console.error(`publish-package: ${err.message}`)
    return 2
  }
  if (!bundles.length) console.log('publish-package: no new bundle in this pipeline')
  for (const b of bundles) {
    for (const { name, file } of publishedFiles(b)) {
      await api('PUT', `/packages/generic/${PACKAGE}/${b.artifactId}/${name}`, { body: fs.readFileSync(file) })
    }
    console.log(`publish-package: ${b.artifactId}: ${publishedFiles(b).length} files at ${packageFileUrl(env.CI_API_V4_URL, env.CI_PROJECT_ID, b.artifactId, `${b.artifactId}.zip`)}`)
  }
  return 0
}

/** The release notes: what was made, the checks, where it came from. Plain text, no long dashes (H2). */
const releaseNotes = (m, env) => [
  `Tactile graph for request #${m.requestIssue}. Braille ID on the plate: ${m.brailleId}.`,
  '',
  `- Touch checks TL-1 to TL-5: passed after ${m.touchcheck.attempts} attempt${m.touchcheck.attempts === 1 ? '' : 's'}`,
  `- Guards: scope, maths and description passed`,
  `- Release mode: ${m.releaseMode}`,
  `- Built by pipeline ${m.pipelineId} from commit ${m.sourceCommit.slice(0, 8)}; profile ${m.profile.id} v${m.profile.version}; generator ${m.generatorVersion}`,
  ...m.agentSessions.map((s) => `- Agent session: ${s}`),
  '',
  'Print graph.stl at 100% scale (README.txt in the zip says how).',
  '',
  `Limitations: ${LIMITATIONS}`,
  ...(env.CI_PROJECT_URL ? ['', `Request: ${env.CI_PROJECT_URL}/-/issues/${m.requestIssue}`] : [])
].join('\n')

const assetLinks = (b, env) => [
  { name: `${b.artifactId}.zip (everything)`, file: `${b.artifactId}.zip`, link_type: 'package' },
  { name: 'graph.stl (print this)', file: 'graph.stl', link_type: 'package' },
  { name: 'graph.svg (preview)', file: 'graph.svg', link_type: 'image' },
  { name: 'description.txt', file: 'description.txt', link_type: 'other' },
  { name: 'manifest.json', file: 'manifest.json', link_type: 'other' }
].map(({ name, file, link_type: linkType }) => ({ name, url: packageFileUrl(env.CI_API_V4_URL, env.CI_PROJECT_ID, b.artifactId, file), link_type: linkType }))

const releaseExists = async (api, tag) => {
  try {
    await api('GET', `/releases/${encodeURIComponent(tag)}`)
    return true
  } catch (err) {
    if (err instanceof GitLabError && err.status === 404) return false
    throw err
  }
}

const runRelease = async (args, env = process.env, api = fromEnv(env)) => {
  if (frozen(env, 'release')) return 0
  const root = args[0] || path.join('out', 'bundle')
  const outRoot = args[1] || path.join('out', 'release')
  let bundles
  try {
    bundles = readBundles(root)
  } catch (err) {
    console.error(`release: ${err.message}`)
    return 2
  }
  if (!bundles.length) console.log('release: no new bundle in this pipeline')
  const released = []
  for (const b of bundles) {
    const tag = b.artifactId
    const manifest = { ...b.manifest, releaseTag: tag }
    if (await releaseExists(api, tag)) {
      console.log(`release: ${tag} already exists; not released again`)
      continue
    }
    if (b.manifest.sourceCommit !== env.CI_COMMIT_SHA) {
      console.error(`release: ${tag} was bundled from ${b.manifest.sourceCommit}, not this pipeline's ${env.CI_COMMIT_SHA}`)
      return 2
    }
    const body = Buffer.from(JSON.stringify(manifest, null, 2) + '\n')
    await api('PUT', `/packages/generic/${PACKAGE}/${tag}/manifest.json`, { body })
    await api('POST', '/releases', {
      body: {
        name: `${tag} (Braille ID ${b.manifest.brailleId})`,
        tag_name: tag,
        ref: env.CI_COMMIT_SHA,
        description: releaseNotes(manifest, env),
        assets: { links: assetLinks(b, env) }
      }
    })
    const dir = path.join(outRoot, tag)
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'manifest.json'), body)
    released.push(tag)
    console.log(`release: ${tag} at ${env.CI_PROJECT_URL || ''}/-/releases/${tag}`)
  }
  fs.mkdirSync(outRoot, { recursive: true })
  fs.writeFileSync(path.join(outRoot, 'released.json'), JSON.stringify({ released }, null, 2) + '\n')
  console.log(`LOCUS_RELEASE ${JSON.stringify({ released })}`)
  return 0
}

module.exports = { PACKAGE, readBundles, packageFileUrl, publishedFiles, releaseNotes, assetLinks, runPublish, runRelease }
