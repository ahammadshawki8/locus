// `locus bisect`: the entry point of the bisect-regression CI job.
//   locus bisect [--recheck <report.json>] [--out <dir>]
// Reads library-recheck's report (default out/recheck/report.json; it must be for this commit). For each shipped graph
// that failed there, it finds the first commit, between the graph's release commit (where it passed) and HEAD, with
// whose code the graph fails: `git bisect run` in a separate worktree (this checkout is not touched), each step
// rendering and touch-checking the released request files with that commit's own CLI (bisect-step.js). Both ends are
// tested the same way first: when the graph also fails at its release commit, or passes at HEAD, no commit is named.
// Writes out/bisect/report.json and prints it after `LOCUS_BISECT `, for the regression detective, which may open the
// exact inverse of a named commit on revert/<sha> (checked by guard-revert), or file re-layout requests.
// Exit 0 = a commit was named for every failing graph (or none failed), 1 = not for every one, 2 = no or stale report.
const fs = require('fs')
const os = require('os')
const path = require('path')
const { spawnSync } = require('child_process')

const g = require('../guards/git')
const { extractRequest, describeFailures } = require('./shipped')
const { testAt, describeStep } = require('./bisect-step')

const STEP = path.join(__dirname, 'bisect-step.js')
const FIRST_BAD = /^([0-9a-f]{40}) is the first bad commit/m
const STEP_LINE = /^bisect step ([0-9a-f]{40}): (good|bad|skip)/gm

const option = (args, name) => {
  const i = args.indexOf(name)
  return i >= 0 ? args.splice(i, 2)[1] : undefined
}

const cannotBisect = (why) => {
  console.error(`bisect-regression: cannot bisect: ${why}`)
  return 2
}

