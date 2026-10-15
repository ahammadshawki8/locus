// The git facts the guards need, read with plain `git` calls (no shell, so no injection from branch names or paths).
const { execFileSync } = require('child_process')

// stderr is captured (it is in the thrown error), so probes that are expected to fail don't print `fatal:` lines.
const git = (args, cwd) => execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] }).trimEnd()

const ZERO_SHA = /^0+$/

/** Changed paths of one commit against its first parent: [{ status, path }]; a rename gives both paths. */
const changedPaths = (sha, cwd) => {
  const hasParent = git(['rev-list', '--parents', '-n', '1', sha], cwd).split(' ').length > 1
  const out = hasParent
    ? git(['diff', '--no-renames', '--name-status', `${sha}^1`, sha], cwd)
    : git(['diff-tree', '--root', '-r', '--no-commit-id', '--no-renames', '--name-status', sha], cwd)
  return out ? out.split('\n').map((line) => { const [status, path] = line.split('\t'); return { status: status[0], path } }) : []
}

/**
 * Commits in base..head, oldest first, with author and changed paths. Merge commits are listed but flagged.
 * `paths` is read on first use: guard-scope needs it only for agent commits, and a branch can carry thousands of
 * people's commits (the JSCAD import: about 2,100), each costing two git calls.
 */
const listCommits = (base, head, cwd) => {
  const out = git(['log', '--reverse', '--format=%H%x00%P%x00%an%x00%ae', `${base}..${head}`], cwd)
  if (!out) return []
  return out.split('\n').map((line) => {
    const [sha, parents, authorName, authorEmail] = line.split('\0')
    let paths
    return {
      sha,
      merge: parents.split(' ').length > 1,
      authorName,
      authorEmail,
      get paths () { return paths || (paths = changedPaths(sha, cwd)) }
    }
  })
}

/** Commits in base..head that touched `path`, oldest first. */
const commitsTouching = (base, head, path, cwd) => {
  const out = git(['log', '--reverse', '--format=%H', `${base}..${head}`, '--', path], cwd)
  return out ? out.split('\n') : []
}

const fileExistsAt = (ref, path, cwd) => {
  try {
    git(['cat-file', '-e', `${ref}:${path}`], cwd)
    return true
  } catch {
    return false
  }
}

const resolves = (ref, cwd) => {
  try {
    git(['rev-parse', '--verify', '--quiet', `${ref}^{commit}`], cwd)
    return true
  } catch {
    return false
  }
}

/**
 * The commit the change starts from: --base if given; in an MR pipeline the MR's diff base; on a branch push the
 * commit before the push; otherwise where HEAD left the default branch. null when none can be found (fail closed).
 */
const resolveBase = ({ base, env = process.env, cwd } = {}) => {
  if (base) return base
  if (env.CI_MERGE_REQUEST_DIFF_BASE_SHA) return env.CI_MERGE_REQUEST_DIFF_BASE_SHA
  if (env.CI_COMMIT_BEFORE_SHA && !ZERO_SHA.test(env.CI_COMMIT_BEFORE_SHA) && resolves(env.CI_COMMIT_BEFORE_SHA, cwd)) return env.CI_COMMIT_BEFORE_SHA
  for (const ref of [`origin/${env.CI_DEFAULT_BRANCH || 'main'}`, env.CI_DEFAULT_BRANCH || 'main']) {
    if (resolves(ref, cwd)) {
      try {
        return git(['merge-base', 'HEAD', ref], cwd)
      } catch {}
    }
  }
  return null
}

/** The branch being checked: --branch, the MR source branch, or the pushed branch. */
const resolveBranch = ({ branch, env = process.env, cwd } = {}) =>
  branch || env.CI_MERGE_REQUEST_SOURCE_BRANCH_NAME || env.CI_COMMIT_BRANCH || git(['rev-parse', '--abbrev-ref', 'HEAD'], cwd)

module.exports = { git, listCommits, changedPaths, commitsTouching, fileExistsAt, resolveBase, resolveBranch }
