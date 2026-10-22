#!/usr/bin/env node
// `npm run setup [-- --test] [-- --project <id or group/path>]`: one command from a fresh clone to a checked graph.
//   1. installs the Locus package (npm --prefix locus ci)
//   2. checks the Duo flow files (locus/flows/check.js)
//   3. renders a shipped graph (requests/4, y = 0.5x^2 - 2x + 5) to out/setup-graph-4
//   4. touch-checks it (TL-1 to TL-5) and prints the report
//   5. runs `locus doctor` (with GITLAB_TOKEN and --project it also checks the GitLab project; docs/setup.md)
// --test also runs the full Locus test suite. Stops at the first step that fails.
const { spawnSync } = require('child_process')
const path = require('path')

const ROOT = path.join(__dirname, '..', '..')
// npm itself: under `npm run` its script is in npm_execpath, so no shell is needed on any platform.
const NPM = process.env.npm_execpath ? [process.execPath, process.env.npm_execpath] : [process.platform === 'win32' ? 'npm.cmd' : 'npm']
const CLI = path.join('locus', 'cli', 'index.js')

const nodeOk = (version) => Number(/^v(\d+)/.exec(version)[1]) >= 20

const steps = (args) => {
  const i = args.indexOf('--project')
  const project = i >= 0 ? ['--project', args[i + 1]] : []
  return [
    { name: 'install', title: 'Install the Locus package', cmd: NPM[0], args: [...NPM.slice(1), '--prefix', 'locus', 'ci'] },
    ...(args.includes('--test') ? [{ name: 'tests', title: 'Run the Locus test suite', cmd: NPM[0], args: [...NPM.slice(1), 'run', 'test:locus'] }] : []),
    { name: 'flows', title: 'Check the GitLab Duo flow files', cmd: process.execPath, args: [path.join('locus', 'flows', 'check.js')] },
    { name: 'render', title: 'Render a shipped graph (requests/4)', cmd: process.execPath, args: [CLI, 'requests/4/', '--out', 'out/setup-graph-4'] },
    { name: 'touchcheck', title: 'Touch-check it (TL-1 to TL-5)', cmd: process.execPath, args: [CLI, 'touchcheck', 'requests/4/', '--out', 'out/setup-graph-4'] },
    { name: 'doctor', title: 'Check the setup', cmd: process.execPath, args: [CLI, 'doctor', ...project] }
  ]
}

const main = (args) => {
  if (!nodeOk(process.version)) {
    console.error(`Locus needs Node 20 or later; this is ${process.version}.`)
    return 1
  }
  const plan = steps(args)
  for (const [n, s] of plan.entries()) {
    console.log(`\n[${n + 1}/${plan.length}] ${s.title}`)
    const r = spawnSync(s.cmd, s.args, { cwd: ROOT, stdio: 'inherit', shell: s.cmd === 'npm.cmd' })
    if (r.status !== 0) {
      console.error(`\nsetup stopped at "${s.title}" (exit ${r.status}). docs/setup.md has the details.`)
      return r.status || 1
    }
  }
  console.log('\nLocus is ready. The plate is in out/setup-graph-4/ (graph.stl, graph.svg, overlay.svg, description.txt).')
  console.log('Next: docs/setup.md, from step 2, connects your GitLab project and Google Cloud.')
  return 0
}

if (require.main === module) process.exitCode = main(process.argv.slice(2))

module.exports = { steps, nodeOk }
