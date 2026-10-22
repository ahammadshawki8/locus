const test = require('node:test')
const assert = require('node:assert')

const { doctor, runDoctor } = require('./doctor')

const AGENT = 'ai-locus-request-gitlab-ai-hackathon_b127f8'
const TEMPLATE = `Function:\n\n/label ~locus-request\n/assign @${AGENT}\n`
const CI = 'variables:\n  GCP_PROJECT_ID: "p"\n  GCP_REGION: "r"\n  GCP_WIF_PROVIDER: "w"\n  GCP_SERVICE_ACCOUNT: "s"\n'

// A project with everything set up; `over` replaces one API answer (a function throws like a failed call).
const project = (over = {}) => {
  const answers = {
    '': { visibility: 'public', only_allow_merge_if_pipeline_succeeds: true, service_desk_enabled: true },
    '/labels': ['locus-request', 'needs-info', 'cannot-make-readable', 'reprint'].map((name) => ({ name })),
    '/variables': ['LOCUS_GITLAB_TOKEN', 'PRINT_ORDER_ENABLED', 'PRINT_ORDER_TO', 'PRINT_ORDER_FROM', 'PRINT_ORDER_SMTP_PASSWORD'].map((key) => ({ key, value: key === 'PRINT_ORDER_ENABLED' ? 'true' : 'x' })),
    '/pipeline_schedules': [{ id: 1, active: true, description: 'Reprint orders' }],
    '/pipeline_schedules/1': { id: 1, active: true, inputs: [{ name: 'schedule', value: 'reprints' }] },
    '/members/all?query=ai-locus-request': [{ username: 'ahammadshawki8' }, { username: AGENT }],
    ...over
  }
  const calls = []
  const api = async (method, route) => {
    calls.push(`${method} ${route}`)
    // Lists are read page by page: `<route>?per_page=100&page=<n>`. A key `<route> page <n>` answers a later page;
    // pages without one are empty.
    const paged = /^(.*?)[?&]per_page=100&page=(\d+)$/.exec(route)
    if (paged && paged[2] !== '1') return answers[`${paged[1]} page ${paged[2]}`] || []
    const a = answers[paged ? paged[1] : route]
    if (typeof a === 'function') return a()
    if (a === undefined) throw Object.assign(new Error(`no answer for ${route}`), { status: 404 })
    return a
  }
  return { api, calls }
}
const files = { template: TEMPLATE, ci: CI }
const failing = (checks) => checks.filter((c) => c.level === 'fail').map((c) => c.what)

test('a fully set up project passes every check, and only reads (GET) from GitLab', async () => {
  const { api, calls } = project()
  const checks = await doctor({ api, files })
  assert.deepStrictEqual(failing(checks), [])
  assert.deepStrictEqual(checks.filter((c) => c.level === 'warn'), [])
  assert.ok(calls.every((c) => c.startsWith('GET ')), calls.join(', '))
  // names only: no variable value ever reaches the report (rule H8)
  assert.ok(!JSON.stringify(checks).includes('"x"'))
})

test('each missing piece fails with what to do about it', async () => {
  const { api } = project({
    '': { visibility: 'private', only_allow_merge_if_pipeline_succeeds: false, service_desk_enabled: false },
    '/labels': [{ name: 'locus-request' }],
    '/variables': [],
    '/members/all?query=ai-locus-request': [{ username: 'ahammadshawki8' }]
  })
  const checks = await doctor({ api, files })
  assert.deepStrictEqual(failing(checks), [
    'project is public',
    'pipelines must succeed before a merge',
    'Service Desk is on',
    'labels exist',
    'LOCUS_GITLAB_TOKEN is set',
    'the locus-request flow is enabled'
  ])
  for (const c of checks.filter((x) => x.level === 'fail')) assert.ok(c.fix, `${c.what} has a fix`)
  assert.match(checks.find((c) => c.what === 'labels exist').detail, /needs-info, cannot-make-readable, reprint/)
})

test('the issue template must assign the flow service account GitLab created', async () => {
  const { api } = project({ '/members/all?query=ai-locus-request': [{ username: 'ai-locus-request-other_1234' }] })
  const checks = await doctor({ api, files })
  assert.deepStrictEqual(failing(checks), ['the request template assigns the flow'])
  assert.match(checks.find((c) => c.what === 'the request template assigns the flow').detail, /ai-locus-request-other_1234/)
})

