// `locus guard <name> ...`: the entry point of the guard-* CI jobs. Exit 0 = pass, 1 = blocked, 2 = could not check
// (missing input, no base commit): a guard that cannot check fails closed.
//   locus guard scope [--base <sha>] [--head <ref>] [--branch <name>]
//   locus guard maths <requests/<iid>> [--out <render dir>] [--base <sha>]
//   locus guard description <requests/<iid>> [--out <render dir>]
//   locus guard revert [--base <sha>] [--head <ref>] [--branch revert/<sha>]
// Without --base, the base is the MR's diff base, the commit before a push, or where HEAD left the default branch
// (guard-revert skips the commit before a push: its base is always where the branch left the default branch).
// Each guard also writes out/guards/<name>[-<iid>].json for the bundle job (manifest `guards`, contracts §5).
const fs = require('fs')
const path = require('path')

const g = require('./git')
const { checkScope, checkDefaultBranch } = require('./scope')
const { checkMaths } = require('./maths')
const { checkDescription } = require('./description')
const { checkRevert } = require('./revert')

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

// Why no base was found: not an MR, no usable commit before the push, and HEAD shares no history with the default
// branch (for example a first push to a project whose default branch holds other history).
const NO_BASE = 'no base commit: not an MR pipeline, no commit before the push, and HEAD shares no history with the default branch (pass --base)'

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
  if (!base) return cannotCheck('guard-scope', NO_BASE)
  const head = option(args, '--head') || 'HEAD'
  const branch = g.resolveBranch({ branch: option(args, '--branch') })
  const pathsOf = (sha) => {
    try {
      return g.changedPaths(sha)
    } catch {
      return [] // not a commit here: nothing is allowed
    }
  }
  // On the default branch, agent work arrives through merges: each merge is checked by its source branch's rules.
  const onDefault = branch === (process.env.CI_DEFAULT_BRANCH || 'main')
  const firstParent = onDefault ? g.listFirstParent(base, head) : null
  const commits = onDefault ? firstParent.flatMap((c) => [...(c.merged || []), c]) : g.listCommits(base, head)
  const result = onDefault ? checkDefaultBranch({ branch, firstParent, pathsOf }) : checkScope({ branch, commits, pathsOf })
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
  if (!base) return cannotCheck('guard-maths', `${NO_BASE}; the lock history needs one`)
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

const runRevert = (args) => {
  const branch = g.resolveBranch({ branch: option(args, '--branch') })
  const named = branch.match(/^revert\/([0-9a-f]{7,40})$/)
  if (!named) return cannotCheck('guard-revert', `${branch} is not a revert/<sha> branch`)
  const base = g.resolveBase({ base: option(args, '--base'), env: { ...process.env, CI_COMMIT_BEFORE_SHA: '' } })
  if (!base) return cannotCheck('guard-revert', NO_BASE)
  const head = option(args, '--head') || 'HEAD'

  const sha = g.resolveCommit(named[1])
  const target = sha && { sha, onDefaultBranch: g.isAncestor(sha, base), hasParent: g.hasParent(sha) }
  const commits = g.listCommits(base, head)
  const ready = target && target.hasParent && commits.length === 1
  const result = checkRevert({
    name: named[1],
    target,
    commits,
    targetChanges: ready ? g.changedPaths(sha) : [],
    revertChanges: ready ? commits[0].paths : [],
    entry: (ref, path) => g.treeEntry(ref, path)
  })
  writeResult('revert', { branch, base, target: sha, revert: commits.length === 1 ? commits[0].sha : null, ...result })
  if (sha) console.log(`guard-revert: ${branch} must be the exact inverse of ${sha.slice(0, 8)} "${g.git(['show', '-s', '--format=%s', sha])}"`)
  return report('guard-revert', result.pass, result.errors)
}

const runGuard = (args) => {
  const name = args.shift()
  const guards = { scope: runScope, maths: runMaths, description: runDescription, revert: runRevert }
  if (!guards[name]) {
    console.error('usage: locus guard <scope|maths|description|revert> ...')
    return 64
  }
  return guards[name](args)
}

module.exports = { runGuard }
