const test = require('node:test')
const assert = require('node:assert')
const fs = require('fs')
const os = require('os')
const path = require('path')

const { copiesFrom, orderMessage, runPrintOrder, maskEmail } = require('./print-order')
const { gitlab } = require('./gitlab')

const manifest = { artifactId: 'graph-3-v1', brailleId: 'G3', requestIssue: 3 }
const H2 = new RegExp(`[${String.fromCharCode(0x2013, 0x2014, 0x2212)}]`)
const env = (over = {}) => ({
  PRINT_ORDER_ENABLED: 'true',
  PRINT_ORDER_TO: 'shop@example.org',
  PRINT_ORDER_FROM: 'locus.orders@example.com',
  PRINT_ORDER_SMTP_PASSWORD: 'app-password',
  PRINT_ORDER_REPLY_TO: 'teacher@example.org',
  CI_API_V4_URL: 'https://gitlab.example/api/v4',
  CI_PROJECT_ID: '9',
  LOCUS_GITLAB_TOKEN: 'pat',
  ...over
})

const dirs = (released) => {
  const release = fs.mkdtempSync(path.join(os.tmpdir(), 'locus-po-release-'))
  const bundle = fs.mkdtempSync(path.join(os.tmpdir(), 'locus-po-bundle-'))
  fs.writeFileSync(path.join(release, 'released.json'), JSON.stringify({ released }))
  for (const tag of released) {
    fs.mkdirSync(path.join(release, tag))
    fs.writeFileSync(path.join(release, tag, 'manifest.json'), JSON.stringify({ ...manifest, artifactId: tag }))
    fs.mkdirSync(path.join(bundle, tag))
    fs.writeFileSync(path.join(bundle, tag, 'graph.stl'), 'solid plate')
  }
  return [release, bundle]
}

const fake = (description = '') => {
  const calls = []
  const fetchImpl = async (url, init) => {
    const route = url.replace('https://gitlab.example/api/v4/projects/9', '')
    calls.push({ method: init.method, route, body: init.body && JSON.parse(init.body) })
    return { ok: true, status: 200, text: async () => JSON.stringify(init.method === 'GET' ? { description } : {}) }
  }
  return { calls, api: gitlab({ apiUrl: 'https://gitlab.example/api/v4', projectId: '9', jobToken: 'job', token: 'pat', fetchImpl }) }
}

test('the number of copies comes from the request, then the default, then 1', () => {
  assert.strictEqual(copiesFrom('Function: y = x\nPrinted copies needed: 6\n', '2'), 6)
  assert.strictEqual(copiesFrom('no copies line', '2'), 2)
  assert.strictEqual(copiesFrom('', undefined), 1)
  assert.strictEqual(copiesFrom('Printed copies needed: 0', 'x'), 1)
  assert.strictEqual(maskEmail('shop@example.org'), 's***@example.org')
})

test('the order is a MIME message with the print settings and the STL attached', () => {
  const msg = orderMessage({ manifest, copies: 6, siteUrl: 'https://locus.example/', apiUrl: 'https://gitlab.example/api/v4', projectId: '9', from: 'a@x.com', to: 'shop@example.org', replyTo: 't@x.com', stl: Buffer.from('solid plate'), boundary: 'B' })
  assert.match(msg, /^From: Locus print orders <a@x\.com>\r\nTo: shop@example\.org\r\nReply-To: t@x\.com\r\nSubject: Print order: graph-3-v1, 6 copies\r\n/)
  assert.match(msg, /Please print 6 copies/)
  assert.match(msg, /100 x 100 x 3\.6 mm/)
  assert.match(msg, /Page with a preview: https:\/\/locus\.example\/graphs\/graph-3-v1\//)
  assert.match(msg, /Content-Disposition: attachment; filename="graph-3-v1\.stl"\r\nContent-Transfer-Encoding: base64\r\n\r\nc29saWQgcGxhdGU=\r\n--B--/)
  assert.match(msg, /Nothing has been paid or confirmed yet/)
  assert.ok(!H2.test(msg))
})

test('when on, it sends one order per released graph, then notes it on the request', async () => {
  const [release, bundle] = dirs(['graph-3-v1'])
  const { calls, api } = fake('Printed copies needed: 6')
  const sent = []
  assert.strictEqual(await runPrintOrder(['https://locus.example', release, bundle], env(), api, (m) => sent.push(m)), 0)
  assert.strictEqual(sent.length, 1)
  assert.strictEqual(sent[0].to, 'shop@example.org')
  assert.strictEqual(sent[0].password, 'app-password')
  assert.match(sent[0].message, /Subject: Print order: graph-3-v1, 6 copies/)
  assert.deepStrictEqual(calls.map((c) => `${c.method} ${c.route}`), ['GET /issues/3', 'POST /issues/3/notes'])
  assert.match(calls[1].body.body, /Print order sent: 6 copies of graph-3-v1 to s\*\*\*@example\.org/)
  assert.ok(!calls[1].body.body.includes('shop@example.org'), 'the shop address is not published on the issue')
})

test('off, frozen, nothing released or missing settings: nothing is sent', async () => {
  const [release, bundle] = dirs(['graph-3-v1'])
  const send = () => { throw new Error('must not send') }
  assert.strictEqual(await runPrintOrder(['https://l', release, bundle], env({ PRINT_ORDER_ENABLED: '' }), fake().api, send), 0)
  assert.strictEqual(await runPrintOrder(['https://l', release, bundle], env({ JUDGING_FREEZE: 'true' }), fake().api, send), 0)
  assert.strictEqual(await runPrintOrder(['https://l', ...dirs([])], env(), fake().api, send), 0)
  assert.strictEqual(await runPrintOrder(['https://l', release, bundle], env({ PRINT_ORDER_SMTP_PASSWORD: '' }), fake().api, send), 2)
})
