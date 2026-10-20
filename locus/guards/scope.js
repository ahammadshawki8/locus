// guard-scope: every agent commit stays inside that agent's allowed paths, on that agent's branch
// (docs/contracts.md §7, projectLocus.md §11). Each Duo flow commits as its own service account, so the commit author
// (or committer, see agentOf) says which flow made it; the branch and the commit's place on it say which agent of that flow:
//   locus-request on graph/<iid>: the first commit (intake) may write requests/<iid>/{spec.json, request.lock.json,
//     layout.json}; every later commit (fixer) may change only requests/<iid>/layout.json.
//   locus-ops on rollback/<n> (release guard): only deploy/gcp/production-revision.
//   locus-ops on revert/<sha> (regression detective): only paths that commit <sha> changed; guard-revert checks that
//     the content is the exact inverse.
//   The impact reviewer writes MR notes only, so locus-ops commits anywhere else fail.
// Agents never delete files, except that the inverse of a file <sha> added is its delete (revert/<sha> only).
// People's commits are not checked here: CODEOWNERS and protected branches cover them.
const agents = require('./agents.json')

const flowPatterns = Object.entries(agents.flows).map(([flow, { authorPattern }]) => [flow, new RegExp(authorPattern)])
const serviceAccount = new RegExp(agents.serviceAccountEmail)

/**
 * Which flow made a commit, from its author or committer; null for a person. Duo's create_commit lets the model set
 * the author name and email, but the committer of an API commit is the account that called the API, so an agent
 * commit written under a person's name is still the agent's.
 */
const agentOf = ({ authorName = '', authorEmail = '', committerName = '', committerEmail = '' }) => {
  const ids = [authorName, authorEmail.split('@')[0], committerName, committerEmail.split('@')[0]]
  const hit = flowPatterns.find(([, re]) => ids.some((id) => re.test(id)))
  return hit ? hit[0] : null
}

/** true when the author or committer is a GitLab service account (any Duo flow), by the local part of its email. */
const isServiceAccount = ({ authorEmail = '', committerEmail = '' }) =>
  [authorEmail, committerEmail].some((e) => serviceAccount.test(e.split('@')[0]))

const INTAKE_FILES = ['spec.json', 'request.lock.json', 'layout.json']

/**
 * @param {object} input.branch the branch the commits are on
 * @param {object[]} input.commits commits in base..head, oldest first: { sha, merge, authorName, authorEmail, committerName?, committerEmail?, paths: [{ status, path }] }
 * @param {function} [input.pathsOf] sha -> [{ status, path }] that commit changed (for revert branches)
 * @returns {{ pass: boolean, violations: { sha, flow, path?, reason }[], agentCommits: number, personCommits: number }}
 */
const checkScope = ({ branch, commits, pathsOf = () => [] }) => {
  const violations = []
  let agentCommits = 0
  let personCommits = 0
  const graph = branch.match(/^graph\/(\d+)$/)
  const revert = branch.match(/^revert\/([0-9a-f]{7,40})$/)
  const rollback = /^rollback\/\d+$/.test(branch)

  commits.forEach((c, index) => {
    const flow = agentOf(c)
    if (!flow && (graph || revert || rollback) && isServiceAccount(c)) {
      // Fail closed: a flow under another display name must not pass as a person on an agent branch.
      agentCommits++
      const name = c.committerName || c.authorName
      violations.push({ sha: c.sha, flow: null, reason: `service account "${name}" is not a Locus flow (agents.json): no commits on ${branch}` })
      return
    }
    if (!flow) {
      personCommits++
      return
    }
    agentCommits++
    const fail = (reason, path) => violations.push({ sha: c.sha, flow, ...(path && { path }), reason })

    let allowed
    let deletable = []
    if (flow === 'locus-request') {
      if (!graph) return fail(`locus-request may commit only on graph/<iid>, not on ${branch}`)
      const dir = `requests/${graph[1]}/`
      allowed = index === 0 ? INTAKE_FILES.map((f) => dir + f) : [dir + 'layout.json']
    } else if (rollback) {
      allowed = ['deploy/gcp/production-revision']
    } else if (revert) {
      const target = pathsOf(revert[1])
      allowed = target.map((p) => p.path)
      deletable = target.filter((p) => p.status === 'A').map((p) => p.path)
    } else {
      return fail(`locus-ops may commit only on rollback/<n> or revert/<sha>, not on ${branch}`)
    }

    if (c.merge) fail('an agent may not make merge commits')
    for (const { status, path } of c.paths) {
      if (status === 'D' && !deletable.includes(path)) fail('an agent may not delete files', path)
      else if (!allowed.includes(path)) fail(`${flow} may not change this file here (allowed: ${allowed.join(', ') || 'nothing'})`, path)
    }
  })

  return { pass: violations.length === 0, violations, agentCommits, personCommits }
}

module.exports = { checkScope, agentOf, isServiceAccount }
