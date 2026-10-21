#!/usr/bin/env node
// Local CLI and the entry point of the `render`, `touchcheck` and `guard-*` CI jobs.
//   locus <requests/<iid> | spec.json> [--out <dir>]
//     writes graph.stl, graph.svg, description.txt and scene.json (the scene touchcheck measures)
//   locus touchcheck <requests/<iid> | spec.json> [--out <dir>] [--attempt <n>]
//     reads scene.json + graph.svg from the render output, writes touchcheck-report.json + overlay.svg and prints the
//     report on one line after `LOCUS_REPORT ` (docs/contracts.md §4: agents read job logs, not artifacts);
//     exits 0 when every rule passed, 1 when a rule failed, 2 when the render output is missing or stale
//   locus guard <scope|maths|description|revert> ...   (see guards/cli.js)
//   locus bundle <requests/<iid>> ...           (see cli/bundle.js): out/bundle/graph-<iid>-v<n>/ + .zip + manifest
//   locus recheck [--impact]                    (see cli/recheck.js): re-check every shipped graph with this code
//   locus bisect                                (see cli/bisect.js): the first commit after which a shipped graph fails
// Release side (CI jobs on GitLab; see release/*.js and site/*.js):
//   locus license-check | auto-merge | publish-package | release | site | validate-site <url> | reply-teacher <url>
//   locus print-order <url>                  (off unless PRINT_ORDER_ENABLED=true; see release/print-order.js)
//   locus print-reprints                     (on the reprints schedule; see release/reprint.js)
// A request folder holds spec.json + layout.json (+ request.lock.json); a spec file `x.json` uses `x.layout.json`.
// The output folder defaults to out/<folder or spec name>.
const fs = require('fs')
const path = require('path')

const { validateSpec, validateLayout, checkLock } = require('../core/validate')
const { render, writeOutputs, loadProfile } = require('../core/render')
const { touchcheck, reportLine } = require('../touchcheck')
const { toOverlay } = require('../touchcheck/overlay')
const { runGuard } = require('../guards/cli')
const { runBundle } = require('./bundle')
const { runRecheck } = require('./recheck')
const { runBisect } = require('./bisect')
const { runLicenseCheck } = require('../release/license')
const { runAutoMerge } = require('../release/auto-merge')
const { runPublish, runRelease } = require('../release/release')
const { runSite } = require('../site/build')
const { runValidateSite } = require('../site/validate')
const { runReply } = require('../release/reply')
const { runPrintOrder } = require('../release/print-order')
const { runReprints } = require('../release/reprint')

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'))

const resolveInputs = (target) => {
  if (fs.statSync(target).isDirectory()) {
    const lock = path.join(target, 'request.lock.json')
    return {
      name: path.basename(path.resolve(target)),
      specFile: path.join(target, 'spec.json'),
      layoutFile: path.join(target, 'layout.json'),
      lockFile: fs.existsSync(lock) ? lock : null
    }
  }
  const name = path.basename(target, '.json')
  return { name, specFile: target, layoutFile: path.join(path.dirname(target), `${name}.layout.json`), lockFile: null }
}

const runRender = (target, outDir) => {
  const { specFile, layoutFile, lockFile } = resolveInputs(target)
  const spec = readJson(specFile)
  const layout = readJson(layoutFile)
  const errors = [
    ...validateSpec(spec).map((e) => `spec.json ${e}`),
    ...validateLayout(layout).map((e) => `layout.json ${e}`),
    ...(lockFile ? checkLock(spec, readJson(lockFile)).map((e) => `spec.json ${e}`) : [])
  ]
  if (errors.length) {
    console.error(`${target}: invalid request\n  ${errors.join('\n  ')}`)
    return 1
  }

  const result = render(spec, layout)
  writeOutputs(outDir, result)
  const { widthMm, heightMm } = result.scene.plate
  console.log(`${target}: rendered ${widthMm.toFixed(1)} x ${heightMm.toFixed(1)} mm plate to ${outDir}`)
  if (result.mesh === 'manifold') console.log('  mesh: the JSCAD union left open edges; the manifold fallback closed it (core/manifold.js)')
  for (const m of result.scene.missing) console.log(`  missing: ${m.mark} (${m.reason})`)
  console.log(`  Not touch-checked yet: run \`locus touchcheck ${target}\`.`)
  return 0
}

