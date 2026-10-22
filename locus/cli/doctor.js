// `locus doctor [--project <id or group/path>]`: checks that a GitLab project is set up to run Locus, and says what to
// do about anything missing (docs/setup.md). Read-only: it only sends GET requests, and it reports CI variable names,
// never their values.
//   Local checks (always): the request template's /assign line, the Google Cloud values in .gitlab-ci.yml.
//   GitLab checks (with GITLAB_TOKEN or LOCUS_GITLAB_TOKEN, a personal access token with read_api or api scope):
//   visibility, merge rule, Service Desk, labels, CI variables, the locus-request flow, the reprints schedule.
// Prints one line per check and `LOCUS_DOCTOR <json>`. Exit 0 = nothing failed (warnings allowed), 1 = a check failed.
const fs = require('fs')
const path = require('path')

const { gitlab } = require('../release/gitlab')

const LABELS = ['locus-request', 'needs-info', 'cannot-make-readable', 'reprint']
const PRINT_VARS = ['PRINT_ORDER_TO', 'PRINT_ORDER_FROM', 'PRINT_ORDER_SMTP_PASSWORD']
const GCP_VARS = ['GCP_PROJECT_ID', 'GCP_REGION', 'GCP_WIF_PROVIDER', 'GCP_SERVICE_ACCOUNT']
const FLOW_ACCOUNT = /^ai-locus-request-/

const ok = (what, detail) => ({ what, level: 'ok', detail })
const fail = (what, detail, fix) => ({ what, level: 'fail', detail, fix })
const warn = (what, detail, fix) => ({ what, level: 'warn', detail, fix })

/** The checks that need only this repository. */
const localChecks = ({ template, ci }) => {
  const checks = []
  const empty = GCP_VARS.filter((k) => !new RegExp(`^\\s*${k}:\\s*"[^"]+"`, 'm').test(ci))
  checks.push(empty.length
    ? fail('Google Cloud values in .gitlab-ci.yml', `empty or missing: ${empty.join(', ')}`, 'Run deploy/gcp/setup.sh in Cloud Shell and paste the four values it prints (docs/setup.md, step 5).')
    : ok('Google Cloud values in .gitlab-ci.yml', GCP_VARS.join(', ')))
  return checks
}

/**
 * @param {{ api: Function, files: { template: string, ci: string } }} input  api: the gitlab.js client (token auth)
 * @returns {Promise<{ what: string, level: 'ok'|'warn'|'fail', detail?: string, fix?: string }[]>}
 */
