// `locus site`: builds the graph library site that Cloud Run serves (docs/contracts.md §9; owner Shawki).
//   locus site [--out out/site]
// Every shipped graph is the newest release graph-<iid>-v<n> of a request (contracts D5). Its files come from the
// Package Registry, where `release` put them, so the site serves exactly what was released, never a re-render.
// Writes out/site/: index.html, graphs/<artifactId>/{index.html, graph.svg, overlay.svg, graph.stl, description.txt,
// manifest.json, <artifactId>.zip}, build-info.json, styles.css, and the container files (Dockerfile, nginx.conf).
// Design: the plate is the hero, shown as the object it is (tilted, lit, lines raised) from the released graph.svg,
// with its braille ID in real braille cells. One typeface: Atkinson Hyperlegible, made by the Braille Institute for
// low-vision readers. The pages work with screen readers: each preview is described by the learner description.
const fs = require('fs')
const path = require('path')

const { fromEnv } = require('../release/gitlab')
const { latestReleases } = require('../cli/shipped')
const { PACKAGE } = require('../release/release')
const { sha256 } = require('../core/bundle')
const { toBraille } = require('../core/braille')

const SITE_FILES = ['graph.svg', 'overlay.svg', 'graph.stl', 'description.txt', 'manifest.json']
const JSCAD = 'https://github.com/jscad/OpenJSCAD.org'

const escape = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

/** "y = 0.5x^3 - 3x^2 + 2" as HTML with superscript powers. */
const equationHtml = (text) => escape(text).replace(/\^(\d+)/g, '<sup>$1</sup>')

/** The first line of the learner description: "This tactile graph shows <equation>, for x from <a> to <b>." */
const readRequest = (description) => {
  const m = /shows (.+?), for x from (\S+) to (\S+?)\.?$/m.exec(description)
  return m ? { equation: m[1], from: m[2], to: m[3] } : null
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

const FONT = 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap'
// Six braille dots, the first and fourth raised: a small mark that reads as "a cell".
const FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%2316232e'/%3E%3Cg fill='%23f4f6f7'%3E%3Ccircle cx='11' cy='8' r='3'/%3E%3Ccircle cx='21' cy='8' r='3'/%3E%3Ccircle cx='11' cy='16' r='3'/%3E%3C/g%3E%3Cg fill='%23f4f6f7' opacity='.28'%3E%3Ccircle cx='21' cy='16' r='3'/%3E%3Ccircle cx='11' cy='24' r='3'/%3E%3Ccircle cx='21' cy='24' r='3'/%3E%3C/g%3E%3C/svg%3E"

const page = ({ title, body, depth, description }) => {
  const up = '../'.repeat(depth)
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)}</title>
<meta name="description" content="${escape(description)}">
<link rel="icon" href="${FAVICON}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONT}">
<link rel="stylesheet" href="${up}styles.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="top">
  <div class="wrap top-in">
    <a class="brand" href="${up || './'}">Locus</a>
    <nav aria-label="Site"><a href="${up || './'}#library">Graph library</a><a href="${up || './'}#how">How it works</a></nav>
  </div>
</header>
<main id="main">
${body}
</main>
<footer class="foot">
  <div class="wrap foot-in">
    <p class="limit">Automated checks measure spacing and size; they do not certify that a learner can understand the graphic.</p>
    <p>Locus is built on <a href="${JSCAD}">JSCAD</a>, the open-source (MIT) 3D modelling library. Its agents run on the GitLab Duo Agent Platform; this site is served from Google Cloud Run.</p>
  </div>
