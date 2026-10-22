// `locus print-order <production url>`: the `print-order` CI job, after reply-teacher on the default branch
// Off unless PRINT_ORDER_ENABLED=true. For each graph this pipeline released, it emails
// the print shop an order with the STL attached and the print settings written out, then notes on the request that
// the order went out. Nothing is paid or confirmed: the shop replies to the teacher.
//   PRINT_ORDER_TO             the school's print shop
//   PRINT_ORDER_FROM           the sending account (for example a Gmail address made for Locus)
//   PRINT_ORDER_SMTP_PASSWORD  that account's app password: masked and hidden, never on a command line or in a log
//   PRINT_ORDER_SMTP_URL       optional, default smtps://smtp.gmail.com:465
//   PRINT_ORDER_REPLY_TO       optional: where the shop should reply (the teacher)
//   PRINT_ORDER_COPIES         optional default copies; the request's "Printed copies needed: N" line wins, and
//                              "Printed copies needed: 0" (digital files only, from the Request page) means no order
// Exit 0 = sent (or off, or nothing released), 1 = the mail server or GitLab refused, 2 = missing input.
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { spawnSync } = require('child_process')

const { fromEnv } = require('./gitlab')
const { packageFileUrl } = require('./release')

/** "Printed copies needed: 6" in the request, else the default, else 1. "Printed copies needed: 0" is 0: no order. */
const copiesFrom = (issueText, fallback) => {
  const m = /Printed copies needed:\s*(\d{1,3})/i.exec(issueText || '')
  if (m) return Math.min(99, Number(m[1]))
  const n = Number(fallback)
  return Number.isInteger(n) && n > 0 ? n : 1
}

const wrap76 = (b64) => (b64.match(/.{1,76}/g) || []).join('\r\n')

/** The order as a MIME message (RFC 5322 + 2045): a plain-text body and the STL attached. Plain ASCII (H2). */
const orderMessage = ({ manifest, copies, siteUrl, apiUrl, projectId, from, to, replyTo, stl, boundary = crypto.randomBytes(12).toString('hex') }) => {
  const id = manifest.artifactId
  const page = `${siteUrl.replace(/\/+$/, '')}/graphs/${id}/`
  const text = [
    'Hello,',
    '',
    `Please print ${copies} ${copies === 1 ? 'copy' : 'copies'} of this tactile maths graph for a class of blind and low-vision learners.`,
    '',
    `Graph: ${id} (braille ID ${manifest.brailleId} in the top-right corner)`,
    'File: graph.stl, attached (also at the link below)',
    `Download: ${packageFileUrl(apiUrl, projectId, id, 'graph.stl')}`,
    `Page with a preview: ${page}`,
    '',
    'How to print it:',
    '- 100% scale. Do not resize: the touch checks measured the spacing at this size.',
    '- The part must measure 100 x 100 x 3.6 mm in the slicer.',
    '- PLA, 0.12 to 0.16 mm layers, flat on the bed as in the file, no supports.',
    '- Keep the top surface clean: the raised lines and braille dots are read by touch.',
    '',
    `Please reply${replyTo ? ` to ${replyTo}` : ''} with the price and when the plates will be ready. Nothing has been paid or confirmed yet.`,
    '',
    'Thank you.',
    '',
    'Sent automatically by the Locus pipeline after the graph passed its touch checks.'
  ].join('\r\n')
  return [
    `From: Locus print orders <${from}>`,
    `To: ${to}`,
    ...(replyTo ? [`Reply-To: ${replyTo}`] : []),
    `Subject: Print order: ${id}, ${copies} ${copies === 1 ? 'copy' : 'copies'}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${id}.${boundary}@locus>`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    text,
    '',
    `--${boundary}`,
    `Content-Type: model/stl; name="${id}.stl"`,
    `Content-Disposition: attachment; filename="${id}.stl"`,
    'Content-Transfer-Encoding: base64',
    '',
    wrap76(stl.toString('base64')),
    `--${boundary}--`,
    ''
  ].join('\r\n')
}

