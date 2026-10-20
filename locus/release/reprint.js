// `locus print-reprints`: the `print-reprints` CI job, on a pipeline schedule (every 30 minutes, LOCUS_SCHEDULE=reprints;
// docs/decisions.md 21 Oct (n)). A teacher asks for more copies of a released graph from its page ("Print again"),
// which emails the project an issue "Reprint: graph-<iid>-v<n>, <copies> copies" labelled `reprint`. GitLab cannot start
// a pipeline when an issue is opened, and agents cannot send mail, so this job collects the open `reprint` issues,
// emails the school's print shop (PRINT_ORDER_TO, the same settings as print-order) the released STL and the print
// settings, notes the order on the issue and closes it. Only issues a project member filed count: a Service Desk ticket
// from outside cannot order prints. Off unless PRINT_ORDER_ENABLED=true; nothing happens during the judging freeze.
// Exit 0 = done (or off, or nothing to do), 1 = GitLab or the mail server refused, 2 = missing settings.
const { fromEnv, GitLabError } = require('./gitlab')
const { PACKAGE } = require('./release')
const { copiesFrom, orderMessage, maskEmail, curlSend } = require('./print-order')

const TAG = /\bReprint:\s*(graph-(?:0|[1-9][0-9]*)-v[1-9][0-9]*)\b/i

/** The released graph a reprint issue names, from its title or description, or null. */
const reprintOf = (issue) => {
  const m = TAG.exec(`${issue.title || ''}\n${issue.description || ''}`)
  return m ? m[1].toLowerCase() : null
}

const runReprints = async (args, env = process.env, api = fromEnv(env), send = curlSend) => {
  if (env.JUDGING_FREEZE === 'true') {
    console.log('print-reprints: JUDGING_FREEZE is on: no orders during judging')
    return 0
  }
  if (env.PRINT_ORDER_ENABLED !== 'true') {
    console.log('print-reprints: off (set PRINT_ORDER_ENABLED=true to send orders)')
    return 0
  }
  const missing = ['PRINT_ORDER_TO', 'PRINT_ORDER_FROM', 'PRINT_ORDER_SMTP_PASSWORD', 'LOCUS_GITLAB_TOKEN', 'LOCUS_SITE_URL'].filter((k) => !env[k])
  if (missing.length) {
    console.error(`print-reprints: cannot send: missing ${missing.join(', ')}`)
    return 2
  }
  const issues = await api('GET', '/issues?labels=reprint&state=opened&per_page=50', { auth: 'token' })
  if (!issues.length) console.log('print-reprints: no reprint request is waiting')
  const note = (iid, ...lines) => api('POST', `/issues/${iid}/notes`, { auth: 'token', body: { body: ['Automated message from the Locus pipeline.', ...lines].join('\n\n') } })
  const close = (iid) => api('PUT', `/issues/${iid}`, { auth: 'token', body: { state_event: 'close' } })
  for (const issue of issues) {
    if (!issue.author || issue.author.username === 'support-bot') {
      console.log(`print-reprints: #${issue.iid} came in through Service Desk; only a project member can order prints`)
      continue
    }
    const tag = reprintOf(issue)
    let stl, manifest
    try {
      if (!tag) throw new GitLabError('GET', 'reprint', 404)
      manifest = JSON.parse((await api('GET', `/packages/generic/${PACKAGE}/${tag}/manifest.json`, { raw: true })).toString('utf8'))
      stl = await api('GET', `/packages/generic/${PACKAGE}/${tag}/graph.stl`, { raw: true })
    } catch (err) {
      if (!(err instanceof GitLabError) || err.status !== 404) throw err
      await note(issue.iid, `No print order was sent: this request does not name a released graph${tag ? ` (${tag} was not found)` : ''}. Use "Print again" on the graph's page.`)
      await close(issue.iid)
      console.log(`print-reprints: #${issue.iid}: no released graph${tag ? ` ${tag}` : ''}; closed with a note`)
      continue
    }
    const copies = Math.max(1, copiesFrom(issue.description, 1))
    const to = env.PRINT_ORDER_TO
    send({
      url: env.PRINT_ORDER_SMTP_URL || 'smtps://smtp.gmail.com:465',
      from: env.PRINT_ORDER_FROM,
      to,
      password: env.PRINT_ORDER_SMTP_PASSWORD,
      message: orderMessage({ manifest, copies, siteUrl: env.LOCUS_SITE_URL, apiUrl: env.CI_API_V4_URL, projectId: env.CI_PROJECT_ID, from: env.PRINT_ORDER_FROM, to, replyTo: env.PRINT_ORDER_REPLY_TO, stl })
    })
    await note(issue.iid,
      `Print order sent: ${copies} more ${copies === 1 ? 'copy' : 'copies'} of ${tag} to ${maskEmail(to)}, with the STL attached and the print settings.`,
      `The shop has been asked to reply${env.PRINT_ORDER_REPLY_TO ? ` to ${maskEmail(env.PRINT_ORDER_REPLY_TO)}` : ''} with the price and the date. Nothing has been paid or confirmed.`)
    await close(issue.iid)
    console.log(`print-reprints: #${issue.iid}: ${copies} ${copies === 1 ? 'copy' : 'copies'} of ${tag} ordered from ${maskEmail(to)}`)
  }
  return 0
}

module.exports = { reprintOf, runReprints }