</footer>
</body>
</html>
`
}

const STYLES = `:root {
  color-scheme: light;
  --paper: #f4f6f7;
  --surface: #ffffff;
  --ink: #16232e;
  --muted: #55626c;
  --hair: #dde2e6;
  --stage-1: #eef1f3;
  --stage-2: #cfd6dc;
  --plate: #f5f7f8;
  --plate-side: #b4bdc4;
  --ridge: #22303b;
  --pass: #17734a;
  --pass-soft: #e2f1e9;
  --link: #2246c4;
}
@media (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;
    --paper: #0f161c;
    --surface: #151e25;
    --ink: #e8edf0;
    --muted: #a3afb8;
    --hair: #26323b;
    --stage-1: #2a353e;
    --stage-2: #141c22;
    --pass: #74d3a2;
    --pass-soft: #14301f;
    --link: #9ab4ff;
  }
}
* { box-sizing: border-box; }
html { font-size: 112.5%; -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--paper); color: var(--ink); font-family: "Atkinson Hyperlegible", system-ui, sans-serif; line-height: 1.55; }
a { color: var(--link); text-underline-offset: 0.2em; text-decoration-thickness: 1px; }
a:hover { text-decoration-thickness: 2px; }
:focus-visible { outline: 3px solid var(--link); outline-offset: 3px; border-radius: 6px; }
.skip { position: absolute; left: -999px; top: 0; }
.skip:focus { left: 1rem; top: 1rem; z-index: 2; background: var(--surface); padding: 0.5rem 0.8rem; }
.wrap { max-width: 72rem; margin: 0 auto; padding: 0 1.5rem; }
sup { font-size: 0.58em; line-height: 0; }

.top { border-bottom: 1px solid var(--hair); }
.top-in { display: flex; align-items: center; justify-content: space-between; height: 4rem; }
.brand { font-weight: 700; font-size: 1.25rem; color: var(--ink); text-decoration: none; letter-spacing: -0.01em; }
.top nav { display: flex; gap: 1.75rem; }
.top nav a { color: var(--muted); text-decoration: none; }
.top nav a:hover { color: var(--ink); }

/* The stage: a lit backdrop for the plate, as in a product photograph. */
.stage { background: radial-gradient(120% 90% at 30% 15%, var(--stage-1) 0%, var(--stage-2) 100%); border-radius: 24px; display: grid; place-items: center; padding: 3.5rem 2rem 4rem; perspective: 1700px; overflow: hidden; }
.plate3d { width: min(82%, 28rem); border-radius: 12px; background: var(--plate); transform: rotateX(24deg) rotateZ(-9deg); transform-origin: 50% 60%;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.9) inset, 0 7px 0 var(--plate-side), 0 9px 1px rgba(22, 35, 46, 0.18), 0 48px 64px -28px rgba(10, 18, 26, 0.55); }
.plate3d svg { display: block; width: 100%; height: auto; }
.plate3d svg .plate { fill: transparent; stroke: none; }
.plate3d svg polyline, .plate3d svg line, .plate3d svg path { stroke: var(--ridge); }
.plate3d svg polygon, .plate3d svg circle { fill: var(--ridge); }
.plate3d svg polyline, .plate3d svg line, .plate3d svg path, .plate3d svg polygon, .plate3d svg circle { filter: drop-shadow(0.25px 0.6px 0.35px rgba(10, 18, 26, 0.45)); }
.stage.small { padding: 1.75rem 1.25rem 2.25rem; border-radius: 18px; perspective: 900px; }
.stage.small .plate3d { width: 100%; box-shadow: 0 1px 0 rgba(255, 255, 255, 0.9) inset, 0 4px 0 var(--plate-side), 0 26px 32px -18px rgba(10, 18, 26, 0.55); }
.stage.small .plate3d svg polyline, .stage.small .plate3d svg circle { filter: none; }
@media (prefers-reduced-motion: no-preference) {
  .stage.hero .plate3d { animation: settle 1.1s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
  @keyframes settle { from { transform: rotateX(0deg) rotateZ(0deg) translateY(10px); } }
}

/* Landing */
.intro { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr); gap: 3.5rem; align-items: center; padding: 4rem 0 3rem; }
.intro h1 { font-size: clamp(2.3rem, 4.6vw, 3.6rem); line-height: 1.06; letter-spacing: -0.025em; margin: 0 0 1.25rem; max-width: 14ch; }
.intro p { font-size: 1.2rem; color: var(--muted); margin: 0 0 1.75rem; max-width: 34rem; }
.cta { display: flex; flex-wrap: wrap; gap: 0.75rem 1.5rem; align-items: center; }
.button { display: inline-flex; align-items: center; gap: 0.5rem; background: var(--ink); color: var(--paper); text-decoration: none; font-weight: 700; padding: 0.9rem 1.35rem; border-radius: 999px; }
.button:hover { text-decoration: none; opacity: 0.92; }
.caption { color: var(--muted); font-size: 0.9rem; text-align: center; margin: 0.9rem 0 0; }

