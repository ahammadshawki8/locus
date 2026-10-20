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
  'overlay.svg': Buffer.from([
    '<svg xmlns="http://www.w3.org/2000/svg" width="248mm" height="141mm" viewBox="0 0 248 141">',
    '<circle class="passed" cx="30" cy="48" r="3" fill="none"/><circle class="passed" cx="15" cy="55" r="5" fill="none"/>',
    ...['TL-1 Lines at least 3.2 mm apart; closest 3.31 mm', 'TL-2 Labels clear', 'TL-3 No labels overlap', 'TL-4 Everything requested is there', 'TL-5 Fits the plate'].map((t) => `<text x="4" y="110">PASS ${t}</text>`),
    '</svg>'
  ].join('\n')),
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
  // the 3D plate is decoration over a flat fallback; every fact is text in the panel
  assert.match(html, /<div class="screen detail">/)
  assert.match(html, /data-scene="single"/)
  assert.match(html, /<div class="fallback"><img src="graph\.svg" alt=""><\/div>/)
  assert.match(html, /"stl":"\/graphs\/graph-7-v2\/graph\.stl"/)
  assert.match(html, /id="description">This tactile graph shows/)
  assert.match(html, /Braille ID G7/)
  assert.match(html, /Touch checks TL-1 to TL-5 passed<\/p>\s*<p class="sub">After 2 attempts\./)
  assert.match(html, /href="https:\/\/gitlab\.example\/g\/p\/-\/releases\/graph-7-v2"/)
  assert.match(html, /href="https:\/\/gitlab\.example\/g\/p\/-\/issues\/7"/)
  assert.match(html, /agent-sessions\/9777991/)
  for (const f of ['graph.stl', 'graph.svg', 'overlay.svg', 'description.txt', 'manifest.json', 'graph-7-v2.zip']) assert.ok(fs.existsSync(path.join(pub, 'graphs', 'graph-7-v2', f)), f)
  const index = fs.readFileSync(path.join(pub, 'index.html'), 'utf8')
  // the carousel's plates, oldest first, and a plain list of links for screen readers
  assert.match(index, /data-scene="carousel"/)
  assert.match(index, /"id":"graph-7-v2".*"id":"graph-12-v1"/)
  assert.match(index, /<a href="\/graphs\/graph-12-v1\/">G12: /)
  assert.match(index, /<script type="importmap">.*three@0\.160\.0/)
  const credits = fs.readFileSync(path.join(pub, 'credits', 'index.html'), 'utf8')
  assert.match(credits, /href="https:\/\/github\.com\/jscad\/OpenJSCAD\.org"><strong>JSCAD<\/strong><\/a>/)
  assert.match(credits, /@jscad\/modeling/)
  assert.ok(!/Made by/.test(credits), 'the credits are for the open work Locus is built on')
  // About holds how it works, requesting, printing, setup and print orders
  const about = fs.readFileSync(path.join(pub, 'about', 'index.html'), 'utf8')
  for (const id of ['how', 'request', 'printing', 'setup', 'print-orders']) assert.match(about, new RegExp(`<h2 id="${id}">`))
  assert.match(about, /Subject: Tactile graph: projectile/)
  assert.match(about, /LOCUS_GITLAB_TOKEN/)
  assert.match(about, /<span class="status">Off<\/span>/)
  // Collections: every graph, newest first
  const collections = fs.readFileSync(path.join(pub, 'collections', 'index.html'), 'utf8')
  assert.match(collections, /href="\/graphs\/graph-12-v1\/"[\s\S]*href="\/graphs\/graph-7-v2\/"/)
  // the nav: About, Request, Collections, Credits, then the GitLab mark; no footer
  assert.match(index, /<a href="\/about\/">About<\/a><a href="\/request\/">Request<\/a><a href="\/collections\/">Collections<\/a><a href="\/credits\/">Credits<\/a><a class="gitlab" href="https:\/\/gitlab\.com\/[^"]+" aria-label="Locus on GitLab"><svg/)
  assert.ok(!/<footer/.test(index) && !/class="flash"/.test(index))
  for (const a of ['site.css', 'hud.js', 'scene.js']) assert.ok(fs.existsSync(path.join(pub, 'assets', a)), a)
  // the request form never carries an address: the teacher pastes their own, kept in their browser
  const request = fs.readFileSync(path.join(pub, 'request', 'index.html'), 'utf8')
  assert.match(request, /<form class="request" data-request data-agent="ai-locus-request-gitlab-ai-hackathon_b127f8"/)
  assert.ok(!/incoming\+|@incoming\.gitlab\.com/.test(request), 'no project address on the public site')
  // the touch checks: one highlight group per rule over the plate drawing
  for (const r of ['TL-1', 'TL-2', 'TL-3', 'TL-4', 'TL-5']) assert.match(html, new RegExp(`class="m-${r}"`))
  assert.match(fs.readFileSync(path.join(out, 'nginx.conf'), 'utf8'), /listen 8080/)
  assert.ok(fs.existsSync(path.join(out, 'Dockerfile')))
  for (const f of ['index.html', 'assets/site.css', 'assets/scene.js', 'assets/hud.js', 'about/index.html', 'request/index.html', 'collections/index.html', 'credits/index.html', 'graphs/graph-7-v2/index.html']) assert.ok(!H2.test(fs.readFileSync(path.join(pub, f), 'utf8')), `${f}: rule H2`)
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

test('the home page shows the four newest graphs; the collection shows them all', () => {
  const out = tmp()
  writeSite(out, { graphs: [1, 2, 3, 4, 5, 6].map((i) => graph(i, 1)), buildInfo: {} })
  const index = fs.readFileSync(path.join(out, 'public', 'index.html'), 'utf8')
  const ids = [...index.matchAll(/"id":"(graph-\d+-v1)"/g)].map((m) => m[1])
  assert.deepStrictEqual(ids, ['graph-3-v1', 'graph-4-v1', 'graph-5-v1', 'graph-6-v1'])
  assert.match(index, /All 6 graphs in the collection/)
  const collections = fs.readFileSync(path.join(out, 'public', 'collections', 'index.html'), 'utf8')
  assert.strictEqual([...collections.matchAll(/<li><a href="\/graphs\//g)].length, 6)
})
