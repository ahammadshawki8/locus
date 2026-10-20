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
const ASSETS = ['site.css', 'hud.js', 'scene.js']
const JSCAD = 'https://github.com/jscad/OpenJSCAD.org'
const PROJECT = 'https://gitlab.com/gitlab-ai-hackathon/transcend-october-2026/43384339/showcase'
const AGENT = 'ai-locus-request-gitlab-ai-hackathon_b127f8'
const THREE_VERSION = '0.160.0'
const TEAM = [
  { name: 'Mohammad Ashfaqul Hasan', short: 'Ashfaq', gitlab: 'Ashfaq909' },
  { name: 'Ahammad Shawki', short: 'Shawki', gitlab: 'ahammadshawki8' },
  { name: 'Nourin Richi', short: 'Nourin', gitlab: 'nourin.richi.2026' }
]

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

const FONTS = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Silkscreen&display=swap'
const FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%23121212'/%3E%3Cg fill='%23ece9e1'%3E%3Ccircle cx='11' cy='8' r='3'/%3E%3Ccircle cx='21' cy='8' r='3'/%3E%3Ccircle cx='11' cy='16' r='3'/%3E%3C/g%3E%3Cg fill='%23ece9e1' opacity='.3'%3E%3Ccircle cx='21' cy='16' r='3'/%3E%3Ccircle cx='11' cy='24' r='3'/%3E%3Ccircle cx='21' cy='24' r='3'/%3E%3C/g%3E%3C/svg%3E"

const NAV = [['/request/', 'Request'], ['/how-it-works/', 'How it works'], ['/setup/', 'Setup'], ['/print-orders/', 'Print orders'], ['/credits/', 'Credits']]

