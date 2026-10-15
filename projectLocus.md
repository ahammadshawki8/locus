# Locus — GitLab Transcend Blueprint (v3: simple to show, hard to beat)

**Locus — tactile maths graphs, made and shipped by an agent.**

| | |
|---|---|
| **Competition** | Life After Code: GitLab Transcend Hackathon |
| **Path** | B — Bring Your Own (upstream: [JSCAD / OpenJSCAD.org](https://github.com/jscad/OpenJSCAD.org), MIT) |
| **Targets** | Path B **Best Hands-off Agent** ($5k) + **Most Stages Covered** ($5k). Also eligible for Most Creative (= highest Innovation score); you can win only one special prize. |
| **Bonus** | Google Cloud deployment (up to +0.2; max final 5.2) |
| **Fallback** | Path B Best Supervised Agent: the same build with one approval gate switched on |
| **Deadline** | 27 Oct 2026, 13:00 UTC. **Internal: 27 Oct 10:00 UTC.** |
| **Status** | Plan only, 13 Oct 2026. Nothing is built, proven or validated with an educator yet. |
| **Team** | **Ashfaq** leads the core build (13–21 Oct) → **Shawki** hosts, completes, finalises and submits (parallel hosting track from 13 Oct, lead from 21 Oct). Built with **Claude Code**. See Part IV. |

> **Truth rule:** A planned stage is not a completed stage. Never claim a graphic is understandable by touch because it passed automated rules. Never claim a GitLab capability works until it has run in the target account. Never fake a failure, a pass, or an agent action.

> **Simplicity rule (lesson from the last hackathon):** If a judge can't explain Locus in one sentence after watching the video once with the sound off, the video has failed, however good the engineering is. Every feature must either appear in **one story** or stay in the README.

---

# PART 0 — WHAT CHANGED IN v3 AND WHY

## 0.1 What the research found (13 Oct)

| Finding | Source | What it means for us |
|---|---|---|
| Tools that turn equations into tactile graphs **already exist**: [TactileView](https://specialneedscomputers.ca/products/tactileview-software) math module (~$775), [ViewPlus Audio Graphing Calculator](https://accessinghigherground.org/wp/wp-content/uploads/2025/04/Creating-Tactile-Graphs-with-the-ViewPlus-Audio-Graphing-Calculator.pdf), [SVGPlott](https://www.springerprofessional.de/svgplott-generating-adaptive-and-accessible-audio-tactile-functi/2191120) (research), [Desmos-based workflows](https://accessinghigherground.org/wp/wp-content/uploads/2025/04/CreatingTactileGraphsWithDesMos.pdf) | [AHG: automated tactile maths](https://accessinghigherground.org/automated-generation-of-tactile-mathematics/), [TactileView](https://specialneedscomputers.ca/products/tactileview-software), [SVGPlott](https://www.springerprofessional.de/svgplott-generating-adaptive-and-accessible-audio-tactile-functi/2191120), [ViewPlus calculator guide](https://accessinghigherground.org/wp/wp-content/uploads/2025/04/Creating-Tactile-Graphs-with-the-ViewPlus-Audio-Graphing-Calculator.pdf) | **"We generate tactile graphs" is not novel.** Don't claim it. |
| A [July 2026 paper](https://www.emergentmind.com/papers/2607.01214) builds a **JSCAD-based** pipeline that makes tactile STL charts with Grade 1 braille labels, and reports manual CAD takes **~2 hours per chart**. It has **no automated legibility validation**, **no user study**, and its LLM step needs teacher review. | [arXiv 2607.01214 (summary)](https://www.emergentmind.com/papers/2607.01214) | (1) Strong evidence for the problem (2 h/chart). (2) It confirms JSCAD is the right engine. (3) **The open gap is verifying readability and fixing failures automatically.** That's Locus. Cite it as related work and don't overlap with it: it does statistical charts, we do function graphs. |
| A [practitioner source](https://accessinghigherground.org/wp/wp-content/uploads/2025/04/CreatingTactileGraphsWithDesMos.pdf) notes that Desmos-based methods "do not create acceptable braille labels presently". | [AHG Desmos guide](https://accessinghigherground.org/wp/wp-content/uploads/2025/04/CreatingTactileGraphsWithDesMos.pdf) | Label collisions are a known pain point. Our label rules target exactly that. |
| Spacing guidance: **1/8 in (3.2 mm) absolute minimum** between elements; **1/4 in (6.4 mm)** may be needed (e.g. capsule paper); separate elements at least 1/4 in. Braille map labels should be **3/8 in (9.5 mm)** from unrelated elements. | [tactilegraphics.org readability](https://tactilegraphics.org/readability.html), [NPS tactile map guidelines 2008](https://www.npshistory.com/publications/interpretation/hfc/tactile-map-guidelines-2008.pdf), [BANA Tactile Graphics 2022](https://www.brailleauthority.org/tg/web-manual/tgmanual.html) | Rule values now cite a source. Still check them against BANA 2022 and a practitioner. |
| Evidence for 3D-printed maths graphs is promising but thin (e.g. [SenseMath](https://www.visio.org/visio.org/media/Visio/Downloads/KEI/Vision-2017/Does-multisensory-presentation-of-mathematical-graphs-improve-visually-impaired-students-performance-on-identifying-mathematical-graphs-A-comparison.pdf), n=8). | [Visio SenseMath study](https://www.visio.org/visio.org/media/Visio/Downloads/KEI/Vision-2017/Does-multisensory-presentation-of-mathematical-graphs-improve-visually-impaired-students-performance-on-identifying-mathematical-graphs-A-comparison.pdf), [Sci Am: 3D prints for blind students](https://blogs.scientificamerican.com/guest-blog/teaching-blind-students-with-3-d-prints/) | Don't over-claim the learning benefit. Claim time saved and quality checked. |
| GitLab custom flows can reportedly be triggered on **pipeline state changes, including Failed**. The docs history says the feature flag was removed in 19.1, but one older source says it's still flagged. | [GitLab blog: agentic flows](https://about.gitlab.com/blog/multi-step-software-delivery-with-agentic-flows/), [custom flows docs](https://docs.gitlab.com/user/duo_agent_platform/flows/custom/) | **Primary retry path = pipeline-failed trigger.** Fallback = a CI job posting an MR note that mentions the agent. Verify both on 15–16 Oct. |

## 0.2 The new positioning (one line)

> **Other tools draw tactile graphs. Locus is the first to *check* them the way a fingertip would, fix what fails, and ship only what passes, automatically.**

## 0.3 What's in the video vs. only in the repo

| In the story (video) | In the build, shown in the README and repo | Cut entirely |
|---|---|---|
| Email request → agent → touch check fails → agent fixes → passes → live → reply email → print → braille ID; **one lifecycle-agent beat (regression detective)**; one eval-score caption | Guards, security scans, package registry, staging validation details, **release guard agent**, judging freeze, migrated JSCAD CI, and all Tier 2/3 depth (§7.2–7.3): more function families, swell-paper profile, agent eval suite, injection guard, Code Review Flow, library site, MCP, AI Catalog | `guard-remedy` and `guard-attempts` as separate jobs (the attempt cap lives in the flow), image input, statistical charts |

The 9 stages are **shown with one on-screen tracker bar** that lights up as the real run progresses, not explained one by one.

## 0.4 The demo trick that makes it obvious: print both attempts

The agent's **first attempt** (which fails the touch check) and the **released version** are both real files from the same run. **Print both.** In the video, a hand (eyes closed) moves across attempt 1, where the curve and the axis merge, then across the released version, where they're clearly separate. The agent's fix becomes physical, honest and instantly understandable. Nothing is staged: attempt 1 is the pipeline's own failing artifact.

---

# PART I — THE IDEA (JUDGE-FACING)

## 1. The 10-second version
**A teacher emails a maths graph. An AI agent makes a version a blind student can read by touch, checks it the way a fingertip would, fixes its own mistakes, and ships it. No human in between.**

## 2. The 30-second version
- **Who:** teachers of students with visual impairments (TVIs).
- **Pain:** modelling one tactile graph by hand takes about 2 hours ([2026 study](https://www.emergentmind.com/papers/2607.01214)). Graphs printed straight from a screen fail under a fingertip: lines merge and braille labels collide.
- **Locus:** email in → GitLab Duo agent → touch-legibility checks in CI → the agent fixes what fails → automatic release and deploy → reply email with a print-ready file.
- **Why GitLab:** the pipeline is the quality gate that decides whether a student ever gets the file. The agent can only change the layout. It can't change the rules or the maths.
- **Agents across the lifecycle, not just content:** a **release guard** agent rolls production back if a live graph fails validation, and a **regression detective** agent finds the commit that broke a shipped graph and opens the revert. Four Duo agents, each owning a lifecycle job (§6b).

## 3. The one diagram (README, Devpost, and video)

```text
 ✉ Teacher email ──▶ 🤖 Duo agent drafts graph ──▶ ☝ Touch check
                              ▲                        │
                              └──── fails: agent fixes ┘
                                                       │ passes
                                                       ▼
                     ✉ Reply with print-ready file ◀── 🚀 Release + deploy
```

Five boxes, one loop. Every other detail goes in the README.

## 4. Path B: before → after (one slide, 10 seconds in the video)

| | Before: JSCAD on GitHub | After: Locus on GitLab |
|---|---|---|
| Lifecycle | One GitHub Actions job: `npm test` on Node 20/22 ([`.github/workflows/node.yml`](https://github.com/jscad/OpenJSCAD.org/blob/master/.github/workflows/node.yml), checked 13 Oct) | Migrated tests + a 9-stage automated lifecycle |
| Making a tactile graph | Write a script by hand, guess the dimensions, hope it's readable | Email a sentence; an agent delivers a checked file |
| Safety | None | Touch checks + guards decide what ships |
| Downstream | A JSCAD change that alters geometry goes unnoticed | A nightly re-check of every shipped graph catches it (**downstream contract test for JSCAD**) |

## 4b. Why not just use existing tools? (README + Devpost)

| | [TactileView](https://specialneedscomputers.ca/products/tactileview-software) math module | [ViewPlus Audio Graphing Calculator](https://accessinghigherground.org/wp/wp-content/uploads/2025/04/Creating-Tactile-Graphs-with-the-ViewPlus-Audio-Graphing-Calculator.pdf) | [2026 JSCAD STL pipeline (paper)](https://www.emergentmind.com/papers/2607.01214) | **Locus** |
|---|---|---|---|---|
| Makes tactile function graphs | Yes | Yes | Statistical charts only | Yes |
| Cost / setup | ~$775, Windows software | Paid, embosser workflow | Research code | Free; send an email |
| **Checks readability by touch before delivery** | No (relies on the designer) | No | No (fixed parameters) | **Yes: 5 measured rules, release blocked on failure** |
| **Fixes its own failed output** | No | No | No | **Yes: agent, allowed fixes only, refuses otherwise** |
| Versioned, traceable output | No | No | No | **Yes: release + braille ID on every print** |
| Re-checks old graphs when the generator changes | No | No | No | **Yes: nightly, with a regression-detective agent** |

State this table carefully: "No" means we found no such feature in the public material we reviewed (sources in §0.1). Don't overstate it, and correct it if a practitioner tells you otherwise.

## 5. Why it needs an LLM agent (judges will ask)
1. **Lesson language → maths.** "Where the ball lands" means mark the positive x-intercept, and "peak" means the vertex. If the request is ambiguous, it asks rather than guessing.
2. **Fixing conflicting failures.** Scaling up fixes merged lines but can overflow the print bed. Moving a label can create a new collision. The agent combines fixes from an allowed list.
3. **The learner description.** It writes the plain-language description that goes with the graphic. A guard checks that every number in it matches the computed values.
4. **Diagnosis in plain language.** The release guard and regression detective read logs, reports and diffs and explain *why* something broke, for example "commit a1b2 changed curve thickness from 1.6 to 1.0 mm, so graph 7 now fails TL-5". Then they choose a constrained action: roll back, revert, or ask for a human.

## 6. Why hands-off is responsible here
Nothing ships unless every deterministic check passes. The agent can only edit `layout.json`. If it can't make a graph readable in 3 attempts, it **refuses and explains** instead of shipping. The teacher still handles the physical output. Every file says that automated checks don't certify comprehension.

## 6b. Four agents, each owning a lifecycle job

This answers the most likely judge objection: *"the agent makes content; the DevSecOps part is just a pipeline."* In Locus, agents own work in **Plan, Create, Verify, Release, Monitor and Secure**. Deterministic CI decides pass or fail, and agents decide what to do about it.

| Agent (Duo custom flow) | Trigger | Reads | May do (enforced by guards) | Stages | Tier |
|---|---|---|---|---|---|
| **`locus-request`**: intake | Work item created (Service Desk issue) | Teacher's email | Write `requests/<iid>/` spec + layout; open MR; or ask one question | Plan, Create | 1 |
| **`locus-fixer`**: layout fixer | Pipeline failed on a `graph/*` MR | touchcheck report + overlay | Edit `layout.json` only, using allowed fixes; refuse after 3 attempts | Create, Verify | 1 |
| **`locus-release-guard`**: release guard | Pipeline failed in `validate-staging` or `post-deploy-smoke` on `main` | Validation/smoke report, release manifest, previous revision | Open an MR changing **only** `deploy/gcp/production-revision` back to the last good revision (GitOps rollback, auto-merged when checks pass); post an incident note on the issue | Release, Monitor, Configure | 1 |
| **`locus-regression-detective`**: regression detective | Scheduled `library-recheck` pipeline failed | Re-check report + `bisect-regression` result (first bad commit, computed deterministically by CI) | Explain the cause in plain language; open an **exact `git revert`** MR of the bad commit, or, if the change was intentional, open a request for the fixer to re-lay out each affected graph | Monitor, Create, Verify | 1 |
| `locus-security-triage`: security triage | Pipeline with new SAST / dependency / secret findings | Security reports | Summarise the risk; open a dependency-bump MR (only `package.json` + lockfile) | Secure | 2 (T2.9) |

**Why the actions are safe:** each agent has its own allowed paths, checked by `guard-scope`. Rollback is just a revision pointer, so it's reviewable and reversible. A revert must exactly invert the target commit (`guard-revert`). Everything still goes through the full pipeline before it merges.

**Duo Agent Platform features used:** custom flows (4–5), triggers (work item created, pipeline failed, scheduled pipeline failed), service accounts, built-in Code Review Flow (T2.5), MCP and AI Catalog (Tier 3).

---

# PART II — WHAT TO BUILD

## 7. Scope: three tiers

We build with Claude Code (§7.4), so the build goes beyond a minimal MVP. **But the video still tells one story** (Part V). Tier 2 and 3 work makes the product deeper and the repo stronger for judges. It never adds beats to the video, except the single eval caption.

**Rule:** start Tier 2 work in an area only after that area's Tier 1 gate has passed. Start Tier 3 only after Gate 9.

### 7.1 Tier 1 — the core loop (must ship)
- Polynomials up to degree 3: `y = a·x³ + b·x² + c·x + d`, with bounded coefficients and domain. Evaluator without `eval`.
- Marks: vertex/turning points, y-intercept, real x-intercepts (found numerically).
- Short braille labels (digits, single letters), using a built-in Grade 1 → Unicode braille table; key mode.
- Profile `fdm-3d-v1` (STL for 3D printing) + SVG preview. *Why 3D print first:* a printer is far easier to get in Dhaka than a swell-paper fuser.
- `touchcheck`: 5 rules + overlay (§10).
- 4 Duo flows (§6b): `locus-request`, `locus-fixer` (attempt cap + refusal), `locus-release-guard` (GitOps rollback), `locus-regression-detective` (bisect → revert MR).
- 4 guards (§11).
- Service Desk email intake + reply.
- Bundle → Package Registry → release → Cloud Run staging → validate → production → reply email.
- Nightly library re-check + deterministic `bisect-regression` job.
- Local CLI: `npm run locus -- examples/projectile.json`.

### 7.2 Tier 2 — depth (expected, because Claude Code makes it affordable)
| ID | Feature | Why it scores |
|---|---|---|
| T2.1 | **More function families:** sine, cosine, exponential, via an allowlisted expression grammar (parsed, never evaluated), with clipping and end markers where a curve leaves the frame | Impact: covers most secondary-school graph requests, not just polynomials |
| T2.2 | **Second profile `swell-a4-v1`:** SVG for swell paper and embossers, with its own rule values | Impact: matches the most common school equipment |
| T2.3 | **Agent eval suite:** 30 real-style teacher requests → expected specs. A CI job scores the Duo agent's parsing and publishes accuracy in the README | Tech + Innovation: answers "how do you know the agent is reliable?" Anthropic and GitLab judges will value this |
| T2.4 | **`guard-injection` + refusal showcase:** malicious and unreadable requests, with real linked issues | Secure stage depth; responsible autonomy |
| T2.5 | **Built-in Code Review Flow** on every agent MR | More Duo Agent Platform features used |
| T2.6 | **Accessible graph library site:** a page per graph with text description, downloads, braille ID and release link; automated accessibility check job ([axe-core](https://github.com/dequelabs/axe-core), MPL-2.0, OSI-approved) | Design + Verify depth; something judges can click |
| T2.7 | **Self-healing re-layout:** when the regression detective decides a generator change was intentional, each affected graph re-enters the fixer loop and is re-released as `v2` | Monitor stage creativity |
| T2.8 | **Property-based tests** for geometry invariants ([fast-check](https://github.com/dubzzz/fast-check), MIT) | Tech: non-trivial testing |
| T2.9 | **Security triage agent** (§6b) | Puts an agent in the Secure stage |

### 7.3 Tier 3 — stretch
- MCP tools exposing `render` and `touchcheck`, so the agent can pre-check a layout before pushing.
- Publish the Locus agent/flow to the AI Catalog.

**Never build:** image-to-tactile, arbitrary user code, accounts, printer control, contracted braille, statistical charts (already covered by the [2026 paper](https://www.emergentmind.com/papers/2607.01214); don't overlap).

### 7.4 How we build: Claude Code

**Role boundary (Stage One depends on it):** *Claude Code is how we build Locus. GitLab Duo Agent Platform is what runs inside Locus.* Every agent action in the product, in the pipeline history and in the video is done by Duo flows. Never use Claude Code to make in-product fixes during a recorded run. Say this in the README.

**Shared memory in the repo, so either person and either Claude Code session can pick up anywhere:**

| File | Contents | Updated |
|---|---|---|
| `CLAUDE.md` | Commands (install, test, render, CLI), architecture in 10 lines, **invariants** ("never edit `locus/touchcheck/rules` to make a request pass", "agent writes only to `requests/<iid>/`", "no secrets in prompts or code"), file ownership | Whenever conventions change |
| `docs/STATE.md` | Current status per tier and gate, the next task, blockers | End of every working session |
| `docs/decisions.md` | Dated decisions (e.g. hands-off vs supervised, rule values and their sources) | When decided |
| `docs/contracts.md` | The interfaces between parts (§15.2) | Changes need both people to agree |
| `HANDOVER.md` | See §15.4 | 20–21 Oct |

**Session routine** (the msr / superpowers skills if installed; otherwise follow the same steps by hand):
1. Start: `/msr-session-start`. It reads `STATE.md` and recent commits and proposes the next task.
2. For each module, plan first (brainstorm → written plan), then **test-driven development**: write the failing test, then the code.
3. Before each commit: `/msr-gate` runs the real lint, test and build commands. Review every diff yourself, because the [hackathon FAQ](https://gitlab-transcend.devpost.com/) says you own what the AI creates.
4. End: `/msr-handoff` updates `STATE.md` and proposes the commit message.
5. Before submission: `/msr-ship` (Shawki).

**Git hygiene:** feature branch → MR → pipeline, so the history shows the automation. Small commits. `git commit -s` ([DCO 1.1](https://docs.gitlab.com/ee/legal/developer_certificate_of_origin.html) sign-off by the human author). Never paste tokens or keys into prompts; use protected, masked CI variables. Use git worktrees or parallel Claude Code sessions for independent modules (for example touchcheck rules and braille labels).

## 8. Architecture

```text
Teacher email ─▶ GitLab Service Desk ─▶ issue (label locus-request)
                                          │ trigger: work item created
                                          ▼
                    Duo flow "locus-request"
                    • ambiguous? → reply asking one question, stop
                    • write requests/<iid>/{spec.json, request.lock.json, layout.json}
                    • branch + MR
                                          ▼
                    MR pipeline: render → touchcheck → guards → security → bundle
                         │ fail                                 │ pass
                         ▼                                      ▼
   trigger: pipeline failed (fallback:         auto-merge → release graph-<iid>
   CI posts MR note mentioning agent)          → Cloud Run staging → validate
                         ▼                     → promote production
   Duo flow "locus-fixer": read report,        → summary note on issue (emailed to
   edit layout.json only, push (max 3)            teacher by Service Desk) → close
   3rd failure → refusal note, no release

validate-staging / post-deploy-smoke fails on main
→ trigger: pipeline failed → Duo flow "locus-release-guard": MR setting
  deploy/gcp/production-revision to last good revision → checks → auto-merge →
  traffic rolled back → incident note on the issue

Nightly "library-recheck": re-render + touchcheck every shipped graph on current main
→ fails → "bisect-regression" job finds the first bad commit (deterministic)
→ trigger: scheduled pipeline failed → Duo flow "locus-regression-detective":
  plain-language cause + exact revert MR (or re-layout requests if intentional)
Report-only during judging (JUDGING_FREEZE).
```

## 9. Files

```text
OpenJSCAD.org/                       # imported upstream; MIT LICENSE preserved & visible
├── .gitlab-ci.yml                   # upstream-test (migrated node.yml) + Locus lifecycle
├── .gitlab/duo/flows/{locus-request,locus-fixer,locus-release-guard,locus-regression-detective}.yml
├── .gitlab/CODEOWNERS               # locus/rules, CI, flows → maintainer
├── locus/
│   ├── core/       # schema, polynomial, layout, geometry (JSCAD), svg, braille, describe, bundle, manifest
│   ├── touchcheck/ # rules TL-1..TL-5, overlay renderer, remedies.json
│   ├── guards/     # scope (per-agent allowed paths), maths-lock, description, revert
│   ├── site/       # graph library + build-info.json
│   └── cli/
├── deploy/gcp/                      # Cloud Run config + production-revision (GitOps pointer)
├── requests/<iid>/{spec.json,request.lock.json,layout.json}
├── examples/  fixtures/
└── docs/{before-after,touch-rules,safety,limitations,related-work}.md
```

**`spec.json`** (agent-written, schema-validated):
```json
{ "schemaVersion": 3, "requestId": 12,
  "graph": { "type": "polynomial", "coeffs": [0, -0.5, 2, 1], "domain": { "min": -0.5, "max": 4.5 } },
  "mark": ["vertex", "y-intercept", "x-intercept+"],
  "labels": "braille-grade1", "profileId": "fdm-3d-v1" }
```
**`request.lock.json`**: an exact copy of `graph` + `mark` from the first commit. Changing them is forbidden.
**`layout.json`**: `{ "xScaleMm", "yScaleMm", "labelMode": "inline|key", "labelOffsets", "showGrid" }`. This is the only file the fixer may edit.
**Bundle `graph-<iid>.zip`**: `graph.stl`, `graph.svg`, `description.txt`, `touchcheck-report.json`, `overlay.svg`, `manifest.json` (commit, request, hashes, checks, attempts, release, braille ID, limitations; generated from real job output only).

## 10. `touchcheck` rules (5)

| ID | Plain words (shown on the overlay) | Measured | Value (source; confirm vs [BANA 2022](https://www.brailleauthority.org/tg/web-manual/tgmanual.html) + practitioner) |
|---|---|---|---|
| TL-1 | "These lines are too close: a fingertip feels one line" | min distance between curve and axis/grid outside real crossings | ≥ 3.2 mm (1/8 in absolute min, [tactilegraphics.org](https://tactilegraphics.org/readability.html)) |
| TL-2 | "This label touches a line" | min distance from braille label box to any line | ≥ 6.4 mm (1/4 in, [tactilegraphics.org](https://tactilegraphics.org/readability.html); [NPS map labels](https://www.npshistory.com/publications/interpretation/hfc/tactile-map-guidelines-2008.pdf) use 9.5 mm) |
| TL-3 | "These labels overlap" | label box intersection | none |
| TL-4 | "Something requested is missing" | inventory: axes, curve, each requested mark, key if used | all present |
| TL-5 | "Too big for the printer / features too thin" | bounding box vs bed; min line width/height | profile-defined (e.g. 180×180 mm bed, ≥ 1.2 mm width) |

**The overlay is the hero visual:** a red circle around each violation with the plain-words message and the measured value ("1.4 mm apart — needs 3.2 mm"). After the fix, the same spot is shown with a green circle.

**Allowed fixes (`remedies.json`):** TL-1 → rescale an axis / hide the grid. TL-2, TL-3 → move a label / switch to key mode. TL-5 → reduce scale. TL-4 → none, refuse (never delete features).

## 11. Guards (4, all required)

| Guard | Blocks |
|---|---|
| `guard-scope` | Any agent commit outside its allowed paths: intake/fixer → `requests/<iid>/`; release guard → `deploy/gcp/production-revision`; security triage → `package.json` + lockfile |
| `guard-maths` | Spec differs from `request.lock.json`, or plotted points don't match the locked maths |
| `guard-description` | Any number in the learner description that doesn't match computed values |
| `guard-revert` | A regression-detective MR that isn't an exact inverse of the commit `bisect-regression` identified |

Plus protected branches and tags, CODEOWNERS, `secret-detection` and `sast` templates, and a licence check (MIT preferred; others must be OSI-approved and listed).

## 12. The nine [official stages](https://about.gitlab.com/topics/devops/#the-dev-ops-lifecycle-and-how-dev-ops-works) (README table + video tracker bar)

| Stage | What happens | Agent involved |
|---|---|---|
| **Plan** | Teacher email → Service Desk issue → typed spec (or one question) | Intake |
| **Create** | MR with spec; layout fixes; revert MRs; rollback MRs | Intake, fixer, regression detective, release guard |
| **Verify** | `touchcheck` + maths + migrated JSCAD tests + property tests; staging validation; agent eval suite | Fixer reacts to failures |
| **Secure** | 4 guards + secret detection + SAST + licence check | Security triage (T2.9) |
| **Package** | STL/SVG/description bundle → Package Registry; site image → Container Registry | — |
| **Release** | GitLab release per graph; staging → validated → production on Cloud Run; rollback | Release guard |
| **Configure** | Printer profiles, `RELEASE_MODE`, Cloud Run config, `production-revision` pointer, all versioned | Release guard edits the pointer |
| **Monitor** | Post-deploy smoke + nightly re-check of every shipped graph + bisect | Regression detective, release guard |
| **Govern** | Manifest + braille ID on every print ↔ release; CODEOWNERS; per-agent scopes; audit trail | — |

## 13. Pipeline jobs (compact)

`upstream-test` (Node 20/22 matrix, only when `packages/**` changes) · `validate-spec` · `render` · `touchcheck` (artifacts kept on failure, so attempt 1 can be printed) · `guard-scope` · `guard-maths` · `guard-description` · `secret-detection` · `sast` · `license-check` · `notify-agent` (fallback only) · `bundle` · `publish-package` · `release` · `deploy-staging` · `validate-staging` · `approve-production` (supervised mode only) · `promote-production` · `post-deploy-smoke` · `reply-teacher` · `library-recheck` (scheduled) · `bisect-regression` (after a re-check failure) · `guard-revert` · `deploy-production-pointer` (applies `production-revision` on merge).

`release` and `promote-production` must `needs:` touchcheck, all guards, security and bundle.

## 14. Hosting and freeze
- **Cloud Run** for staging and production (static graph library in a container; min instances 0; budget alert). Deployment code in `deploy/gcp/`. **Fallback:** GitLab Pages (loses the 0.2 bonus).
- **Before submitting:** commit `JUDGING_FREEZE=true`. During judging, `library-recheck` and smoke tests only log; there are no issues, commits, releases or deploys. Ask on Discord whether judges may send a test email.

---

# PART III — GATES

| # | Gate | Owner | By | If it fails |
|---|---|---|---|---|
| 0 | Both: Devpost team joined (Shawki = Representative), **GitLab onboarding requested**, Discord joined, Claude Code set up | Both | 13 Oct | — |
| C | **Contracts agreed:** `docs/contracts.md` + `fixtures/bundle-sample/` committed | Both | 14 Oct | Blocks parallel work; do it first |
| 1 | JSCAD imported, MIT in About, [`node.yml`](https://github.com/jscad/OpenJSCAD.org/blob/master/.github/workflows/node.yml) migrated, `CLAUDE.md` + `STATE.md` in repo | Ashfaq | 15 Oct | Standalone packages against published `@jscad/*` |
| 2 | Polynomial → STL + SVG + overlay in CI | Ashfaq | 15 Oct | SVG first |
| 3 | 3D print access confirmed; quote + turnaround known | Shawki | 15 Oct | Show files only; say so (big Impact hit) |
| 4 | Practitioner booked (15th), spoken to (20th) | Ashfaq | 20 Oct | Narrow the claim; never invent quotes |
| 5 | **Duo loop: email/issue → spec → fail → fix → pass, no human, twice** | Ashfaq | **16 Oct** | **Switch to Supervised** |
| 5b | Regression detective: a seeded generator regression → re-check fails → bisect finds it → agent opens an exact revert MR | Ashfaq | 20 Oct | Agent posts the diagnosis only; revert is manual |
| 5c | Release guard: a seeded bad staging/production deploy → agent's rollback MR → traffic back on the last good revision | Shawki | 23 Oct | Agent posts the incident note; rollback runs as a CI job |
| 6 | Service Desk email intake works | Ashfaq | 17 Oct | Issue template intake; say so |
| 6b | Hosting skeleton: GitLab CI deploys a placeholder site to Cloud Run staging + production | Shawki | 17 Oct | Pages fallback |
| 7 | touchcheck 5 rules + overlay; seeded bad fixtures fail correctly | Ashfaq | 18 Oct | Cut to TL-1, 2, 4 |
| 7b | **Calibration test print** received (line widths, heights, spacing, braille dots) and rule values adjusted | Shawki | 19 Oct | Use published values only; say so |
| 8 | Guards block bad agent diffs | Ashfaq | 20 Oct | Must pass |
| H | **Handover accepted** (§15.4) | Both | 21 Oct | Fix gaps on the pairing day |
| 9 | Release → staging → production → reply email, on real bundles | Shawki | 23 Oct | Pages fallback |
| 10 | **Two prints in hand** (attempt 1 + released) | Shawki | 23 Oct | Use the overlay only |
| 10b | **One blind or low-vision reader** touches both prints (informed consent; no personal data; filmed hands only if they agree) and gives one honest sentence | Shawki (session), Ashfaq (outreach) | 24 Oct | Say plainly that no reader test was done |
| 11 | **Sound-off test:** 2 people who've never heard of Locus watch the draft video once and explain it in one sentence | Shawki | 25 Oct | Recut the video, not the code |

---

# PART IV — TEAM, SCHEDULE AND HANDOVER

## Roles

| | **Ashfaq** | **Shawki** |
|---|---|---|
| Lead period | 13–21 Oct (core build) | Hosting track from 13 Oct; leads from 21 Oct |
| Owns | Project setup, JSCAD import + CI migration, generation, touchcheck + overlay, braille, intake + fixer flows, regression detective + `bisect-regression` + `guard-revert`, Service Desk intake, guards, refusal path, local CLI. Tier 2: T2.1, T2.2, T2.3, T2.4, T2.8, T2.9. Tier 3: MCP. Outreach to practitioners and a blind/low-vision reader | Google Cloud + Cloud Run hosting, print sourcing + calibration print, packaging, release, security jobs, staging → production, GitOps `production-revision` + release guard flow, reply email, the two prints + reader session, nightly re-check schedule + freeze. Tier 2: T2.5, T2.6, T2.7. Tier 3: AI Catalog. README, video, Devpost, submission |
| Devpost | Team member | **Team Representative** (submits the entry) |
| GitLab / cloud | Maintainer | Maintainer; owns the Google Cloud project and billing |

## Day by day

| Date | Ashfaq | Shawki |
|---|---|---|
| **Tue 13** | Create the Devpost team; onboarding request; Discord; Claude Code setup; email 3–5 TVIs/schools/disability offices, also asking whether one blind/low-vision reader could try two prints on 23–24 Oct | Join the team; onboarding request; Claude Code setup; Google Cloud account + budget alert; ask 2–3 Dhaka print services/labs for quote + turnaround |
| **Wed 14** | **Together: write `docs/contracts.md` + sample bundle fixture (1 h).** JSCAD polynomial → STL/SVG locally; overlay prototype; check Service Desk | **Together: contracts (1 h).** Cloud Run service skeleton + `deploy/gcp/` |
| **Thu 15** | Import JSCAD, migrate [`node.yml`](https://github.com/jscad/OpenJSCAD.org/blob/master/.github/workflows/node.yml), `CLAUDE.md` + `STATE.md`; generation in CI; **office hours 19:00 UTC** | Confirm print access; design the calibration STL (spacing ladder, line widths, braille dots) |
| **Fri 16** | **Duo loop spike → hands-off or supervised** (`docs/decisions.md`) | Send the calibration print; storyboard the video from Part V |
| **Sat 17** | Service Desk intake; touchcheck TL-1, TL-2, TL-4 | Hosting skeleton: CI → Cloud Run staging + production (Gate 6b) |
| **Sun 18** | TL-3, TL-5; braille + key mode | Release + package jobs against the sample bundle; **from today, run Ashfaq's loop daily on own machine** and log friction in `STATE.md` |
| **Mon 19** | Full loop on a real emailed request; local CLI; `bisect-regression` + `guard-revert` | Calibration print received → adjust profile values with Ashfaq (Gate 7b); security jobs |
| **Tue 20** | Regression detective flow (Gate 5b); guards + refusal; **office hours 10:00 UTC**; practitioner notes; write `HANDOVER.md` | `production-revision` pointer + `deploy-production-pointer` job; Devpost draft text; README skeleton with the one diagram and the §4b comparison |
| **Wed 21** | **Pairing day:** finish T2.1 function families, T2.2 swell profile, T2.3 eval suite, T2.4, T2.8, T2.9 as far as possible; walkthrough; Gate H | **Pairing day:** walkthrough; run everything alone; Gate H; wire real bundles into release → staging → production |
| **Thu 22** | On call for Phase 1 code (bug fixes only) | Release guard flow (Gate 5c); reply email; T2.5 Code Review Flow; **send both real STLs to print** |
| **Fri 23** | On call | T2.6 library site + a11y job; T2.7 self-healing re-layout; `JUDGING_FREEZE`; README complete; Gates 9 + 10 |
| **Sat 24** | Help with filming; join the reader session if it happens | Reader session (Gate 10b); two clean runs from fresh emails; record the regression-detective run; film the prints |
| **Sun 25** | Review the video draft | Edit; **sound-off test**; recut. No new features |
| **Mon 26** | Final read of the README and Devpost text | `/msr-ship`; check links while signed out; commit `JUDGING_FREEZE=true` |
| **Tue 27** | — | **Submit by 10:00 UTC.** Nothing changes after 13:00 UTC |

## 15. Making the handover smooth

### 15.1 Principle
There's no hard switch on one day. Shawki works alongside from day 1 on hosting and release, so on 21 Oct they're taking over a system they've already run, not meeting it for the first time.

### 15.2 Contract first (14 Oct, together)
`docs/contracts.md` fixes the interfaces before either side builds:
- **Bundle contract:** file list, `manifest.json` schema (fields in §9), naming `graph-<iid>-v<n>`.
- **Job contract:** `bundle` job artifact paths; what `release` / `deploy-*` jobs consume; required `needs:`.
- **Flow contract:** labels (`locus-request`, `needs-info`, `cannot-make-readable`, `incident`, `regression`); the issue summary note format the reply email uses; each agent's allowed paths (for `guard-scope`).
- **Rollback contract:** format of `deploy/gcp/production-revision`; how `deploy-production-pointer` applies it.
- **Site contract:** `build-info.json` fields; per-graph page URL pattern.

`fixtures/bundle-sample/` lets Shawki build release and deploy jobs against a fake bundle while Ashfaq builds the real one. After 14 Oct, any contract change needs both people to agree, recorded in `docs/decisions.md`.

### 15.3 Daily rhythm (13–21 Oct)
- End of every session: `/msr-handoff` → `STATE.md` updated and pushed.
- End of day: a 5-line message: **done / next / blocked / decisions / needs from the other person**.
- From 18 Oct, Shawki runs the full loop on their own machine once a day, so environment problems surface early, not on handover day.

### 15.4 Handover acceptance (Gate H, 21 Oct)
- [ ] Gates 0–8 pass, or failures are written down with the agreed fallback.
- [ ] Shawki has run the full loop alone from a fresh email, using only `CLAUDE.md` and `HANDOVER.md`.
- [ ] `/msr-session-start` on Shawki's machine gives an accurate summary of where the project stands.
- [ ] `HANDOVER.md` covers: what works, what's flaky (and how to re-run it), the hands-off/supervised decision, the four flows' configs and triggers, CI variable **names** (never values), Service Desk address, known issues, office-hours answers, Tier 2 status.
- [ ] Shawki has Maintainer access, Duo flow access and the Service Desk mailbox. Secrets live only in protected, masked CI variables.
- [ ] Practitioner notes and print contacts are in `docs/` (no learner personal data).
- [ ] The walkthrough call is recorded for reference.

### 15.5 After handover
Ashfaq is on call for bugs in Phase 1 code until 25 Oct and helps film on 24 Oct. All new feature decisions after 21 Oct are Shawki's.

**Cut order if behind:** Tier 3 → T2.9 → T2.7 → T2.5 → T2.2 → T2.1 → TL-3/TL-5 → key mode → Service Desk (use the issue template) → Cloud Run (use Pages).
**Never cut:** the Duo loop, a real touch failure + overlay, the agent fix, **at least one lifecycle agent beyond intake/fixer (regression detective or release guard)**, guard-scope + guard-maths, release, braille ID, the two prints, honest limitations.

## 16. Office-hours questions (15 Oct — Ashfaq; 20 Oct — both)
1. Are pipeline-**failed** triggers for custom flows enabled on the hackathon instance? If not, does a CI-posted MR note that mentions the flow service account trigger it?
2. Is Service Desk enabled, and does a Service Desk-created issue fire a "work item created" trigger?
3. During judging, can scheduled pipelines run read-only, and may judges trigger the flow?
4. Are any registries or security templates limited by the group's tier?
5. Is it fine to state that Claude Code was used to build the project while GitLab Duo runs the in-product agents?
6. Do pipeline-failed triggers also fire for **scheduled** pipelines and for pipelines on `main`, and can a flow open an MR that contains a `git revert`?

---

# PART V — THE VIDEO (2:55, 9 beats, one real run + one lifecycle-agent moment)

**Principles:** one request (#N) from start to finish, plus one short lifecycle-agent beat. A stage tracker bar (Plan … Govern) sits at the bottom and lights up only when the real event appears on screen. Use plain words on screen and don't explain YAML. AI narration and captions are allowed. No third-party trademarks or music. YouTube Public or Unlisted. **Nine beats, no more.**

| # | Time | Show | Say | Tracker |
|---|---|---|---|---|
| 1 | 0:00–0:25 | Two prints side by side. A hand, eyes closed, over **attempt 1** (curve and axis merge), then the **released** print (clearly separate). Caption: "Modelling one tactile graph by hand: ~2 hours." | "Same graph, two prints. On the left, a fingertip can't tell the curve from the axis. Teachers spend hours making these by hand." | — |
| 2 | 0:25–0:45 | Teacher's email → issue appears → Duo intake session → MR with spec | "With Locus, a teacher just sends an email. A GitLab Duo agent turns it into a graph." | Plan, Create |
| 3 | 0:45–1:05 | Red pipeline → **overlay**: red circle "1.4 mm apart — needs 3.2 mm", "label touches line" | "Locus checks it the way a fingertip would. It fails." | Verify |
| 4 | 1:05–1:25 | Fixer session → diff in plain words → guards green | "The agent fixes its own work, and it can only change the layout, never the rules or the maths." | Create, Secure |
| 5 | 1:25–1:50 | Green overlay → package → release → staging validated → production | "Every check passes. GitLab packages it, releases it, validates it on staging and puts it live. No human touched it." | Verify, Package, Release, Configure |
| 6 | 1:50–2:05 | Reply in the teacher's inbox → the print → finger finds the braille ID → same ID on the release page | "The teacher gets a print-ready file. The braille ID traces each print to its release." | Govern |
| 7 | 2:05–2:25 | **Regression detective:** overnight re-check flags graph 7 → bisect names the commit → agent's plain-language diagnosis → revert MR → green | "One night, a code change broke an old graph. Another agent found the exact commit and reverted it before anyone printed it." | Monitor, Create |
| 8 | 2:25–2:40 | The one diagram + all 9 stages lit + caption with the **real** eval score (T2.3) | "Four agents, nine lifecycle stages, and every agent is tested on real teacher requests." | all 9 |
| 9 | 2:40–2:55 | Name + tagline + URLs + limitation line + reader's/practitioner's sentence **only if real, with consent** | "Locus. Graphs a fingertip can read." | — |

**In the README only (not in the video):** the release guard's rollback run, the refusal path, the security triage agent and the comparison table. Each links to the real issue, MR or pipeline.

---

# PART VI — HONEST SCORECARD (1–5 per criterion, equal weight)

Earlier versions of this plan scored themselves higher with each revision, even though nothing new had been proven. These numbers are deliberately conservative. Nothing is built yet.

| Criterion | Floor | **Realistic** | Ceiling | What decides it |
|---|---:|---:|---:|---|
| **Technological Implementation** (tie-breaker) | 3.0 | **4.0** | 4.5 | Four agents with real lifecycle jobs (fix, rollback, bisect + revert), per-agent scopes, pipeline-failed triggers, eval suite. It drops if the rollback or detective loops stay half-working |
| **Design** | 3.2 | **4.0** | 4.5 | Email in, email out, with agents handling failures afterwards. The risk is reliability of many moving parts on camera |
| **Potential Impact** | 2.5 | **3.5** | 4.2 | Comparison table + 2 h/chart evidence + physical before/after. A real reader's sentence is worth +0.5. Still a niche audience with no outcome data |
| **Innovation / Idea** | 3.8 | **4.3** | 4.7 | Checking by touch as a CI gate; self-fixing output; an agent that protects shipped physical objects from code regressions; braille provenance |
| **Presentation** | 3.0 | **4.0** | 4.6 | 9 beats; the two-print opening; the sound-off test. It depends on filming quality in the last 3 days |
| **Average** | 3.1 | **3.96** | 4.5 | |
| + Google Cloud bonus | 0 | +0.2 | +0.2 | |
| **Final** | **≈3.1** | **≈4.2** | **≈4.7** | |

**Prize outlook:**
- **Most Stages Covered (Path B):** your strongest shot. Agents now act in 6 of the 9 stages, not just CI jobs.
- **Path B Best Hands-off Agent:** a contender if Gates 5, 5b and 5c pass and the video shows them working.
- **Most Creative:** possible, but it needs the single highest Innovation score across both paths.

**What still caps it:** the audience is niche, there's no learner outcome data, and the touch rules come from published guidance rather than our own testing with readers. A multi-agent security project may still look deeper to some GitLab judges.

**Scope-creep warning:** Claude Code makes building cheap, but it doesn't make polishing, testing and filming cheap. A finished Tier 1, including the two lifecycle agents, with a great video beats an unfinished Tier 2.

**Biggest risks:** (1) the Duo loop by 16 Oct; (2) the lifecycle agents' triggers on `main` and on scheduled pipelines (office-hours question 6); (3) a 3D print in hand by 23 Oct; (4) a practitioner and a reader; (5) handover friction (fixed by contracts, daily `STATE.md`, and Shawki running the loop from 18 Oct); (6) scope creep. Settle (3) and (4) today. They cost no code and add the most score.

---

# PART VII — SUBMISSION CHECKLIST

- [ ] Public GitLab repo, MIT LICENSE visible in About, upstream attribution, `docs/related-work.md` citing the tools and paper in §0.1.
- [ ] Original JSCAD URL; production URL (Cloud Run); Google Cloud link.
- [ ] Visible pipeline history: a failing touchcheck → agent fix → pass → release → staging → production; nightly re-check → bisect → revert MR; release-guard rollback run.
- [ ] README includes the §4b comparison table (carefully worded) and links to each agent's real runs.
- [ ] Flow YAML committed (MIT, [DCO 1.1](https://docs.gitlab.com/ee/legal/developer_certificate_of_origin.html)); agent session links in the README; README states Claude Code was the build tool and GitLab Duo runs the product's agents.
- [ ] Agent eval results (T2.3) published in the README, real numbers only.
- [ ] All new work dated on or after 5 Oct 2026; README "upstream vs new".
- [ ] Devpost text opens with the 10-second version and the one diagram.
- [ ] Video < 3:00, passed the sound-off test, real footage, Public/Unlisted.
- [ ] Category matches `RELEASE_MODE`; Environmental not opted in.
- [ ] `JUDGING_FREEZE=true`; links checked while signed out; live until about 16 Nov; nothing changes after 13:00 UTC on 27 Oct.

## Sources

**Hackathon**
- [Hackathon overview and FAQ](https://gitlab-transcend.devpost.com/) · [Official rules](https://gitlab-transcend.devpost.com/rules) · [Resources](https://gitlab-transcend.devpost.com/resources) (text also pasted by the user, 13 Oct 2026)
- [GitLab DevSecOps lifecycle (official stage reference)](https://about.gitlab.com/topics/devops/#the-dev-ops-lifecycle-and-how-dev-ops-works)
- [GitLab Developer Certificate of Origin 1.1](https://docs.gitlab.com/ee/legal/developer_certificate_of_origin.html)

**Upstream project**
- [JSCAD / OpenJSCAD.org](https://github.com/jscad/OpenJSCAD.org) · [MIT licence](https://github.com/jscad/OpenJSCAD.org/blob/master/LICENSE) · [current CI: `.github/workflows/node.yml`](https://github.com/jscad/OpenJSCAD.org/blob/master/.github/workflows/node.yml)

**GitLab Duo Agent Platform**
- [Custom flows docs](https://docs.gitlab.com/user/duo_agent_platform/flows/custom/) · [Agentic flows blog (pipeline triggers)](https://about.gitlab.com/blog/multi-step-software-delivery-with-agentic-flows/)

**Related work and existing tools**
- [Touching and Feeling the Data (arXiv 2607.01214, summary)](https://www.emergentmind.com/papers/2607.01214)
- [SVGPlott](https://www.springerprofessional.de/svgplott-generating-adaptive-and-accessible-audio-tactile-functi/2191120) · [TactileView](https://specialneedscomputers.ca/products/tactileview-software) · [ViewPlus Audio Graphing Calculator guide](https://accessinghigherground.org/wp/wp-content/uploads/2025/04/Creating-Tactile-Graphs-with-the-ViewPlus-Audio-Graphing-Calculator.pdf) · [Desmos tactile graphs guide](https://accessinghigherground.org/wp/wp-content/uploads/2025/04/CreatingTactileGraphsWithDesMos.pdf) · [AHG: automated generation of tactile mathematics](https://accessinghigherground.org/automated-generation-of-tactile-mathematics/)

**Touch-readability guidance**
- [tactilegraphics.org: readability](https://tactilegraphics.org/readability.html) · [BANA Guidelines and Standards for Tactile Graphics 2022](https://www.brailleauthority.org/tg/web-manual/tgmanual.html) · [NPS tactile map guidelines 2008](https://www.npshistory.com/publications/interpretation/hfc/tactile-map-guidelines-2008.pdf)

**Evidence on 3D-printed maths graphs**
- [Visio SenseMath study](https://www.visio.org/visio.org/media/Visio/Downloads/KEI/Vision-2017/Does-multisensory-presentation-of-mathematical-graphs-improve-visually-impaired-students-performance-on-identifying-mathematical-graphs-A-comparison.pdf) · [Scientific American: teaching blind students with 3D prints](https://blogs.scientificamerican.com/guest-blog/teaching-blind-students-with-3-d-prints/)

**Tools named in the plan**
- [axe-core](https://github.com/dequelabs/axe-core) · [fast-check](https://github.com/dubzzz/fast-check)
