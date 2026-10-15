// `locus guard <name> ...`: the entry point of the guard-* CI jobs. Exit 0 = pass, 1 = blocked, 2 = could not check
// (missing input, no base commit): a guard that cannot check fails closed.
//   locus guard scope [--base <sha>] [--head <ref>] [--branch <name>]
//   locus guard maths <requests/<iid>> [--out <render dir>] [--base <sha>]
//   locus guard description <requests/<iid>> [--out <render dir>]
// Without --base, the base is the MR's diff base, the commit before a push, or where HEAD left the default branch.
// Each guard also writes out/guards/<name>[-<iid>].json for the bundle job (manifest `guards`, contracts §5).
const fs = require('fs')
const path = require('path')

const g = require('./git')
const { checkScope } = require('./scope')
const { checkMaths } = require('./maths')
const { checkDescription } = require('./description')

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'))
const option = (args, name) => {
  const i = args.indexOf(name)
  return i >= 0 ? args.splice(i, 2)[1] : undefined
}

const writeResult = (name, result) => {
  const dir = path.join('out', 'guards')
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, `${name}.json`), JSON.stringify(result, null, 2) + '\n')
}

const cannotCheck = (name, why) => {
  console.error(`${name}: cannot check: ${why}`)
  return 2
}

const report = (name, pass, lines) => {
  console.log(`${name}: ${pass ? 'passed' : 'BLOCKED'}`)
  for (const line of lines) console.log(`  - ${line}`)
  return pass ? 0 : 1
}

const runScope = (args) => {
  const base = g.resolveBase({ base: option(args, '--base') })
  if (!base) return cannotCheck('guard-scope', 'no base commit (pass --base, or run in an MR or branch pipeline)')
  const head = option(args, '--head') || 'HEAD'
  const branch = g.resolveBranch({ branch: option(args, '--branch') })
  const commits = g.listCommits(base, head)
  const result = checkScope({ branch, commits, pathsOf: (sha) => g.changedPaths(sha).map((p) => p.path) })
  writeResult('scope', { branch, base, ...result })
  console.log(`guard-scope: ${commits.length} commit(s) on ${branch} since ${base.slice(0, 8)}: ${result.agentCommits} by agents, ${result.personCommits} by people`)
  return report('guard-scope', result.pass, result.violations.map((v) => `${v.sha.slice(0, 8)} (${v.flow})${v.path ? ` ${v.path}` : ''}: ${v.reason}`))
}

const requestFiles = (dir, args) => {
  const name = path.basename(path.resolve(dir))
  const out = option(args, '--out') || path.join('out', name)
  return {
    name,
    spec: path.join(dir, 'spec.json'),
    lock: path.join(dir, 'request.lock.json'),
    layout: path.join(dir, 'layout.json'),
    scene: path.join(out, 'scene.json'),
    description: path.join(out, 'description.txt')
  }
}

const missingFile = (files, keys) => keys.map((k) => files[k]).find((f) => !fs.existsSync(f))

const runMaths = (args) => {
  const dir = args.shift()
  if (!dir) return cannotCheck('guard-maths', 'usage: locus guard maths <requests/<iid>> [--out <dir>] [--base <sha>]')
  const files = requestFiles(dir, args)
  const missing = missingFile(files, ['spec', 'lock', 'layout', 'scene'])
  if (missing) return cannotCheck('guard-maths', `${missing} not found (render first; every request needs request.lock.json)`)

  const base = g.resolveBase({ base: option(args, '--base') })
  if (!base) return cannotCheck('guard-maths', 'no base commit to check the lock history against')
  const root = g.git(['rev-parse', '--show-toplevel'])
  const lockPath = path.relative(root, path.resolve(files.lock)).split(path.sep).join('/')
  const branchCommits = g.git(['rev-list', '--reverse', `${base}..HEAD`])
  const history = {
    existedAtBase: g.fileExistsAt(base, lockPath),
    touchedBy: g.commitsTouching(base, 'HEAD', lockPath),
    firstCommit: branchCommits ? branchCommits.split('\n')[0] : null
  }

  const result = checkMaths({ spec: readJson(files.spec), lock: readJson(files.lock), scene: readJson(files.scene), layout: readJson(files.layout), history })
  writeResult(`maths-${files.name}`, result)
  return report(`guard-maths ${dir}`, result.pass, result.errors)
}

const runDescription = (args) => {
  const dir = args.shift()
  if (!dir) return cannotCheck('guard-description', 'usage: locus guard description <requests/<iid>> [--out <dir>]')
  const files = requestFiles(dir, args)
  const missing = missingFile(files, ['spec', 'lock', 'scene', 'description'])
  if (missing) return cannotCheck('guard-description', `${missing} not found (render first)`)
  const spec = readJson(files.spec)
  const result = checkDescription(fs.readFileSync(files.description, 'utf8'), { lock: readJson(files.lock), scene: readJson(files.scene), requestId: spec.requestId })
  writeResult(`description-${files.name}`, result)
  console.log(`guard-description ${dir}: ${result.numbers} number(s) checked`)
  return report(`guard-description ${dir}`, result.pass, result.errors)
}

const runGuard = (args) => {
  const name = args.shift()
  const guards = { scope: runScope, maths: runMaths, description: runDescription }
  if (!guards[name]) {
    console.error('usage: locus guard <scope|maths|description> ...')
    return 64
  }
  return guards[name](args)
}

module.exports = { runGuard }