const doctor = async ({ api, files }) => {
  const checks = []
  const get = async (route) => {
    try {
      return { data: await api('GET', route, { auth: 'token' }) }
    } catch (err) {
      return { error: `GET ${route}: HTTP ${err.status || 'error'}` }
    }
  }
  // A list, every page: the project's members include everyone inherited from its groups, often far more than 100.
  const getAll = async (route) => {
    const items = []
    for (let page = 1; page <= 50; page++) {
      const r = await get(`${route}${route.includes('?') ? '&' : '?'}per_page=100&page=${page}`)
      if (r.error) return r
      items.push(...r.data)
      if (r.data.length < 100) break
    }
    return { data: items }
  }

  const project = await get('')
  if (project.error) {
    checks.push(fail('the project can be read', project.error, 'Check --project and that the token has the read_api or api scope.'))
    return [...checks, ...localChecks(files)]
  }
  const p = project.data
  checks.push(p.visibility === 'public'
    ? ok('project is public', 'teachers and judges open the release links without signing in')
    : fail('project is public', `visibility is ${p.visibility}`, 'Settings > General > Visibility: Public, with public pipelines (docs/setup.md, step 2).'))
  checks.push(p.only_allow_merge_if_pipeline_succeeds
    ? ok('pipelines must succeed before a merge', 'auto-merge waits for every check')
    : fail('pipelines must succeed before a merge', 'off', 'Settings > Merge requests > Merge checks: tick "Pipelines must succeed" (docs/setup.md, step 2).'))
  checks.push(p.service_desk_enabled
    ? ok('Service Desk is on', 'anyone can email a request')
    : fail('Service Desk is on', 'off', 'Settings > General > Service Desk: turn it on (docs/setup.md, step 3).'))

  const labels = await getAll('/labels')
  if (labels.error) checks.push(warn('labels exist', labels.error, 'Create the labels by hand (docs/setup.md, step 3).'))
  else {
    const have = new Set(labels.data.map((l) => l.name))
    const missing = LABELS.filter((l) => !have.has(l))
    checks.push(missing.length
      ? fail('labels exist', `missing: ${missing.join(', ')}`, 'Manage > Labels > New label, one per name (docs/setup.md, step 3).')
      : ok('labels exist', LABELS.join(', ')))
  }

  const vars = await getAll('/variables')
  if (vars.error) {
    checks.push(warn('LOCUS_GITLAB_TOKEN is set', `${vars.error} (this token cannot list CI variables)`, 'Check Settings > CI/CD > Variables by hand (docs/setup.md, step 4).'))
  } else {
    const byKey = new Map(vars.data.map((v) => [v.key, v.value]))
    checks.push(byKey.has('LOCUS_GITLAB_TOKEN')
      ? ok('LOCUS_GITLAB_TOKEN is set', 'auto-merge and the reply to the teacher can run')
      : fail('LOCUS_GITLAB_TOKEN is set', 'missing', 'Add a personal access token (scope api) as a masked, hidden variable (docs/setup.md, step 4).'))
    if (byKey.get('PRINT_ORDER_ENABLED') !== 'true') checks.push(ok('print orders', 'off (set PRINT_ORDER_ENABLED=true to email the print shop)'))
    else {
      const missing = PRINT_VARS.filter((k) => !byKey.has(k))
      checks.push(missing.length
        ? fail('print orders', `on, but missing: ${missing.join(', ')}`, 'Add the print-order variables (docs/setup.md, step 7).')
        : ok('print orders', 'on'))
    }
  }

  const members = await getAll('/members/all?query=ai-locus-request')
  if (members.error) checks.push(warn('the locus-request flow is enabled', members.error, 'Check Manage > Members for the flow service account.'))
  else {
    const account = members.data.map((m) => m.username).find((u) => FLOW_ACCOUNT.test(u))
    if (!account) {
      checks.push(fail('the locus-request flow is enabled', 'no ai-locus-request-* service account is a member', 'Create the flow from .gitlab/duo/flows/locus-request.yml and enable it with the Assign and Mention triggers (docs/setup.md, step 6).'))
    } else {
      checks.push(ok('the locus-request flow is enabled', `service account @${account}`))
      const assigned = (/^\/assign @(\S+)/m.exec(files.template) || [])[1]
      checks.push(assigned === account
        ? ok('the request template assigns the flow', `/assign @${account}`)
        : fail('the request template assigns the flow', `the template assigns @${assigned || 'nobody'}, the flow account is @${account}`, 'Change the /assign line in .gitlab/issue_templates/graph-request.md and locus/issue-template.test.js (docs/setup.md, step 6).'))
    }
  }

  const schedules = await getAll('/pipeline_schedules')
  if (schedules.error) checks.push(warn('reprints schedule', schedules.error, 'Check Build > Pipeline schedules by hand (docs/setup.md, step 7).'))
  else {
    let found = false
    for (const s of schedules.data.filter((x) => x.active)) {
      const d = await get(`/pipeline_schedules/${s.id}`)
      const inputs = (d.data && d.data.inputs) || []
      const variables = (d.data && d.data.variables) || []
      if (inputs.some((i) => i.name === 'schedule' && i.value === 'reprints') || variables.some((v) => v.key === 'LOCUS_SCHEDULE' && v.value === 'reprints')) found = true
    }
    checks.push(found
      ? ok('reprints schedule', 'Print again requests are ordered every 30 minutes')
      : warn('reprints schedule', 'no active schedule with the input schedule = reprints', 'Only needed for "Print again": Build > Pipeline schedules > New (docs/setup.md, step 7).'))
  }

  return [...checks, ...localChecks(files)]
}

const option = (args, name) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}

const runDoctor = async (args, env = process.env, deps = {}) => {
  const log = deps.log || console.log
  const root = path.join(__dirname, '..', '..')
  const readFile = deps.readFile || ((f) => fs.readFileSync(path.join(root, f), 'utf8'))
  const files = { template: readFile('.gitlab/issue_templates/graph-request.md'), ci: readFile('.gitlab-ci.yml') }
  const token = env.GITLAB_TOKEN || env.LOCUS_GITLAB_TOKEN
  const projectId = option(args, '--project') || env.CI_PROJECT_ID || env.LOCUS_PROJECT

  let checks
  if (!token || !projectId) {
    log('locus doctor: local checks only. For the GitLab checks, set GITLAB_TOKEN (a personal access token with read_api')
    log('  scope) and pass --project <id or group/path>, for example: GITLAB_TOKEN=... npm run locus -- doctor --project my-group/locus')
    checks = localChecks(files)
  } else {
    const api = deps.api || gitlab({ apiUrl: env.CI_API_V4_URL || 'https://gitlab.com/api/v4', projectId, token, fetchImpl: deps.fetchImpl })
    checks = await doctor({ api, files })
  }

  for (const c of checks) {
    log(`  ${{ ok: 'ok  ', warn: 'warn', fail: 'FAIL' }[c.level]} ${c.what}${c.detail ? `: ${c.detail}` : ''}`)
    if (c.level !== 'ok' && c.fix) log(`       ${c.fix}`)
  }
  const failing = checks.filter((c) => c.level === 'fail').map((c) => c.what)
  log(`LOCUS_DOCTOR ${JSON.stringify({ pass: failing.length === 0, failing, warnings: checks.filter((c) => c.level === 'warn').map((c) => c.what) })}`)
  return failing.length ? 1 : 0
}

module.exports = { doctor, runDoctor, LABELS }
