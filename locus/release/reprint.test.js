const test = require('node:test')
const assert = require('node:assert')

const { reprintOf, runReprints } = require('./reprint')
const { gitlab } = require('./gitlab')
const { LIMITATIONS } = require('../core/bundle')

const manifest = { artifactId: 'graph-3-v1', brailleId: 'G3', requestIssue: 3, limitations: LIMITATIONS }
const env = (over = {}) => ({
  PRINT_ORDER_ENABLED: 'true',
  PRINT_ORDER_TO: 'shop@example.org',
  PRINT_ORDER_FROM: 'locus.orders@example.com',
  PRINT_ORDER_SMTP_PASSWORD: 'app-password',
  LOCUS_GITLAB_TOKEN: 'pat',
  LOCUS_SITE_URL: 'https://locus.example',
  CI_API_V4_URL: 'https://gitlab.example/api/v4',
  CI_PROJECT_ID: '9',
  ...over
})

/** A fake GitLab with the given open reprint issues and released packages. */
const fake = (issues, packages = { 'graph-3-v1': true }) => {
  const calls = []
  const fetchImpl = async (url, init) => {
    const route = url.replace('https://gitlab.example/api/v4/projects/9', '')
    calls.push({ method: init.method, route, body: init.body && JSON.parse(init.body) })
    const pkg = /^\/packages\/generic\/locus-graphs\/([^/]+)\/(.+)$/.exec(route)
    if (pkg) {
      if (!packages[pkg[1]]) return { ok: false, status: 404, text: async () => '' }
      const data = pkg[2] === 'manifest.json' ? JSON.stringify({ ...manifest, artifactId: pkg[1] }) : 'solid plate'
      return { ok: true, status: 200, arrayBuffer: async () => Buffer.from(data) }
    }
    if (route.startsWith('/issues?')) return { ok: true, status: 200, text: async () => JSON.stringify(issues) }
    return { ok: true, status: 201, text: async () => '{}' }
  }
  return { calls, api: gitlab({ apiUrl: 'https://gitlab.example/api/v4', projectId: '9', jobToken: 'job', token: 'pat', fetchImpl }) }
}
const issue = (iid, author, title, description = '') => ({ iid, author: { username: author }, title, description })

test('a reprint issue names its released graph in the title or the description', () => {
  assert.strictEqual(reprintOf(issue(8, 'n', 'Reprint: graph-3-v1, 4 copies')), 'graph-3-v1')
  assert.strictEqual(reprintOf(issue(8, 'n', 'More copies please', 'Reprint: graph-12-v2\nPrinted copies needed: 2')), 'graph-12-v2')
  assert.strictEqual(reprintOf(issue(8, 'n', 'Tactile graph: projectile')), null)
})

test('each open reprint from a project member is ordered from the school shop, noted and closed', async () => {
  const { calls, api } = fake([issue(8, 'nourin.richi.2026', 'Reprint: graph-3-v1, 4 copies', 'Reprint: graph-3-v1\nPrinted copies needed: 4')])
  const sent = []
  assert.strictEqual(await runReprints([], env(), api, (m) => sent.push(m)), 0)
  assert.strictEqual(sent.length, 1)
  assert.strictEqual(sent[0].to, 'shop@example.org')
  assert.match(sent[0].message, /Subject: Print order: graph-3-v1, 4 copies/)
  assert.match(sent[0].message, /Page with a preview: https:\/\/locus\.example\/graphs\/graph-3-v1\//)
  const writes = calls.filter((c) => c.method !== 'GET').map((c) => `${c.method} ${c.route}`)
  assert.deepStrictEqual(writes, ['POST /issues/8/notes', 'PUT /issues/8'])
  assert.match(calls.find((c) => c.method === 'POST').body.body, /4 more copies of graph-3-v1 to s\*\*\*@example\.org/)
})

test('a Service Desk ticket cannot order prints, and an unknown graph is closed with a note, not ordered', async () => {
  const send = () => { throw new Error('must not send') }
  const desk = fake([issue(9, 'support-bot', 'Reprint: graph-3-v1, 50 copies')])
  assert.strictEqual(await runReprints([], env(), desk.api, send), 0)
  assert.ok(!desk.calls.some((c) => c.method !== 'GET'), 'nothing written for a Service Desk ticket')
  const unknown = fake([issue(10, 'nourin.richi.2026', 'Reprint: graph-99-v1, 2 copies')])
  assert.strictEqual(await runReprints([], env(), unknown.api, send), 0)
  assert.match(unknown.calls.find((c) => c.method === 'POST').body.body, /graph-99-v1 was not found/)
})

test('off, frozen or missing settings: nothing is read or sent', async () => {
  const send = () => { throw new Error('must not send') }
  const { calls, api } = fake([issue(8, 'n', 'Reprint: graph-3-v1')])
  assert.strictEqual(await runReprints([], env({ PRINT_ORDER_ENABLED: '' }), api, send), 0)
  assert.strictEqual(await runReprints([], env({ JUDGING_FREEZE: 'true' }), api, send), 0)
  assert.strictEqual(await runReprints([], env({ LOCUS_SITE_URL: '' }), api, send), 2)
  assert.strictEqual(calls.length, 0)
})
