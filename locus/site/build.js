// `locus site`: builds the graph library site that Cloud Run serves (docs/contracts.md §9; owner Shawki).
//   locus site [--out out/site]
// Every shipped graph is the newest release graph-<iid>-v<n> of a request (contracts D5). Its files come from the
// Package Registry, where `release` put them, so the site serves exactly what was released, never a re-render.
// Writes out/site/public/: index.html (the library: the plates floating in a 3D carousel), how-it-works/, credits/,
// graphs/<artifactId>/{index.html, graph.svg, overlay.svg, graph.stl, description.txt, manifest.json, <id>.zip},
// assets/ (site.css, hud.js, scene.js), build-info.json; and out/site/{Dockerfile, nginx.conf}.
// Design: a CRT television showing the library, after arcmarumo.com (layout and effects; the code is our own). Every
// effect is decorative: the words are real HTML, everything works from the keyboard, motion stops for people who
// ask for reduced motion, and without WebGL each plate falls back to its flat drawing.
const fs = require('fs')
const path = require('path')

const { fromEnv } = require('../release/gitlab')
const { latestReleases } = require('../cli/shipped')
const { PACKAGE } = require('../release/release')
const { sha256 } = require('../core/bundle')
const { toBraille } = require('../core/braille')

const SITE_FILES = ['graph.svg', 'overlay.svg', 'graph.stl', 'description.txt', 'manifest.json']
const ASSETS = ['site.css', 'hud.js', 'scene.js', 'logo.svg']
const JSCAD = 'https://github.com/jscad/OpenJSCAD.org'
const PROJECT = 'https://gitlab.com/gitlab-ai-hackathon/transcend-october-2026/43384339/showcase'
const AGENT = 'ai-locus-request-gitlab-ai-hackathon_b127f8'
const THREE_VERSION = '0.160.0'

const escape = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

/** "y = 0.5x^3 - 3x^2 + 2" as HTML with superscript powers. */
const equationHtml = (text) => escape(text).replace(/\^(\d+)/g, '<sup>$1</sup>')