const runTouchcheck = (target, outDir, attempt) => {
  const sceneFile = path.join(outDir, 'scene.json')
  const svgFile = path.join(outDir, 'graph.svg')
  for (const file of [sceneFile, svgFile]) {
    if (!fs.existsSync(file)) {
      console.error(`${target}: ${file} not found. Render first: locus ${target} --out ${outDir}`)
      return 2
    }
  }

  const spec = readJson(resolveInputs(target).specFile)
  const scene = readJson(sceneFile)
  if (spec.profileId !== scene.profileId) {
    console.error(`${target}: spec.json asks for profile "${spec.profileId}" but ${sceneFile} was rendered for "${scene.profileId}". Render again.`)
    return 2
  }
  const checked = touchcheck(scene, loadProfile(scene.profileId), { requested: spec.mark, requestId: spec.requestId, attempt })
  const { report, results } = checked
  fs.writeFileSync(path.join(outDir, 'touchcheck-report.json'), JSON.stringify(report, null, 2) + '\n')
  fs.writeFileSync(path.join(outDir, 'overlay.svg'), toOverlay(fs.readFileSync(svgFile, 'utf8'), scene, checked))

  console.log(reportLine(report))
  console.log(`${target}: touchcheck ${report.pass ? 'passed' : 'FAILED'} (${report.profileId}, attempt ${attempt}); report and overlay in ${outDir}`)
  for (const rule of results) {
    console.log(`  ${rule.id} ${rule.passed ? 'passed' : 'failed'}${rule.note ? `: ${rule.note}` : ''}`)
    for (const v of rule.violations) {
      const where = v.at ? ` at (${v.at.xMm}, ${v.at.yMm}) mm` : ''
      const measured = v.measuredMm == null ? '' : ` [${v.measuredMm} mm, needs ${v.requiredMm} mm]`
      console.log(`    - ${(v.subject || []).join(' / ')}${where}: ${v.message}${measured}`)
    }
  }
  console.log('  Automated checks measure spacing and size; they do not certify that a learner can understand the graphic.')
  return report.pass ? 0 : 1
}

const main = (argv) => {
  const args = argv.slice(2)
  if (args[0] === 'guard') return runGuard(args.slice(1))
  if (args[0] === 'bundle') return runBundle(args.slice(1))
  if (args[0] === 'recheck') return runRecheck(args.slice(1))
  if (args[0] === 'bisect') return runBisect(args.slice(1))
  const release = {
    'license-check': () => runLicenseCheck(args.slice(1)),
    'auto-merge': () => runAutoMerge(),
    'publish-package': () => runPublish(args.slice(1)),
    release: () => runRelease(args.slice(1)),
    site: () => runSite(args.slice(1)),
    'validate-site': () => runValidateSite(args.slice(1)),
    'reply-teacher': () => runReply(args.slice(1)),
    'print-order': () => runPrintOrder(args.slice(1)),
    'print-reprints': () => runReprints(args.slice(1))
  }[args[0]]
  if (release) return release()
  const command = args[0] === 'touchcheck' ? args.shift() : 'render'
  const outIndex = args.indexOf('--out')
  const outArg = outIndex >= 0 ? args.splice(outIndex, 2)[1] : null
  const attemptIndex = args.indexOf('--attempt')
  const attempt = attemptIndex >= 0 ? Number(args.splice(attemptIndex, 2)[1]) : 1
  if (!Number.isInteger(attempt) || attempt < 1) {
    console.error('--attempt must be a whole number from 1')
    return 64
  }
  const target = args[0]
  if (!target) {
    console.error('usage: locus [touchcheck] <requests/<iid> | spec.json> [--out <dir>] [--attempt <n>]\n       locus guard <scope|maths|description|revert> ...\n       locus bundle <requests/<iid>> ...\n       locus recheck [--impact]\n       locus bisect')
    return 64
  }
  const outDir = outArg || path.join('out', resolveInputs(target).name)
  return command === 'touchcheck' ? runTouchcheck(target, outDir, attempt) : runRender(target, outDir)
}

// The release-side commands are async (GitLab API, the live site); an error there is a failed job, never a pass.
Promise.resolve().then(() => main(process.argv)).then((code) => { process.exitCode = code }, (err) => {
  console.error(err.message)
  process.exitCode = 1
})
