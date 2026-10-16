// Shipped graphs and how to re-check one: shared by library-impact, library-recheck and bisect-regression.
// A shipped graph is the newest release tag graph-<iid>-v<n> of a request (docs/contracts.md D5). It is re-checked
// from the request files as they were at that tag (what was released), rendered and touch-checked by a given copy of
// the CLI: this checkout's for the re-check, the commit under test's for the bisect.
const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const { git } = require('../guards/git')

const RELEASE_TAG = /^graph-(0|[1-9][0-9]*)-v([1-9][0-9]*)$/
const REQUEST_FILES = ['spec.json', 'layout.json', 'request.lock.json']

/** The newest release of each request, by request number: [{ requestId, version, tag }]. */
const latestReleases = (tags) => {
  const newest = new Map()
  for (const tag of tags) {
    const m = RELEASE_TAG.exec(tag)
    if (!m) continue
    const [requestId, version] = [Number(m[1]), Number(m[2])]
    if (!newest.has(requestId) || newest.get(requestId).version < version) newest.set(requestId, { requestId, version, tag })
  }
  return [...newest.values()].sort((a, b) => a.requestId - b.requestId)
}

/** Every shipped graph in the repository at `cwd`, with the commit its release tag points to. */
const shippedGraphs = (cwd) => {
  const tags = git(['tag', '-l', 'graph-*'], cwd).split('\n').filter(Boolean)
  return latestReleases(tags).map((r) => ({ ...r, releaseCommit: git(['rev-parse', `${r.tag}^{commit}`], cwd) }))
}

/** Writes requests/<iid>/ as it was at `ref` into `dest`. Throws when spec.json or layout.json is not there. */
const extractRequest = (ref, requestId, dest, cwd) => {
  fs.rmSync(dest, { recursive: true, force: true })
  fs.mkdirSync(dest, { recursive: true })
  for (const file of REQUEST_FILES) {
    const at = `requests/${requestId}/${file}`
    let content
    try {
      content = git(['show', `${ref}:${at}`], cwd)
    } catch {
      if (file === 'request.lock.json') continue
      throw new Error(`${ref} has no ${at}`)
    }
    fs.writeFileSync(path.join(dest, file), content + '\n')
  }
}

const FAILURE_FIELDS = ['rule', 'message', 'measuredMm', 'requiredMm', 'at']

/** The failing results of a touchcheck report, with the fields the report gave them. */
const failuresOf = (report) => report.results.filter((r) => !r.pass)
  .map((r) => Object.fromEntries(FAILURE_FIELDS.filter((k) => r[k] !== undefined).map((k) => [k, r[k]])))

const lastLines = (r) => `${r.stderr || ''}${r.stdout || ''}`.trim().split('\n').slice(-3).join(' | ').slice(0, 400)

/**
 * Renders and touch-checks one request with the CLI at `cli` (exactly as the render and touchcheck jobs run it).
 * @returns {{ pass: boolean, stage?: 'render' | 'touchcheck', error?: string, failures: object[] }}
 */
const checkGraph = ({ cli, requestDir, outDir, cwd, env = process.env }) => {
  fs.rmSync(outDir, { recursive: true, force: true })
  const run = (...args) => spawnSync(process.execPath, [cli, ...args], { cwd, env, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  const rendered = run(requestDir, '--out', outDir)
  if (rendered.status !== 0) return { pass: false, stage: 'render', error: `render exited ${rendered.status}: ${lastLines(rendered)}`, failures: [] }
  const checked = run('touchcheck', requestDir, '--out', outDir, '--attempt', '1')
  const reportFile = path.join(outDir, 'touchcheck-report.json')
  if (checked.status > 1 || checked.status === null || !fs.existsSync(reportFile)) {
    return { pass: false, stage: 'touchcheck', error: `touchcheck exited ${checked.status}: ${lastLines(checked)}`, failures: [] }
  }
  const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'))
  return checked.status === 0 && report.pass ? { pass: true, failures: [] } : { pass: false, stage: 'touchcheck', failures: failuresOf(report) }
}

/** One line per failure, for the job log. */
const describeFailures = (result) => result.error
  ? [result.error]
  : result.failures.map((f) => `${f.rule}: ${f.message}${f.measuredMm == null ? '' : ` [${f.measuredMm} mm, needs ${f.requiredMm} mm]`}${f.at ? ` at (${f.at.join(', ')}) mm` : ''}`)

module.exports = { latestReleases, shippedGraphs, extractRequest, failuresOf, checkGraph, describeFailures }