test('long lists are read to the end: a flow account on page 2 of an inherited member list is found', async () => {
  const people = Array.from({ length: 100 }, (_, i) => ({ username: `participant${i}` }))
  const { api } = project({
    '/members/all?query=ai-locus-request': people,
    '/members/all?query=ai-locus-request page 2': [{ username: AGENT }]
  })
  const checks = await doctor({ api, files })
  assert.deepStrictEqual(failing(checks), [])
  assert.match(checks.find((c) => c.what === 'the locus-request flow is enabled').detail, new RegExp(AGENT))
})

test('print orders are optional: off is fine, but on needs the address and password variables', async () => {
  const off = project({ '/variables': [{ key: 'LOCUS_GITLAB_TOKEN' }] })
  const offChecks = await doctor({ api: off.api, files })
  assert.deepStrictEqual(failing(offChecks), [])
  assert.strictEqual(offChecks.find((c) => c.what === 'print orders').level, 'ok')
  assert.match(offChecks.find((c) => c.what === 'print orders').detail, /off/)
  const half = project({ '/variables': [{ key: 'LOCUS_GITLAB_TOKEN' }, { key: 'PRINT_ORDER_ENABLED', value: 'true' }, { key: 'PRINT_ORDER_TO' }] })
  const halfChecks = await doctor({ api: half.api, files })
  assert.deepStrictEqual(failing(halfChecks), ['print orders'])
  assert.match(halfChecks.find((c) => c.what === 'print orders').detail, /PRINT_ORDER_FROM, PRINT_ORDER_SMTP_PASSWORD/)
})

test('no reprints schedule is a warning, not a failure; a schedule set by variable also counts', async () => {
  const none = project({ '/pipeline_schedules': [] })
  const c1 = (await doctor({ api: none.api, files })).find((c) => c.what === 'reprints schedule')
  assert.strictEqual(c1.level, 'warn')
  const byVariable = project({ '/pipeline_schedules/1': { id: 1, active: true, variables: [{ key: 'LOCUS_SCHEDULE', value: 'reprints' }] } })
  const c2 = (await doctor({ api: byVariable.api, files })).find((c) => c.what === 'reprints schedule')
  assert.strictEqual(c2.level, 'ok')
})

test('a call the token may not make is a warning that names the call, never a crash', async () => {
  const { api } = project({ '/variables': () => { throw Object.assign(new Error('403'), { status: 403 }) } })
  const checks = await doctor({ api, files })
  const v = checks.find((c) => c.what === 'LOCUS_GITLAB_TOKEN is set')
  assert.strictEqual(v.level, 'warn')
  assert.match(v.detail, /HTTP 403/)
})

test('the Google Cloud values must be filled in .gitlab-ci.yml', async () => {
  const { api } = project()
  const checks = await doctor({ api, files: { template: TEMPLATE, ci: 'variables:\n  GCP_PROJECT_ID: ""\n' } })
  assert.deepStrictEqual(failing(checks), ['Google Cloud values in .gitlab-ci.yml'])
})

test('runDoctor without a token runs the local checks only and says how to add the GitLab ones', async () => {
  const lines = []
  const log = (l) => lines.push(l)
  const code = await runDoctor([], { }, { log, readFile: (f) => (f.endsWith('.md') ? TEMPLATE : CI) })
  assert.strictEqual(code, 0)
  assert.ok(lines.some((l) => /GITLAB_TOKEN/.test(l)))
  assert.ok(lines.some((l) => /Google Cloud values/.test(l)))
})

test('runDoctor exits 1 when a check fails and prints a LOCUS_DOCTOR line', async () => {
  const lines = []
  const { api } = project({ '/members/all?query=ai-locus-request': [] })
  const code = await runDoctor(['--project', 'group/showcase'], { GITLAB_TOKEN: 't' }, { log: (l) => lines.push(l), api, readFile: (f) => (f.endsWith('.md') ? TEMPLATE : CI) })
  assert.strictEqual(code, 1)
  const summary = JSON.parse(lines.find((l) => l.startsWith('LOCUS_DOCTOR ')).slice('LOCUS_DOCTOR '.length))
  assert.strictEqual(summary.pass, false)
  assert.ok(summary.failing.includes('the locus-request flow is enabled'))
  assert.ok(!lines.join('\n').includes(' t '), 'the token is never printed')
})