const runGit = (args, cwd, env) => {
  const r = spawnSync('git', args, { cwd, env, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  return `${r.stdout || ''}${r.stderr || ''}`
}

/** One failing shipped graph: its first bad commit since the release, or why none is named. */
const bisectGraph = ({ graph, worktree, head, mainRoot, outRoot, env }) => {
  const { requestId, releaseTag, releaseCommit: good } = graph
  const entry = { requestId, releaseTag, goodCommit: good }
  const dir = path.join(outRoot, String(requestId))
  const requestDir = path.join(dir, 'request')
  const outDir = path.join(dir, 'render')
  try {
    extractRequest(releaseTag, requestId, requestDir, mainRoot)
  } catch (e) {
    return { ...entry, error: e.message }
  }
  if (!g.isAncestor(good, head, mainRoot)) return { ...entry, error: `its release commit ${good.slice(0, 8)} is not an ancestor of HEAD` }

  const at = (commit) => {
    g.git(['checkout', '-q', '--detach', commit], worktree)
    return testAt({ worktree, requestDir, outDir, headSha: head, mainRoot, env })
  }
  const before = at(good)
  if (before.verdict === 'bad') return { ...entry, error: `fails at its release commit ${good.slice(0, 8)} too (${describeStep(before)}), so no commit since the release caused it` }
  if (before.verdict === 'skip') return { ...entry, error: `cannot be tested at its release commit ${good.slice(0, 8)}: ${before.why}` }
  const now = at(head)
  if (now.verdict !== 'bad') return { ...entry, error: `the failure did not reproduce in a clean checkout of HEAD (${describeStep(now)})` }

  let log = runGit(['bisect', 'start', head, good], worktree, env)
  try {
    if (!FIRST_BAD.test(log)) log += runGit(['bisect', 'run', process.execPath, STEP, worktree, requestDir, outDir, head, mainRoot], worktree, env)
  } finally {
    runGit(['bisect', 'reset'], worktree, env)
  }
  // every commit tested, in order: the two ends, then each bisect step
  const steps = [before, now].map(({ commit, verdict }) => ({ commit, verdict }))
  for (const [, commit, verdict] of log.matchAll(STEP_LINE)) steps.push({ commit, verdict })
  const found = FIRST_BAD.exec(log)
  if (!found) return { ...entry, steps, error: `git bisect named no single commit: ${log.trim().split('\n').slice(-4).join(' | ')}` }

  const bad = found[1]
  const [subject, authorName, parents] = g.git(['show', '-s', '--format=%s%x00%an%x00%P', bad], mainRoot).split('\0')
  return {
    ...entry,
    steps,
    firstBadCommit: bad,
    subject,
    authorName,
    merge: parents.split(' ').length > 1,
    paths: g.changedPaths(bad, mainRoot),
    failures: now.result.failures,
    revertBranch: `revert/${bad}`
  }
}

const runBisect = (args, env = process.env) => {
  const recheckFile = path.resolve(option(args, '--recheck') || path.join('out', 'recheck', 'report.json'))
  const outRoot = path.resolve(option(args, '--out') || path.join('out', 'bisect'))
  if (!fs.existsSync(recheckFile)) return cannotBisect(`${recheckFile} not found (run locus recheck first)`)
  const recheck = JSON.parse(fs.readFileSync(recheckFile, 'utf8'))
  const mainRoot = g.git(['rev-parse', '--show-toplevel'])
  const head = g.git(['rev-parse', 'HEAD'])
  if (recheck.kind !== 'recheck' || recheck.commit !== head) {
    return cannotBisect(`${recheckFile} is a ${recheck.kind} report for ${String(recheck.commit).slice(0, 8)}, not the re-check of HEAD ${head.slice(0, 8)}: run locus recheck again`)
  }

  fs.rmSync(outRoot, { recursive: true, force: true })
  fs.mkdirSync(outRoot, { recursive: true })
  const failing = recheck.graphs.filter((graph) => !graph.pass && graph.stage !== 'input')
  const regressions = []
  if (failing.length) {
    const worktree = fs.mkdtempSync(path.join(os.tmpdir(), 'locus-bisect-'))
    g.git(['worktree', 'add', '--detach', worktree, head], mainRoot)
    try {
      for (const graph of failing) regressions.push(bisectGraph({ graph, worktree, head, mainRoot, outRoot, env }))
    } finally {
      runGit(['worktree', 'remove', '--force', worktree], mainRoot, env)
      fs.rmSync(worktree, { recursive: true, force: true })
      runGit(['worktree', 'prune'], mainRoot, env)
    }
  }

  const commits = []
  for (const r of regressions.filter((x) => x.firstBadCommit)) {
    let c = commits.find((x) => x.sha === r.firstBadCommit)
    if (!c) commits.push((c = { sha: r.firstBadCommit, subject: r.subject, authorName: r.authorName, revertBranch: r.revertBranch, graphs: [] }))
    c.graphs.push(r.requestId)
  }
  const pipelineId = env.CI_PIPELINE_ID ? Number(env.CI_PIPELINE_ID) : 0
  const report = { commit: head, pipelineId, regressions, commits }
  fs.writeFileSync(path.join(outRoot, 'report.json'), JSON.stringify(report, null, 2) + '\n')
  console.log('LOCUS_BISECT ' + JSON.stringify(report))

  const unnamed = regressions.filter((r) => !r.firstBadCommit)
  if (!failing.length) {
    console.log(`bisect-regression: no shipped graph failed the re-check of ${head.slice(0, 8)}; nothing to bisect`)
    return 0
  }
  console.log(`bisect-regression: ${failing.length} failing shipped graph(s) at ${head.slice(0, 8)}; first bad commit named for ${failing.length - unnamed.length}`)
  for (const r of regressions) {
    if (!r.firstBadCommit) {
      console.log(`  ${r.releaseTag}: no commit named: ${r.error}`)
      continue
    }
    console.log(`  ${r.releaseTag}: passed at its release commit ${r.goodCommit.slice(0, 8)}; first fails with ${r.firstBadCommit.slice(0, 8)} "${r.subject}" (${r.authorName}${r.merge ? ', a merge commit' : ''}), which changed ${r.paths.map((p) => p.path).join(', ')}`)
    for (const line of describeFailures(r)) console.log(`    - ${line}`)
    console.log(`    tested: ${r.steps.map((s) => `${s.commit.slice(0, 8)} ${s.verdict}`).join(', ')}`)
  }
  if (commits.length) console.log('  The regression detective may open the exact inverse of a named commit on its revert/<sha> branch (checked by guard-revert), or file one re-layout request per graph if the change was intended.')
  return unnamed.length ? 1 : 0
}

module.exports = { runBisect }