/** Sends one message with curl's SMTP client. The password goes in on stdin as a curl config, never in argv. */
const curlSend = ({ url, from, to, password, message }) => {
  const dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'locus-order-'))
  const file = path.join(dir, 'order.eml')
  fs.writeFileSync(file, message)
  const quote = (s) => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
  const config = [`url = ${quote(url)}`, 'ssl-reqd', `mail-from = ${quote(from)}`, `mail-rcpt = ${quote(to)}`, `user = ${quote(`${from}:${password}`)}`, `upload-file = ${quote(file)}`, 'silent', 'show-error'].join('\n')
  const r = spawnSync('curl', ['--config', '-'], { input: config, encoding: 'utf8' })
  fs.rmSync(dir, { recursive: true, force: true })
  if (r.status !== 0) throw new Error(`the mail server refused the order (curl exit ${r.status}): ${(r.stderr || '').replace(password, '***').trim().slice(0, 200)}`)
}

const maskEmail = (email) => {
  const [user, domain] = String(email || '').split('@')
  return domain ? `${user.slice(0, 1)}***@${domain}` : 'the print shop'
}

const runPrintOrder = async (args, env = process.env, api = fromEnv(env), send = curlSend) => {
  const siteUrl = args[0]
  const releaseDir = args[1] || path.join('out', 'release')
  const bundleDir = args[2] || path.join('out', 'bundle')
  if (env.JUDGING_FREEZE === 'true') {
    console.log('print-order: JUDGING_FREEZE is on: no orders during judging')
    return 0
  }
  if (env.PRINT_ORDER_ENABLED !== 'true') {
    console.log('print-order: off (set PRINT_ORDER_ENABLED=true to send orders)')
    return 0
  }
  const missing = ['PRINT_ORDER_TO', 'PRINT_ORDER_FROM', 'PRINT_ORDER_SMTP_PASSWORD'].filter((k) => !env[k])
  if (missing.length || !siteUrl) {
    console.error(`print-order: cannot send: ${missing.length ? `missing ${missing.join(', ')}` : 'usage: locus print-order <production url>'}`)
    return 2
  }
  const listFile = path.join(releaseDir, 'released.json')
  if (!fs.existsSync(listFile)) {
    console.error(`print-order: ${listFile} not found (the release job writes it)`)
    return 2
  }
  const { released } = JSON.parse(fs.readFileSync(listFile, 'utf8'))
  if (!released.length) {
    console.log('print-order: nothing was released in this pipeline')
    return 0
  }
  for (const tag of released) {
    const manifest = JSON.parse(fs.readFileSync(path.join(releaseDir, tag, 'manifest.json'), 'utf8'))
    const stlFile = path.join(bundleDir, tag, 'graph.stl')
    if (!fs.existsSync(stlFile)) {
      console.error(`print-order: ${stlFile} not found (the bundle job writes it)`)
      return 2
    }
    let issue = null
    if (env.LOCUS_GITLAB_TOKEN) {
      try {
        issue = await api('GET', `/issues/${manifest.requestIssue}`, { auth: 'token' })
      } catch {}
    }
    const to = env.PRINT_ORDER_TO
    const copies = copiesFrom(issue && issue.description, env.PRINT_ORDER_COPIES)
    if (copies === 0) {
      console.log(`print-order: ${tag}: the request asked for digital files only; not ordered`)
      continue
    }
    const message = orderMessage({
      manifest, copies, siteUrl, apiUrl: env.CI_API_V4_URL, projectId: env.CI_PROJECT_ID,
      from: env.PRINT_ORDER_FROM, to, replyTo: env.PRINT_ORDER_REPLY_TO, stl: fs.readFileSync(stlFile)
    })
    send({ url: env.PRINT_ORDER_SMTP_URL || 'smtps://smtp.gmail.com:465', from: env.PRINT_ORDER_FROM, to, password: env.PRINT_ORDER_SMTP_PASSWORD, message })
    console.log(`print-order: ${tag}: ${copies} ${copies === 1 ? 'copy' : 'copies'} ordered from ${maskEmail(to)}`)
    if (env.LOCUS_GITLAB_TOKEN) {
      const note = [
        'Automated message from the Locus pipeline.',
        `Print order sent: ${copies} ${copies === 1 ? 'copy' : 'copies'} of ${tag} to ${maskEmail(to)}, with the STL attached and the print settings.`,
        `The shop has been asked to reply${env.PRINT_ORDER_REPLY_TO ? ` to ${maskEmail(env.PRINT_ORDER_REPLY_TO)}` : ''} with the price and the date. Nothing has been paid or confirmed.`
      ].join('\n\n')
      await api('POST', `/issues/${manifest.requestIssue}/notes`, { auth: 'token', body: { body: note } })
    }
  }
  return 0
}

module.exports = { copiesFrom, orderMessage, runPrintOrder, maskEmail, curlSend }