/** One page: the television (bezel and screen), the HUD, and the page's own content. */
const page = ({ title, description, current, content, scene, loader, screen = '' }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)}</title>
<meta name="description" content="${escape(description)}">
<link rel="icon" href="${FAVICON}">
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
  <a class="brand" href="/" aria-label="Locus, home"><span class="word">Locus</span><span class="year">Year 2026</span></a>
  <nav aria-label="Site">${NAV.map(([href, label]) => `<a href="${href}"${current === href ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav>
</header>
<footer class="hud bottom">
  <div class="group"><span class="dim" data-clock aria-hidden="true"></span></div>
  <div class="group"><a class="hide-s" href="${PROJECT}">Source: GitLab</a><a href="/request/">Request a graph</a></div>
</footer>
${loader ? `<div class="loader" role="status" aria-label="Loading the plates"><div class="row"><span>Loading</span><span data-count>0</span></div><div class="bar"><div class="fill"></div></div></div>` : ''}
<div class="flash" aria-hidden="true"></div>
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

const indexPage = (graphs) => {
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

const howPage = () => page({
  title: 'How Locus works',
  description: 'How a teacher asks Locus for a tactile maths graph, and what happens next.',
  current: '/how-it-works/',
  content: `<main id="content" class="page"><div class="inner">
<h1>How it works</h1>
<p class="lead">A teacher writes one email. A GitLab Duo agent turns it into a raised-line plate, the pipeline checks it the way a fingertip reads, and the teacher gets a file ready to 3D print.</p>

<h2>From one email to a print</h2>
<ol class="steps">
  <li><span class="n">01</span><div><h3>Write the request</h3><p>Name one function, the x range, and the points the learner should find. Plain words are fine.</p></div></li>
  <li><span class="n">02</span><div><h3>The agent draws it</h3><p>A GitLab Duo agent reads the email, writes the graph files and opens a merge request. If anything is unclear it asks one question instead of guessing.</p></div></li>
  <li><span class="n">03</span><div><h3>The pipeline checks it by touch</h3><p>Five rules measure the plate in millimetres: lines at least 3.2 mm apart, labels clear of lines and points, no labels overlapping, every point that was asked for on the plate, and everything inside the edges.</p></div></li>
  <li><span class="n">04</span><div><h3>The agent fixes its own layout</h3><p>If a rule fails, the agent changes only the layout (hides the grid, moves a label, rescales an axis) and tries again, at most three times. It never changes the maths. If the graph still cannot be read by touch, it says so and nothing is printed.</p></div></li>
  <li><span class="n">05</span><div><h3>It ships</h3><p>The passing plate is released, checked on a staging site, published in this library on Google Cloud, and the teacher gets a reply with the page and the print file.</p></div></li>
  <li><span class="n">06</span><div><h3>It goes to the printer</h3><p>If <a href="/print-orders/">print orders</a> are on, the print shop gets the file and the settings by email, and replies to the teacher. Then the plates are in the learners' hands.</p></div></li>
</ol>

<h2 id="request">How to request a graph</h2>
<p><strong>Write one email like this:</strong></p>
<pre class="mail">${escape(MAIL)}</pre>
<p>The <a href="/request/">Request page</a> drafts this email from your own words and opens it in your mail. It goes to your Locus project's address (<a href="/setup/">Setup</a>), where it becomes an issue that starts the agent.</p>
<dl class="grid">
  <dt>Functions</dt><dd>One straight line, parabola or cubic (nothing above x<sup>3</sup>), with numbers between -100 and 100</dd>
  <dt>Points</dt><dd>The highest or lowest point, the turning points, where the curve crosses the y-axis or the x-axis</dd>
  <dt>Refused</dt><dd>A curve that only touches an axis, like y = (x - 1)<sup>2</sup> at its vertex: a fingertip feels one line there, so Locus says no</dd>
  <dt>Reply</dt><dd>About ten minutes later: the page in this library, the STL print file and a text description for the learner</dd>
</dl>

<h2>Printing the plate</h2>
<dl class="grid">
  <dt>Scale</dt><dd>100%. Do not resize: the checks measured the spacing at this size</dd>
  <dt>Printer</dt><dd>Any FDM printer, PLA, 0.12 to 0.16 mm layers, flat on the bed, no supports</dd>
  <dt>Size</dt><dd>100 x 100 mm, 3.6 mm at the tallest point</dd>
  <dt>Reading</dt><dd>Hold it with the raised triangle at the top-left. The braille number at the top-right is the graph's ID; it leads back to its page here</dd>
</dl>
<p class="limit">Automated checks measure spacing and size; they do not certify that a learner can understand the graphic.</p>
</div></main>`
})

const creditsPage = () => page({
  title: 'Credits | Locus',
  description: 'Locus is built on JSCAD and made by Ashfaq, Shawki and Nourin.',
  current: '/credits/',
  content: `<main id="content" class="page"><div class="inner">
<h1>Credits</h1>
<p class="lead">Locus stands on open work. It was built for the GitLab Transcend hackathon in October 2026.</p>

<h2>Built on</h2>
<dl class="grid">
  <dt><a href="${JSCAD}">JSCAD</a></dt><dd>The open-source 3D modelling library (MIT licence) that draws every plate. Locus started from the JSCAD project and keeps its history and licence.</dd>
  <dt>GitLab Duo</dt><dd>The Agent Platform runs the agents that draw, fix and review; GitLab CI runs the touch checks, guards and releases.</dd>
  <dt>Google Cloud Run</dt><dd>Serves this library. Every release is checked on staging before it reaches it.</dd>
  <dt><a href="https://threejs.org">three.js</a></dt><dd>Draws the plates in 3D on these pages (MIT licence).</dd>
  <dt>Typefaces</dt><dd>IBM Plex Mono and Silkscreen (SIL Open Font Licence).</dd>
  <dt>Design</dt><dd>The television look is inspired by <a href="https://www.arcmarumo.com">Arc</a>.</dd>
</dl>

<h2>Made by</h2>
<ul class="people">
${TEAM.map((p) => `  <li><span class="name">${escape(p.short)}</span>${escape(p.name)}<br><a href="https://gitlab.com/${escape(p.gitlab)}">@${escape(p.gitlab)}</a></li>`).join('\n')}
</ul>
</div></main>`
})

const textPage = ({ title, description, current, body }) => page({ title, description, current, content: `<main id="content" class="page"><div class="inner">\n${body}\n</div></main>` })

const steps = (list) => `<ol class="steps">\n${list.map(([title, text], i) => `  <li><span class="n">${String(i + 1).padStart(2, '0')}</span><div><h3>${title}</h3>${text}</div></li>`).join('\n')}\n</ol>`

const requestPage = () => textPage({
  title: 'Request a graph | Locus',
  description: 'Write what you are teaching in your own words; Locus drafts the email for you.',
  current: '/request/',
  body: `<h1>Request a graph</h1>
<p class="lead">Write what you are teaching, in your own words: a function, or just today's topic. This page turns it into an email Locus can act on and opens it in your mail, ready to send. Nothing is sent until you press Send there.</p>
<form class="request" data-request data-agent="${AGENT}" onsubmit="return false">
  <div>
    <div class="field">
      <label for="note">What do you need?</label>
      <textarea id="note" name="note" placeholder="Tomorrow I'm teaching projectile motion. The ball follows y = -0.5x^2 + 2x + 1, from x = -0.5 to 4.5. The students should find the highest point and where it starts on the y-axis."></textarea>
      <p class="help">A function with its x range and the points to find works best. A topic alone works too: then the agent asks you one question before it draws anything.</p>
    </div>
    <div class="field">
      <label for="copies">Printed copies (optional)</label>
      <input id="copies" name="copies" inputmode="numeric" placeholder="e.g. 6, one per student">
    </div>
    <div class="field">
      <label for="to">Your Locus address</label>
      <input id="to" name="to" type="email" autocomplete="off" placeholder="the address from your Locus project">
      <p class="help">In your Locus project on GitLab: Issues, the three-dot menu, "Email a new issue". It is private to you, so it is kept only in this browser and never sent anywhere else. <a href="/setup/">Setting up Locus</a></p>
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

const setupPage = () => textPage({
  title: 'Set up Locus | Locus',
  description: 'How to set up Locus for a school: the GitLab project, Google Cloud, the agents and the first request.',
  current: '/setup/',
  body: `<h1>Set up Locus</h1>
<p class="lead">Locus runs in your own GitLab project with GitLab Duo, and publishes to your own Google Cloud. Setting it up takes about an hour, once. After that, teachers only write emails.</p>
${steps([
  ['Get the project', `<p>Create a GitLab project with Locus in it (import <a href="${PROJECT}">the Locus repository</a>). The project needs the GitLab Duo Agent Platform. Make it public if the teachers' download links should open without signing in.</p>`],
  ['Merge settings', '<p>Settings, Merge requests: merge method <strong>Merge commit</strong>, and tick <strong>Pipelines must succeed</strong>. Then GitLab refuses to merge any graph that did not pass every check.</p>'],
  ['A token for the pipeline', '<p>Create a token with the <code class="inline">api</code> scope (a project access token if your GitLab offers it, otherwise a personal one) and save it as the CI variable <code class="inline">LOCUS_GITLAB_TOKEN</code>: masked and hidden, not protected. The pipeline uses it only to merge passing graphs and to post the reply.</p>'],
  ['Google Cloud', '<p>Open Cloud Shell and run <code class="inline">bash deploy/gcp/setup.sh &lt;project-id&gt; &lt;billing-account-id&gt;</code>. It makes the project, turns on Cloud Run, sets up keyless login for your pipeline and a 5 USD budget alert, and prints four values. Put them in <code class="inline">.gitlab-ci.yml</code>. None of them is a secret.</p>'],
  ['Labels', '<p>Create the labels <code class="inline">locus-request</code>, <code class="inline">needs-info</code> and <code class="inline">cannot-make-readable</code>.</p>'],
  ['The agents', '<p>Automate, Flows, New flow. Create <code class="inline">locus-request</code> from <code class="inline">.gitlab/duo/flows/locus-request.yml</code> with the triggers Assign and Mention, and <code class="inline">locus-ops</code> from <code class="inline">locus-ops.yml</code> with the triggers Pipeline events (failed) and Assign. The display names must be exactly these. Note the service account GitLab creates for locus-request: requests are assigned to it.</p>'],
  ['Your request address', '<p>Issues, the three-dot menu, "Email a new issue". Paste that address on the <a href="/request/">Request page</a> once. Keep it private: anyone with it can file issues as you.</p>'],
  ['Print orders (optional)', '<p>If a print shop or a colleague with a 3D printer should get every new graph by email, turn on <a href="/print-orders/">print orders</a>.</p>'],
  ['The first request', '<p>Send one request from the Request page. About ten minutes later the reply arrives with the page in this library and the print file. If anything fails, the merge request shows which check and why.</p>']
])}
<p class="limit">Automated checks measure spacing and size; they do not certify that a learner can understand the graphic.</p>`
})

/** "shop@example.org" shown as "s***@example.org". */
const maskEmail = (email) => {
  const [user, domain] = String(email || '').split('@')
  return domain ? `${user.slice(0, 1)}***@${domain}` : ''
}

const printPage = (printOrders) => textPage({
  title: 'Print orders | Locus',
  description: 'Locus can email every new graph to a print shop, ready to print.',
  current: '/print-orders/',
  body: `<h1>Print orders</h1>
<p class="lead">From a lesson idea to plates in the classroom: when print orders are on, every graph that passes is emailed to your print shop, or to a colleague with a 3D printer, with the print file attached and the settings written out.</p>
<p><span class="status${printOrders.enabled ? ' on' : ''}">${printOrders.enabled ? `On: orders go to ${escape(maskEmail(printOrders.to))}` : 'Off'}</span></p>

<h2>What happens</h2>
${steps([
  ['A graph is released', '<p>Only after the touch checks, the guards, the release and the live site check have all passed.</p>'],
  ['The pipeline writes the order', '<p>One email per new graph: the STL file attached, the links to the page and the release, the number of copies, and how to print it (100% scale, PLA, 0.12 to 0.16 mm layers, no supports, flat on the bed).</p>'],
  ['The shop replies to you', '<p>The order asks the shop to reply to the teacher with the price and when the plates are ready. Nothing is paid or confirmed automatically.</p>'],
  ['The request is updated', '<p>A note on the request says that the order was sent and to whom, so the teacher sees it with the reply.</p>']
])}

<h2>Turn it on</h2>
<p>In your Locus project, Settings, CI/CD, Variables. The password is an app password of the sending account, never its real password.</p>
<dl class="grid">
  <dt>PRINT_ORDER_ENABLED</dt><dd><code class="inline">true</code> to send orders; anything else keeps them off</dd>
  <dt>PRINT_ORDER_TO</dt><dd>The print shop's email address</dd>
  <dt>PRINT_ORDER_FROM</dt><dd>The account the orders are sent from, for example a Gmail address made for Locus</dd>
  <dt>PRINT_ORDER_SMTP_PASSWORD</dt><dd>That account's app password (masked and hidden)</dd>
  <dt>PRINT_ORDER_REPLY_TO</dt><dd>Where the shop's reply should go, usually the teacher (optional)</dd>
  <dt>PRINT_ORDER_COPIES</dt><dd>Copies of each graph (optional, 1 if not set)</dd>
</dl>
<p class="limit">Locus only sends the order. Price, payment and delivery stay between you and the shop.</p>`
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
  write('index.html', indexPage(prepared))
  write('how-it-works/index.html', howPage())
  write('credits/index.html', creditsPage())
  write('request/index.html', requestPage())
  write('setup/index.html', setupPage())
  write('print-orders/index.html', printPage(printOrders))
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