/** The first line of the learner description: "This tactile graph shows <equation>, for x from <a> to <b>." */
const readRequest = (description) => {
  const m = /shows (.+?), for x from (\S+) to (\S+?)\.?$/m.exec(description)
  return m ? { equation: m[1], from: m[2], to: m[3] } : null
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`
const kindOf = (equation) => (/x\^3/.test(equation || '') ? 'Cubic' : /x\^2/.test(equation || '') ? 'Parabola' : 'Line')

const FONTS = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap'
// The mark: a locus is the set of points that follow a rule, so it is five raised dots along an arch, the vertex
// marked larger, like a curve read by touch. assets/logo.svg is the same mark on a tile, used as the favicon.
const LOGO_MARK = '<svg class="mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><g fill="currentColor"><circle cx="6" cy="23.5" r="2.4"/><circle cx="10.6" cy="14.6" r="2.4"/><circle cx="16" cy="10.5" r="3.3"/><circle cx="21.4" cy="14.6" r="2.4"/><circle cx="26" cy="23.5" r="2.4"/></g></svg>'

const NAV = [['/about/', 'About'], ['/request/', 'Request'], ['/collections/', 'Collections'], ['/credits/', 'Credits']]
const HOME_GRAPHS = 4
// GitLab's tanuki mark, one colour, linking to the Locus project on GitLab.
const GITLAB_MARK = '<svg viewBox="0 0 32 32" width="20" height="20" aria-hidden="true" focusable="false"><path fill="currentColor" d="M31.4 12.6l-.04-.1L27 1.17a1.13 1.13 0 0 0-.45-.54 1.17 1.17 0 0 0-1.33.07 1.16 1.16 0 0 0-.38.58l-2.94 9H10.07l-2.94-9a1.13 1.13 0 0 0-.39-.58 1.17 1.17 0 0 0-1.33-.07 1.15 1.15 0 0 0-.45.54L.64 12.5l-.04.1a8.09 8.09 0 0 0 2.68 9.34l.02.01.04.03 6.62 4.96 3.28 2.48 2 1.51a1.35 1.35 0 0 0 1.63 0l2-1.51 3.28-2.48 6.67-4.99.02-.02a8.1 8.1 0 0 0 2.68-9.34z"/></svg>'

/** One page: the television (bezel and screen), the HUD, and the page's own content. */
const page = ({ title, description, current, content, scene, loader, screen = '' }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)}</title>
<meta name="description" content="${escape(description)}">
<link rel="icon" href="/assets/logo.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<link rel="stylesheet" href="/assets/site.css">
${scene ? `<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@${THREE_VERSION}/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@${THREE_VERSION}/examples/jsm/"}}</script>
<script type="module" src="/assets/scene.js"></script>` : ''}
<script src="/assets/hud.js" defer></script>
</head>
<body>
<a class="skip" href="#content">Skip to content</a>
<div class="tv">
<div class="screen${screen ? ` ${screen}` : ''}">
${content}
<header class="hud top">
  <div class="group"><a href="/"${current === 'home' ? ' aria-current="page"' : ''}>Home</a><span class="dim hide-s" data-timecode aria-hidden="true">00:00:00</span></div>
  <a class="brand" href="/" aria-label="Locus, home">${LOGO_MARK}<span class="word">locus</span></a>
  <nav aria-label="Site">${NAV.map(([href, label]) => `<a href="${href}"${current === href ? ' aria-current="page"' : ''}>${label}</a>`).join('')}<a class="gitlab" href="${PROJECT}" aria-label="Locus on GitLab">${GITLAB_MARK}</a></nav>
</header>
${loader ? `<div class="loader" role="status" aria-label="Loading the plates"><div class="row"><span>Loading</span><span data-count>0</span></div><div class="bar"><div class="fill"></div></div></div>` : ''}
</div>
</div>
</body>
</html>
`

/** The PASS lines the touchcheck overlay prints under the plate: [{ rule, text }]. */
const passLines = (overlay) => {
  if (!overlay) return []
  const out = []
  const re = /<text[^>]*>PASS (TL-\d) ([^<]+)<\/text>/g
  let m
  while ((m = re.exec(overlay.toString('utf8')))) out.push({ rule: m[1], text: m[2].trim() })
  return out
}

const RULE_NAMES = { 'TL-1': 'Lines apart', 'TL-2': 'Labels clear', 'TL-3': 'No overlap', 'TL-4': 'All there', 'TL-5': 'Fits the plate' }
const MARK = 'fill="none" stroke="#1c7a4b" stroke-width="0.7"'

/**
 * The plate drawing with the places each rule measured, one group per rule (shown when that rule is chosen):
 * TL-1 the closest pair of lines and TL-4 the marked points (both from the touchcheck overlay), TL-2 and TL-3 the
 * braille labels (from the drawing), TL-5 the edge margin of the profile.
 */
const checkDrawing = (g) => {
  const svg = g.files['graph.svg'].toString('utf8').replace(/^<\?xml[^>]*>\s*/, '')
  const overlay = g.files['overlay.svg'] ? g.files['overlay.svg'].toString('utf8') : ''
  const circles = [...overlay.matchAll(/<circle class="passed" cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"/g)].map((m) => m.slice(1).map(Number))
  const labels = [...svg.matchAll(/<g class="braille" data-label="label-[^"]*">([\s\S]*?)<\/g>/g)].map((m) => {
    const dots = [...m[1].matchAll(/cx="([\d.]+)" cy="([\d.]+)"/g)].map((d) => [Number(d[1]), Number(d[2])])
    const xs = dots.map((d) => d[0])
    const ys = dots.map((d) => d[1])
    return [Math.min(...xs) - 2, Math.min(...ys) - 2, Math.max(...xs) - Math.min(...xs) + 4, Math.max(...ys) - Math.min(...ys) + 4]
  })
  const margin = 3 // fdm-handheld-v1 rules.edgeMarginMm
  const box = ([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.2" ${MARK}/>`
  const marks = [
    `<g class="m-TL-1">${circles.filter((c) => c[2] >= 4).map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" ${MARK} stroke-width="1"/>`).join('')}</g>`,
    `<g class="m-TL-2">${labels.map(box).join('')}</g>`,
    `<g class="m-TL-3">${labels.map(box).join('')}</g>`,
    `<g class="m-TL-4">${circles.filter((c) => c[2] < 4).map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" ${MARK}/>`).join('')}</g>`,
    `<g class="m-TL-5"><rect x="${margin}" y="${margin}" width="${100 - 2 * margin}" height="${100 - 2 * margin}" rx="2" ${MARK} stroke-dasharray="2 1.5"/></g>`
  ].join('')
  return svg
    .replace(/<svg ([^>]*?)width="[^"]*" height="[^"]*" viewBox="[^"]*"/, '<svg $1viewBox="-1 -1 102 102" aria-hidden="true"')
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<\/svg>\s*$/, `<g class="marks">${marks}</g></svg>`)
}

/** What the 3D scene needs about each graph, as JSON for scene.js. */
const sceneData = (graphs) => JSON.stringify(graphs.map((g) => {
  const m = g.manifest
  return {
    id: m.artifactId,
    stl: `/graphs/${m.artifactId}/graph.stl`,
    url: `/graphs/${m.artifactId}/`,
    label: `${m.brailleId}, ${String(m.requestIssue).padStart(3, '0')}, 2026`,
    titleHtml: g.request ? equationHtml(g.request.equation) : escape(m.artifactId),
    tags: `${kindOf(g.request && g.request.equation)} • checked in ${plural(m.touchcheck.attempts, 'attempt')}`
  }
})).replace(/</g, '\\u003c')

const indexPage = (graphs, total = graphs.length) => {
  const newest = graphs[graphs.length - 1]
  const list = graphs.map((g) => `<li><a href="/graphs/${escape(g.manifest.artifactId)}/">${escape(g.manifest.brailleId)}: ${g.request ? equationHtml(g.request.equation) : escape(g.manifest.artifactId)}</a></li>`).join('')
  const content = graphs.length
    ? `<main id="content">
<h1 class="sr-only">Locus: maths graphs a blind student can read by touch</h1>
<p class="sr-only">Every graph in this library was drawn by a GitLab Duo agent from a teacher's request and passed five touch checks before release. Use the left and right arrow keys to move between graphs, and Enter to open the one in the centre.</p>
<section class="scene" data-scene="carousel" aria-label="Graph library">
  <div class="fallback"><img src="/graphs/${escape(newest.manifest.artifactId)}/graph.svg" alt=""></div>
  <ul class="sr-only">${list}</ul>
</section>
<script type="application/json" id="graphs-data">${sceneData(graphs)}</script>
<div class="caption" aria-live="polite">
  <span class="label" data-caption-label></span>
  <span class="title" data-caption-title></span>
  <span class="tags" data-caption-tags></span>
  <a class="all" href="/collections/">${total > graphs.length ? `All ${total} graphs in the collection` : 'Open the collection'}</a>
</div>
</main>`
    : `<main id="content" class="page"><div class="inner"><h1>Locus</h1><p class="lead">No graph has been released yet.</p></div></main>`
  return page({
    title: 'Locus: maths graphs a blind student can read by touch',
    description: 'Raised-line maths graphs for blind and low-vision learners, drawn by an agent, checked by touch rules, ready to 3D print.',
    current: 'home',
    content,
    scene: graphs.length > 0,
    loader: graphs.length > 0
  })
}

const graphPage = (g, projectUrl) => {
  const m = g.manifest
  const req = g.request
  const attempts = m.touchcheck.attempts
  const rules = passLines(g.files['overlay.svg'])
  const session = m.agentSessions[0]
  const link = (href, text) => (href ? `<a href="${escape(href)}">${text}</a>` : text)
  const made = [
    `${link(projectUrl && `${projectUrl}/-/issues/${m.requestIssue}`, `Request #${m.requestIssue}`)} named a function, its x range and the points to mark.`,
    `A GitLab Duo agent laid out the plate${session ? ` (${link(session, 'session')})` : ''}.`,
    `The pipeline checked it like a fingertip would: passed after ${plural(attempts, 'attempt')}${attempts > 1 ? '; the agent fixed its own layout' : ''}.`,
    `Released as ${link(projectUrl && `${projectUrl}/-/releases/${m.releaseTag}`, escape(m.releaseTag))} and published here.`
  ]
  const content = `<section class="scene" data-scene="single" aria-label="The plate in 3D">
  <div class="fallback"><img src="graph.svg" alt=""></div>
</section>
<script type="application/json" id="graphs-data">${sceneData([g])}</script>
<main id="content" class="panel">
  <p class="label">${escape(m.brailleId)}, ${String(m.requestIssue).padStart(3, '0')}, 2026</p>
  <h1>${req ? equationHtml(req.equation) : escape(m.artifactId)}</h1>
  <p class="range">${req ? `Raised-line graph for x from ${escape(req.from)} to ${escape(req.to)}` : escape(m.artifactId)}</p>
  <div class="braille"><span class="cells" aria-hidden="true">${toBraille(String(m.requestIssue))}</span><span class="what">Braille ID ${escape(m.brailleId)}<br>top-right corner of the plate</span></div>
  <p class="ok">Touch checks TL-1 to TL-5 passed</p>
  <p class="sub">After ${plural(attempts, 'attempt')}. The maths, scope and description guards passed too.</p>
  <div class="buttons"><a class="btn" href="graph.stl" download>Download STL</a><a class="btn ghost" href="${escape(m.artifactId)}.zip" download>All files</a></div>

  <h2>Description for the learner</h2>
  <pre class="desc" id="description">${escape(g.description.trim())}</pre>

  ${rules.length ? `<h2>What the touch check measured</h2>
  <div class="checks" data-checks>
    <div class="drawing">${checkDrawing(g)}</div>
    <div>
    <div class="rulebar" role="group" aria-label="Touch rules">${rules.map((r) => `<button type="button" data-rule="${escape(r.rule)}" data-text="${escape(`${r.rule}, ${RULE_NAMES[r.rule] || ''}: passed. ${r.text}.`)}" aria-pressed="false">${escape(r.rule)} ${escape(RULE_NAMES[r.rule] || '')}</button>`).join('')}</div>
    <p class="detail" data-rule-detail aria-live="polite">${escape(`${rules[0].rule}: passed. ${rules[0].text}.`)}</p>
    </div>
  </div>` : ''}

  <h2>How it was made</h2>
  <ol class="made">${made.map((t) => `<li><span>${t}</span></li>`).join('')}</ol>

  <h2>Print</h2>
  <dl class="grid">
    <dt>Scale</dt><dd>100%, flat on the bed, no supports</dd>
    <dt>Hold</dt><dd>Triangle at the top-left; braille ID at the top-right</dd>
    <dt>Profile</dt><dd>${escape(m.profile.id)} v${m.profile.version}</dd>
    <dt>Built from</dt><dd>commit ${escape(m.sourceCommit.slice(0, 8))}, pipeline ${m.pipelineId}</dd>
    <dt>Files</dt><dd><a href="graph.svg">graph.svg</a>, <a href="description.txt">description.txt</a>, <a href="manifest.json">manifest.json</a></dd>
  </dl>
  <p class="limit">${escape(m.limitations)}</p>
</main>`
  return page({
    title: `${m.brailleId}: ${req ? req.equation : m.artifactId} | Locus`,
    description: g.summary,
    current: 'graph',
    content,
    scene: true,
    loader: true,
    screen: 'detail'
  })
}

const MAIL = `Subject: Tactile graph: projectile

Please make a tactile graph of y = -0.5x^2 + 2x + 1
for x from -0.5 to 4.5.
Please mark the highest point and where the curve
crosses the y-axis.`

const textPage = ({ title, description, current, body, wide = false, full = false, scene = false }) => page({ title, description, current, scene, content: `<main id="content" class="page"><div class="inner${wide ? ' wide' : ''}${full ? ' full' : ''}">\n${body}\n</div></main>` })

const steps = (list) => `<ol class="steps">\n${list.map(([title, text], i) => `  <li><span class="n">${String(i + 1).padStart(2, '0')}</span><div><h3>${title}</h3>${text}</div></li>`).join('\n')}\n</ol>`

/** "shop@example.org" shown as "s***@example.org". */
const maskEmail = (email) => {
  const [user, domain] = String(email || '').split('@')
  return domain ? `${user.slice(0, 1)}***@${domain}` : ''
}

/** Line icons for the About page (24 x 24, drawn in the current colour). */
const ICON = {
  write: '<path d="M4 6h16v12H4z"/><path d="M4 7l8 6 8-6"/>',
  draw: '<rect x="4" y="4" width="16" height="16" rx="2.5"/><path d="M7 16c2.5-7 7.5-7 10 0"/><circle cx="12" cy="10.8" r="1.3" fill="currentColor" stroke="none"/>',
  check: '<path d="M9 21v-7.5a1.5 1.5 0 0 1 3 0V12a1.5 1.5 0 0 1 3 0v1a1.5 1.5 0 0 1 3 0v4.5a4.5 4.5 0 0 1-4.5 4.5H12"/><path d="M9 15.5 7.4 13.9a1.6 1.6 0 0 0-2.3 2.2L9 21"/><path d="M5 5.5l1.8 1.8L10 4"/>',
  print: '<path d="M7 9V4h10v5"/><rect x="4" y="9" width="16" height="7" rx="1.5"/><path d="M7 14h10v6H7z"/>'
}
const icon = (name) => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${ICON[name]}</svg>`

const DOCS = {
  readme: `${PROJECT}#readme`,
  how: `${PROJECT}/-/blob/main/docs/how-it-works.md`,
  setup: `${PROJECT}/-/blob/main/HANDOVER.md#13-moving-the-agent-to-the-team-project`,
  variables: `${PROJECT}/-/blob/main/HANDOVER.md#7-ci-variables-names-only-h8`
}

/** About: what Locus is and how to use it, in plain words. The technical setup lives in the repository's docs. */
const aboutPage = (newest) => textPage({
  title: 'About Locus',
  description: 'What Locus is and how a teacher uses it, in plain words.',
  current: '/about/',
  full: true,
  scene: Boolean(newest),
  body: `<section class="about-hero">
  <div>
    <h1>Blindness can't limit curiosity.</h1>
    <p class="lead">Blind and low-vision students learn maths graphs from raised-line plates they read with their fingertips. Making one by hand can take hours. With Locus, a teacher writes one email and gets back a plate that is ready to 3D print.</p>
    <div class="buttons"><a class="btn" href="/request/">Request a graph</a><a class="btn ghost" href="/collections/">See the collection</a></div>
  </div>
  ${newest ? `<figure class="plate-float">
    <section class="scene" data-scene="single" aria-label="A plate made by Locus, in 3D"><div class="fallback"><img src="/graphs/${escape(newest.manifest.artifactId)}/graph.svg" alt=""></div></section>
    <script type="application/json" id="graphs-data">${sceneData([newest])}</script>
    <figcaption>${newest.request ? equationHtml(newest.request.equation) : escape(newest.manifest.artifactId)}, made by Locus. Drag to turn it.</figcaption>
  </figure>` : ''}
</section>

<h2>How to use Locus</h2>
<ol class="cards">
  <li>${icon('write')}<span class="n">1</span><h3>Write what you are teaching</h3><p>A function and the points your students should find, or just today's topic, in your own words. The <a href="/request/">Request page</a> turns it into an email.</p></li>
  <li>${icon('draw')}<span class="n">2</span><h3>Locus draws the plate</h3><p>An AI agent reads your email and lays out the graph: raised lines, a dome on each point, and braille labels.</p></li>
  <li>${icon('check')}<span class="n">3</span><h3>It is checked by touch</h3><p>Before anything is sent, five rules measure the plate the way a fingertip reads it. If a rule fails, the agent fixes the layout and checks again.</p></li>
  <li>${icon('print')}<span class="n">4</span><h3>You print it</h3><p>About ten minutes later you get a reply with the print file. If your school has a print shop connected, the order goes to them too.</p></li>
</ol>

<h2>What you get back</h2>
<ul class="gets">
  <li><h3>The print file</h3><p>One STL file. Print it at 100% scale on any 3D printer, flat on the bed, in PLA.</p></li>
  <li><h3>A description for the learner</h3><p>The graph in plain sentences: what the curve does and where every marked point is.</p></li>
  <li><h3>A page in the collection</h3><p>A 3D preview, the touch checks it passed, and every file, for you and for other teachers.</p></li>
</ul>

<h2>Tips for a good request</h2>
<div class="two-col">
  <ul class="tips">
    <li><strong>One function per request,</strong> written like <code class="inline">y = -0.5x^2 + 2x + 1</code>. Straight lines, parabolas and cubics work.</li>
    <li><strong>Say where the graph starts and ends,</strong> for example "x from -0.5 to 4.5".</li>
    <li><strong>Name the points to find:</strong> the highest or lowest point, the turning points, where the curve crosses an axis.</li>
    <li><strong>Only a topic?</strong> That works too. Locus asks you one question before it draws anything.</li>
  </ul>
  <pre class="mail">${escape(MAIL)}</pre>
</div>

<h2>Good to know</h2>
<ul class="gets">
  <li><h3>Some graphs are refused</h3><p>If a curve only touches an axis, a fingertip feels one line there. Locus explains why and prints nothing, rather than send a plate that cannot be read.</p></li>
  <li><h3>Every plate has an ID</h3><p>A braille number in the top-right corner leads back to the graph's page. Hold the plate with the raised triangle at the top-left.</p></li>
  <li><h3>The checks are not a promise</h3><p>The rules measure spacing and size; they do not certify that a learner will understand the graphic. A teacher's judgement still comes first.</p></li>
</ul>

<h2>For schools setting it up</h2>
<p class="wide-p">Locus runs in your own GitLab project and publishes to your own Google Cloud. The setup takes about an hour, once, and is written up in the project's documentation:</p>
<ul class="doclinks">
  <li><a href="${DOCS.readme}">The Locus project on GitLab</a></li>
  <li><a href="${DOCS.how}">How Locus works, in diagrams</a></li>
  <li><a href="${DOCS.setup}">Setting up the agents in your project</a></li>
  <li><a href="${DOCS.variables}">Settings, including print orders</a></li>
</ul>`
})

/** Collections: every shipped graph, newest first, as a compact list. */
const collectionsPage = (graphs) => textPage({
  title: 'Collections | Locus',
  description: 'Every tactile graph Locus has released, ready to print.',
  current: '/collections/',
  body: `<h1>Collections</h1>
<p class="lead">Every graph Locus has released. Each one passed the five touch checks before it was published. Print at 100% scale.</p>
${graphs.length ? `<ul class="collection">
${[...graphs].reverse().map((g) => {
    const m = g.manifest
    return `  <li><a href="/graphs/${escape(m.artifactId)}/">
    <span class="thumb"><img src="/graphs/${escape(m.artifactId)}/graph.svg" alt="" loading="lazy"></span>
    <span class="eq">${g.request ? equationHtml(g.request.equation) : escape(m.artifactId)}</span>
    <span class="meta"><span class="cells" aria-hidden="true">${toBraille(String(m.requestIssue))}</span>${escape(m.brailleId)} • ${kindOf(g.request && g.request.equation)}${g.request ? ` • x from ${escape(g.request.from)} to ${escape(g.request.to)}` : ''} • checked in ${plural(m.touchcheck.attempts, 'attempt')}</span>
  </a></li>`
  }).join('\n')}
</ul>` : '<p>No graph has been released yet.</p>'}`
})

const creditsPage = () => textPage({
  title: 'Credits | Locus',
  description: 'Locus is built on JSCAD, GitLab and Google Cloud.',
  current: '/credits/',
  full: true,
  body: `<h1>Credits</h1>
<p class="lead">Locus stands on open work and on two platforms. It was built for the GitLab Transcend hackathon in October 2026.</p>

<h2>JSCAD</h2>
<div class="feature">
  <p><a href="${JSCAD}"><strong>JSCAD</strong></a> (OpenJSCAD.org) is an open-source library for making 3D models in JavaScript, with code rather than a mouse. It is released under the MIT licence and kept by its community of contributors; its package lists Rene K. Mueller, z3dev and Mark Moissette among them.</p>
  <ul>
    <li><strong>The starting point.</strong> Locus began as the JSCAD repository, imported with its full history and its MIT licence. Its packages live on unchanged in <code class="inline">packages/</code>, and JSCAD's own test suite still runs in every Locus pipeline.</li>
    <li><strong>Every plate is JSCAD geometry.</strong> The curve, the axes, the ticks, the point domes and every braille dot are solids made with <code class="inline">@jscad/modeling</code>, joined into one plate and written out as the STL file you print.</li>
    <li><strong>The same code makes the same plate.</strong> Because JSCAD builds geometry from code, a graph can be rebuilt exactly from its request, which is how Locus re-checks every shipped graph whenever the code changes.</li>
  </ul>
  <p>Thank you to everyone who has built and maintained JSCAD. <a href="${JSCAD}">github.com/jscad/OpenJSCAD.org</a></p>
</div>

<h2>GitLab</h2>
<div class="feature">
  <p>Locus lives in a GitLab project. GitLab is where requests arrive, where the agents work, and where every graph is checked and released.</p>
  <dl class="grid">
    <dt>Duo Agent Platform</dt><dd>Two custom flows run the agents. <strong>locus-request</strong> reads a teacher's email, writes the request files, opens a merge request and fixes its own layout until the touch checks pass. <strong>locus-ops</strong> reviews a developer's change and explains on the merge request, before it is merged, which shipped graphs it would break.</dd>
    <dt>Flow triggers</dt><dd>A request starts the agent when it is assigned to the flow's service account (the request email's last line does it); a failed pipeline starts the reviewer. Each flow works as its own service account.</dd>
    <dt>Issues by email</dt><dd>A teacher's email becomes an issue through the project's "Email a new issue" address, and every note on it is emailed back to the teacher.</dd>
    <dt>CI/CD pipelines</dt><dd>The pipeline renders each plate, runs the five touch checks, the guards that keep the agent inside its files and its maths, and then packages, releases and deploys.</dd>
    <dt>Merge requests</dt><dd>Each request is a merge request: the first attempt fails, the agent's fix passes, and the pipeline merges it on its own. "Pipelines must succeed" makes GitLab refuse anything red.</dd>
    <dt>Security scanning</dt><dd>Secret Detection and SAST run on every pipeline on the main branch, and a licence check keeps every dependency permissive.</dd>
    <dt>Package Registry</dt><dd>Every released plate's files (STL, preview, description, manifest) are kept as a generic package, so their links never expire.</dd>
    <dt>Releases</dt><dd>Each graph is tagged and released as graph-&lt;request&gt;-v&lt;version&gt;, with links to its files and the checks it passed.</dd>
    <dt>ID tokens</dt><dd>GitLab's signed ID token lets the pipeline sign in to Google Cloud without any stored key.</dd>
  </dl>
</div>

<h2>Google Cloud</h2>
<div class="feature">
  <p>This site, and every graph page on it, is served from Google Cloud.</p>
  <dl class="grid">
    <dt>Cloud Run</dt><dd>Runs the site. Each release becomes a new revision that is first served on a staging address and checked like a visitor would (every page loads, every file matches its fingerprint) before it gets production traffic. It scales to zero when nobody is visiting.</dd>
    <dt>Cloud Build</dt><dd>Builds the site's container from the pipeline's files on every release.</dd>
    <dt>Artifact Registry</dt><dd>Keeps the site's container images, with a cleanup rule that keeps only the five newest.</dd>
    <dt>Workload Identity Federation</dt><dd>Trusts GitLab's ID token from our project's protected main branch only, so no Google key exists anywhere.</dd>
    <dt>IAM and billing</dt><dd>One deploy service account with only the roles it needs, and a 5 USD monthly budget alert.</dd>
  </dl>
</div>

<h2>Also built on</h2>
<dl class="grid">
  <dt><a href="https://threejs.org">three.js</a></dt><dd>Draws the plates in 3D on these pages (MIT licence).</dd>
  <dt><a href="https://github.com/elalish/manifold">Manifold</a></dt><dd>Closes the rare mesh the main union leaves open (Apache 2.0 licence).</dd>
  <dt>IBM Plex Mono</dt><dd>The typeface of this site (SIL Open Font Licence).</dd>
  <dt>Design</dt><dd>The television look is inspired by <a href="https://www.arcmarumo.com">Arc</a>.</dd>
</dl>`
})

const requestPage = () => textPage({
  title: 'Request a graph | Locus',
  description: 'Write what you are teaching in your own words; Locus drafts the email for you.',
  current: '/request/',
  wide: true,
  body: `<h1>Request a graph</h1>
<p class="lead">Write what you are teaching, in your own words: a function, or just today's topic. This page turns it into an email Locus can act on and opens it in your mail, ready to send. Nothing is sent until you press Send there.</p>
<form class="request" data-request data-agent="${AGENT}" onsubmit="return false">
  <div>
    <div class="field">
      <label for="note">What do you need?</label>
      <textarea id="note" name="note" placeholder="Tomorrow I'm teaching projectile motion. The ball follows y = -0.5x^2 + 2x + 1, from x = -0.5 to 4.5. The students should find the highest point and where it starts on the y-axis."></textarea>
      <p class="help">A function with its x range and the points to find works best. A topic alone works too: then the agent asks you one question before it draws anything.</p>
    </div>
    <fieldset class="field prints">
      <legend class="sr-only">Printed copies</legend>
      <label class="check"><input type="checkbox" name="print" checked> I need printed copies</label>
      <div class="copies" data-copies>
        <label for="copies">How many</label>
        <input id="copies" name="copies" type="number" min="1" max="99" value="1" inputmode="numeric">
      </div>
      <p class="help">Ticked: your school's print shop gets the file once the graph passes the checks, and replies to you with the price. Unticked: you get the digital files only, to print yourself.</p>
    </fieldset>
    <div class="field">
      <label for="to">Your Locus address</label>
      <input id="to" name="to" type="email" autocomplete="off" placeholder="the address from your Locus project">
      <p class="help">In your Locus project on GitLab: Issues, the three-dot menu, "Email a new issue". It is private to you, so it is kept only in this browser and never sent anywhere else. <a href="${DOCS.setup}">Setting up Locus</a></p>
    </div>
    <details class="more"><summary>Agent account</summary>
      <div class="field" style="margin-top:14px">
        <label for="agent">Assign the request to</label>
        <input id="agent" name="agent" autocomplete="off">
        <p class="help">The service account of your project's locus-request flow. The email's last line assigns the request to it, which starts the agent.</p>
      </div>
    </details>
    <div class="send"><button type="button" class="btn" data-gmail>Open in Gmail</button><button type="button" class="btn ghost" data-mailapp>Open in my mail app</button></div>
    <p class="error" data-error role="alert"></p>
  </div>
  <div>
    <label>Your email, drafted</label>
    <pre data-preview aria-live="polite"></pre>
  </div>
</form>`
})

/** The first sentence of the learner description, for lists. */
const summaryOf = (description) => (description.trim().split(/(?<=\.)\s/)[0] || '').slice(0, 200)

/**
 * Writes the site. `graphs`: [{ manifest, files: { 'graph.svg': Buffer, ..., '<artifactId>.zip': Buffer } }].
 * Each file's sha256 must match the manifest's hash where it has one, so a corrupted download never ships.
 */
const writeSite = (outDir, { graphs, buildInfo, projectUrl, printOrders = { enabled: false } }) => {
  fs.rmSync(outDir, { recursive: true, force: true })
  const pub = path.join(outDir, 'public')
  const write = (rel, data) => {
    fs.mkdirSync(path.dirname(path.join(pub, rel)), { recursive: true })
    fs.writeFileSync(path.join(pub, rel), data)
  }
  const prepared = graphs.map((g) => {
    for (const [file, hash] of Object.entries(g.manifest.hashes)) {
      if (g.files[file] && sha256(g.files[file]) !== hash) throw new Error(`${g.manifest.artifactId}: ${file} does not match its manifest hash`)
    }
    const description = g.files['description.txt'].toString('utf8')
    return { ...g, description, summary: summaryOf(description), request: readRequest(description) }
  }).sort((a, b) => a.manifest.requestIssue - b.manifest.requestIssue)
  for (const g of prepared) {
    const dir = `graphs/${g.manifest.artifactId}`
    for (const [file, data] of Object.entries(g.files)) write(`${dir}/${file}`, data)
    write(`${dir}/index.html`, graphPage(g, projectUrl))
  }
  write('index.html', indexPage(prepared.slice(-HOME_GRAPHS), prepared.length))
  write('about/index.html', aboutPage(prepared[prepared.length - 1]))
  write('request/index.html', requestPage())
  write('collections/index.html', collectionsPage(prepared))
  write('credits/index.html', creditsPage())
  for (const a of ASSETS) write(`assets/${a}`, fs.readFileSync(path.join(__dirname, 'assets', a)))
  write('build-info.json', JSON.stringify({ ...buildInfo, graphs: prepared.map((g) => g.manifest.artifactId) }, null, 2) + '\n')
  fs.writeFileSync(path.join(outDir, 'Dockerfile'), DOCKERFILE)
  fs.writeFileSync(path.join(outDir, 'nginx.conf'), NGINX)
  return prepared.map((g) => g.manifest.artifactId)
}

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
  const printOrders = { enabled: env.PRINT_ORDER_ENABLED === 'true' && Boolean(env.PRINT_ORDER_TO), to: env.PRINT_ORDER_TO }
  const ids = writeSite(outDir, { graphs, buildInfo, projectUrl: env.CI_PROJECT_URL, printOrders })
  console.log(`site: ${ids.length} graph(s) in ${outDir}: ${ids.join(', ') || 'none yet'}`)
  console.log(`LOCUS_SITE ${JSON.stringify({ commit: buildInfo.commit, graphs: ids })}`)
  return 0
}

module.exports = { writeSite, fetchShipped, runSite, summaryOf, readRequest, maskEmail, checkDrawing, SITE_FILES }
