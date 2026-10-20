const test = require('node:test')
const assert = require('node:assert')
const fs = require('fs')
const os = require('os')
const path = require('path')

const { writeSite, fetchShipped, readRequest } = require('./build')
const { gitlab } = require('../release/gitlab')
const { sha256, LIMITATIONS } = require('../core/bundle')

const SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="100mm" height="100mm" viewBox="0 0 100 100">\n  <title>y = -0.5x^2 + 2x + 1</title>\n  <rect class="plate" x="0" y="0" width="100" height="100"/>\n</svg>\n'
const files = (id) => ({
  'graph.svg': Buffer.from(SVG),
  'overlay.svg': Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),
  'graph.stl': Buffer.from(`solid ${id}`),
  'description.txt': Buffer.from('This tactile graph shows y = -0.5x^2 + 2x + 1, for x from -0.5 to 4.5.\nIts highest point is at (2, 3).\n'),
  [`${id}.zip`]: Buffer.from('zip')
})

const graph = (iid, n) => {
  const id = `graph-${iid}-v${n}`
  const f = files(id)
  const manifest = {
    artifactId: id,
    brailleId: `G${iid}`,
    requestIssue: iid,
    sourceCommit: 'e'.repeat(40),
    pipelineId: 1,
    generatorVersion: '0.1.0',
    profile: { id: 'fdm-handheld-v1', version: 1 },
    hashes: { 'graph.stl': sha256(f['graph.stl']), 'graph.svg': sha256(f['graph.svg']), 'description.txt': sha256(f['description.txt']) },
    touchcheck: { pass: true, attempts: 2 },
    guards: { scope: true, maths: true, description: true },
    agentSessions: ['https://gitlab.example/g/p/-/automate/agent-sessions/9777991'],
    releaseMode: 'hands-off',
    releaseTag: id,
    limitations: LIMITATIONS
  }
  return { manifest, files: { ...f, 'manifest.json': Buffer.from(JSON.stringify(manifest)) } }
}

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'locus-site-'))
const H2 = new RegExp(`[${String.fromCharCode(0x2013, 0x2014, 0x2212)}]`)

test('the learner description names the equation and the x range', () => {
  assert.deepStrictEqual(readRequest('This tactile graph shows y = 0.5x^3 - 3x^2 + 4.5x + 2, for x from -0.1 to 4.\nMore.'), { equation: 'y = 0.5x^3 - 3x^2 + 4.5x + 2', from: '-0.1', to: '4' })
  assert.strictEqual(readRequest('Something else.'), null)
})

test('the site has a page per shipped graph at /graphs/<artifactId>/, the downloads, and build-info.json', () => {
  const out = tmp()
  const ids = writeSite(out, { graphs: [graph(12, 1), graph(7, 2)], buildInfo: { version: '0.1.0', commit: 'abc', builtAt: 'now' }, projectUrl: 'https://gitlab.example/g/p' })
  assert.deepStrictEqual(ids, ['graph-7-v2', 'graph-12-v1'])
  const pub = path.join(out, 'public')
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(path.join(pub, 'build-info.json'))), { version: '0.1.0', commit: 'abc', builtAt: 'now', graphs: ['graph-7-v2', 'graph-12-v1'] })
  const html = fs.readFileSync(path.join(pub, 'graphs', 'graph-7-v2', 'index.html'), 'utf8')
  assert.match(html, /<html lang="en">/)
  assert.match(html, /y = -0\.5x<sup>2<\/sup> \+ 2x \+ 1/)
  // the inlined plate is named by its own title and described by the learner description on the page
  assert.match(html, /role="img" aria-labelledby="graph-7-v2-title" aria-describedby="description"/)
  assert.match(html, /<title id="graph-7-v2-title">Plate preview: y = -0\.5x\^2 \+ 2x \+ 1<\/title>/)
  assert.match(html, /id="description">This tactile graph shows/)
  assert.match(html, /Braille ID G7/)
  assert.match(html, /TL-1 to TL-5 passed<span class="more">after 2 attempts/)
  assert.match(html, /href="https:\/\/gitlab\.example\/g\/p\/-\/releases\/graph-7-v2"/)
  assert.match(html, /href="https:\/\/gitlab\.example\/g\/p\/-\/issues\/7"/)
  assert.match(html, /agent-sessions\/9777991/)
  for (const f of ['graph.stl', 'graph.svg', 'overlay.svg', 'description.txt', 'manifest.json', 'graph-7-v2.zip']) assert.ok(fs.existsSync(path.join(pub, 'graphs', 'graph-7-v2', f)), f)
  const index = fs.readFileSync(path.join(pub, 'index.html'), 'utf8')
  assert.match(index, /href="graphs\/graph-12-v1\/"/)
  assert.match(index, /JSCAD/)
  assert.match(fs.readFileSync(path.join(out, 'nginx.conf'), 'utf8'), /listen 8080/)
  assert.ok(fs.existsSync(path.join(out, 'Dockerfile')))
  for (const f of ['index.html', 'styles.css', 'graphs/graph-7-v2/index.html']) assert.ok(!H2.test(fs.readFileSync(path.join(pub, f), 'utf8')), `${f}: rule H2`)
})

test('an empty library still builds, so the first deploy works before any release', () => {
  const out = tmp()
  assert.deepStrictEqual(writeSite(out, { graphs: [], buildInfo: { version: '0.1.0', commit: '', builtAt: 'now' } }), [])
  assert.match(fs.readFileSync(path.join(out, 'public', 'index.html'), 'utf8'), /No graph has been released yet/)
})

test('a file that does not match its manifest hash is never shipped', () => {
  const g = graph(7, 1)
  g.files['graph.stl'] = Buffer.from('tampered')
  assert.throws(() => writeSite(tmp(), { graphs: [g], buildInfo: {} }), /graph.stl does not match its manifest hash/)
})

test('the site takes the newest release of each request from the Package Registry', async () => {
  const shipped = { 'graph-7-v1': graph(7, 1), 'graph-7-v2': graph(7, 2), 'graph-3-v1': graph(3, 1) }
  const fetched = []
  const fetchImpl = async (url) => {
    const route = url.replace('https://gitlab.example/api/v4/projects/9', '')
    if (route.startsWith('/releases')) return { ok: true, status: 200, text: async () => JSON.stringify(['graph-7-v1', 'graph-7-v2', 'graph-3-v1', 'v1.0'].map((t) => ({ tag_name: t }))) }
    const [, , , tag, file] = route.split('/').slice(1)
    fetched.push(`${tag}/${file}`)
    return { ok: true, status: 200, arrayBuffer: async () => shipped[tag].files[file] }
  }
  const api = gitlab({ apiUrl: 'https://gitlab.example/api/v4', projectId: '9', jobToken: 'job', fetchImpl })
  const graphs = await fetchShipped(api)
  assert.deepStrictEqual(graphs.map((g) => g.manifest.artifactId), ['graph-3-v1', 'graph-7-v2'])
  assert.ok(!fetched.some((f) => f.startsWith('graph-7-v1/')))
  assert.ok(fetched.includes('graph-7-v2/overlay.svg'))
})
