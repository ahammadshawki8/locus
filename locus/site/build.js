// `locus site`: builds the graph library site that Cloud Run serves (docs/contracts.md §9; owner Shawki).
//   locus site [--out out/site]
// Every shipped graph is the newest release graph-<iid>-v<n> of a request (contracts D5). Its files come from the
// Package Registry, where `release` put them, so the site serves exactly what was released, never a re-render.
// Writes out/site/: index.html, graphs/<artifactId>/{index.html, graph.svg, graph.stl, description.txt,
// manifest.json, <artifactId>.zip}, build-info.json, styles.css, and the container files (Dockerfile, nginx.conf).
// The pages are plain HTML for screen readers: the description is the text alternative of the preview.
const fs = require('fs')
const path = require('path')

const { fromEnv } = require('../release/gitlab')
const { latestReleases } = require('../cli/shipped')
const { PACKAGE } = require('../release/release')
const { sha256 } = require('../core/bundle')

const SITE_FILES = ['graph.svg', 'graph.stl', 'description.txt', 'manifest.json']

const escape = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

const page = (title, body, depth) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)}</title>
<link rel="stylesheet" href="${'../'.repeat(depth)}styles.css">
</head>
<body>
<header><a class="home" href="${'../'.repeat(depth) || './'}">Locus</a> <span>tactile maths graphs</span></header>
<main>
${body}
</main>
<footer><p>Automated checks measure spacing and size; they do not certify that a learner can understand the graphic.</p></footer>
</body>
</html>
`

const STYLES = `:root { color-scheme: light dark; --ink: #111; --paper: #fdfdfb; --muted: #555; --line: #d6d6d0; --accent: #0b5cad; }
@media (prefers-color-scheme: dark) { :root { --ink: #f2f2ee; --paper: #141414; --muted: #b5b5ad; --line: #3a3a36; --accent: #7cb7ff; } }
* { box-sizing: border-box; }
body { margin: 0; font: 18px/1.55 system-ui, sans-serif; color: var(--ink); background: var(--paper); }
header, main, footer { max-width: 52rem; margin: 0 auto; padding: 1rem; }
header { display: flex; gap: .75rem; align-items: baseline; border-bottom: 1px solid var(--line); }
header .home { font-weight: 700; font-size: 1.3rem; color: var(--ink); text-decoration: none; }
header span, footer { color: var(--muted); }
a { color: var(--accent); }
a:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
h1 { font-size: 1.8rem; line-height: 1.2; margin: 1.2rem 0 .4rem; }
.preview { background: #fff; border: 1px solid var(--line); border-radius: 8px; padding: .5rem; max-width: 28rem; }
.preview img { width: 100%; height: auto; display: block; }
.facts { display: grid; grid-template-columns: max-content 1fr; gap: .25rem 1rem; }
.facts dt { color: var(--muted); }
.facts dd { margin: 0; }
ul.graphs { list-style: none; padding: 0; display: grid; gap: .75rem; }
ul.graphs li { border: 1px solid var(--line); border-radius: 8px; padding: .75rem 1rem; }
.downloads a { display: inline-block; margin: 0 1rem .5rem 0; }
pre.description { white-space: pre-wrap; font: inherit; background: transparent; }
`

const DOCKERFILE = `# The Locus graph library: static files served by nginx on Cloud Run's port 8080.
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY public /usr/share/nginx/html
`

const NGINX = `server {
  listen 8080;
  root /usr/share/nginx/html;
  index index.html;
  types { model/stl stl; }
  location = /build-info.json { add_header Cache-Control "no-store"; }
  location / { try_files $uri $uri/ =404; }
}
`

const graphPage = (g, projectUrl) => {
  const m = g.manifest
  const releaseUrl = projectUrl ? `${projectUrl}/-/releases/${m.releaseTag}` : null
  const requestUrl = projectUrl ? `${projectUrl}/-/issues/${m.requestIssue}` : null
  const body = `<h1>Tactile graph ${escape(m.artifactId)}</h1>
<p>${escape(g.summary)}</p>
<div class="preview"><img src="graph.svg" alt="${escape(g.description.trim())}"></div>
<h2>Download</h2>
<p class="downloads">
<a href="graph.stl" download>graph.stl (print this, at 100% scale)</a>
<a href="${escape(m.artifactId)}.zip" download>${escape(m.artifactId)}.zip (all files)</a>
<a href="description.txt">description.txt</a>
<a href="manifest.json">manifest.json</a>
</p>
<h2>Description for the learner</h2>
<pre class="description">${escape(g.description.trim())}</pre>
<h2>Checks</h2>
<dl class="facts">
<dt>Braille ID on the plate</dt><dd>${escape(m.brailleId)} (top-right corner)</dd>
<dt>Touch checks</dt><dd>TL-1 to TL-5 passed after ${m.touchcheck.attempts} attempt${m.touchcheck.attempts === 1 ? '' : 's'}</dd>
<dt>Guards</dt><dd>scope, maths and description passed</dd>
<dt>Release mode</dt><dd>${escape(m.releaseMode)}</dd>
<dt>Printer profile</dt><dd>${escape(m.profile.id)} v${m.profile.version}</dd>
<dt>Source commit</dt><dd><code>${escape(m.sourceCommit.slice(0, 8))}</code></dd>
${releaseUrl ? `<dt>GitLab release</dt><dd><a href="${escape(releaseUrl)}">${escape(m.releaseTag)}</a></dd>` : ''}
${requestUrl ? `<dt>Request</dt><dd><a href="${escape(requestUrl)}">issue #${m.requestIssue}</a></dd>` : ''}
</dl>`
  return page(`${m.artifactId}: Locus tactile graph`, body, 2)
}

const indexPage = (graphs) => {
  const items = graphs.map((g) => `<li><a href="graphs/${escape(g.manifest.artifactId)}/">${escape(g.manifest.artifactId)}</a>: ${escape(g.summary)}</li>`).join('\n')
  const body = `<h1>Locus graph library</h1>
<p>Raised-line maths graphs for blind and low-vision learners. A teacher emails a function; a GitLab Duo agent makes the graph, the pipeline checks it the way a fingertip would, and every graph here passed those checks.</p>
${graphs.length ? `<ul class="graphs">\n${items}\n</ul>` : '<p>No graph has been released yet.</p>'}`
  return page('Locus graph library', body, 0)
}

/** The first sentence of the learner description, for lists. */
const summaryOf = (description) => (description.trim().split(/(?<=\.)\s/)[0] || '').slice(0, 200)

/**
 * Writes the site. `graphs`: [{ manifest, files: { 'graph.svg': Buffer, ..., '<artifactId>.zip': Buffer } }].
 * Each file's sha256 must match the manifest's hash where it has one, so a corrupted download never ships.
 */
const writeSite = (outDir, { graphs, buildInfo, projectUrl }) => {
  fs.rmSync(outDir, { recursive: true, force: true })
  const pub = path.join(outDir, 'public')
  fs.mkdirSync(path.join(pub, 'graphs'), { recursive: true })
  const prepared = graphs.map((g) => {
    for (const [file, hash] of Object.entries(g.manifest.hashes)) {
      if (g.files[file] && sha256(g.files[file]) !== hash) throw new Error(`${g.manifest.artifactId}: ${file} does not match its manifest hash`)
    }
    const description = g.files['description.txt'].toString('utf8')
    return { ...g, description, summary: summaryOf(description) }
  }).sort((a, b) => a.manifest.requestIssue - b.manifest.requestIssue)
  for (const g of prepared) {
    const dir = path.join(pub, 'graphs', g.manifest.artifactId)
    fs.mkdirSync(dir, { recursive: true })
    for (const [file, data] of Object.entries(g.files)) fs.writeFileSync(path.join(dir, file), data)
    fs.writeFileSync(path.join(dir, 'index.html'), graphPage(g, projectUrl))
  }
  fs.writeFileSync(path.join(pub, 'index.html'), indexPage(prepared))
  fs.writeFileSync(path.join(pub, 'styles.css'), STYLES)
  fs.writeFileSync(path.join(pub, 'build-info.json'), JSON.stringify({ ...buildInfo, graphs: prepared.map((g) => g.manifest.artifactId) }, null, 2) + '\n')
  fs.writeFileSync(path.join(outDir, 'Dockerfile'), DOCKERFILE)
  fs.writeFileSync(path.join(outDir, 'nginx.conf'), NGINX)
  return prepared.map((g) => g.manifest.artifactId)
}

/** Every shipped graph's files, downloaded from the Package Registry with the job token. */
const fetchShipped = async (api) => {
  const releases = []
  for (let pageNo = 1; ; pageNo++) {
    const batch = await api('GET', `/releases?per_page=100&page=${pageNo}`)
    releases.push(...batch)
    if (batch.length < 100) break
  }
  const graphs = []
  for (const { tag } of latestReleases(releases.map((r) => r.tag_name))) {
    const get = (file) => api('GET', `/packages/generic/${PACKAGE}/${tag}/${file}`, { raw: true })
    const files = {}
    for (const file of [...SITE_FILES, `${tag}.zip`]) files[file] = await get(file)
    graphs.push({ manifest: JSON.parse(files['manifest.json'].toString('utf8')), files })
  }
  return graphs
}

const runSite = async (args, env = process.env, api = fromEnv(env)) => {
  const outIndex = args.indexOf('--out')
  const outDir = outIndex >= 0 ? args[outIndex + 1] : path.join('out', 'site')
  const graphs = await fetchShipped(api)
  const buildInfo = {
    version: require('../package.json').version,
    commit: env.CI_COMMIT_SHA || '',
    pipelineId: Number(env.CI_PIPELINE_ID || 0),
    builtAt: new Date().toISOString()
  }
  const ids = writeSite(outDir, { graphs, buildInfo, projectUrl: env.CI_PROJECT_URL })
  console.log(`site: ${ids.length} graph(s) in ${outDir}: ${ids.join(', ') || 'none yet'}`)
  console.log(`LOCUS_SITE ${JSON.stringify({ commit: buildInfo.commit, graphs: ids })}`)
  return 0
}

module.exports = { writeSite, fetchShipped, runSite, summaryOf, SITE_FILES }
