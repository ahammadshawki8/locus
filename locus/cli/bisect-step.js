#!/usr/bin/env node
// One step of bisect-regression (see bisect.js), run by `git bisect run` inside the bisect worktree:
//   node bisect-step.js <worktree> <requestDir> <outDir> <headSha> <mainRoot>
// Renders and touch-checks the released request files with the worktree's own CLI, so the code judged is the code of
// the commit under test (generator, touchcheck rules and profiles alike).
// Exit 0 = good (the graph passes), 1 = bad (it fails), 125 = skip (this commit cannot be tested: it has no locus CLI,
// or its dependencies could not be installed), as `git bisect run` expects.
const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const { git } = require('../guards/git')
const { checkGraph, describeFailures } = require('./shipped')

// What decides which ajv and @jscad/modeling a commit's code runs with.
const DEPENDENCY_PATHS = ['locus/package.json', 'locus/package-lock.json', 'packages']

/**
 * The environment to run the worktree's code with. When the commit's dependencies are HEAD's, it uses this checkout's
 * locus/node_modules (through NODE_PATH; @jscad/modeling there links to this checkout's packages/modeling, which is
 * HEAD's). Otherwise it installs the commit's own (npm ci in the worktree). null when that install failed.
 */
const prepare = ({ worktree, headSha, mainRoot, env }) => {
  const modules = path.join(worktree, 'locus', 'node_modules')
  const same = spawnSync('git', ['diff', '--quiet', headSha, 'HEAD', '--', ...DEPENDENCY_PATHS], { cwd: worktree }).status === 0
  if (same) {
    fs.rmSync(modules, { recursive: true, force: true })
    return { ...env, NODE_PATH: [path.join(mainRoot, 'locus', 'node_modules'), env.NODE_PATH].filter(Boolean).join(path.delimiter) }
  }
  const npm = spawnSync('npm', ['ci', '--no-audit', '--no-fund', '--prefer-offline'], {
    cwd: path.join(worktree, 'locus'), encoding: 'utf8', shell: process.platform === 'win32'
  })
  return npm.status === 0 ? env : null
}

/** Tests the commit checked out in `worktree`: { commit, verdict: 'good' | 'bad' | 'skip', why?, result? }. */
const testAt = ({ worktree, requestDir, outDir, headSha, mainRoot, env = process.env }) => {
  const commit = git(['rev-parse', 'HEAD'], worktree)
  const cli = path.join(worktree, 'locus', 'cli', 'index.js')
  if (!fs.existsSync(cli)) return { commit, verdict: 'skip', why: 'no locus CLI at this commit' }
  const stepEnv = prepare({ worktree, headSha, mainRoot, env })
  if (!stepEnv) return { commit, verdict: 'skip', why: 'npm ci failed for this commit\'s dependencies' }
  const result = checkGraph({ cli, requestDir, outDir, cwd: worktree, env: stepEnv })
  return { commit, verdict: result.pass ? 'good' : 'bad', result }
}

const describeStep = (step) => step.why || (step.result.pass ? 'passes' : describeFailures(step.result).join('; '))

const EXIT = { good: 0, bad: 1, skip: 125 }

if (require.main === module) {
  const [worktree, requestDir, outDir, headSha, mainRoot] = process.argv.slice(2)
  const step = testAt({ worktree, requestDir, outDir, headSha, mainRoot })
  console.log(`bisect step ${step.commit}: ${step.verdict} (${describeStep(step)})`)
  process.exitCode = EXIT[step.verdict]
}

module.exports = { testAt, describeStep }