section.band { padding: 3.5rem 0 1rem; }
.intro + section.band { padding-top: 1.5rem; }
section.band > h2, .section-head h2 { font-size: 1.9rem; letter-spacing: -0.02em; line-height: 1.15; margin: 0 0 0.6rem; }
.section-head { display: flex; justify-content: space-between; align-items: end; gap: 2rem; flex-wrap: wrap; margin-bottom: 2rem; }
.section-head p { color: var(--muted); margin: 0; max-width: 34rem; }

ol.steps { list-style: none; margin: 2rem 0 0; padding: 0; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0; border-top: 1px solid var(--hair); }
ol.steps li { padding: 1.5rem 1.5rem 0.5rem 0; }
ol.steps li + li { padding-left: 1.5rem; border-left: 1px solid var(--hair); }
ol.steps .n { font-weight: 700; font-size: 0.95rem; color: var(--muted); }
ol.steps h3 { font-size: 1.15rem; margin: 0.4rem 0 0.4rem; }
ol.steps p { margin: 0; color: var(--muted); }
ol.steps figure { margin: 1rem 0 0; }
ol.steps figure img { width: 100%; height: auto; display: block; background: #fff; border-radius: 10px; border: 1px solid var(--hair); }
ol.steps figcaption { font-size: 0.85rem; color: var(--muted); margin-top: 0.4rem; }

ul.library { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(19rem, 1fr)); gap: 2rem; }
ul.library a.card { display: block; color: inherit; text-decoration: none; }
ul.library .meta { display: flex; justify-content: space-between; align-items: baseline; margin-top: 1rem; }
ul.library .eq { font-weight: 700; font-size: 1.15rem; }
ul.library .id { color: var(--muted); white-space: nowrap; }
ul.library .id .cells { font-size: 1.35rem; color: var(--ink); margin-right: 0.35rem; vertical-align: -0.1em; }
ul.library .sub { color: var(--muted); margin: 0.2rem 0 0; }
ul.library a.card:hover .eq { text-decoration: underline; text-underline-offset: 0.2em; }
.empty { font-size: 1.2rem; color: var(--muted); }

.credits { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 2rem; margin-top: 1.5rem; }
.credits h3 { font-size: 1.05rem; margin: 0 0 0.35rem; }
.credits p { margin: 0; color: var(--muted); }

/* What the touch check measured: the overlay cropped to the plate, and the rule results as text. */
.measured { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); gap: 3rem; align-items: start; }
.measured .sheet { background: #fff; border: 1px solid var(--hair); border-radius: 18px; padding: 1rem; }
.measured .sheet svg { display: block; width: 100%; height: auto; }
ul.rules { list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--hair); }
ul.rules li { display: grid; grid-template-columns: 4.4rem 1fr; gap: 1rem; padding: 0.95rem 0; border-bottom: 1px solid var(--hair); }
ul.rules .rule { font-weight: 700; color: var(--pass); display: flex; align-items: center; gap: 0.45rem; white-space: nowrap; }
ul.rules .rule .dot { width: 1.1rem; height: 1.1rem; }
ul.rules p { margin: 0; }
.measured .note { color: var(--muted); font-size: 0.92rem; margin: 1rem 0 0; }

/* Graph page */
.crumbs { padding-top: 1.75rem; color: var(--muted); font-size: 0.95rem; }
.crumbs a { color: var(--muted); }
.product { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 3.5rem; align-items: center; padding: 1.5rem 0 1rem; }
.product h1 { font-size: clamp(1.8rem, 2.7vw, 2.35rem); line-height: 1.15; letter-spacing: -0.02em; margin: 0 0 0.5rem; white-space: nowrap; }
.product .range { color: var(--muted); font-size: 1.15rem; margin: 0 0 2rem; }
.idline { display: flex; align-items: center; gap: 1.1rem; padding: 1.1rem 0; border-top: 1px solid var(--hair); border-bottom: 1px solid var(--hair); margin-bottom: 1.5rem; }
.idline .cells { font-size: 3.4rem; line-height: 1; text-shadow: 0 2px 1px rgba(10, 18, 26, 0.22); }
.idline strong { display: block; font-size: 1.1rem; }
.idline span.text { color: var(--muted); }
.passed { display: flex; align-items: center; gap: 0.8rem; color: var(--pass); font-weight: 700; margin: 0 0 1.75rem; }
.passed .dot, ul.rules .dot { border-radius: 50%; background: var(--pass); display: grid; place-items: center; flex: none; }
.passed .dot { width: 1.6rem; height: 1.6rem; border-radius: 50%; background: var(--pass); display: grid; place-items: center; flex: none; }
.passed .dot svg { display: block; }
.passed span.more { display: block; color: var(--muted); font-weight: 400; }
.downloads { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem 1.5rem; }

