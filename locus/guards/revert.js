// guard-revert: a revert/<sha> branch holds one commit, and that commit is the exact inverse of <sha>, the commit
// bisect-regression named (docs/contracts.md §7). Exact means the diff reversed:
//   - the same paths that <sha> changed against its first parent, and no others;
//   - for each of them, the branch's base still holds <sha>'s version (mode + blob), and the branch's commit puts back
//     the version from before <sha> (a file <sha> added is deleted, one it deleted comes back).
// If a later commit changed one of those paths, no exact inverse exists: restoring the old file would also undo the
// later work, so the guard blocks and a person must revert it.
// guard-revert does not re-prove that <sha> is the guilty commit; bisect-regression did that on main, and library-impact
// on the revert MR shows whether the shipped graphs pass again.

/**
 * @param {string} input.name the commit as the branch names it (revert/<name>)
 * @param {{ sha: string, onDefaultBranch: boolean, hasParent: boolean } | null} input.target that commit, resolved
 * @param {{ sha: string, merge: boolean }[]} input.commits the branch's commits since its base, oldest first
 * @param {{ status: string, path: string }[]} input.targetChanges what the target changed against its first parent
 * @param {{ status: string, path: string }[]} input.revertChanges what the branch's commit changed against its parent
 * @param {function} input.entry (ref, path) -> "mode blob" of that path at that ref, or null when absent
 * @returns {{ pass: boolean, errors: string[] }}
 */
const checkRevert = ({ name, target, commits, targetChanges, revertChanges, entry }) => {
  if (!target) return { pass: false, errors: [`${name} is not a commit in this repository`] }
  const short = target.sha.slice(0, 8)
  const errors = []
  if (!target.onDefaultBranch) errors.push(`${short} is not on the default branch: only a merged commit can be reverted`)
  if (!target.hasParent) errors.push(`${short} is a root commit: it has no parent to go back to`)
  if (commits.length !== 1) errors.push(`the branch must hold exactly one commit, the inverse of ${short}; it holds ${commits.length}`)
  if (errors.length) return { pass: false, errors }

  const [revert] = commits
  if (revert.merge) errors.push('the inverse must be a plain commit, not a merge')
  const targetPaths = new Set(targetChanges.map((c) => c.path))
  const revertPaths = new Set(revertChanges.map((c) => c.path))
  for (const path of targetPaths) {
    if (!revertPaths.has(path)) {
      errors.push(`${path}: ${short} changed it, but the inverse does not`)
    } else if (entry(`${revert.sha}^1`, path) !== entry(target.sha, path)) {
      errors.push(`${path}: changed again after ${short}, so restoring it would also undo later work; a person must revert this`)
    } else if (entry(revert.sha, path) !== entry(`${target.sha}^1`, path)) {
      errors.push(`${path}: not restored to its content before ${short}`)
    }
  }
  for (const path of revertPaths) if (!targetPaths.has(path)) errors.push(`${path}: the inverse changes it, but ${short} did not`)
  return { pass: errors.length === 0, errors }
}

module.exports = { checkRevert }
