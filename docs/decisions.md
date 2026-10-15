# Locus decisions log

Dated entries, newest first. Any change to `docs/contracts.md` gets a line here.

---

## 15 Oct 2026 (b): pipeline checked against the Duo Agent Platform docs → pipeline v2 (PROPOSED, agree tonight)

Sources read on 15 Oct:
- [Triggers](https://docs.gitlab.com/user/duo_agent_platform/triggers/)
- [Custom flows](https://docs.gitlab.com/user/duo_agent_platform/flows/custom/) and the [flow registry v1 spec](https://gitlab.com/gitlab-org/modelops/applied-ml/code-suggestions/ai-assist/-/blob/main/docs/flow_registry/v1.md)
- [Flow execution](https://docs.gitlab.com/user/duo_agent_platform/flows/execution/) and [`agent-config.yml`](https://docs.gitlab.com/user/duo_agent_platform/flows/execution/agent-config-yaml/)
- [Agent tools](https://docs.gitlab.com/user/duo_agent_platform/agents/tools/)
- [Sessions](https://docs.gitlab.com/user/duo_agent_platform/sessions/)
- Foundational flows: [Code Review](https://docs.gitlab.com/user/duo_agent_platform/flows/foundational_flows/code_review/), [Fix CI/CD Pipeline](https://docs.gitlab.com/ci/pipelines/fix_pipeline/), [SAST Vulnerability Resolution](https://docs.gitlab.com/user/application_security/vulnerabilities/agentic_vulnerability_resolution/), [Secret False Positive Detection](https://docs.gitlab.com/user/duo_agent_platform/flows/foundational_flows/secret_false_positive_detection/), [Breaking Change Resolution](https://docs.gitlab.com/user/application_security/dependency_scanning/agentic-breaking-change-resolution/)

### D1. The current plan checked against the docs

| # | Plan v1 assumption | Docs say | Verdict |
|---|---|---|---|
| 1 | A Service Desk issue triggers intake (work item created) | Triggers need a human. Service Desk issues are created by the Support Bot | Broken: Needs a person to assign the issue to the bot, or a person files the issue |
| 2 | Intake's push → failed pipeline → separate fixer flow | A flow, bot or service account can't start a trigger | Broken: Fixer must run **inside the same flow** |
| 3 | CI posts an MR note mentioning the agent (fallback) | Bot comments can't start triggers | Broken: Remove `notify-agent` |
| 4 | Scheduled `library-recheck` failure → regression detective | Scheduled pipelines have no human | Broken: Re-check must also run on human-merged `main` pipelines |
| 5 | Agent auto-merges the green MR | No merge or approve tool in the [tool list](https://docs.gitlab.com/user/duo_agent_platform/agents/tools/) | Broken: A deterministic CI job merges (hands-off) or a person does (supervised) |
| 6 | Release guard fires when `main` fails after a graph release | That `main` pipeline is started by the merge bot → no trigger | Works with changes: Works only for human-merged changes. Graph-only releases are protected by `promote-production` needing `validate-staging` |
| 7 | Regression detective opens an exact `git revert` MR | No revert tool. `create_commit` (multi-file actions), `get_commit_diff` and `get_repository_file` exist | Works: with a change: the agent writes the inverse commit through the API, and `guard-revert` checks it exactly. Fallback: CI `prepare-revert` job |
| 8 | Fixer reads the touchcheck report artifact | No artifact tool. `get_pipeline_errors` / `get_job_logs` read job logs | Works with changes: touchcheck must **print** its compact JSON report to the job log |
| 9 | Flow YAML lives in `.gitlab/duo/flows/` and runs from there | Loading flows by repo path needs the `ai_catalog_create_third_party_flows` flag (off by default). Flows live in the AI Catalog | Works with changes: Keep the repo YAML as the source of truth; paste it into the catalog; a CI check compares them |
| 10 | Four flows share one identity | Enabling each flow creates its own service account `ai-<flow>-<group>`. Rights = service account ∩ triggering user | Works: Better than planned: `guard-scope` can check the commit **author** per agent |
| 11 | Judges open agent session links | Sessions are visible only to Developer+, and are deleted 30 days after last activity | Works with changes: Agents post a reasoning summary as a note. Export session logs to `docs/evidence/`. Re-run the demo on ~25 Oct so sessions last through judging |
| 12 | Our personal hackathon credits pay for agent runs | Triggered flows bill the **service account**, through the namespace's Monthly Commitment Pool / On-Demand credits, not the human | Open: **Ask GitLab:** does the hackathon group have a pool? If not, triggered flows may fail |
| 13 | Agents run `npm` / touchcheck in their container | The tools page marks `run_command`, `edit_file` and `read_file` "IDE only". `run_tests` and `create_commit` work in the web UI. Flows run in CI with the repo cloned (`coding_environment: full`), `setup_script` and a custom `image` | Open: **Verify in Gate 5.** Fallback: the fixer commits each attempt with `create_commit` and reads the MR pipeline's logs with `get_pipeline_errors` |
| 14 | Pipeline trigger only for our branches | The trigger can't filter by branch. The flow receives the **full pipeline webhook payload** (ref, source, user, status, jobs) | Works: First component classifies the payload and ends early on anything that isn't ours |
| 15 | Ask the teacher one question by email, then continue | The teacher's emailed reply becomes a Support Bot comment, which can't trigger | Works with changes: The reply arrives, then a person re-assigns the issue to the bot (one click). Demo the clear-request path |
| 16 | Supervised fallback = a manual CI job | Flows support a `HumanInputComponent` (approval checkpoint, to-do + email) | Works: Supervised mode can be the **same flow** with an approval node |

### D2. Pipeline v2

**Principle:** every chain starts with **one person's action**. After that, agents and CI finish the job without checkpoints, which matches the Hands-off prize ("picks up a trigger and completes the job end-to-end").

**Flow 1: `locus-request`** (intake → fixer loop in one session)
- **Trigger:**
  - Work item created, when a teacher or coordinator files the issue from the template; or
  - Assign, when a person assigns a Service Desk email issue to the bot.
- **Components:** `intake` (AgentComponent) → `fixer` (AgentComponent) ⟲ router → `end` / `refuse`.
- **Intake:**
  - Reads the issue.
  - Writes `requests/<iid>/`.
  - Opens `graph/<iid>` and the MR with `create_commit` + `create_merge_request`. Attempt 1 is committed, so the MR pipeline shows **red**.
- **Fixer:**
  - Runs touchcheck in the flow container. Fallback: reads `get_pipeline_errors`.
  - Edits `layout.json` only.
  - Commits each attempt, so CI history shows red → green.
  - Router: pass → `end`; fail and attempts < 3 → `fixer`; else → `refuse` (label `cannot-make-readable`, note).
- The final note contains the plain-language summary used by the reply email.

**After the flow (deterministic CI):** a green `graph/*` MR (all guards, `RELEASE_MODE=hands-off`) → `auto-merge` job (project access token) → `main` pipeline:
- package → release → staging → validate → production
- `reply-teacher` posts the summary note, and Service Desk emails it.

**Flow 2: `locus-ops`** (one flow, supervisor + 3 subagents, so 4 agents in total stays true)
- **Trigger:** Pipeline events = Failed, which only fires for human-caused pipelines. Also Assign, for nightly `regression` issues.
- **`triage`** reads the webhook payload and routes:
  - **`impact-reviewer`** (NEW, pre-merge):
    - When: `library-impact` failed on a **person's MR** that changes `locus/core/**`, `packages/**` or `package*.json`.
    - CI rendered every shipped graph with the MR's code.
    - The agent posts a plain-language review on the MR ("this change makes graph 7 fail TL-5: curve 1.6 → 1.0 mm") and either requests changes or lists the graphs that will need a re-layout. **The regression is caught before merge**, which is a stronger story than catching it after.
  - **`regression-detective`:**
    - When: `library-recheck` failed on a human-merged `main` pipeline, or a person assigned a nightly `regression` issue.
    - Reads `bisect-regression` output and explains the cause.
    - Opens the inverse-commit MR (`guard-revert`), or files re-layout requests if the change was intentional.
  - **`release-guard`:**
    - When: `validate-staging` / `post-deploy-smoke` failed on `main`.
    - Opens the rollback MR on `deploy/gcp/production-revision` and posts an incident note.
  - Anything else → `end`. Only the triage step is spent.

**Foundational flows (switched on, not built):**
- **Code Review:** automatic on every MR. `mr-review-instructions.yaml` holds the Locus invariants: never edit `locus/touchcheck/rules`, never change the locked maths.
- **SAST Vulnerability Resolution + Secret False Positive Detection:** automatic after default-branch scans. **Replaces the custom security triage agent (T2.9).** Ultimate only, so check the group tier.
- **Breaking Change Resolution (beta, Ultimate):** fixes dependency-bump MRs from dependency-scanning auto-remediation. Stretch goal for the JSCAD upgrade story.

**`.gitlab/duo/agent-config.yml`:**
- `image: node:22`
- `setup_script: npm ci`
- `cache` keyed on `package-lock.json`
- `network_policy.allowed_domains`: only `registry.npmjs.org` + GitLab, **and nothing else.** This is least privilege for agents and gives the Secure/Govern story.

**Tool least privilege:** each component's `toolset` lists only the tools it needs. Toolset option overrides pin values the LLM can't change.

### D3. Questions for GitLab (Discord, today)
1. Triggered flows bill the service account through the namespace's Monthly Commitment Pool. Do hackathon groups have one, or do triggered flows draw on the triggering member's credits?
2. Is the hackathon group Ultimate (for SAST Vulnerability Resolution, Secret FP Detection, Breaking Change Resolution)?
3. In CI-executed custom flows (`environment: ambient`), are `run_command`, `edit_file` and `read_file` available, or only the tools marked for the web UI?
4. Can a flow merge an MR or set auto-merge?

### D4. Gate 5 (16 Oct) now proves
1. A person files the issue (work item created) → one `locus-request` session → red pipeline → fix → green.
2. Assign trigger on a Service Desk issue.
3. Which tools work in the ambient flow (file tools, `run_command` / `run_tests`, `create_commit`).
4. Credit usage shows up, and under whose name.

---

## 15 Oct 2026 (a): answers from GitLab (Discord, `transcend-hackathon`)

### A. Onboarding and credits (GitLab staff)
- **Each teammate registers on their own** at [contributors.gitlab.com/transcend-hackathon](https://contributors.gitlab.com/transcend-hackathon). Maintainer access doesn't count.
- Once both are onboarded, post **both exact GitLab usernames** in the Discord thread. GitLab then adds us to the showcase project as Developer + AI.
- **Credits are personal.** Each member can spend their own in the shared project.
- **Action (Ashfaq, today):** register. **Action (Shawki):** post both usernames once Ashfaq is done.

### B. Triggers (GitLab staff)
1. "All trigger event types require a human user to perform the triggering action." Bots, service accounts and other flows can't start a trigger.
2. Scheduled pipelines can't start a trigger.
3. A `main` pipeline started by a human push or merge does qualify.
4. CI job comments work only if a human wrote them.
5. A `git revert` MR is not a documented flow capability.

**Rejected:** posting CI comments with a teammate's personal token so they count as human. It goes around a rule GitLab stated on purpose, it shows in the activity log, and it would weaken the hands-off claim.

Impact and the redesign are in entry (b) above.

---

## 14 Oct 2026: Braille labels, key mode, TL-2 / TL-3 (Ashfaq)
- **Braille table**: our own minimal Grade 1 (uncontracted) table in `core/braille.js`. It covers letters, capitals
  (dot 6), digits with a number sign before *each* number, decimal point (256), comma (2), minus (5 + 36) and hyphen (36).
  Any other character is refused, not guessed. **Not checked by a braille transcriber yet**; ask the practitioner
  (Gate 4). Known question: whether lone letters (key letters, "x") need the grade 1 indicator.
- **Cell size** in `fdm-3d-v1.geometry.braille`: NLS Specification 800 values (dot base 1.44 mm, height 0.48 mm, dot
  spacing 2.34 mm, cell spacing 6.2 mm, line spacing 10.16 mm). These are geometry, not rule values, and are to be
  confirmed against the published spec and the calibration print (Gate 7b): 0.48 mm dots are low for FDM. Dots are
  domes (half-ellipsoids), each a separate watertight shell like the other parts.
- **Label text**: the value a reader needs. For a vertex or turning point it is `x,y`; for the y-intercept, y; for an
  x-intercept, x. Values are rounded to 2 decimals (the description says "about" when it rounded; a label cannot).
- **Inline mode**: the label goes up and right of its dot, with the box corner at dot radius + TL-2 gap in both x and y.
  `labelOffsets[markId]` moves it from there. This is deterministic and deliberately simple: it often fails (e.g. a
  vertex at the top of the plot has no room above it), and moving it is the fixer's job.
- **Key mode**: each mark gets a letter (a, b, c… in mark order) next to its dot. A key under the plot lists
  `letter value`, one braille line per entry, at the left margin. The plot moves up so the key's top row sits the TL-2
  gap below the lowest raised feature. The plate grows taller, which can now conflict with TL-5 (seeded fixture
  `tl5-key-too-tall`).
- **TL-2** is measured from each label's box to raised line edges and to other marks (a label's own mark is not counted).
  A label that runs off the plate fails TL-2, measured by how far it runs off, because moving the label is the fix.
  Render does not clip such labels; the STL shows exactly what was checked. **TL-3** fails when label boxes overlap.
- **Not checked (open):** that a label stays near its own mark. A label 40 mm from its point passes TL-2/TL-3 but is
  useless. The five rules have no published value for this; ask the practitioner. Until then the overlay and description
  are the human check.
- **Not built yet:** axis labels ("x", "y"), tick labels, and the braille ID `L<iid>-<n>` on the plate. The braille ID
  needs the bundle version `n`, which render does not know yet; it comes with the bundle job.
- **Seeded fixtures (Gate 7)**: `fixtures/touchcheck/` holds one good request and one seeded to break each rule. A test
  renders and touch-checks each and requires exactly the expected failing rules. The good one shows that allowed fixes
  are enough for the projectile: grid hidden, `yScaleMm` 40, key mode, labels moved.

## 14 Oct 2026: touchcheck v1 report, overlay and job (Ashfaq)
- **Report** follows contracts §4. Two optional fields are added: rule `note` (plain words on how the rule was
  applied) and violation `subject` (scene ids). `at`, `measuredMm` and `requiredMm` may be `null` when there is no place
  or nothing measured (a missing mark). Schema: `locus/core/schema/touchcheck-report.schema.json`, and the sample bundle
  report passes it. Proposed into contracts §4. This needs Shawki's agreement (Gate C).
- **TL-2 / TL-3** pass as "not applicable: no labels yet" while the scene has no labels. If labels appear before these
  checks exist, they fail rather than pass unchecked.
- **TL-4** compares the spec's `mark` list with the scene (so a mark dropped from both `marks` and `missing` still fails).
  The key is not checked until key mode exists; the report says so.
- **TL-5**: the plate may be turned 90° on the bed. Mark dots count as features for the width check. Height is not
  checked while `minFeatureHeightMm` is null; the report says so.
- **Overlay**: the SVG preview plus a numbered red circle with short plain words and the measured value at each located
  violation. Green marks checks that passed: a ring on each present mark, the closest passing pair of lines when TL-1
  passes, and a dashed plate outline when TL-5 passes. A legend lists all five rules, the full messages and the limitation.
- **CI**: the `touchcheck` job gates `requests/*`. The example is checked too and its report and overlay are kept, but
  its expected failure (exit 1) does not fail the job; a crash (exit > 1) does. Unit tests assert that the example fails.

## 14 Oct 2026: TL-1: clear gap, and what counts as a real crossing (Ashfaq)
- **Measured edge to edge.** TL-1 measures the empty space between the raised edges of two lines (centre distance
  minus half of each line's width), because that is what a fingertip has to feel. Every line is sampled every 0.5 mm
  against every other line, on the scene that the STL and SVG are made from.
- **Real meetings are excused, but only as far as the meeting explains the closeness.** A real meeting is a *crossing*
  (each centreline passes from one side of the other to the other) or a *join* (an end of one line touches the other:
  raised edges touch). From each real meeting we walk along both lines while the gap keeps growing, until it reaches
  `minLineGapMm`. Only that stretch is excused. If the gap stops growing first (lines cross, then run alongside), the
  rest is measured as usual.
- **A tangent touch is not a real meeting.** The curve touching a line without crossing it (a grid line through the
  projectile's vertex) means the lines run together there, so it fails with 0 mm.
- **Line ends.** Every end either joins the other line or stays `minLineGapMm` clear of it. An end in between fails,
  including a short stub just past a crossing, even inside an excused stretch: the reader cannot tell whether the lines
  join or where one stops.
- **No minimum crossing angle.** A first version treated crossings under 30° as lines running together. 30° was our
  number, not published guidance. With it, the projectile's curve meeting the y-axis at 26.6° failed, and no allowed fix
  cleared it within the bed. Rule values come from published guidance only (see above), so there is no angle threshold.
  **Open question** (practitioner, Gate 4; BANA 2022): a very shallow crossing (e.g. a cubic with an inflection on the
  axis) is excused for as long as the lines keep separating. If a minimum angle is added, it goes in the profile with
  its source.
- **Projectile result with the committed layout and rule values:** TL-1 fails in 8 places: the curve ends 1.53 mm clear of
  the x-axis near both of its ends (after crossing it); grid-y-3 runs along the curve at the vertex (0 mm); the y-axis and
  grid-x-1..4 stop 3.1 mm below the x-axis (1.93 mm clear). A layout using only allowed fixes (`showGrid: false`,
  `yScaleMm: 40`) passes all five rules (tested), so the fixer has a path. Neither the example nor any rule value was changed.

## 14 Oct 2026: Gate 2 rendering choices (Ashfaq)
- **In-repo JSCAD via `file:`**: `locus` depends on `@jscad/modeling` as `file:../packages/modeling` (it has no
  dependencies), so Locus renders with the imported JSCAD and a JSCAD change reaches shipped graphs (what the nightly
  re-check guards). This replaces the earlier plan to make `locus` a root workspace, which would install the whole monorepo.
- **Own binary STL writer** instead of `@jscad/stl-serializer`, which needs other workspace packages installed.
- **Separate watertight shells, no boolean union.** The projectile union left 1,766 open edges (T-junctions);
  `generalize({snap, triangulate})` only halved them. Each shell on its own has 0 open edges, which a test enforces.
  Slicers merge overlapping shells. Confirm on the calibration print (Gate 7b).
- **One scene for everything**: STL, SVG and (next) touchcheck all read the same mm-space scene.
- **Geometry defaults** in `fdm-3d-v1.geometry` (curve 2.0 mm wide × 1.2 mm high, axis 1.2 × 0.8, grid 1.2 × 0.4,
  mark dots 4.0 mm × 1.6 mm, 10 mm margin, 2 mm base) are design starting values, not from a published source.
- **Marks**: `vertex` only for quadratics (rejected at validation otherwise); `x-intercept+` / `x-intercept-` mark every
  positive / negative root. A requested mark that isn't on the graph is carried as `missing` (for TL-4 and the description).

## 14 Oct 2026: Initial rule values from published guidance only (Ashfaq)
TL-1 ≥ 3.2 mm (tactilegraphics.org, 1/8 in absolute minimum), TL-2 ≥ 6.4 mm (1/4 in), TL-5 bed 180×180 mm and min
feature width 1.2 mm in `fdm-3d-v1`. To be checked against BANA 2022, a practitioner (Gate 4) and the calibration
print (Gate 7b). Any change is recorded here with its source.

## 14 Oct 2026: No placeholder CI jobs (Ashfaq)
`.gitlab-ci.yml` contains only jobs that do real work. Planned jobs are listed as comments. An `echo ok` job would be a
faked pass (truth rule).

## 14 Oct 2026: `locus/` is standalone until Gate 2 (Ashfaq)
`locus/` has its own `package.json` with zero dependencies and uses `node:test`. It becomes an npm workspace depending
on `packages/modeling` when geometry work starts (Gate 2), together with a regenerated `package-lock.json`.

## 14 Oct 2026: Two small upstream config changes (Ashfaq)
- `jsdoc.json` output moved from `./docs` to `./docs/api`, and `.gitignore` now ignores only `/docs/api/` at the root,
  because Locus keeps its own docs in `docs/`.
- Root `package.json` gains `test:locus` and `locus` scripts. Upstream workspaces and lerna packages are unchanged.

## 14 Oct 2026: Import JSCAD with full history (Ashfaq)
Merged `jscad/OpenJSCAD.org` `master` at `f245ea3a` into this repo with `--allow-unrelated-histories`, so upstream
authorship and the MIT LICENSE stay intact and visible. Upstream README kept as `README.jscad.md`; root `README.md` is Locus.
