// `locus recheck [--impact]`: the entry point of the library-recheck and library-impact CI jobs (docs/contracts.md §6).
//   locus recheck [--out <dir>]            library-recheck (main + nightly): out/recheck/report.json + `LOCUS_RECHECK ` line
//   locus recheck --impact [--out <dir>]   library-impact (MRs changing generator code or dependencies):
//                                          out/impact/report.json + `LOCUS_IMPACT ` line
// Both re-render and touch-check every shipped graph (the newest release tag graph-<iid>-v<n> of each request, using
// the request files at that tag) with the code of this checkout, so they say which released graphs this code would
// break. Requests without a release tag are not shipped and are left to the render and touchcheck jobs.
// Exit 0 = every shipped graph passes (or none is shipped yet), 1 = a shipped graph fails, 2 = could not check one
// (its release tag lacks the request files).
const fs = require('fs')
const path = require('path')

const { git } = require('../guards/git')
const { shippedGraphs, extractRequest, checkGraph, describeFailures } = require('./shipped')

const MODES = {
  recheck: { job: 'library-recheck', dir: path.join('out', 'recheck'), prefix: 'LOCUS_RECHECK ' },
  impact: { job: 'library-impact', dir: path.join('out', 'impact'), prefix: 'LOCUS_IMPACT ' }
}

const option = (args, name) => {
  const i = args.indexOf(name)
  return i >= 0 ? args.splice(i, 2)[1] : undefined
}

const runRecheck = (args, env = process.env) => {
  const impact = args.includes('--impact')
  const mode = impact ? MODES.impact : MODES.recheck
  const outRoot = path.resolve(option(args, '--out') || mode.dir)
  const cwd = git(['rev-parse', '--show-toplevel'])
  const commit = git(['rev-parse', 'HEAD'])
  const pipelineId = env.CI_PIPELINE_ID ? Number(env.CI_PIPELINE_ID) : 0
  const cli = path.join(__dirname, 'index.js')

  fs.rmSync(outRoot, { recursive: true, force: true })
  fs.mkdirSync(outRoot, { recursive: true })
  const graphs = shippedGraphs(cwd).map(({ requestId, tag, releaseCommit }) => {
    const shipped = { requestId, releaseTag: tag, releaseCommit }
    const requestDir = path.join(outRoot, String(requestId), 'request')
    try {
      extractRequest(tag, requestId, requestDir, cwd)
    } catch (e) {
      return { ...shipped, pass: false, stage: 'input', error: e.message, failures: [] }
    }
    return { ...shipped, ...checkGraph({ cli, requestDir, outDir: path.join(outRoot, String(requestId), 'render'), cwd, env }) }
  })

  const report = { kind: impact ? 'impact' : 'recheck', commit, pipelineId, pass: graphs.every((g) => g.pass), graphs }
  fs.writeFileSync(path.join(outRoot, 'report.json'), JSON.stringify(report, null, 2) + '\n')
  console.log(mode.prefix + JSON.stringify(report))

  const failed = graphs.filter((g) => !g.pass)
  if (!graphs.length) console.log(`${mode.job}: nothing to re-check: no release tag graph-<iid>-v<n> yet, so no graph has shipped`)
  else console.log(`${mode.job}: ${graphs.length} shipped graph(s) re-checked with ${commit.slice(0, 8)}: ${failed.length ? `${failed.length} FAILED` : 'all pass'}`)
  for (const g of graphs) {
    console.log(`  ${g.releaseTag} (released at ${g.releaseCommit.slice(0, 8)}): ${g.pass ? 'passes' : 'FAILS'}`)
    for (const line of describeFailures(g)) console.log(`    - ${line}`)
  }
  if (failed.length && !impact) console.log('  Next: bisect-regression finds the commit since each release after which the graph fails.')
  if (failed.length && impact) console.log('  With this MR\'s code, the shipped graphs above no longer pass touchcheck.')
  console.log('  Automated checks measure spacing and size; they do not certify that a learner can understand the graphic.')
  if (failed.some((g) => g.stage === 'input')) return 2
  return failed.length ? 1 : 0
}

module.exports = { runRecheck }
