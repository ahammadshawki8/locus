// `locus validate-site <url> [--expect-commit <sha>]`: the `validate-staging` and `post-deploy-smoke` CI jobs.
// Reads the live site the way a visitor would: /build-info.json must name this pipeline's commit, the library page and
// every graph page must load as text/html, and each graph's graph.stl, graph.svg and description.txt must have exactly the sha256
// its manifest.json gives. Writes out/<name>/report.json and prints `LOCUS_SITE_CHECK <json>` (agents read logs).
// Exit 0 = every check passed, 1 = a check failed (the release guard reads why), 2 = usage.
const fs = require('fs')
const path = require('path')

const { sha256 } = require('../core/bundle')

const fetchBytes = async (fetchImpl, url) => {
  const res = await fetchImpl(url, { redirect: 'follow' })
  const type = (res.headers && res.headers.get('content-type')) || ''
  return { status: res.status, type, body: res.ok ? Buffer.from(await res.arrayBuffer()) : null }
}

/** @returns {Promise<{ pass: boolean, checks: { what: string, pass: boolean, detail?: string }[] }>} */
const validateSite = async (baseUrl, { expectCommit, fetchImpl = fetch } = {}) => {
  const base = baseUrl.replace(/\/+$/, '')
  const checks = []
  const check = (what, pass, detail) => checks.push(detail === undefined ? { what, pass } : { what, pass, detail })

  const info = await fetchBytes(fetchImpl, `${base}/build-info.json`)
  if (!info.body) {
    check('build-info.json loads', false, `HTTP ${info.status}`)
    return { pass: false, checks }
  }
  const buildInfo = JSON.parse(info.body.toString('utf8'))
  check('build-info.json loads', true)
  if (expectCommit) check('the site was built from this commit', buildInfo.commit === expectCommit, `site ${buildInfo.commit || 'none'}, pipeline ${expectCommit}`)

  const home = await fetchBytes(fetchImpl, `${base}/`)
  check('the library page loads', Boolean(home.body), `HTTP ${home.status}`)
  // A page served with another type is saved as a file by the browser instead of shown.
  const html = (res) => /^text\/html\b/i.test(res.type)
  if (home.body) check('the library page is served as text/html', html(home), home.type || 'no content type')

  for (const id of buildInfo.graphs || []) {
    const pageRes = await fetchBytes(fetchImpl, `${base}/graphs/${id}/`)
    check(`${id}: page loads`, Boolean(pageRes.body), `HTTP ${pageRes.status}`)
    if (pageRes.body) check(`${id}: page is served as text/html`, html(pageRes), pageRes.type || 'no content type')
    const m = await fetchBytes(fetchImpl, `${base}/graphs/${id}/manifest.json`)
    if (!m.body) {
      check(`${id}: manifest.json loads`, false, `HTTP ${m.status}`)
      continue
    }
    const manifest = JSON.parse(m.body.toString('utf8'))
    for (const [file, hash] of Object.entries(manifest.hashes)) {
      const f = await fetchBytes(fetchImpl, `${base}/graphs/${id}/${file}`)
      check(`${id}: ${file} matches its manifest hash`, Boolean(f.body) && sha256(f.body) === hash, f.body ? undefined : `HTTP ${f.status}`)
    }
  }
  // detail on passing checks only says what was compared; keep it on failures
  for (const c of checks) if (c.pass && c.what !== 'the site was built from this commit') delete c.detail
  return { pass: checks.every((c) => c.pass), checks }
}

const runValidateSite = async (args, env = process.env, fetchImpl = fetch) => {
  const url = args.find((a) => /^https?:\/\//.test(a))
  const i = args.indexOf('--expect-commit')
  const expectCommit = i >= 0 ? args[i + 1] : undefined
  const j = args.indexOf('--name')
  const name = j >= 0 ? args[j + 1] : 'site-check'
  if (!url) {
    console.error('usage: locus validate-site <url> [--expect-commit <sha>] [--name <report folder>]')
    return 2
  }
  const result = await validateSite(url, { expectCommit, fetchImpl })
  const outDir = path.join('out', name)
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify({ url, ...result }, null, 2) + '\n')
  for (const c of result.checks) console.log(`  ${c.pass ? 'ok  ' : 'FAIL'} ${c.what}${c.detail ? ` (${c.detail})` : ''}`)
  console.log(`LOCUS_SITE_CHECK ${JSON.stringify({ url, pass: result.pass, failing: result.checks.filter((c) => !c.pass).map((c) => c.what) })}`)
  return result.pass ? 0 : 1
}

module.exports = { validateSite, runValidateSite }
