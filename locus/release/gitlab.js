// A small GitLab REST client for the release-side CI jobs (auto-merge, publish-package, release, site, reply-teacher).
// Two credentials, never printed (H8):
//   - CI_JOB_TOKEN (header JOB-TOKEN): packages, releases and reads in this project.
//   - LOCUS_GITLAB_TOKEN (header PRIVATE-TOKEN): Shawki's personal access token, a masked and hidden CI variable, for
//     the two calls the job token cannot make: merging an MR and posting a note. Project access tokens are not
//     available in the hackathon workspace, so these calls show as the token owner.
// `fetch` is injected so tests run without a network.

class GitLabError extends Error {
  constructor (method, route, status, body) {
    super(`GitLab ${method} ${route}: HTTP ${status}${body ? `: ${String(body).slice(0, 300)}` : ''}`)
    this.status = status
  }
}

/**
 * @param {{ apiUrl: string, projectId: string|number, jobToken?: string, token?: string, fetchImpl?: Function }} options
 * @returns {(method: string, route: string, opts?: { body?: object|Buffer, auth?: 'job'|'token', raw?: boolean }) => Promise<any>}
 *   `route` is relative to the project (`/merge_requests/3`), or absolute from the API root when it starts with `//`.
 */
const gitlab = ({ apiUrl, projectId, jobToken, token, fetchImpl = fetch }) => async (method, route, { body, auth = 'job', raw = false } = {}) => {
  const secret = auth === 'token' ? token : jobToken
  if (!secret) throw new Error(`GitLab ${method} ${route}: no ${auth === 'token' ? 'LOCUS_GITLAB_TOKEN' : 'CI_JOB_TOKEN'}`)
  const url = route.startsWith('//')
    ? `${apiUrl.replace(/\/+$/, '')}${route.slice(1)}`
    : `${apiUrl.replace(/\/+$/, '')}/projects/${encodeURIComponent(projectId)}${route}`
  const headers = { [auth === 'token' ? 'PRIVATE-TOKEN' : 'JOB-TOKEN']: secret }
  let payload
  if (Buffer.isBuffer(body)) {
    payload = body
    headers['Content-Type'] = 'application/octet-stream'
  } else if (body !== undefined) {
    payload = JSON.stringify(body)
    headers['Content-Type'] = 'application/json'
  }
  const res = await fetchImpl(url, { method, headers, body: payload })
  if (!res.ok) throw new GitLabError(method, route, res.status, await res.text().catch(() => ''))
  if (raw) return Buffer.from(await res.arrayBuffer())
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

/** The client for this CI job, from GitLab's predefined variables. */
const fromEnv = (env = process.env, fetchImpl) => gitlab({
  apiUrl: env.CI_API_V4_URL,
  projectId: env.CI_PROJECT_ID,
  jobToken: env.CI_JOB_TOKEN,
  token: env.LOCUS_GITLAB_TOKEN,
  fetchImpl
})

module.exports = { gitlab, fromEnv, GitLabError }