.two { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 3.5rem; }
.description { white-space: pre-wrap; font: inherit; font-size: 1.05rem; margin: 0; background: var(--surface); border: 1px solid var(--hair); border-radius: 16px; padding: 1.4rem 1.6rem; }
dl.facts { margin: 0; display: grid; grid-template-columns: max-content 1fr; gap: 0.6rem 1.5rem; }
dl.facts dt { color: var(--muted); }
dl.facts dd { margin: 0; }
h2.small { font-size: 1.35rem; margin: 0 0 1rem; letter-spacing: -0.01em; }

.foot { border-top: 1px solid var(--hair); margin-top: 5rem; }
.foot-in { padding-top: 1.75rem; padding-bottom: 3rem; color: var(--muted); font-size: 0.92rem; display: grid; gap: 0.4rem; }
.foot p { margin: 0; max-width: 46rem; }
.foot .limit { color: var(--ink); }

@media (max-width: 60rem) {
  .intro, .product, .two, .measured { grid-template-columns: 1fr; gap: 2rem; }
  .product h1 { white-space: normal; }
  ol.steps { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  ol.steps li:nth-child(3) { border-left: 0; padding-left: 0; }
  .credits { grid-template-columns: 1fr; }
}
@media (max-width: 34rem) {
  .wrap { padding: 0 1rem; }
  ol.steps { grid-template-columns: 1fr; }
  ol.steps li + li { border-left: 0; padding-left: 0; border-top: 1px solid var(--hair); }
  .top nav { gap: 1rem; font-size: 0.9rem; }
  .stage { padding: 2.5rem 1rem 3rem; }
  .plate3d { transform: rotateX(18deg) rotateZ(-6deg); }
}
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

const TICK = '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 7.4l2.6 2.6L11 4.4" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'

/** The PASS lines the touchcheck overlay prints under the plate: [{ rule, text }]. */
const passLines = (overlay) => {
  if (!overlay) return []
  const out = []
  const re = /<text[^>]*>PASS (TL-\d) ([^<]+)<\/text>/g
  let m
  while ((m = re.exec(overlay.toString('utf8')))) out.push({ rule: m[1], text: m[2].trim() })
  return out
}

/** The touchcheck overlay cropped to the 100 mm plate (the report under it is shown as text instead). */
const overlayPlate = (overlay, id) => overlay.toString('utf8')
  .replace(/^<\?xml[^>]*>\s*/, '')
  .replace(/<svg ([^>]*?)width="[^"]*" height="[^"]*" viewBox="[^"]*"/, `<svg $1viewBox="-1 -1 102 102" role="img" aria-labelledby="${id}-overlay-title"`)
  .replace('<title>', `<title id="${id}-overlay-title">What the touch check measured: `)

/** The released graph.svg inlined in a lit stage, so its lines look raised. Named by its own <title>. */
const plateStage = (g, { hero = false, describedBy } = {}) => {
  const id = g.manifest.artifactId
  const svg = g.files['graph.svg'].toString('utf8')
    .replace(/^<\?xml[^>]*>\s*/, '')
    .replace('<svg ', `<svg role="img" aria-labelledby="${id}-title"${describedBy ? ` aria-describedby="${describedBy}"` : ''} `)
    .replace('<title>', `<title id="${id}-title">Plate preview: `)
  return `<div class="stage${hero ? ' hero' : ''}"><div class="plate3d">${svg}</div></div>`
}

const steps = (g, projectUrl) => {
  const m = g.manifest
  const attempts = m.touchcheck.attempts
  const session = m.agentSessions[0]
  const link = (href, text) => (href ? `<a href="${escape(href)}">${text}</a>` : text)
  return [
    ['A teacher asks', `${link(projectUrl && `${projectUrl}/-/issues/${m.requestIssue}`, `Request #${m.requestIssue}`)} named a function, its x range and the points to mark.`],
    ['An agent draws it', `A GitLab Duo agent turned the request into a plate layout${session ? ` (${link(session, 'its session')})` : ''}.`],
    ['The pipeline checks it by touch', `Five rules measure gaps, labels and edges like a fingertip would. Passed after ${plural(attempts, 'attempt')}${attempts > 1 ? ': the agent fixed its own layout' : ''}.`],
    ['It ships', `Released as ${link(projectUrl && `${projectUrl}/-/releases/${m.releaseTag}`, escape(m.releaseTag))}, published here, and the teacher gets the link by email.`]
  ]
}

const graphPage = (g, projectUrl) => {
  const m = g.manifest
  const req = g.request
  const attempts = m.touchcheck.attempts
  const list = steps(g, projectUrl).map(([title, text], i) => `  <li><span class="n">Step ${i + 1}</span><h3>${title}</h3><p>${text}</p></li>`).join('\n')
  const rules = passLines(g.files['overlay.svg'])
  const body = `<div class="wrap">
<p class="crumbs"><a href="../../">Graph library</a> / ${escape(m.brailleId)}</p>
<section class="product" aria-labelledby="title">
  ${plateStage(g, { hero: true, describedBy: 'description' })}
  <div>
    <h1 id="title">${req ? equationHtml(req.equation) : escape(m.artifactId)}</h1>
    <p class="range">${req ? `Raised-line graph for x from ${escape(req.from)} to ${escape(req.to)}` : escape(m.artifactId)}</p>
    <div class="idline">
      <span class="cells" aria-hidden="true">${toBraille(String(m.requestIssue))}</span>
      <span><strong>Braille ID ${escape(m.brailleId)}</strong><span class="text">Raised in the plate's top-right corner. Any print leads back to this page.</span></span>
    </div>
    <p class="passed"><span class="dot">${TICK}</span><span>Touch checks TL-1 to TL-5 passed<span class="more">after ${plural(attempts, 'attempt')}; the maths, scope and description guards passed too</span></span></p>
    <div class="downloads">
      <a class="button" href="graph.stl" download>Download the print file</a>
      <a href="${escape(m.artifactId)}.zip" download>All files (zip)</a>
    </div>
  </div>
</section>

<section class="band" aria-labelledby="made">
  <h2 id="made">How this graph was made</h2>
  <ol class="steps">
${list}
  </ol>
</section>

${rules.length ? `<section class="band" aria-labelledby="measured">
  <h2 id="measured">What the touch check measured</h2>
  <div class="measured">
    <div class="sheet">${overlayPlate(g.files['overlay.svg'], m.artifactId)}</div>
    <div>
      <ul class="rules">
${rules.map((r) => `        <li><span class="rule"><span class="dot">${TICK}</span>${escape(r.rule)}</span><p>${escape(r.text)}</p></li>`).join('\n')}
      </ul>
      <p class="note">Green circles on the drawing mark where each rule took its closest measurement. On a failing layout they are red, and the agent fixes the layout before anything ships.</p>
    </div>
  </div>
</section>
` : ''}<section class="band two">
  <div>
    <h2 class="small">Description for the learner</h2>
    <pre class="description" id="description">${escape(g.description.trim())}</pre>
  </div>
  <div>
    <h2 class="small">Print and provenance</h2>
    <dl class="facts">
      <dt>Print</dt><dd>At 100% scale, flat, no supports (README.txt in the zip)</dd>
      <dt>Printer profile</dt><dd>${escape(m.profile.id)} v${m.profile.version}</dd>
      <dt>Release</dt><dd>${projectUrl ? `<a href="${escape(`${projectUrl}/-/releases/${m.releaseTag}`)}">${escape(m.releaseTag)}</a>` : escape(m.releaseTag)}, ${escape(m.releaseMode)}</dd>
      <dt>Built from</dt><dd>commit <code>${escape(m.sourceCommit.slice(0, 8))}</code>, pipeline ${m.pipelineId}</dd>
      <dt>Files</dt><dd><a href="graph.svg">graph.svg</a>, <a href="description.txt">description.txt</a>, <a href="manifest.json">manifest.json</a></dd>
    </dl>
  </div>
</section>
</div>`
  return page({ title: `${m.brailleId}: ${req ? req.equation : m.artifactId} | Locus`, body, depth: 2, description: g.summary })
}

const indexPage = (graphs) => {
  const newest = graphs[graphs.length - 1]
  const cards = graphs.map((g) => {
    const m = g.manifest
    return `  <li><a class="card" href="graphs/${escape(m.artifactId)}/">
    ${plateStage(g).replace('<div class="stage', '<div class="stage small')}
    <span class="meta"><span class="eq">${g.request ? equationHtml(g.request.equation) : escape(m.artifactId)}</span><span class="id"><span class="cells" aria-hidden="true">${toBraille(String(m.requestIssue))}</span>${escape(m.brailleId)}</span></span>
    <span class="sub">${g.request ? `x from ${escape(g.request.from)} to ${escape(g.request.to)}, ` : ''}checked in ${plural(m.touchcheck.attempts, 'attempt')}</span>
  </a></li>`
  }).join('\n')
  const howSteps = [
    ['A teacher asks', 'One email with a function, an x range and the points to mark.'],
    ['An agent draws it', 'A GitLab Duo agent turns the request into a raised-line plate with braille labels.'],
    ['The pipeline checks it by touch', 'Five rules measure it the way a fingertip reads. If it fails, the agent fixes its own layout.'],
    ['It ships', 'Released, published here on Google Cloud, and the teacher gets a link to print.']
  ].map(([t, p], i) => `  <li><span class="n">Step ${i + 1}</span><h3>${t}</h3><p>${p}</p></li>`).join('\n')
  const body = `<div class="wrap">
<section class="intro" aria-labelledby="title">
  <div>
    <h1 id="title">Maths graphs a blind student can read by touch.</h1>
    <p>A teacher emails a function. Locus draws it as a raised-line plate, checks it the way a fingertip would, fixes it until it passes, and sends back a file ready to 3D print.</p>
    <div class="cta">${newest ? `<a class="button" href="graphs/${escape(newest.manifest.artifactId)}/">See the newest graph</a>` : ''}<a href="#how">How it works</a></div>
  </div>
  ${newest ? `<div>${plateStage(newest, { hero: true })}<p class="caption">${escape(newest.manifest.brailleId)}, from the library below</p></div>` : ''}
</section>

<section class="band" id="how" aria-labelledby="how-title">
  <h2 id="how-title">How it works</h2>
  <ol class="steps">
${howSteps}
  </ol>
</section>

<section class="band" id="library" aria-labelledby="library-title">
  <div class="section-head">
    <div><h2 id="library-title">Graph library</h2><p>Every graph here passed the touch checks before it was released. Print at 100% scale.</p></div>
  </div>
  ${graphs.length ? `<ul class="library">\n${cards}\n</ul>` : '<p class="empty">No graph has been released yet.</p>'}
</section>

<section class="band" aria-labelledby="credits-title">
  <h2 id="credits-title">Built on open work</h2>
  <div class="credits">
    <div><h3><a href="${JSCAD}">JSCAD</a></h3><p>The open-source (MIT) 3D modelling library that draws every plate. Locus started from it.</p></div>
    <div><h3>GitLab Duo Agent Platform</h3><p>Runs the agents that draw, fix and review, and the pipeline that checks every graph.</p></div>
    <div><h3>Google Cloud Run</h3><p>Serves this library. Every release is checked on staging before it reaches this page.</p></div>
  </div>
</section>
</div>`
  return page({ title: 'Locus: maths graphs a blind student can read by touch', body, depth: 0, description: 'Raised-line maths graphs for blind and low-vision learners, drawn by an agent, checked by touch rules, ready to 3D print.' })
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
    return { ...g, description, summary: summaryOf(description), request: readRequest(description) }
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

module.exports = { writeSite, fetchShipped, runSite, summaryOf, readRequest, SITE_FILES }
