// `locus reply-teacher <production url>`: the `reply-teacher` CI job, last on the default branch (projectLocus.md S.4
// step 8, docs/contracts.md §8). For each graph this pipeline released (out/release/released.json), it posts the
// summary note on the request issue and closes it. On a Service Desk ticket, GitLab emails the note to the teacher.
// It runs after post-deploy-smoke, so every link in the note already works. The note says it is automated: it is
// posted with LOCUS_GITLAB_TOKEN, so GitLab shows it under Shawki's name (gitlab.js).
// Exit 0 = replied (or nothing released), 1 = GitLab refused, 2 = missing input.
const fs = require('fs')
const path = require('path')

const { fromEnv } = require('./gitlab')
const { packageFileUrl } = require('./release')

/**
 * The contracts §8 note, plain text, no long dashes (H2). Lines are separated by blank lines: GitLab's Markdown joins
 * single line breaks into one paragraph (seen on issue #2, 21 Oct).
 */
const replyNote = ({ manifest, siteUrl, apiUrl, projectId }) => {
  const attempts = manifest.touchcheck.attempts
  return [
    'Automated message from the Locus pipeline.',
    `Your graph is ready: ${siteUrl.replace(/\/+$/, '')}/graphs/${manifest.artifactId}/`,
    `Download (print at 100% scale): ${packageFileUrl(apiUrl, projectId, manifest.artifactId, 'graph.stl')}`,
    `Checks passed: TL-1 to TL-5 (after ${attempts} attempt${attempts === 1 ? '' : 's'})`,
    `Braille ID on the plate: ${manifest.brailleId}`,
    `Note: ${manifest.limitations.charAt(0).toLowerCase()}${manifest.limitations.slice(1)}`
  ].join('\n\n')
}

const runReply = async (args, env = process.env, api = fromEnv(env)) => {
  const siteUrl = args[0]
  const releaseDir = args[1] || path.join('out', 'release')
  if (env.JUDGING_FREEZE === 'true') {
    console.log('reply-teacher: JUDGING_FREEZE is on: no notes during judging')
    return 0
  }
  if (!siteUrl) {
    console.error('usage: locus reply-teacher <production url> [release dir]')
    return 2
  }
  const listFile = path.join(releaseDir, 'released.json')
  if (!fs.existsSync(listFile)) {
    console.error(`reply-teacher: ${listFile} not found (the release job writes it)`)
    return 2
  }
  const { released } = JSON.parse(fs.readFileSync(listFile, 'utf8'))
  if (!released.length) {
    console.log('reply-teacher: nothing was released in this pipeline')
    return 0
  }
  if (!env.LOCUS_GITLAB_TOKEN) {
    console.error('reply-teacher: needs the masked CI variable LOCUS_GITLAB_TOKEN (HANDOVER.md section 7)')
    return 1
  }
  for (const tag of released) {
    const manifest = JSON.parse(fs.readFileSync(path.join(releaseDir, tag, 'manifest.json'), 'utf8'))
    const iid = manifest.requestIssue
    const body = replyNote({ manifest, siteUrl, apiUrl: env.CI_API_V4_URL, projectId: env.CI_PROJECT_ID })
    await api('POST', `/issues/${iid}/notes`, { auth: 'token', body: { body } })
    await api('PUT', `/issues/${iid}`, { auth: 'token', body: { state_event: 'close' } })
    console.log(`reply-teacher: ${tag}: note posted on #${iid}, issue closed`)
  }
  return 0
}

module.exports = { replyNote, runReply }
