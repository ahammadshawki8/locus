// `locus auto-merge`: the `auto-merge` CI job in a graph/<iid> MR pipeline (projectLocus.md S.4 step 6, contracts D7).
// In hands-off mode it asks GitLab to merge the MR when the pipeline succeeds (the merge API's auto_merge), pinned to
// this pipeline's commit. GitLab, not this job, then decides: the project's "Pipelines must succeed" check refuses a
// red pipeline, and a newer commit cancels the request. Agents have no merge tool, so the merge is this job's.
// It does nothing (exit 0) in supervised mode, during the judging freeze, or on any branch but graph/<iid> into the
// default branch. Exit 1 = the merge request was refused or could not be made.
const { fromEnv } = require('./gitlab')

const GRAPH_BRANCH = /^graph\/([1-9][0-9]*)$/

/** What the job should do, from the pipeline's variables alone: { merge: true } or { merge: false, reason }. */
const plan = (env) => {
  if (env.JUDGING_FREEZE === 'true') return { merge: false, reason: 'JUDGING_FREEZE is on: nothing is merged during judging' }
  if (env.RELEASE_MODE !== 'hands-off') return { merge: false, reason: `RELEASE_MODE is "${env.RELEASE_MODE}": a person merges (supervised)` }
  if (env.CI_PIPELINE_SOURCE !== 'merge_request_event' || !env.CI_MERGE_REQUEST_IID) return { merge: false, reason: 'not a merge request pipeline' }
  const m = GRAPH_BRANCH.exec(env.CI_MERGE_REQUEST_SOURCE_BRANCH_NAME || '')
  if (!m) return { merge: false, reason: `branch "${env.CI_MERGE_REQUEST_SOURCE_BRANCH_NAME}" is not graph/<iid>` }
  if (env.CI_MERGE_REQUEST_TARGET_BRANCH_NAME !== env.CI_DEFAULT_BRANCH) return { merge: false, reason: `target "${env.CI_MERGE_REQUEST_TARGET_BRANCH_NAME}" is not the default branch` }
  return { merge: true, iid: Number(env.CI_MERGE_REQUEST_IID), requestId: Number(m[1]) }
}

const commitMessage = (mr, env) => [
  `Merge ${mr.source_branch}: ${mr.title}`,
  '',
  `Merged by the auto-merge CI job (hands-off) once pipeline ${env.CI_PIPELINE_ID} passed every check.`,
  `See merge request ${env.CI_PROJECT_PATH}!${mr.iid}`
].join('\n')

const runAutoMerge = async (env = process.env, api = fromEnv(env)) => {
  const p = plan(env)
  if (!p.merge) {
    console.log(`auto-merge: nothing to do: ${p.reason}`)
    return 0
  }
  if (!env.LOCUS_GITLAB_TOKEN) {
    console.error('auto-merge: hands-off needs the masked CI variable LOCUS_GITLAB_TOKEN (HANDOVER.md section 7); a person must merge this MR')
    return 1
  }
  const mr = await api('GET', `/merge_requests/${p.iid}`, { auth: 'token' })
  if (mr.state !== 'opened') {
    console.log(`auto-merge: !${p.iid} is ${mr.state}; nothing to do`)
    return 0
  }
  if (mr.sha !== env.CI_COMMIT_SHA) {
    console.log(`auto-merge: !${p.iid} has a newer commit (${mr.sha}); its own pipeline decides`)
    return 0
  }
  if (mr.draft || mr.has_conflicts) {
    console.error(`auto-merge: !${p.iid} is ${mr.draft ? 'a draft' : 'in conflict'}; a person must look at it`)
    return 1
  }
  const merged = await api('PUT', `/merge_requests/${p.iid}/merge`, {
    auth: 'token',
    body: {
      sha: env.CI_COMMIT_SHA,
      auto_merge: true,
      should_remove_source_branch: true,
      merge_commit_message: commitMessage(mr, env)
    }
  })
  const state = merged.state === 'merged' ? 'merged' : 'set to merge when the pipeline succeeds'
  console.log(`auto-merge: !${p.iid} (request ${p.requestId}) ${state}, at ${env.CI_COMMIT_SHA}`)
  return 0
}

module.exports = { plan, commitMessage, runAutoMerge, GRAPH_BRANCH }
