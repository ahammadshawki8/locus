# Locus decisions log

Dated entries, newest first. Any change to `docs/contracts.md` gets a line here.

---

## 21 Oct 2026 (j): touch results of the four prototype prints (Shawki)

**What this is:** one sighted team member (Shawki) feeling the prints, eyes open or closed as they chose; **not** a test
with a blind or low-vision reader, and not a claim that learners can read the graphs (H3). Answers as given:

| Piece | Question | Answer |
|---|---|---|
| Calibration, row A (line pairs, gaps 2.0 / 3.2 / 4.0 / 6.4 / 9.5 mm) | First gap that feels like two separate lines | **4.0 mm** (2.0 and 3.2 felt like one) |
| Calibration, row B (widths 0.8 / 1.0 / 1.2 / 1.6 / 2.0 mm) | Thinnest line that is easy to follow | **1.2 mm** |
| Calibration, braille LOCUS at 0.5 and 0.8 mm | Which height is clearer | **0.8 mm** |
| Plate A (default layout, touchcheck fails) | Curve and grid merge into one ridge at the vertex | **Yes** |
| Plate A | A label is hard to find or confusing | **Yes** |
| Plate B (fixed layout, passes) | Trace the whole curve | **Yes** |
| Plate B | Find the marked points and their labels | **Yes** |
| Plate C (cubic, passes) | Feel both turning points | **Yes** |
| All plates | Braille ID and orientation triangle can be felt | **Yes** |
| All plates | Axes feel different from the curve | **Yes** |
| All plates | Anything rough, sharp or broken | **No** |

**What it means:**
1. **Agrees with the design:** braille dots 0.8 mm high (profile `fdm-handheld-v1`), curve 1.2 mm wide, axes lower and
   thinner than the curve, braille ID and triangle. Plate A fails by touch where touchcheck said it fails (TL-1 at the
   vertex, TL-2 at a label); plates B and C, which pass touchcheck, also pass this check.
2. **Against the TL-1 value:** two long parallel lines felt separate only from 4.0 mm, while TL-1 asks for 3.2 mm
   (published guidance). Plate B, whose closest gap is 3.4 mm, still traced well: a curve passing near an axis over a
   short stretch is easier than two long parallel lines.
3. **Decision: keep 3.2 mm** until after judging. Raising it now would fail graph-2-v1 and graph-3-v1 on one sighted
   person's check, three days before the freeze. The README states the finding as a limitation and names a stricter
   TL-1 for long parallel lines as the next step. Calibration Gate 7b: results recorded.

## 21 Oct 2026 (i): feature freeze; finish, polish, show (Shawki)

Shawki's decision: no new features. The video (under 3 minutes, plain words, story first) is what wins; the README
backs it with links. From now on only finishing, polishing for the camera, and the must-dos.
1. **Not built, and stays unbuilt:** the release guard (Gate 5c). The README calls it planned, never done (H3).
2. **Not run:** the regression detective (built and tested locally, never run on GitLab). The impact reviewer's real
   run on MR !9 is the "an agent protects shipped graphs" evidence. MR !9 is closed, not merged.
3. **Left to do:** touch results for the four prototype prints; camera polish of the graph page (no new behaviour);
   tidy the team project; export session evidence to `docs/evidence/`; README; the video with a fresh run where
   Nourin is the teacher (Shawki, when filming); `JUDGING_FREEZE` and all triggers off right after submitting.
4. Tier 2 (T2.1 to T2.8) is dropped.

## 21 Oct 2026 (h): Gate 5b, first half: the impact reviewer ran on a person's MR (Shawki)

1. **The person's change:** Shawki, in GitLab's web editor, removed the tick-skipping guards in `locus/core/scene.js`
   (`Simplify ticks: draw a tick at every unit`) on branch `simplify-ticks` and opened MR !9. Claude Code found the
   seed with a local `locus recheck --impact` against the two real release tags and wrote the steps; it did not push
   the change or start any flow (H6).
2. **Pipelines:** MR pipeline 2969300647 failed at `library-impact` (`LOCUS_IMPACT`: graph-2-v1 TL-1 3 mm at (85.5,
   24.4); graph-3-v1 TL-1 3.1 mm at (12, 30.1) and 0.8 mm at (16.4, 43.5); 3.2 mm needed), and at touchcheck and
   locus-test. The branch pipeline 2969300111 failed too.
3. **locus-ops started by itself** on both failed pipelines (trigger: pipeline events, failed): sessions 2969311709
   (43 s, the branch pipeline: no MR, so triage ends) and 2969312152 (158 s). The second posted the impact review on
   MR !9 as `locus-ops`: the two graphs and three failures with the numbers above, the cause read from the diff ("my
   reading of the diff, not a measurement"), the developer's two choices (fix the MR, or merge and re-layout each
   graph as v(n+1)), the job log link and the limitations line. Before anything was merged.
4. Not yet run: the regression detective (merge anyway, library-recheck fails on main, bisect, revert MR).

## 21 Oct 2026 (g): second request, hands-off from the email to the reply, session finished (Shawki)

Read from GitLab and Shawki's inbox; nobody acted after the email (H3).
1. Email (the cubic of print C, y = 0.5x^3 - 3x^2 + 4.5x + 2, x from -0.1 to 4, both turning points and the y-intercept)
   to the "Email a new issue" address with the `/assign` line: issue #3.
2. Session 9777991 (workload 2969233552, 20:09:54 to 20:19:49, success). Intake committed attempt 1 (`39a33344`) and
   opened MR !8: pipeline 2969236015 **failed** at touchcheck in 88 s (locus-test no longer runs on graph MRs). The
   fixer committed attempt 2 (`74130cd5`): pipeline 2969246084 **passed** (296 s: render took 178 s this time, against
   47 s for attempt 1). auto-merge set the MR to merge; GitLab merged it at 20:19.
3. The fixer's **pass note** arrived by email ("Your tactile graph is ready to print.", what changed and why, the
   MR link, the limitations line, the session link). Its zip and STL links download signed out (HTTP 200).
4. Main pipeline 2969261192 passed every job with no retry: release **`graph-3-v1`**, staging, validation, production,
   smoke, reply-teacher; issue #3 closed. The site lists graph-2-v1 and graph-3-v1; both pages and STLs load.
5. Open: render time varies (47 s to 178 s on the same request); if a demo session runs near its budget, look there.

## 21 Oct 2026 (f): the locus-request session on #2 timed out while waiting; graph MR pipelines made shorter (Shawki)

1. **What GitLab shows:** session 9772083 "Session failed: Session did not report a final status before its pipeline
   finished" (status "failed (dropped)" on #2). The work was right (attempt 2 passed, auto-merge merged it), but the
   fixer never posted its pass note. Its log: after the attempt 2 commit it called get_pipeline_failing_jobs on
   pipeline 2968972322 about 30 times, as its prompt says while a pipeline runs.
2. **Timings (GitLab API):** session workload 18:39:15 to 18:47:10 (472 s). Attempt 1 pipeline 18:40:46 to 18:44:49,
   attempt 2 18:43:12 to 18:47:14; in each, locus-test took 163 to 211 s of about 240. The session ended 4 s before
   attempt 2's pipeline reported success. Cause: the session's time or step budget ran out while it waited.
3. **Fix:** on a `graph/<iid>` MR, locus-test runs only if code, profiles, packages or the CI file changed; such an MR
   otherwise changes only `requests/<iid>/` (guard-scope). Every main pipeline still runs the whole suite. auto-merge
   needs locus-test as optional. Expected attempt pipeline: about 2.5 minutes (render, touchcheck, bundle, auto-merge).
4. **Also:** the reply note now has one line per paragraph (GitLab's Markdown joined the lines on #2).
5. **Found on #2 too:** GitLab does not email a person about their own actions, and reply-teacher posts with Shawki's
   token, so Shawki got no email of the reply. In the demo the teacher must be someone else: Nourin sends the request
   from her own "Email a new issue" address; then every note on the issue is emailed to her.
6. **To prove (H3):** a fresh request whose session ends with its pass note and status finished.

## 21 Oct 2026 (e): the first request went from one email to a live graph page and a reply (Shawki)

1. **Main pipeline 2969054691** (after the guard-scope fix, MR !5 merged by Shawki): guard-scope passed on main; bundle,
   publish-package and release made **`graph-2-v1`** ([release](https://gitlab.com/gitlab-ai-hackathon/transcend-october-2026/43384339/showcase/-/releases/graph-2-v1),
   "Braille ID G2", five package links; the STL downloads signed out, HTTP 200, 699,584 bytes).
2. **deploy-staging failed once:** Cloud Build e0ff0bc7 built and pushed the image ("DONE") and then reported
   `INTERNAL_ERROR`; the two builds before it, same files and settings, succeeded. Shawki pressed Retry on the job
   (a person's click, recorded here; the run before it was hands-off). The retry passed, then validate-staging,
   promote-production, post-deploy-smoke and reply-teacher. reply-teacher closed issue #2 at 19:22 UTC.
3. **Live** (read 21 Oct): https://locus-site-742642312166.us-central1.run.app/graphs/graph-2-v1/ shows Braille ID G2 and
   "passed after 2 attempts"; graph.stl, the zip and graph.svg download from the site; `/build-info.json` lists
   graph-2-v1 at commit `3f814d81`.
4. **Hardening** (branch `deploy-diagnostics`): deploy-staging retries once on a script failure, and on a failed build
   `deploy.sh` prints Cloud Build's own log into the job log. `setup.sh` now also enables Cloud Resource Manager
   (Shawki enabled it by hand on 21 Oct).
5. **For the demo:** the fresh run around 25 Oct (HANDOVER.md task 6) must be hands-off end to end; with the retry it
   should not need a click. If it still does, say so.

## 21 Oct 2026 (d): first request in the team project ran hands-off to a merge; guard-scope then blocked main (Shawki)

1. **The run (H3: read from GitLab, nobody touched it after the email):** Shawki emailed the project's "Email a new
   issue" address with `/assign @ai-locus-request-gitlab-ai-hackathon_b127f8`. Issue #2 appeared assigned to the flow;
   its session ran as pipeline 2968962168 (`refs/workloads/...`, success). Intake committed attempt 1 (`b6022b42`) on
   `graph/2` and opened MR !4: pipeline 2968966165 **failed** at touchcheck (the default layout), and bundle and
   auto-merge were skipped. The fixer committed attempt 2 (`75dc9050`: grid hidden, vertex label above the vertex,
   y-intercept label left of the y-axis): pipeline 2968972322 **passed** every job, and `auto-merge` set the MR to
   merge when the pipeline succeeds. GitLab merged !4 on its own (`f6bfda0d`).
2. **Blocked:** main pipeline 2968984338 failed at **guard-scope**, so nothing was released. guard-scope had never
   run on a merged request: on main it saw the agent's two commits and said "locus-request may commit only on
   graph/<iid>". GitLab also credits the merge commit to the MR's author, `locus-request`.
3. **Fix** (`locus/guards/scope.js` `checkDefaultBranch`, `git.js` `listFirstParent`): on the default branch each merge
   is checked by the rules of the branch it names ("Merge graph/2: ..." from auto-merge, or GitLab's "Merge branch
   'x' into 'main'"); an agent-credited merge passes only when it merges an agent branch; an agent commit straight on
   main still fails. Run locally on the real history: `guard scope --base a5ccd71c --head f6bfda0d --branch main`
   passes (3 agent commits, all in their allowed files). 260 of 260 tests pass.
4. **Next:** merging this fix starts a new main pipeline; `bundle` picks up request 2 (no release tag yet), so it
   should release `graph-2-v1`, deploy it and reply on #2.

## 21 Oct 2026 (c): contracts D8 and §9 changed, both agreed (H5)

1. **D8:** Ashfaq proposed it on 20 Oct (g); Shawki agreed on 21 Oct. The contract now says what ran four times: the
   fixer reads the `LOCUS_REPORT` line from its own attempt's touchcheck job log and commits with `create_commit`; no
   flow runs a command. Giving the fixer `run_command` would need a clone, `agent-config.yml` and new runs before the
   freeze, for no visible gain.
2. **§9 `production-revision`:** Shawki proposed it on 20 Oct (i) item 6 and agreed on 21 Oct; Ashfaq to confirm (he is
   on call for Phase 1 code, and this touches only Shawki's side). `UNSET` lets each validated release reach
   production (hands-off); a revision name pins production for a rollback. Built that way in `deploy/gcp/deploy.sh`.
3. `docs/contracts.md` D8 and §9 are edited to match; nothing else in the contract changes.

## 21 Oct 2026 (b): locus-request created in the team project (Shawki)

1. Shawki created the custom flow in the team project (Flows > New flow): display name `locus-request`, visibility
   Private, the YAML of `.gitlab/duo/flows/locus-request.yml` pasted unchanged. Enabled with the triggers **Mention**
   and **Assign**; "Assign reviewer", offered by default, was removed (it would start intake on an MR).
2. GitLab named its service account **`ai-locus-request-gitlab-ai-hackathon_b127f8`** (read from the members page): the
   group already has Ashfaq's test-bed account without the suffix. The issue template's `/assign` now names it, and
   its test accepts the `_<hex>` suffix. Role: Developer, combined with the triggering person's role.
3. Not run yet in the team project (H3).

## 21 Oct 2026 (a): Google Cloud set up; the first default-branch pipeline deployed the site (Shawki)

1. **Google Cloud** (`deploy/gcp/setup.sh`, run by Shawki in Cloud Shell on 20 Oct): project `locus-tactile-2026`
   (number 742642312166) in Shawki's organisation `ahammadshawki8-org`. The first link to the billing account failed
   with `INVALID_ARGUMENT` because the project had been created outside the organisation that owns the billing
   account; moving it in fixed that. Second run: a new service account was not yet visible to IAM, so the script now
   retries the IAM steps and also enables Compute Engine (Cloud Run runs as its default service account). Workload
   Identity Federation accepts only our project's protected `main`. Budget "Locus", 5 USD.
2. **Merged:** `release-side` into the team project's `main` (`96aa4890`), by Shawki through an MR.
3. **[Pipeline 2968850266](https://gitlab.com/gitlab-ai-hackathon/transcend-october-2026/43384339/showcase/-/pipelines/2968850266)
   passed every job,** among them license-check, publish-package, release, site, deploy-staging, validate-staging,
   promote-production, post-deploy-smoke and reply-teacher. With no request on `main` yet, publish-package, release
   and reply-teacher had nothing to do, so they are shown working only once a real request is merged.
4. **Live:** https://locus-site-742642312166.us-central1.run.app (read 21 Oct): the library page says no graph has
   been released yet, and `/build-info.json` names commit `96aa4890` and pipeline 2968850266. Gate 6b passed.
5. **Not run yet (H3):** `auto-merge`, a real release and package, a graph page, the reply note, a rollback.

## 20 Oct 2026 (i): the release side is built; tokens and permissions; two contract proposals (Shawki)

1. **Our role** (onboarding email, read by Ashfaq): custom role Developer+ = Developer plus Manage AI catalog items,
   Configure AI catalog items, **Manage CI/CD variables**, **Manage merge request settings**, Manage webhooks, Manage
   Terraform state, Link security policy projects. Not included: project access tokens (Settings > Access tokens is a
   404 for Shawki).
2. **GitLab's answers to other teams** (Discord, Mattias, pasted by Shawki): "Project access tokens are not available
   in the hackathon workspace"; for auto-merge "a flow or CI job can call the MR accept API. Use a personal access
   token stored as a masked CI/CD variable. CI_JOB_TOKEN does not have sufficient scope"; "PAT-authored requests are
   attributed to that user"; "Fully autonomous with self-freeze/rollback policy: yes, that fits the Hands-off
   definition". Shawki also asked Mattias on 20 Oct; no answer yet.
3. **Decision: `LOCUS_GITLAB_TOKEN`.** Shawki made a legacy personal access token (scope `api`, expires 30 Nov 2026)
   and saved it as a masked and hidden, unprotected CI variable (HANDOVER.md section 7). Only `auto-merge` and
   `reply-teacher` use it. Everything else uses `CI_JOB_TOKEN`. The README must say that these two calls show as
   Shawki, and the reply note starts "Automated message from the Locus pipeline". Rejected: a token kept in Google
   Secret Manager (same account, more parts) and releasing from the unmerged MR.
4. **Built (tests first; 256 of 256 pass locally; nothing has run on GitLab yet, H3):**
   - `license-check` (`locus/release/license.js`): every Locus runtime dependency is MIT, ISC, BSD or Apache-2.0.
   - `auto-merge` (`locus/release/auto-merge.js`): on a `graph/<iid>` MR in hands-off mode, the merge API with
     `auto_merge` pinned to the pipeline's commit; GitLab merges when the whole pipeline succeeds. `allow_failure`, so
     a failure never reads to the fixer as a touch failure.
   - `publish-package` and `release` (`locus/release/release.js`): generic package `locus-graphs/graph-<iid>-v<n>/`,
     then tag and release `graph-<iid>-v<n>` on that commit with the package links; the released manifest has
     `releaseTag` filled in. Job token only.
   - `site` (`locus/site/build.js`): the library page, `/graphs/<artifactId>/` and `/build-info.json`, from the
     released package files, refusing any file whose sha256 differs from its manifest.
   - `deploy-staging`, `validate-staging`, `promote-production`, `post-deploy-smoke` (`deploy/gcp/deploy.sh`,
     `locus/site/validate.js`): Cloud Run service `locus-site`, keyless login through Workload Identity Federation.
   - `reply-teacher` (`locus/release/reply.js`): the contracts §8 note, then the issue is closed.
   - `deploy/gcp/setup.sh`: the one-time Google Cloud setup, for Shawki to run in Cloud Shell.
   - Every one of them does nothing while `JUDGING_FREEZE=true`.
5. **Proposal A, contracts D8 (needs both, H5):** go back to the wording that matches the four runs: the fixer reads
   the `LOCUS_REPORT` line from the touchcheck job log and commits with `create_commit`. Ashfaq agrees (20 Oct (g)).
   Shawki: pending.
6. **Proposal B, contracts §9 `production-revision` (needs both, H5):** "`UNSET`: production follows the newest
   revision that passed `validate-staging`. A revision name: production is pinned there (a rollback); new releases
   are still built and checked on staging, but production does not move until a person sets it back to `UNSET`." The
   release guard's rollback stays a one-line MR, and no CI job ever commits. `deploy-production-pointer` becomes part
   of `promote-production`. Built this way; pending agreement.

## 20 Oct 2026 (h): handover received; both merges done; Windows checkouts use LF (Shawki)

1. **Merges:** [PR 1](https://github.com/ahammadshawki8/locus/pull/1) merged into the working repo's `main` with a merge commit (`fc267a6f`). [MR !1](https://gitlab.com/gitlab-ai-hackathon/transcend-october-2026/43384339/showcase/-/merge_requests/1) merged in the team project: `main` at `df01ab9e`, [pipeline 2968472746](https://gitlab.com/gitlab-ai-hackathon/transcend-october-2026/43384339/showcase/-/pipelines/2968472746) passed (read from the GitLab API).
2. **Seen working:** Ashfaq showed Shawki the agents running in his test bed (the runs listed in `HANDOVER.md` section 2).
3. **Local checks on Shawki's machine (Windows, Node 24):** `npm --prefix locus ci`, then `npm run test:locus`: 233 of 233 pass; `node locus/flows/check.js`: exit 0; `npm run locus -- touchcheck examples/projectile.json`: fails TL-1 and TL-2 with a `LOCUS_REPORT` line and `overlay.svg`, exit 1, as designed.
4. **Line endings:** on the first run, 2 tests failed on Windows only (`production-revision` and the issue template quick actions), because Git turned LF into CRLF in the working copy. `.gitattributes` now says `* text=auto eol=lf`, so every checkout matches CI. The repo contents do not change.
5. **Still open:** contracts D8 (20 Oct (g) item 3).

## 20 Oct 2026 (g): Shawki's 16 to 19 Oct work merged into the branch; contracts D8 no longer matches the code (Ashfaq)

1. **Merge:** the working repo's `main` (`6d77f814`, three commits by Shawki: 9be54757, 993b6af8, 6d77f814) is merged
   into `feat/gate2-render`, so PR 1 and the team project's MR !1 carry both sides and have no conflicts. Nothing of
   either side was dropped: Shawki's 19 Oct and 16 Oct entries are kept word for word in date order; his S.3 board
   (written from the 16 Oct board) is folded into the 20 Oct one (onboarding done, credits working, all four prints
   done, the A/B/C touch questions, enabling Secret FP Detection and Breaking Change Resolution, his handover checks as
   S.3 Next items 4, 15 and 16). His 16 Oct entry holds the same GitLab answers as 20 Oct (c); his is the earlier
   record.
2. **Contracts §10:** Shawki already replaced "Still waiting on GitLab" with "GitLab's answers (16 Oct)", so the
   proposal of 20 Oct (c) item 7 is already in the contract in his words.
3. **Contracts D8 does not match the code (H5, both must agree).** Shawki's 16 Oct D8: "The fixer runs `touchcheck`
   itself in the flow (`run_command`), edits `layout.json` (`edit_file`) and commits each attempt with
   `create_commit`. The `LOCUS_REPORT` log line (§4) stays as the audit record and fallback." The flow that ran four
   times (#3, #5, #6, #7) does what the old D8 said: it reads the `LOCUS_REPORT` line from the touchcheck job log and
   commits with `create_commit`; it has `coding_environment: none` and no command or file tools, and `check.js`
   rejects `run_command` as IDE only (20 Oct (c) item 4 decided to change nothing before 27 Oct). Neither side is
   edited here. **To agree:** either D8 goes back to the old wording (it describes what ran), or the fixer gets
   `run_command` and `edit_file` (needs a clone, `agent-config.yml`, `check.js` changes and new runs before the
   freeze). Ashfaq's view: the old wording, because it is what the evidence shows.
4. **Team project:** MR !1's first pipeline (2968423176, on `locus/import` at `1701f81e`) passed every job: render,
   touchcheck, the three guards, bundle, library-impact, locus-test, upstream-test on Node 20 and 22.

## 20 Oct 2026 (f): no live runs during judging; triggers off at the deadline; handover to Shawki (Ashfaq)

No change to `docs/contracts.md`.
1. **GitLab's answer** (Discord, asked by the team whether event-driven flows may stay on after 27 Oct 13:00 UTC so a
   judge can see them work; pasted by Ashfaq): "Switch your triggers off at the deadline. The submitted repository
   must stay unchanged until winners are announced - if a flow fires when a judge opens an MR, it could create new
   commits in the repo, which puts your eligibility at risk. Document the flows working in your demo video and README
   instead. That is sufficient evidence for judges." Licensing and app-scope questions are Devpost's to rule on (the
   Devpost forum or the organisers), not GitLab's.
2. **Decision:** no live runs during judging, in this repo or a separate requests repo (considered the same day and
   dropped). At the deadline every flow trigger is switched off (`HANDOVER.md` section 14; Part VII). Judges get the
   recorded runs (issue #7, MR !5 and the rest), the download links of those runs, and the local commands. A browser
   page that runs render and touchcheck without any repo change stays an option for Shawki's site, not a plan.
3. **Bundle artifacts kept 90 days** (`.gitlab-ci.yml`, was 30): the pass note and the README link them, and 30 days
   from a 25 Oct run would end before the winners may be announced. Whether GitLab keeps the latest artifacts of a ref
   regardless is not visible to a Developer, so it is not relied on. Applies to pipelines run with this file only.
4. **README** status (it still said, on 16 Oct, that the flows and guards were not built, which is no longer true) and
   a "See it working" section with the #7 links. The README is Shawki's to polish.
5. **Questions not asked:** a list of six further questions for GitLab (service-account triggers, merge pattern,
   starting flows from CI, credits budget, MCP servers, whether autonomous rollback is Hands-off) was reviewed and not
   posted: the first, second and fourth are answered (15 Oct (a), 20 Oct (c)), the third and fifth are about things
   Locus does not use, and the sixth is a Devpost question that matters only if the release guard is built.
6. **Handover:** `HANDOVER.md` section 0 lists Shawki's tasks in order, section 13 the steps to set up the agent in the
   team project, section 14 the freeze. `docs/how-it-works.md` explains the flow in diagrams without code, with three
   ways to test it.
7. **MR !1 in Shawki's Showcase** (Ashfaq asked for a merge request Shawki can start from): commit `1701f81e`, whose
   tree is exactly `feat/gate2-render` at `f75c756a` and whose parents are that commit and the project's first commit
   `f83d9336` (the organisers' template README), pushed as branch `locus/import`;
   [MR !1](https://gitlab.com/gitlab-ai-hackathon/transcend-october-2026/43384339/showcase/-/merge_requests/1) into
   `main`, reviewer Shawki. Merging it is a fast-forward and is S.3 Next item 0. No flow is enabled there, so no agent
   runs until Shawki sets one up. The project's `main` was not touched.

## 20 Oct 2026 (e): the email-to-files demo ran: one email, no comment, print files back (Ashfaq ran it)

No change to `docs/contracts.md`. Ashfaq re-pasted `locus-request.yml` (as of `eaf06941`; his report) and sent one
plain-text email; everything below was read from GitLab, git and a signed-out download afterwards. Claude Code
started nothing and changed nothing in the run (H6); it watched through the API, read-only.

1. **14:00:57 UTC issue #7** "Tactile graph: projectile", created from Ashfaq's email to his personal "Email a new
   issue" address: type issue, author Ashfaq909, not confidential. The description is the email body without its last
   line: the `/assign` quick action was applied ("assigned to @ai-locus-request-gitlab-ai-hackathon" by Ashfaq909 at
   14:00:57.9) and removed from the text.
2. **The assign at creation fired the Assign trigger:** 14:01:03
   [session 9753341](https://gitlab.com/gitlab-ai-hackathon/transcend-october-2026/43396940/showcase/-/automate/agent-sessions/9753341)
   "triggered by @Ashfaq909". **So one email starts the flow with no comment** (20 Oct (d) item 6: the fallback was
   not needed). The issue template's `/assign` uses the same quick action; the template itself has still not run.
3. **Intake** (14:01:59): commit `22cbd4b8` on `graph/7` from `820fd236`, author and committer `locus-request`,
   `Locus-Session` trailer; only the three request files; spec coeffs [0, -0.5, 2, 1], domain -0.5 to 4.5, marks
   vertex and y-intercept; the default layout. MR !5. The intake note read the request right (the vertex at x = 2).
   A local run of that spec with requestId 7 on `820fd236`, made before the email, failed TL-1 and TL-2 at attempt 1
   and passed with print B's layout.
4. **Attempt 1:** pipelines 2967886587 (push) and 2967886911 (MR) failed.
5. **Attempt 2** (14:04:55): commit `bc49410a`, `requests/7/layout.json` only: `showGrid` false (TL-1),
   `labelOffsets` vertex [0, 12] and y-intercept [-12, 4] (TL-2); one sentence per change, trailer. **MR pipeline
   2967900651 passed all 7 jobs** (render, touchcheck, guard-scope, guard-maths, guard-description, bundle, locus-test).
6. **14:09:26 the pass note**, exactly the new shape: "Your tactile graph is ready to print.", the zip link and the STL
   link for `refs/merge-requests/5/head`, "Checks passed: TL-1 to TL-5 (after 2 attempt(s))", "Braille ID on the
   plate: G7", what changed, the MR, the limitations line, the session. Session completed. **About 8.5 min from email
   to files.**
7. **Both links, downloaded signed out:** zip 200, 164775 bytes, the 7 contract files; STL 200, 726784 bytes, the same
   file as in the zip. Manifest: `graph-7-v1`, `G7`, `sourceCommit` `bc49410a`, pipeline 2967900651, touchcheck pass
   after 2 attempts, all three guards true, `agentSessions` = [session 9753341]; the hashes of graph.stl, graph.svg and
   description.txt match the files.
8. **Where the email went:** GitLab sent the notifications (for example "locus-request pushed new commits to merge
   request !5") to the notification address of Ashfaq's GitLab account, not to the mailbox the request was sent from
   (Ashfaq's report). That is how this route works: the issue belongs to the account. To answer the sending mailbox,
   make it the account's notification address, or use Service Desk (which answers the sender but needs one comment).
9. **The STL is closed, like the prototype prints:** read by exact float32 position, no edge is unmatched (no hole);
   13 edges are shared by four triangles (surfaces touching) and 4 have zero length. stl.js's `countOpenEdges`
   (4 decimals) counts 17, and it counts 41, 11 and 17 on the printed plates A, B and C, so this is the same class of
   mesh as the plates that printed. The test bed `main` still has the old renderer; the 20 Oct (b) fallback is not in
   this run.

**After the run, test bed `main` brought up** (Ashfaq's go-ahead, 20 Oct): merge commit `b011f52c` (parents `101adca2`
and the old `main` `820fd236`, tree exactly `feat/gate2-render`), pushed as a fast-forward. Pipeline 2968090159: all
10 jobs that ran passed (library-recheck passed with no shipped graph; bisect-regression skipped). New requests now
branch from it: the render fallback, the issue template and the new flow comments. The flow prompt itself lives in the
AI Catalog (pasted as of the pass-note change).

**Next to try, Service Desk from any address** (Ashfaq asked for replies to any requester): the ticket's author is the
Support Bot, so it cannot start a flow by itself (15 Oct (a) B; a personal token in CI was rejected there). A person's
reply by email to GitLab's new-ticket notification posts a comment as that person; with the mention line it should
start the flow, and Service Desk then emails every note, the links included, to the sender. Not run yet.

**What this proves and what it doesn't (H3):** a person sends one email and, with no other human step, gets a
touch-checked, guard-checked print file back by email in about 8.5 minutes, made and fixed by the agent alone. It
needs the sender to be a project member (a teacher without an account uses Service Desk plus one comment). Nothing
was merged, released or deployed (Shawki's S.4 steps 6 to 8), and it does not show that a learner can read the plate.

## 20 Oct 2026 (d): email in, print files back by email: the pass note carries the download links (Ashfaq)

No change to `docs/contracts.md`, the touch rules, the profile or `remedies.json`. Not run on GitLab yet (H3).
Ashfaq's goal for the demo: a teacher sends one email and gets the print-ready files back by email. Everything up to
a passing bundle already ran (#5, 16 Oct (o)); the missing part was getting the files to the requester.

1. **The pass note now starts with the files** (`locus-request.yml` fixer step D, tested in `locus/flows/check.test.js`):
   "Your tactile graph is ready to print.", a link to the whole bundle zip ("print at 100% scale"), a link to the STL
   alone, "Checks passed: TL-1 to TL-5 (after k attempt(s))" and "Braille ID on the plate: G<n>"; then what changed,
   the MR, the limitations line and the session. The intake note now says a download link follows when the checks pass.
   Service Desk emails every note on a ticket to the requester (16 Oct (o) item 7), so the email carries the links.
2. **The links** are the bundle job's artifacts, read through the API by the MR pipeline's ref:
   `https://gitlab.com/api/v4/projects/<project id>/jobs/artifacts/refs%2Fmerge-requests%2F<MR iid>%2Fhead/raw/out/bundle/graph-<n>-v1.zip?job=bundle`
   (and `.../graph-<n>-v1/graph.stl?job=bundle`). The agent builds them from the project id, the MR iid and the issue
   number; it has no tool that lists a pipeline's jobs, so a job-id link is not possible. **Read without signing in
   on 20 Oct:** graph-5 (MR !3) zip 200, 190429 bytes, holding the 7 contract files with manifest `graph-5-v1`; its STL
   200, 832484 bytes; graph-3 (MR !1) zip 200, 169493 bytes, STL 200, 749584 bytes. The same URL by branch name
   (`graph%2F5`) is 404, because a branch with an open MR runs MR pipelines only (`workflow:rules`). No new job and no
   token (H8).
3. **Limits (H3):** the version is always `v1` here, because `bundle` counts release tags and no release job exists;
   once Shawki's release job makes tags, the reply should link the release instead (contracts §8, `reply-teacher`).
   The bundle artifacts expire 30 days after their pipeline, so re-run the demo around 25 Oct (Part VII) to keep them
   through judging. The MR is not merged, released or deployed: S.4 steps 6 to 8 stay Shawki's (and item 13).
4. **Two ways in by email:**
   - **Service Desk (ran, #5):** any address mails the project's `incoming+...-issue-@incoming.gitlab.com` address; a
     ticket appears and one person comments `@ai-locus-request-gitlab-ai-hackathon please make this graph.` The notes,
     with the links, come back from the Support Bot.
   - **"Email a new issue" (not run yet):** a project member mails their personal address (Issues page, "Email a new
     issue to this project"). GitLab's [docs](https://docs.gitlab.com/user/project/issues/create_issues/) say the issue
     is created "with your user as the author" and "You can use Markdown and quick actions", so a body that ends with
     `/assign @ai-locus-request-gitlab-ai-hackathon` would assign the bot by that person's own action, with no comment
     needed. Not shown yet: that the quick action is applied and fires the assign trigger. The notes come back as
     GitLab notification emails (as for #4, 16 Oct (o)). The address holds a personal token: never write it in the
     repo, a commit or a log (H8).
5. **Ashfaq must paste `locus-request.yml` into the AI Catalog again** (this and 20 Oct (b) item 3 together).
6. **The demo uses the no-comment way** (Ashfaq's choice, 20 Oct): "Email a new issue" with the `/assign` line. The
   [triggers page](https://docs.gitlab.com/user/duo_agent_platform/triggers/) says Assign fires "When the service
   account user is assigned to an issue or merge request" and does not say whether an issue created with an assignee
   counts, so the first email decides it. **Fallback**, only if no session starts: switch on the flow's "Work item
   created" trigger ("When a work item is created") and send the next email without the `/assign` line, so that one
   issue never starts two sessions. A Service Desk ticket cannot start a flow by itself in either way: its author is
   the Support Bot, and "All trigger event types require a human user to perform the triggering action".

## 20 Oct 2026 (c): GitLab's answers to Shawki's Discord questions: team access, credits, CI tools, merging (reported by Ashfaq)

No change to `docs/contracts.md` (H5). Shawki asked these on Discord; Ashfaq pasted the thread on 20 Oct. The message
dates and a link were not given. They answer four items of S.3 "Waiting on GitLab" (asked 15 Oct (b) D3).
1. **Team project access.** GitLab first found Ashfaq and Nourin not provisioned, then each got their own workspace
   (Ashfaq's is the test bed, `.../43396940/showcase`), and GitLab then "added them to your Showcase project with the
   Developer + AI role". Shawki asked whether the group-name casing in the registration form ("SrotDev" against
   "Srotdev") caused the delay; there is no answer to that. **Read the same day (REST, as Ashfaq909):** Ashfaq is a
   Developer (access level 30) on Shawki's project `.../43384339/showcase` (project 87666718). That project's `main` is
   protected and holds only the organisers' "Initial commit" (`f83d9336`, README only), so S.3 Next item 0 is still
   open; as a Developer, Ashfaq cannot push `main` there.
2. **Credits in Duo Chat.** Set the Default GitLab Duo group in [preferences](https://gitlab.com/-/profile/preferences)
   to the **Transcend October 2026** subgroup (`gitlab-ai-hackathon/transcend-october-2026`), not the parent "GitLab AI
   Hackathon" group. Shawki had picked the parent and still saw "No credits remain". Whether it now works is Shawki's
   to report.
3. **Credits for triggered flows:** "triggered flows run as the flow's service account. The service account does not
   have personal credits - its consumption is billed at the namespace level, separately from your personal
   allocation. We cannot confirm the size of the namespace-level pool for this hackathon." This fits 16 Oct (m)
   (nothing on Ashfaq's Credits page after runs). It refines 15 Oct (a) ("credits are personal"): personal credits
   cover a person's Duo use, not flow runs. **Risk kept:** the pool size is unknown, so a run could still stop for
   lack of credits during the demo or judging; re-run the demo early (around 25 Oct, Part VII) so a failure shows in
   time.
4. **`run_command`, `edit_file`, `read_file` in CI flows:** GitLab says "these tools are available in flows running on
   CI". The [tools page](https://docs.gitlab.com/user/duo_agent_platform/agents/tools/) marks them IDE only, and
   `locus/flows/check.js` rejects them for that reason (16 Oct (g)). **Not shown in our account (H3).** Decision:
   change nothing now. The flows read `LOCUS_REPORT` from job logs (contracts D8, three real runs), run with
   `coding_environment: none`, and would need a clone, an image with Node and `npm ci` (that is, `agent-config.yml`)
   before a command could run touchcheck. That is too much new surface before 27 Oct. So 20 Oct (b) item 2 stands, but
   its reason is now "no flow uses commands", not "commands are IDE only". If a probe run ever shows `run_command`
   working, `check.js` and that decision are reopened together.
5. **Merging:** "a flow can call the GitLab merge request API to accept an MR. There is no dedicated merge tool". No
   tool in the flow registry does this, so it would take a command with a token in the flow (H8). Decision: keep the
   deterministic `auto-merge` CI job (contracts D7, S.4 step 6); who builds it is still S.3 Next item 13.
6. **Foundational flows:** Secret False Positive Detection and Breaking Change Resolution "are available in the AI
   Catalog" and are enabled from AI > Flows like the others. Optional (T2.9, early in the cut order, §15.5); enabling
   them in the team project is Shawki's call.
7. **Proposed contracts §10 change (both must agree, H5):** "Still waiting on GitLab" lists credits for triggered
   flows and whether flows can merge. Proposed: "Answered (`docs/decisions.md` 20 Oct (c)): triggered flows bill the
   namespace, pool size unknown; flows can merge only through the API, so `auto-merge` stays a CI job."
8. **When the flows move to the team project** (after item 0): each flow is created there again, with exactly the
   display names in `locus/guards/agents.json`. Its service account may get another name than the test bed's
   `ai-locus-request-gitlab-ai-hackathon`. If so, the template's `/assign` line and its test change with it.

## 20 Oct 2026 (b): issue template, no agent-config.yml, per-rule refusal suggestions, and a manifold fallback for render (Ashfaq)

No change to `docs/contracts.md`, the touch rules, the profile or `remedies.json` (H7). Nothing here has run on
GitLab yet (H3).

1. **Issue template** `.gitlab/issue_templates/graph-request.md` (tested by `locus/issue-template.test.js`): three
   parts in plain words (function, x range, points to mark, in the words intake already maps to marks), a line asking
   for no names or personal details, then `/label ~locus-request` (contracts §7) and
   `/assign @ai-locus-request-gitlab-ai-hackathon`. **Decision:** the template starts the flow by **assign**, the
   trigger that ran on #3 and #6, not by "work item created", which would start `locus-request` on every new issue in
   the project (intake would then ask a needs-info question on issues that are not requests). Not shown yet: that a
   quick-action assign at creation fires the assign trigger, and that `/label` works (the test bed has no
   `locus-request` label yet; what `/label` does with a missing label is not checked, so the label is created first). The hints in the
   template's HTML comments hold no numbers, because the raw issue text, comments included, is what intake reads.
   GitLab reads templates from the default branch, so it can be tried only after the template reaches test bed `main`.
   S.4 step 1, the §6b table, §8 and the flow's header comment now say this.
2. **`.gitlab/duo/agent-config.yml` is dropped** (plan §7.1 listed it: Node image, `npm ci`, cache, network
   allowlist). [GitLab's page](https://docs.gitlab.com/user/duo_agent_platform/flows/execution/agent-config-yaml/)
   says it "configures how flows execute in CI/CD" (image, setup_script, network_policy, cache), and the
   [execution page](https://docs.gitlab.com/user/duo_agent_platform/flows/execution/) says `setup_script` commands
   "have access to all environment variables in the flow, including the triggering user's OAuth token". Every Locus
   flow is `coding_environment: none` with GitLab API tools only (`run_command` and the file tools are IDE only, 16 Oct
   (g)), so nothing in a flow would use the image, `npm ci` or the cache, and three real runs worked without the file.
   Adding it would put a setup script next to that token for no benefit. Neither page says what the file does for a
   flow with `coding_environment: none`; if a flow ever needs commands, this decision is reopened. The §6b sentence
   "`agent-config.yml` limits network access" is replaced by what is true: no flow runs a command.
3. **Refusal suggestions per rule** (17 Oct (b): the #6 note led with generic suggestions that could not help a
   tangent touch). The refuse prompt now has one suggestion per rule (TL-1: a curve that crosses an axis instead of
   only touching it, or stays clear of the axes; TL-2 and TL-3: fewer or more widely spaced marked points; TL-4: points
   inside the x range; TL-5: a shorter x range or a smaller spread of values) and asks for those of the rules that
   still fail only. Tested in `locus/flows/check.test.js`; `check.js` passes. **Ashfaq must paste
   `locus-request.yml` into the AI Catalog again** for it to take effect; until a refusal runs, it is untested on GitLab.
4. **render: manifold fallback for open meshes** (S.3 Next item 12). The JSCAD repair (16 Oct (n)) is kept and runs
   first, so every request it closes, prints A, B and C among them, gives exactly the old bytes (`core/prints.test.js`
   passes; contracts D3). Only when it throws "mesh still has N unpaired edges" does render pass **the same JSCAD
   parts** (`toParts` in `core/geometry.js`; `toSolid` is still their union) to
   [Manifold](https://github.com/elalish/manifold) (`manifold-3d` 3.2.1, Apache-2.0, pinned exactly: the newest
   version with no dependencies of its own; 3.3.0 and later pull in about ten). Manifold unions them, cuts the result
   to the plate's footprint when it sticks out (as `clipToPlate` does), and returns a closed mesh; stl.js writes it.
   Manifold's WebAssembly loads only asynchronously, so it runs in a child process (`core/manifold-worker.mjs`) and
   render stays synchronous for every caller. render returns `mesh: "jscad" | "manifold"` and the CLI logs the
   fallback, so a render job says which step closed the STL. No change to `scene.json`, so touchcheck results do not
   change. If the fallback also fails, render throws as before (and a flow run ends BROKEN).
   - Found first: a seeded sweep (scratch script, not in the repo; degree 1 to 3, coefficients -2 to 3 in steps of
     0.5, domains of 2 to 5 units from -3 to 0, the default layout, grid on and off) failed **10 of 240** renders (4.2%)
     with the old code. On all 10, Manifold's union of the parts is closed, with a volume within 0.1% of JSCAD's union
     of the same parts. Prints A, B and C through Manifold give JSCAD's volume to 0.01 cubic mm (checked once; they
     never take this path).
   - Tests (`core/render.test.js`): prints A and B take the JSCAD path; five requests from the sweep (1, 117, 7, 31
     and 188 open edges; one far taller than the plate, two steep cubics with pinches) take the fallback and give a
     closed STL inside the plate, within 1% of the JSCAD volume; the fallback gives the same bytes twice.
   - **Two things that are fine in Manifold's mesh are open edges in an STL**, which holds float32 positions only
     (stl.js's `countOpenEdges` compares them to 4 decimals): a zero-length edge (two vertices one edge apart that
     float32 cannot tell apart; collapsed on output, dropping the triangles that vanish), and a pinch (surfaces that
     touch along a line or at a point, for example a steep cubic's outline touching itself; there an edge is shared by
     four triangles). Each pinch is fused with a filler 0.02 mm wide, far below what a printer makes (layers are about
     0.1 mm), like the sliver filler of 16 Oct (n); at most 3 rounds. Found because the first version of the fallback
     still left 3 of the 10 open (1, 1 and 43 edges); Manifold's own `simplify(1e-4)` did not remove them and was
     dropped.
   - **Sweep result:** the generator above with two seeds, 480 renders: 12 (2.5%) fail on the JSCAD path, and **all 12
     now render a closed STL through the fallback** (0 open edges). The other 468 take the JSCAD path, unchanged.
     This does not show that every request renders: the sweep covers the default layout only, and a fixer's layout can
     still fail; then render throws, as before.
   - This changes `locus/core/**`, a `library-impact` path; no graph has shipped, so there is nothing to re-check.
   - **CI:** pipeline 2967480283 (test bed, push of `e6d42a4e` to `feat/gate2-render`, `node:20`): all 9 jobs passed;
     `npm --prefix locus ci` installed `manifold-3d`, and `locus-test` passed 232 of 232, the fallback tests included.
     Test bed `main` is still `820fd236`, so flow runs there still use the old renderer.

## 20 Oct 2026 (a): GitLab's answer on the two Service Desk questions (Discord, reported by Ashfaq)

No change to `docs/contracts.md`. The questions were asked on 17 Oct (c); Ashfaq pasted the reply on 20 Oct. No link
to the message was given.
1. **`contact-project+` address:** "mail to the contact-project+<token>@gitlab.com address only creates a ticket if
   Service Desk is enabled for that project and the token matches exactly. Check Settings > General > Service Desk to
   confirm it is enabled and that you are using the exact address shown there." Read the same day (GraphQL, as
   Ashfaq909): `serviceDeskEnabled` is true, and `serviceDeskAddress` is a `contact-project+...-issue-@incoming.gitlab.com`
   address, the one we mailed twice on 16 Oct (o). That is not the `contact-project+<token>@gitlab.com` form in the
   answer, so the Settings page may show another address. Ashfaq is a Developer on the test bed and Settings needs
   Maintainer, so it is not checked (H3).
2. **Assigning a flow's service account to a ticket:** "we have not confirmed whether a flow service account can be
   assigned to a Service Desk ticket. If assignment fails, share the exact error and we will investigate." The exact
   error is in 16 Oct (o) item 4: "Cannot assign @ai-locus-request-gitlab-ai-hackathon to #4".
3. **What changes:** nothing that works. S.4 step 1 (the `incoming+` address, then a person's mention) and the flow's
   header comment stay; no re-paste is needed for this answer. S.3 "Waiting on GitLab" now holds the follow-ups:
   whether the Settings page shows a different address, and GitLab's look at the assign error once Ashfaq sends it.

## 19 Oct 2026: team provisioned, Duo credits working, plates printed

- All three members (Shawki, Ashfaq, Nourin) are now in one hackathon group, after each was first given a separate workspace on 16 Oct.
- Duo credits now work for the team. The 16 Oct "No credits remain" problem is closed.
- Consequence: Gate 5 no longer has to run in Shawki's account. Ashfaq runs it in the shared project with his own account.
- Prototype plates A, B and C are printed, so all 4 prototype prints exist (H9). Their touch results go in a later entry.
- Still unknown: the size of the namespace credit pool for triggered flows. Gate 5 records the use of one session.

---

## 17 Oct 2026 (c): flow re-pasted, Discord questions asked, practitioner booked (reported by Ashfaq)

No change to `docs/contracts.md`. All three are Ashfaq's report; none can be read from git.
1. Ashfaq pasted `.gitlab/duo/flows/locus-request.yml` at `caa3a884` into the AI Catalog entry `locus-request` and
   saved it; it is still enabled with `ai-locus-request-gitlab-ai-hackathon` and its triggers. The change was the
   header comment only, so no run is needed to check it.
2. Ashfaq asked GitLab on Discord why Service Desk mail to the `contact-project+` address creates no ticket, and why
   a flow's service account cannot be assigned to a Service Desk ticket (16 Oct (o)). No answer yet.
3. **Gate 4:** a practitioner is booked; the conversation has not happened yet. Notes go in `docs/` afterwards,
   with no personal data (§15.4); the open questions for them are in 14 Oct (TL-1 shallow crossings, braille table).
   Not done: the Credits page after the 17 Oct run; the message to Shawki about S.3 Next items 0, 6 and 13.

## 17 Oct 2026 (b): the refusal path ran: 3 attempts, then cannot-make-readable, nothing released (Ashfaq ran it)

No change to `docs/contracts.md`. Every step below was read from GitLab, the job logs and git after it happened;
Claude Code started no flow and changed nothing in the run (H6). The request is the one chosen in 17 Oct (a) item 5.

1. 05:55:31 UTC Ashfaq filed issue **#6** "Tactile graph: parabola touching the axis" ("Please make a tactile graph
   of y = (x - 1)^2 for x from -0.5 to 2.5. Please mark the lowest point and where the curve crosses the y-axis.").
   05:56:56 he assigned it to `ai-locus-request-gitlab-ai-hackathon`;
   [session 9633187](https://gitlab.com/gitlab-ai-hackathon/transcend-october-2026/43396940/showcase/-/automate/agent-sessions/9633187)
   started at once, "triggered by @Ashfaq909". (Whether Ashfaq had re-pasted the flow after `6f26cd70` does not
   matter here: that change was a comment.)
2. **Intake** (05:57:46): commit `bfb7e92e` on `graph/6` from `820fd236`, author and committer `locus-request`
   (service-account email), `Locus-Session` trailer; `spec.json` coeffs [0, 1, -2, 1], domain -0.5 to 2.5, marks
   vertex and y-intercept (exactly the spec checked locally), the matching lock, the default layout, no other file.
   MR !4 at 05:57:51; the teacher note at 05:57:55 read the request right ("the vertex, at x = 1, y = 0, where it
   touches the x-axis").
3. **Attempt 1** (MR pipeline 2957962126; push pipeline 2957962078 also ran): render passed, guards passed,
   touchcheck failed at 05:58:59, `LOCUS_REPORT` `requestId` 6, `attempt` 1: TL-1 at (36, 20) mm, the vertex,
   measured 0, required 3.2; 11 TL-2. Exactly the local result of 17 Oct (a).
4. **Attempt 2** (commit `cdb170f5`, 06:00:47, layout.json only): `yScaleMm` 8 to 30 (TL-1), grid off (TL-1, TL-2),
   vertex label [0, 16.5], y-intercept label [-11, -8] (TL-2); one sentence per change with its rule, trailer.
   MR pipeline 2957964721: touchcheck failed at 06:02:03, `attempt` 2: TL-1 at (36, 20) 0 mm, and TL-5 (the
   y-axis 3 mm past the top edge, at y scale 30). Every TL-2 was cleared.
5. **Attempt 3** (commit `618f12d7`, 06:02:58, layout.json only): `yScaleMm` 30 to 26 (TL-5), `xScaleMm` 16 to 14
   (TL-1). MR pipeline 2957967437: touchcheck failed at 06:04:11, `attempt` 3: **only TL-1, at (33, 20) mm, the
   vertex, 0 mm**; TL-2 to TL-5 passed. A local render and touchcheck of `618f12d7`'s files gives the same result.
   guard-scope: "3 commit(s) on graph/6 since 820fd236: 3 by agents, 0 by people".
6. **Refuse:** 06:04:28 the agent added `cannot-make-readable` to #6 (the label created in 17 Oct (a) item 3);
   06:04:34 the refusal note; 06:04:36 session completed. About 7.5 min from assign to refusal. The note says
   nothing will be printed or released, names TL-1 with its plain message, where it is on the plate, 0 mm measured and
   3.2 required, "after attempt 3, the last of 3 attempts checked", that TL-2 to TL-5 passed (true, see 5), and why:
   the curve "only touches the x-axis at its lowest point ... no change to the layout can leave a clear gap"; it links
   MR !4 and ends with the limitations line and the session. No emoji or long dash in the agent's text; the only
   emoji on the issue is GitLab's own "has started" message.
7. `bundle` was skipped in every pipeline; no release exists. MR !4 is open, not merged.

**What the agent got wrong or loose (H3):** its "what you could change" list starts with the prompt's generic
examples, "use a shorter x range, ask for fewer marked points", which would not help here (any range containing x = 1
touches the axis, and the touch is in the curve, not in a mark). Its third suggestion, a parabola that crosses the
axis or stays clear of it, is the one that works. The refuse prompt gives those examples, so the prompt is the cause;
whether to make that list depend on the failing rule is a prompt change for later.

**What this proves and what it doesn't:** the refusal path runs end to end in our account: a real request the touch
rules cannot pass, three attempts by the agent alone (the third fixed everything except the impossible part), then the
label, a plain explanation, and no bundle or release. It does not show that a learner could or could not read such a
plate: the refusal comes from Locus's own rule that a tangent touch is lines running together (14 Oct). Routes in
`locus-request` that have now run: intake to fixer_1, fail to fixer_2, a pass at fixer_2 (#3, #5), fail to fixer_3,
and fixer_3 to refuse (#6). Not run yet: `asked` (needs-info), `exists`, a pass at attempt 1 or 3, an immediate
refuse (a failing result with no allowed fix), and BROKEN.

## 17 Oct 2026 (a): the refusal-path request, MR !2 closed, labels, and the flow's trigger comment (Ashfaq)

No change to `docs/contracts.md`, the touch rules, the profile or `remedies.json` (H7).

1. **Gate 6 reply:** Ashfaq read the #5 requester's inbox: the Support Bot sent the thank-you and both agent notes
   (16 Oct (o) item 7, now filled in).
2. **MR !2 closed** (Ashfaq's go-ahead, 17 Oct, 05:22 UTC) with a note pointing to #5 / MR !3; the branch `graph/4`
   and the MR stay as the record of the dropped run.
3. **Labels:** the test bed had no labels at all, so the refuse step's `update_issue` (pinned to
   `cannot-make-readable`) would have depended on GitLab creating a label for the service account, which is not
   shown. With Ashfaq's go-ahead, Claude Code created the project labels `cannot-make-readable` and `needs-info`
   (contracts §7) through the API as Ashfaq909. This is project setup, not an agent action.
4. **Trigger comment:** the header of `.gitlab/duo/flows/locus-request.yml` said "NOT RUN YET" and "assign" for
   Service Desk. It now says what ran: assign on an issue (#3), a mention on a Service Desk ticket (#5, because GitLab
   refuses to assign the service account to a ticket), and that "work item created" has not run. Comment only;
   `check.js` passes. The AI Catalog copy changes only when Ashfaq pastes the file again. The §6b agent table in
   `projectLocus.md` names the mention trigger too.
5. **Refusal-path request (chosen here; it ran the same day, 17 Oct (b)):** y = (x - 1)^2 on x from -0.5 to 2.5, marking the vertex and the
   y-intercept. The vertex (1, 0) lies on the x-axis, so the curve touches the axis without crossing it. TL-1 treats
   a tangent touch as lines running together (14 Oct, "A tangent touch is not a real meeting"), and it fails with 0 mm
   at the touch point. The fixer's allowed fixes for TL-1 are rescale-x, rescale-y and hide-grid; none of them
   moves the x-axis away from a point that lies on it, and labels (move-label, key-mode) are not lines. So **no
   allowed layout can pass**, and the fixer should use all 3 attempts and then refuse. Checked locally with this
   code (`cc643e1f` renderer, scratch scripts, not in the repo), requestId 6 (the test bed's next issue number; the
   braille ID can change whether render succeeds, 16 Oct (n)):
   - The CI path on a `requests/6/` folder as intake writes it (default layout): render passes; touchcheck fails,
     TL-1 once at (36, 20) mm, exactly the vertex, measured 0, required 3.2, allowed fixes rescale-x, rescale-y,
     hide-grid; plus 11 TL-2 results (both labels near lines), all with allowed fixes.
   - 286 layouts (x scale 1 to 28 mm, y scale 0.5 to 100 mm, grid on and off): **no layout passes**; every one that
     renders fails TL-1 with 0 mm at the vertex. 88 crash render ("mesh still has N unpaired edges"), almost all at
     extreme scales.
   - The practical range (x scale 8 to 20, y scale 4 to 32, grid on and off; inline and key mode; typical label
     offsets; 129 distinct layouts): no layout passes; render crashes in 2 (x 12, y 6, grid on; key mode at x 16,
     y 8, grid off).
     A range of -1 to 3 gave the same picture, so the request keeps -0.5 to 2.5.
   - **Known risk:** if the fixer picks one of the about 2% of layouts that crash render, the run ends BROKEN (a
     note asking a person to look), not refused. That would be recorded as it happens, not re-run until it refuses.
   - Why this is an honest refusal: it is an ordinary lesson graph (a perfect square, the parabola resting on the
     x-axis), the failure is measured, and Locus's rules have no fix for it. It does not show that a learner could or
     could not read such a plate; it shows that Locus refuses, says why, and releases nothing when its checks cannot
     pass.
   - Rejected: a TL-4 request (a requested point not on the graph) would refuse at once, but intake requests a mark
     only when its point lies inside the range, so an honest request does not reach TL-4. A graph too tall for the
     plate is not a sure refusal: the layout schema allows any positive scale, so reduce-scale can always make it fit.
   - Route (Ashfaq): an ordinary issue, assigned to the service account (the trigger proven on #3).
6. **`HANDOVER.md` draft** started (due 20 Oct, §15.4): where things are, what ran, what has not, flows and triggers,
   Service Desk, CI variable names, flaky parts.
7. S.3 Next item 12 (robust mesh) not started this session.

## 16 Oct 2026 (o): Gate 5 run 2 through Service Desk: which address works, a mention instead of assign, and a GitLab outage (Ashfaq ran it)

No change to `docs/contracts.md`. Everything below was read from GitLab, git and the executor job logs after it
happened; Claude Code started no flow and changed nothing in a run (H6).

**Before the run:**
- `projectLocus.md` was repaired (`5616ac7f`): since `829915e1` it held two extra copies of its header and Part S
  inside the S.3 Code row (a string replace whose replacement contained "$`"). Every edit since `11950b57` was kept.
- **Test bed `main` now has the render fixes of 16 Oct (n)** (Ashfaq's go-ahead): merge commit `820fd236` (parents
  `5616ac7f` and the old `main` `3e0af8ea`, tree exactly `feat/gate2-render`), pushed as a fast-forward. Pipeline
  2955873544 on `main`: all 11 jobs that ran passed, `bisect-regression` skipped; `upstream-test` did not run because it
  runs only when `packages/**` or the root package files change. 223 tests pass locally; `check.js` passes.

**Service Desk (Gate 6), seen in our account:**
1. Ashfaq emailed the request (y = 0.5x^3 - 1.5x on -2.2 to 2.2, turning points and x-crossings) from his own mail
   account to the address GraphQL gives as `serviceDeskAddress`, `contact-project+<project slug>-<id>-issue-@incoming.gitlab.com`,
   at 15:03 and again at 15:19 UTC. **Neither created a ticket**, and neither brought a thank-you email or a
   rejection. The two causes in the
   [Service Desk troubleshooting docs](https://gitlab.com/gitlab-org/gitlab/-/blob/master/doc/user/project/service_desk/_index.md)
   (ignored `Auto-Submitted` / `X-Autoreply` headers; DKIM failures after forwarding) do not fit a message typed and
   sent directly.
2. The same email sent at 15:47 UTC to the project's address on the main incoming mailbox,
   `incoming+<project slug>-<id>-issue-@incoming.gitlab.com` (the form shown in
   [configure.md](https://gitlab.com/gitlab-org/gitlab/-/blob/master/doc/user/project/service_desk/configure.md)),
   **created ticket #4** at 15:47:38 and Ashfaq received the Support Bot's thank-you email. So in our account
   **only the `incoming+` address works**; why the `contact-project+` alias drops mail is not known.
3. Service Desk creates a work item of type **Ticket**, confidential, author `support-bot`. REST `issues/4` returns
   it (`issue_type: ticket`), so `get_issue` can address it.
4. **A flow's service account cannot be assigned to a ticket:** the sidebar answered "Cannot assign
   @ai-locus-request-gitlab-ai-hackathon to #4", although the account is a Developer and the same assignment worked on
   issue #3. The message comes from GitLab's `IssueSetAssignees` mutation, which drops assignees for whom
   `can?(:read_issue, project)` is false
   ([set_assignees.rb](https://gitlab.com/gitlab-org/gitlab/-/blob/master/app/graphql/mutations/issues/set_assignees.rb)).
   Why that is false for this account here is not proven (service accounts are checked through composite identity).
5. **A mention on the ticket starts the flow.** Ashfaq's comment `@ai-locus-request-gitlab-ai-hackathon please make
   this graph.` started a session within 25 s; the goal is the discussion plus `Context: {Issue IID: 4}`, which
   intake accepts. So the Service Desk path in our account is **email to the `incoming+` address, then a person's
   mention**, not assign (S.4 step 1 is updated).

**Three sessions on #4, all cut off by a GitLab.com outage** ([status page](https://status.gitlab.com/) incident "503s on GitLab.com", investigating
from 16:10 UTC; at 16:52 "we are seeing slowness with Duo requests and services", GitLab Duo "Degraded Performance"):
- [Session 9613530](https://gitlab.com/gitlab-ai-hackathon/transcend-october-2026/43396940/showcase/-/automate/agent-sessions/9613530)
  (mention 15:59:55): executor job 17240788513 failed with `runner_system_failure`; the runner could not pull its
  helper image (`registry.gitlab.com` answered 502). The agent never ran. Session "failed (dropped)" at 16:02:39.
- [Session 9614767](https://gitlab.com/gitlab-ai-hackathon/transcend-october-2026/43396940/showcase/-/automate/agent-sessions/9614767)
  (mention 16:38:11): executor job 17241691854 got HTTP 503 from `wss://gitlab.com/api/v4/ai/duo_workflows/ws` on all
  5 tries ("Workflow could not connect to the Workflow service"). The agent never ran.
- [Session 9615472](https://gitlab.com/gitlab-ai-hackathon/transcend-october-2026/43396940/showcase/-/automate/agent-sessions/9615472)
  (mention 16:55:18, after the endpoint answered normally 10 times in a row): **intake worked on the confidential
  ticket.** Commit `28ae30de` on `graph/4` (from `820fd236`; author and committer `locus-request` with a
  `service_account_group_*` email; `Locus-Session` trailer) holds `spec.json` with coeffs [0.5, 0, -1.5, 0], domain
  -2.2 to 2.2, marks turning-points and x-intercepts, the matching lock, and the default layout. It opened MR !2 and
  posted the teacher note (turning points at x = -1 and 1, crossings at about -1.73, 0 and 1.73). Attempt 1 pipelines
  2956349907 (push) and 2956350065 (MR): `render` passed (the 16 Oct (n) fix on a real request), guards passed,
  touchcheck failed with `LOCUS_REPORT` `requestId` 4, `attempt` 1: 3 TL-1 and many TL-2 results, every one with
  allowed fixes. While `fixer_1` was polling that pipeline, at 16:57:46 the connection to the Duo service closed
  abnormally (WebSocket 1006); the 4 reconnects were refused with "GitLab Duo is already responding to this chat in
  another tab or location" (1013), and the run stopped at 16:58:04. The fixer never acted.
- The teacher note reached Ashfaq by email, but as an ordinary GitLab notification to his account ("You're receiving
  this email because of your account on gitlab.com", sender `locus-request`), not as a Service Desk email from the
  Support Bot. That shows a note reaches a participant; the reply to a requester **without** a GitLab account is not
  shown yet (H3).

A new mention on #4 cannot finish this request: intake finds `requests/4/spec.json` on `graph/4`, answers `exists`
and ends (by design). **Decision (Ashfaq):** after GitLab Duo is operational again, file a fresh request by email to
the `incoming+` address and mention the flow on the new ticket. #4 and MR !2 stay as the record of the dropped run;
MR !2 is closed afterwards.

**Gate 5 run 2, complete** (GitLab Duo back to Operational at 17:06:40 UTC on the status page):
1. 17:10:12 ticket **#5** "Tactile graph: cubic" from an email to the `incoming+` address, sent from a different
   address than #4 (a university account). 17:11:23 Ashfaq's mention; 17:11:24
   [session 9616199](https://gitlab.com/gitlab-ai-hackathon/transcend-october-2026/43396940/showcase/-/automate/agent-sessions/9616199)
   started, "triggered by @Ashfaq909".
2. **Intake** (17:12:51): commit `2005e098` on `graph/5` (from `820fd236`), the same spec, lock and default layout as
   `28ae30de` on #4 with requestId 5, trailer included; MR !3 at 17:13:10; the teacher note at 17:13:26.
3. **Attempt 1** pipelines 2956398931 (push) and 2956399718 (MR) failed on touchcheck, as expected.
4. **Fixer:** commit `77afedf8`, `requests/5/layout.json` only: `showGrid` false (TL-1, hide-grid) and its own offsets
   for all five labels (TL-2, move-label): turning-point-1 [0, 12], turning-point-2 [0, -12], x-intercept-1
   [-4.5, 15], x-intercept-2 [11.5, 13.5], x-intercept-3 [4.5, -15]; scales unchanged. One sentence per change names
   its rule; trailer included.
5. **Attempt 2 MR pipeline 2956408478: all 7 jobs passed.** touchcheck `LOCUS_REPORT` `requestId` 5, `attempt` 2,
   `pass` true; guard-scope "2 commit(s) on graph/5 since 820fd236: 2 by agents, 0 by people"; guard-maths passed;
   guard-description 13 numbers, passed. `bundle` built `graph-5-v1` (braille ID G5), "touchcheck passed after 2
   attempt(s)", manifest `agentSessions` = [session 9616199], `sourceCommit` `77afedf8`.
6. 17:20:02 the pass note on #5 (what changed, the MR link, the "Automated checks measure spacing and size; they do not
   certify that a learner can understand the graphic." line, the session); 17:20:05 session completed. About 8.5
   min from mention to pass. The agent's notes have no emoji or long dash; the only emoji on the ticket is GitLab's own
   "has started" message.
7. **Requester inbox (checked by Ashfaq on 17 Oct, reported by him):** the inbox that sent ticket #5 (the university
   address) received the Support Bot's thank-you email and **both agent notes** (the intake note and the pass note)
   **from the Support Bot**, as Service Desk emails. Read from GitLab the same day: #5 is `issue_type: ticket`,
   confidential, author `support-bot`, with a Service Desk reply-to address set. So **a Service Desk requester gets the
   agent's notes by email** in our account (Gate 6 reply). Not shown yet: the contracts §8 summary note with a page
   link and download, because release and deploy do not exist yet. MR !2 was closed on 17 Oct (Ashfaq's go-ahead; see
   17 Oct (a)).

**What this proves and what it doesn't (H3):** Gate 5 has now run twice end to end (16 Oct (m) and this), and the
second came in through Service Desk email and ran on a confidential ticket. It needed a person's mention, not an
assign. It does not prove a learner can read the plate, the refusal path has still not run (both runs used 2 of 3
attempts), and merge, release, deploy and the reply email after the MR do not exist yet. MR !3 stays open.

## 16 Oct 2026 (n): render crashed on many ordinary requests; the STL repair is now robust (Ashfaq)

No change to `docs/contracts.md`. Found while preparing the second Gate 5 run, before filing it: the planned request (a
cubic, y = 0.5x^3 - 1.5x on -2.2 to 2.2, issue number 4) made `render` throw "mesh still has 1 unpaired edges", so the
agent would have met a red `render` job instead of a touch-check report. A sweep of 20 everyday requests (default
layout, grid on and off) then failed 7 times, including every straight line (y = x + 1: over 500 open edges) and every
layout wider than the plate. Even the braille ID number could flip the result.

**Causes and fixes** (`locus/core/stl.js`, `locus/core/geometry.js`, `locus/core/render.js`):
1. **Copies of one point a few micrometres apart.** The weld only merged open-edge vertices with each other; a centre
   fan can leave slivers between several copies where only one is on an open edge. It now welds every vertex within
   the tolerance of an open-edge vertex, directly or through other such vertices, with a tolerance that grows each
   pass (2, 5, 10 micrometres; printers work in about 100).
2. **Straight lines.** A degree-1 curve is 401 collinear samples, and the union cannot fuse that long collinear
   outline. A path straight from end to end (within 10 nm) is now built from its two ends; every other path keeps
   every sample. A first version that dropped any nearly straight sample changed print C (the middle of a cubic is
   nearly straight), so it was narrowed (contracts D3).
3. **Holes a few micrometres wide.** A loop of at most 4 open edges narrower than 10 micrometres across its longest edge
   is closed with reversed triangles. A real missing face stays open, and render still fails on it (test).
4. **Layouts wider than the plate.** TL-5 measures `scene.json` and fails them with `reduce-scale`, but render crashed
   first, so the fixer got no report. When the solid sticks out, the STL is now cut to the plate footprint; the scene
   keeps the true positions, so TL-5 still fails (checked: y = x + 1 on -3 to 3 renders, then TL-5 fails 10 times
   with `reduce-scale`). Such a graph is never bundled, because the bundle needs touchcheck to pass.
5. **Zero-length grid lines** (`locus/core/scene.js`). Vertical grid lines rose from the x-axis to the top of the
   y-axis; when the whole curve is below the x-axis those are the same height, so the lines had no length and JSCAD
   threw "the given points must define a closed geometry". They now hang from the x-axis down to the bottom of the
   y-axis in that case; a curve above the axis gets exactly the old grid.
6. Tried and dropped: merging vertices on a 10 micrometre grid from the start (changed prints A, B and C and opened
   most meshes).

**Checks:** prints A, B and C are byte-identical (`core/prints.test.js`). New tests: four everyday requests with and
without the grid (the cubic among them), the over-wide line, three straight lines, the sliver filler, and a curve below
the x-axis with the grid. A seeded random sweep through `render` (degree 1 to 3, coefficients from -2 to 3 in nice
steps, domains of 2 to 5 units, default layout, grid on and off; scratch script, not in the repo): **7 of 240 renders
still fail (2.9%)**, all "mesh still has N unpaired edges". Seen causes: marks or braille cells that overlap (two
points 2 mm apart, so their 3 mm domes and labels intersect) and very steep cubics. The planned second request (the
cubic, issue 4) now renders, and its attempt 1 fails TL-1 and TL-2, both with allowed fixes. 223 tests pass. This
changes `locus/core/**`, a `library-impact` path; no graph has shipped yet, so there is nothing to re-check.

Pipeline 2955547838 (test bed, push of `cc643e1f` to `feat/gate2-render`): all 9 jobs passed, `locus-test` 223 of
223. The test bed `main` still has the old renderer (`3e0af8ea`), and intake branches from `main`, so the second run
waits until Ashfaq approves bringing `main` up to this commit. Checked read-only the same day: Service Desk is already
enabled on the test bed (GraphQL `serviceDeskEnabled: true`, with an incoming address), so the second run can come in
by email (Gate 6) and be assigned (the Gate 5 Service Desk trigger).

**Known limit (H3):** about 3 in 100 requests still make `render` fail. In a flow run that shows up as a failed
`render` job, which the fixer reports as BROKEN (a note asking a person to look), not as a pass or a refusal. A more
robust mesh step (for example a manifold library instead of repairing the JSCAD union) is S.3 Next item 12.

## 16 Oct 2026 (m): Gate 5 run: locus-request took a real request from issue to a passing bundle (Ashfaq ran it)

No change to `docs/contracts.md`. **First run of a Locus agent flow in our account** (test bed, project 87669530). Every
step below was read from GitLab and git after it happened; Claude Code started nothing and changed nothing in the run
(H6).

**Before the run:**
- **Test bed `main` now holds our code** (Ashfaq's go-ahead, 16 Oct). Ashfaq is a Developer there, so the default
  branch setting is not available to him (GraphQL `adminProject: false`), but `main` allows Developers to push (no
  force push). Merge commit `3e0af8ea` (Ashfaq, signed off) joins the template README commit `5c808212` with
  `feat/gate2-render` at `829915e1` using `-s ours --allow-unrelated-histories`, so its tree is exactly our branch and
  the push was a fast-forward. Pipeline 2955199583 on `main`: all 12 jobs passed (upstream-test on Node 20 and 22,
  library-recheck, guards), `bisect-regression` skipped. The team project and the GitHub working repo are untouched;
  S.3 Next item 0 still needs Shawki.
- 12:42 UTC Ashfaq created `locus-request` (display name exactly `locus-request`, private) and enabled it: service
  account **`ai-locus-request-gitlab-ai-hackathon`**, auto-created trigger (event types 0, 1, 2).
- **Credits:** Ashfaq looked at the GitLab Credits page and found nothing listed for the probe run. Whether that is a
  delay or a view a Developer doesn't get is unknown; contracts §10 stays open.

**The run** (issue #3, MR !1, [session 9601992](https://gitlab.com/gitlab-ai-hackathon/transcend-october-2026/43396940/showcase/-/automate/agent-sessions/9601992)):
1. 12:53 Ashfaq filed #3 "Tactile graph: ball path" with the projectile request (16 Oct (h) step 3 text) and at
   12:54:07 assigned it to the service account. The session started in under a second, "triggered by @Ashfaq909"
   (the **Assign** trigger works).
2. **Intake** (12:55): commit `8690280c` on `graph/3` with `spec.json` (coeffs [0, -0.5, 2, 1], domain -0.5 to 4.5,
   marks vertex, y-intercept, x-intercept+), the lock (same graph and marks) and `layout.json` equal as JSON to
   `tools/prints/layout-A.json` (D4); the message ends with the `Locus-Session` trailer. It opened MR !1 (`graph/3`
   into `main`) and posted a plain-words note: peak (2, 3), launch height 1, landing at about 4.45.
3. **Attempt 1 pipelines** (push 2955218116 and MR 2955218960; the push pipeline ran because the MR did not exist yet):
   touchcheck **failed** (TL-1, TL-2, TL-5; `LOCUS_REPORT` with `requestId` 3, `attempt` 1), everything else passed.
   guard-scope: "1 commit(s) on graph/3 since 3e0af8ea: 1 by agents, 0 by people": the 16 Oct (l) display-name match
   works on a real agent commit.
4. **Fixer** (`fixer_1` read attempt 1, then `fixer_2`): commit `4dbdf419`, `layout.json` only: `showGrid` false
   (TL-1) and its own label offsets: vertex [0, 12], y-intercept [-11.5, 7], x-intercept+ [3.3, 14] (TL-2, TL-5);
   `yScaleMm` stayed 8. It is not print B's layout (B: `yScaleMm` 16, other offsets); the prompt never gave B (16 Oct
   (h) item 6). The message names the rule each change fixes and ends with the trailer.
5. **Attempt 2 MR pipeline 2955233864: all 7 jobs passed.** touchcheck `LOCUS_REPORT` `requestId` 3, `attempt` 2,
   `pass` true; guard-scope 2 commits, 2 by agents, passed; guard-maths and guard-description (11 numbers) passed.
   The fixer posted the pass note on #3 and the session completed (about 7 min from assignment). MR !1 is open and
   mergeable; nobody has merged it.
6. **`bundle`** built `graph-3-v1` (braille ID G3): "touchcheck passed after 2 attempt(s)", "agent sessions: 1 (from
   2 agent commit(s))". Its `manifest.json` holds `agentSessions: [<session 9601992 URL>]`, `pipelineId` 2955233864,
   `sourceCommit` `4dbdf419`: the trailer route of 16 Oct (j) works.

**What this proves and what it doesn't (H3):** a person's one action (assign) started one Duo session that wrote the
request, failed the touch check on the default layout, changed only the layout by itself and passed every CI gate, with
guard-scope holding the agent to its paths. It does not prove a learner can read the plate (automated checks only), it
used 2 of 3 attempts so the refusal path has not run, and nothing after the MR (merge, release, deploy, reply) exists
yet. Cycles and credits per attempt are still unmeasured.

**Next in the flow (S.4 steps 6 to 8):** `auto-merge` (not built), then `publish-package`, `release`,
`deploy-staging`, `reply-teacher` (Shawki). MR !1 stays open as the first real input for those jobs.

## 16 Oct 2026 (l): first flow run in our account: locus-probe (Ashfaq ran it), and what it changed

No change to `docs/contracts.md` (one wording proposal for Shawki below). **This is the first Duo flow that has run in
our account.** It is the probe, not a Locus agent: `locus-request` and `locus-ops` have still not run (H3).

**The run** (test bed, project 87669530):
- 11:58 UTC Ashfaq created `locus-probe` in the AI Catalog (item 1018412, private), after the 16 Oct (k) fix. At
  11:59 he enabled it in the test bed: GitLab added the service account **`ai-locus-probe-gitlab-ai-hackathon`**
  (display name `locus-probe`, Developer) and an auto-created trigger owned by it ("Auto-created triggers for
  locus-probe", event types 0, 1, 2 in GraphQL).
- 12:03 Ashfaq opened issue #2 "Duo probe" and commented `@ai-locus-probe-gitlab-ai-hackathon job: <job 17230294125
  URL>`. One second later the account replied that the flow started:
  [session 9598935](https://gitlab.com/gitlab-ai-hackathon/transcend-october-2026/43396940/showcase/-/automate/agent-sessions/9598935),
  "triggered by @Ashfaq909". It completed at 12:05:15, about 85 s in all.
- Its note on #2, checked against git (`git fetch gitlab probe/2`):
  1. `get_issue` ok.
  2. `get_job_logs` ok: it found the `LOCUS_REPORT` line in job 17230294125 and copied its start unchanged (D8 works
     as designed: the agent reads the report from the log).
  3. `create_commit` ok: commit `14cecd9c` on `probe/2` (from `11950b57`). **Author and committer are both
     `locus-probe <service_account_group_121124982_d83db293da385ebdbcb742d7d7c8b0d9@noreply.gitlab.com>`.** The
     message kept its three lines, and `git log --format=%(trailers:key=Locus-Session,valueonly)` reads the session
     URL from it.
  4. `create_commit` with a `delete` action ok: commit `0c0e9c02` removes `probe/2.txt`.
  5. Its first `get_commit` call with the ref `probe/2` returned 404; it retried with `probe%2F2` and got the commit.
     The ai-assist
     [`commit.py`](https://gitlab.com/gitlab-org/modelops/applied-ml/code-suggestions/ai-assist/-/blob/main/duo_workflow_service/tools/commit.py)
     puts `commit_sha` in the URL path, while
     [`repository_files.py`](https://gitlab.com/gitlab-org/modelops/applied-ml/code-suggestions/ai-assist/-/blob/main/duo_workflow_service/tools/repository_files.py)
     sends `ref` as a query parameter, so `get_repository_file` with `graph/n` is fine. Our flows pass `get_commit`
     only commit SHAs.
- **Credits:** open until Ashfaq reads the GitLab Credits dashboard (whose row the run is on).

**Decisions:**
1. **`agents.json` matches the flow's display name, not `ai-<flow>-`.** The service account's username never appears in
   git; the display name given in the AI Catalog does. Patterns are now `^locus-request$` and `^locus-ops$` (author or
   committer name, or email local part). Before this fix, guard-scope would have counted every agent commit as a
   person's and skipped it. **The flows must be created with exactly the display names `locus-request` and
   `locus-ops`.**
2. **Fail closed:** a commit whose author or committer email local part starts with `service_account_` but matches no
   Locus flow is blocked on `graph/`, `revert/` and `rollback/` branches (a flow created under another name, or a
   foundational Duo flow). Elsewhere it is not guard-scope's business. Tests use the real identity shape.
3. **The fixer reads `layout.json` and `spec.json` at the commit SHA, not at `graph/n`.** `get_repository_file`
   remembers every (project, ref, path) that returned 404 in a session and refuses to fetch it again
   (gitlab-org/gitlab#604564, in `repository_files.py`), and intake checks `requests/n/spec.json` at `graph/n`
   expecting a 404. Whether that memory is shared between components of one flow isn't documented; reading at the
   SHA avoids the question and is the exact commit the fixer checks. Test-pinned.
4. **Proposal for Shawki (contracts §7 wording, H5):** "Each flow has its own service account (`ai-<flow>-<group>`), so
   guard-scope checks the commit author" could read "... so guard-scope checks the commit author and committer, which
   carry the flow's display name". The rule itself is unchanged; not edited until Shawki agrees.
5. `probe/2` is deleted from the test bed after this record (16 Oct (g) step 3); commits, session and note are recorded
   above. 218 tests pass.

**Still open from the probe questions:** credits (above). Answered: a person's mention starts a custom flow; the agent
reads job logs; author and committer; delete works; the trailer survives.

## 16 Oct 2026 (k): the AI Catalog rejects max_cycles; check.js now applies GitLab's own flow schema (Ashfaq)

No change to `docs/contracts.md`. **No flow has run in our account yet** (H3).

- **Seen in our account (16 Oct):** creating `locus-probe` in the test bed's AI Catalog failed with "Latest version
  definition object property at `/components/0/max_cycles` is a disallowed additional property. Versions is
  invalid". `check.js` had passed it: the docs we read don't say custom flows reject `max_cycles`.
- **The validator GitLab uses** is
  [`app/validators/json_schemas/ai_catalog/flow_v2.json`](https://gitlab.com/gitlab-org/gitlab/-/blob/827a2fb14adfc4317d876855e2a46c6937b6c943/app/validators/json_schemas/ai_catalog/flow_v2.json)
  in gitlab-org/gitlab (last changed 29 Sep 2026, commit `827a2fb1`; MIT, as the repository's
  [LICENSE](https://gitlab.com/gitlab-org/gitlab/-/blob/master/LICENSE) puts everything outside `ee/`, `jh/` and
  `doc/` under MIT). An `AgentComponent` may have only `name`, `type`, `prompt_id`, `prompt_version`, `inputs`,
  `toolset`, `description`, `subagents`, `max_delegations`, `model_size_preference`, `model_tags`, `ui_log_events`
  and `ui_role_as`. `yaml_definition` is required, but GitLab fills it with the pasted text itself.

**Decisions:**
1. **`max_cycles` is removed from all three flows.** In ai-assist v1,
   [`agent_node.py`](https://gitlab.com/gitlab-org/modelops/applied-ml/code-suggestions/ai-assist/-/blob/main/duo_workflow_service/agent_platform/v1/components/agent/nodes/agent_node.py)
   treats a missing `max_cycles` as no cycle limit for that step, so only the flow's overall graph-step limit applies
   (from the source, not yet seen in a run). `locus-request` still makes at most 3 attempts: that comes from its
   routes and from which steps hold `create_commit` (16 Oct (h) item 1), not from cycles. The "220 cycles" of 16 Oct
   (h) item 3 no longer applies.
2. **`check.js` validates every flow against a copy of that schema** (`locus/flows/gitlab-flow-schema.json`, pinned at
   `827a2fb1`), with `yaml_definition` set to the YAML text as GitLab does, on top of its own checks. A test pins
   that `max_cycles` is rejected. To refresh the copy, download the file again and say so here.
3. Ashfaq pastes the fixed `locus-probe.yml` again (16 Oct (g) steps).

## 16 Oct 2026 (j): pipeline 2953818513, still no flow run, and agentSessions from commit trailers (Ashfaq)

No change to `docs/contracts.md`. **No flow has run in our account yet** (H3).

- **Pipeline 2953818513** (test bed, push of `4cb3bda8`, the 16 Oct (i) commit): all 9 jobs passed in 158 s;
  `locus-test` 212 of 212 on the runner (job 17222733573). guard-scope checked 1 commit since `84e654a7` (0 by
  agents) and passed. `requests/` still holds only its README, so touchcheck and `bundle` checked 0 requests.
- **PR 1** is open and mergeable, with no review or comment yet (checked 16 Oct).
- **No flow run to record.** Checked read-only on 16 Oct: the test bed still lists only the six foundational flows in
  `aiCatalogConfiguredItems`, its only issue is the welcome issue, it has no MRs, its branches are `main` and
  `feat/gate2-render`, and its default branch is `main`. So `locus/guards/agents.json` stays as it is.

**Decision (Ashfaq): how a flow's session URL reaches the manifest's `agentSessions`** (the open point of 16 Oct (c),
(g) and (h) item 8).
1. **Every `locus-request` commit message ends with a trailer**: a blank line, then `Locus-Session: <session URL>`,
   where the URL is the flow's `context:session_url`. The intake, `fixer_2` and `fixer_3` prompts say so, and
   `check.test.js` pins it.
2. **The bundle job reads it from git**: `git log --format=%(trailers:key=Locus-Session,valueonly)` over the agent
   commits (author or committer matches `agents.json`, as in guard-scope) that changed `requests/<iid>/` since the
   previous release tag (every commit for v1). It keeps only URLs of the form
   `<CI_PROJECT_URL>/-/automate/agent-sessions/<id>`, once each, in order, and logs anything else as a warning. A
   person's commit with a trailer is ignored. An agent commit without one gives a warning, not a failure, and adds no
   URL. `squash: false` on the MR (16 Oct (h) item 5) keeps these commits in `main`'s history, and the job already
   has the full history (`GIT_DEPTH: 0`).
3. **`--agent-session <url>` is removed** from `locus bundle`: a URL typed on the command line is not job output
   (CLAUDE.md: never hand-write a manifest). This replaces the `agentSessions` row of 16 Oct (c).
4. **Why not the issue notes** (which also end with the session URL): reading them needs an API token in the bundle
   job (H8). Git history is already there.
5. **`locus-probe` now tests it**: its step 3 commit message has the trailer, and it reports the message `get_commit`
   returns. When Ashfaq runs it, also record
   `git log --format='%an <%ae> | %cn <%ce> | %(trailers:key=Locus-Session,valueonly)' gitlab/probe/<iid>`.

**Not yet seen (H3):** whether `create_commit` keeps a multi-line message as given, so that git reads the trailer,
and whether the `agents.json` patterns match the real service account. Until a run shows both, a real request's
`agentSessions` may still be empty; the bundle warns instead of guessing. 215 tests pass.

## 16 Oct 2026 (i): pipeline 2953759450, still no flow run, and the PR into the working repo (Ashfaq)

No change to `docs/contracts.md`. **No flow has run in our account yet** (H3).

- **Pipeline 2953759450** (test bed, push of `84e654a7`, the 16 Oct (h) commit): all 9 jobs passed in 155 s;
  `locus-test` 212 of 212 on the runner (job 17222358023). `requests/` still holds only its README, so touchcheck,
  guard-maths and `bundle` checked 0 requests.
- **locus-probe and locus-request have not been run.** Ashfaq confirmed on 16 Oct. Checked read-only the same day: the
  test bed (project 87669530) lists only the six foundational flows in `aiCatalogConfiguredItems`, its only issue is
  the organisers' welcome issue, it has no MRs, its branches are `main` and `feat/gate2-render`, and its default
  branch is `main`. So `locus/guards/agents.json` and the flows stay as they are; all three flows pass `check.js`.
- **Decision (Ashfaq): S.3 Next item 6.** Opened
  [ahammadshawki8/locus PR 1](https://github.com/ahammadshawki8/locus/pull/1) from `ashfaqstu:feat/gate2-render` into
  the working repo's `main` (GitHub reports it mergeable). It changes that `main` only when Shawki merges it. It must
  be merged with a merge commit, not squash or rebase, so the JSCAD history from 14 Oct stays (about 2,100 commits, 18
  of them ours when it was opened; later pushes to the branch join it). The PR asks Shawki to look at the guard-scope committer rule (16 Oct (g) item 7) and S.3 Next items 9
  and 10.

## 16 Oct 2026 (h): locus-request in flow syntax: intake, then the fixer, at most 3 attempts (Gate 5, Ashfaq)

No change to `docs/contracts.md`. **No flow has run in our account yet** (H3).

**Pipeline 2953715382** (test bed, push of `878a5846`, the 16 Oct (g) commit): all 9 jobs passed; `locus-test` 205 of
205 on the runner (job 17222097118). `requests/` still holds only its README, so touchcheck, guard-maths and `bundle`
each logged "0 request(s) checked".

**locus-probe has not been run yet.** Checked read-only on 16 Oct: the test bed (project 87669530) has no `locus-probe`
catalog item (GraphQL `aiCatalogConfiguredItems` lists only the six foundational flows from 16 Oct (g)), no probe issue
and no `probe/*` branch. So nothing is recorded from a run, and `locus/guards/agents.json` keeps the `ai-<flow>-`
patterns until the probe shows the real author and committer. The test bed `main` still holds only the organisers'
README.

**Sources read on 16 Oct** (ai-assist `main` at `8ef3f48f`, 15 Oct): [flow registry v1](https://gitlab.com/gitlab-org/modelops/applied-ml/code-suggestions/ai-assist/-/blob/main/docs/flow_registry/v1.md);
[`routers/router.py`](https://gitlab.com/gitlab-org/modelops/applied-ml/code-suggestions/ai-assist/-/blob/main/duo_workflow_service/agent_platform/v1/routers/router.py)
(a route matches the answer text exactly, else `default_route`);
[`state/base.py`](https://gitlab.com/gitlab-org/modelops/applied-ml/code-suggestions/ai-assist/-/blob/main/duo_workflow_service/agent_platform/v1/state/base.py)
and [`components/base.py`](https://gitlab.com/gitlab-org/modelops/applied-ml/code-suggestions/ai-assist/-/blob/main/duo_workflow_service/agent_platform/v1/components/base.py)
(any component takes `literal: true` inputs, which need `as`);
[`flows/base.py`](https://gitlab.com/gitlab-org/modelops/applied-ml/code-suggestions/ai-assist/-/blob/main/duo_workflow_service/agent_platform/v1/flows/base.py)
(every v1 flow gets `context:session_url` = project URL + `/-/automate/agent-sessions/<id>`); the tools
[`pipeline.py`](https://gitlab.com/gitlab-org/modelops/applied-ml/code-suggestions/ai-assist/-/blob/main/duo_workflow_service/tools/pipeline.py)
(`get_pipeline_failing_jobs`: failed jobs with ids, or `pipeline_status` when none failed),
[`merge_request.py`](https://gitlab.com/gitlab-org/modelops/applied-ml/code-suggestions/ai-assist/-/blob/main/duo_workflow_service/tools/merge_request.py)
(`get_merge_request` returns the raw MR, with `sha` and `head_pipeline`),
[`issue.py`](https://gitlab.com/gitlab-org/modelops/applied-ml/code-suggestions/ai-assist/-/blob/main/duo_workflow_service/tools/issue.py)
(`update_issue` takes `add_labels`) and
[`notify_me_when.py`](https://gitlab.com/gitlab-org/modelops/applied-ml/code-suggestions/ai-assist/-/blob/main/duo_workflow_service/tools/notify_me_when.py)
(a timer tool exists, but it is in neither the web UI list nor the live list, so it is not used).

**Decisions** (`.gitlab/duo/flows/locus-request.yml`, no longer a design draft):
1. **Shape: `intake > fixer_1 > fixer_2 > fixer_3 > refuse`, with no route back.** intake commits attempt 1 (print A's
   layout) and opens the MR; `fixer_1` only waits for that pipeline; `fixer_2` and `fixer_3` each commit one
   `layout.json` change and wait for its pipeline. Only intake, `fixer_2` and `fixer_3` hold `create_commit`, so a
   fourth attempt can't happen, whatever the model answers. A loop (`fixer` routing to itself) would leave the cap to
   the model, and what happens when an agent component runs a second time (its history, its answer) isn't documented.
   `check.test.js` pins the routes, that there is no cycle, and who can commit.
2. **Which attempt.** Each fixer step gets its attempt number as a literal input, and accepts only a `LOCUS_REPORT`
   whose `attempt` (counted by CI from the history of `layout.json`) is that number, so it never acts on an older
   pipeline. It also waits until the MR's `head_pipeline.sha` is the commit it is checking.
3. **Waiting for the pipeline.** No usable tool waits, so the fixer polls: `get_merge_request` until the pipeline for
   its commit exists, then `get_pipeline_failing_jobs` on that pipeline. A failed `touchcheck` job means FAIL (read its
   `LOCUS_REPORT` line); `pipeline_status` success means PASS; failed without touchcheck means BROKEN (a note, then
   stop). A pass is only visible as a fully green pipeline (no tool lists a pipeline's passed jobs), which is also what
   `auto-merge` needs. On the test bed, pipeline 2953715382 had touchcheck done 74 s after it started and the whole
   pipeline in 156 s. `max_cycles` add up to 220 agent cycles, under the 600 graph-step limit (2 per cycle). **Open:**
   how many cycles and credits one attempt really costs (Gate 5 run).
4. **Passing the MR on.** The router needs one exact word, so intake answers with the MR URL: `asked` and `exists` end
   the flow and anything else goes to `fixer_1`, which checks that it is an open MR from `graph/<n>`. This is the
   only router whose `default_route` continues; every later router ends on an unexpected answer.
5. **Write tools** (test-pinned, contracts §7): intake `create_commit`, `create_merge_request`, `update_issue`,
   `create_issue_note`; `fixer_1` notes only; `fixer_2` and `fixer_3` `create_commit` and notes; `refuse`
   `update_issue` and notes. Pinned options: intake `update_issue` adds `needs-info`, refuse adds
   `cannot-make-readable`; the MR has `remove_source_branch: true` and `squash: false` (one commit per attempt, which
   guard-scope and the attempt count read). guard-scope still checks every path.
6. **What the fixer is told.** The allowed fixes in its prompt must equal `locus/touchcheck/remedies.json` (test), TL-4
   means refuse, and the plate geometry comes from `locus/core/scene.js`. The prompt gives **no worked answer** (not
   print B's layout), so a pass on the demo request is the agent's own fix (H3).
7. **Intake** writes all three files in one `create_commit`, keys in the order `checkLock` compares, and the
   default layout must equal `tools/prints/layout-A.json` (test, D4). An ambiguous or out-of-scope request gets one
   question and `needs-info`. A request that already has `graph/<n>` gets a note and ends (`exists`).
8. **Session links.** Every note ends with the session URL (`context:session_url`). That is how a session URL can
   reach the bundle manifest's `agentSessions` later (16 Oct (g) open point); the bundle job doesn't read it yet.
9. `check.js` now rejects a literal input without `as`. 212 tests pass.

**Known gaps (not built):**
- `needs-info` is only ever added. After the teacher answers and a person re-assigns the issue, a person removes it.
- A stopped session doesn't resume: re-assigning runs intake, which finds `graph/<n>` and ends. A person carries on.
- What the **Work item created** trigger passes as the goal isn't in the docs we read; intake accepts a number, an
  issue URL or "Issue IID: <n>".
- A TL-2 or TL-3 result gives `at` but not which label failed, so the fixer works it out from the geometry. Naming the
  label in each result would change contracts §4: a proposal for Shawki, not done (H5).
- The prompts use `{{attempt}}` in the system text; if a system placeholder isn't filled in, the user message
  still carries the attempt.

**How Ashfaq runs it** (Claude Code never starts a flow, H6), after the probe:
1. It needs a default branch with our code, since intake branches `graph/<n>` from it and the pipeline comes from
   `.gitlab-ci.yml`: S.3 Next item 0, or (test bed only, Ashfaq's call) set the test bed's default branch to
   `feat/gate2-render` for the run and back afterwards.
2. Test bed > **AI > Flows > New flow**: `locus-request`, Private, paste the YAML, **Create flow**, **Enable** with
   triggers **Assign** (and **Work item created** if the UI offers it). Note the service account name.
3. Open an issue, for example: "Please make a tactile graph of the ball's path y = -0.5x^2 + 2x + 1 from x = -0.5 to
   4.5. Mark the peak, the launch height and where it lands." Assign it to the service account.
4. Record: session URL; intake's note and MR; each attempt's commit (`%an <%ae> | %cn <%ce>`), pipeline and
   `LOCUS_REPORT` attempt; the final note (pass or refusal); the guard results; the Credits dashboard row. Then update
   `agents.json` if the names differ.

## 16 Oct 2026 (g): the locus-ops flow, a probe flow to test Duo first, and guard-scope reads the committer (Ashfaq)

No change to `docs/contracts.md`. **No flow has run in our account yet** (H3): everything below is checked against the
docs, the ai-assist source and read-only queries, not against a run.

**Sources read on 16 Oct:** [flow registry v1](https://gitlab.com/gitlab-org/modelops/applied-ml/code-suggestions/ai-assist/-/blob/main/docs/flow_registry/v1.md),
[custom flow YAML schema](https://docs.gitlab.com/user/duo_agent_platform/flows/custom_flows_schema/),
[custom flows](https://docs.gitlab.com/user/duo_agent_platform/flows/custom/),
[triggers](https://docs.gitlab.com/user/duo_agent_platform/triggers/),
[agent tools](https://docs.gitlab.com/user/duo_agent_platform/agents/tools/),
[AI Catalog size limits](https://docs.gitlab.com/user/duo_agent_platform/ai_catalog/#configuration-size-limits),
and the [create_commit source](https://gitlab.com/gitlab-org/modelops/applied-ml/code-suggestions/ai-assist/-/blob/main/duo_workflow_service/tools/commit.py).

**What the docs say that shapes the flows:**
- A custom flow is flow registry v1 YAML with restrictions: `environment: ambient` only; top-level `name`,
  `description` and `product_group` are rejected; no `response_schema_id` on `AgentComponent` (so no structured
  output); no `model` in prompts; no `params.stop`. The YAML may be at most 40 KiB. Our old drafts used none of this
  syntax.
- What a flow receives as its goal depends on the trigger: **Pipeline events** pass the full pipeline webhook payload; **Assign** passes the
  issue or MR number; **Mention** passes `Input: <comment>` and `Context: {Issue IID: <n>}`.
- Creating or enabling a flow, and adding a trigger, need Maintainer or Owner. REST shows Ashfaq at access level 30
  (Developer) on the test bed (project 87669530), but GraphQL `userPermissions` there shows `adminAiCatalogItem`,
  `createAiCatalogItemConsumer` and `manageAiFlowTriggers` as true (probably the hackathon's Developer + AI role).
  Unconfirmed until Ashfaq creates a flow.
- Already enabled on the test bed (GraphQL `aiCatalogConfiguredItems`): six agents and the foundational flows
  Developer (with an active trigger), Code Review, Fix CI/CD Pipeline, Convert to GitLab CI/CD, Resolve SAST
  Vulnerability and SAST False Positive Detection.
- Triggered flows bill the flow's service account, through the namespace's Monthly Commitment Pool or On-Demand
  credits, not the person who triggered them (triggers doc). Contracts §10 keeps "credits for triggered flows" open
  until a run shows it.
- `create_commit` takes `create`, `update`, `delete` and `move` actions, so the inverse of an added file is a delete
  on paper (Gate 5 open point; the probe tests it). It also takes optional `author_name` and `author_email`.

**Decisions:**
1. **Tool list = docs and the live GitLab.com list.** `locus/flows/tools.json` holds the docs' web UI list (88), its IDE-only
   list (11) and the live `aiCatalogBuiltInTools` GraphQL list (100, read as Ashfaq909). A flow may only name a tool in
   both the web UI list and the live list. `run_command`, `read_file` and `edit_file` are IDE only, so no Locus flow
   uses them, and the flows use `coding_environment: none` (API only, no clone).
2. **`locus/flows/check.js`** checks every `.gitlab/duo/flows/*.yml` that is not marked `# DESIGN DRAFT` against those
   rules, plus: component names, prompts defined inline, every `{{placeholder}}` fed by an input, router targets,
   every component reachable and routed, 40 KiB, and H2. `check.test.js` runs it in `locus-test`, and also pins what
   each `locus-ops` agent can write to contracts §7. `locus-request.yml` is still a design draft (Gate 5) and is
   skipped.
3. **`locus-ops` routing:** `triage` answers one word (`impact`, `regression`, `release`, `none`) and a conditional router
   on `context:triage.final_answer` sends it on. Any other answer goes to `end` (`default_route`), so only triage is spent. Not
   supervisor mode: the route is fixed by the payload, and a router costs fewer cycles than delegation. `release` goes to
   `end` until Shawki adds the release guard (Gate 5c). An Assign event routes to the detective only for an open issue
   labelled `regression`.
4. **Impact reviewer:** reads `LOCUS_IMPACT` from the `library-impact` job log and posts one MR note. Its only write tool is
   `create_merge_request_note` (contracts §7: MR notes only). If the report can't be read, it says so instead of
   guessing numbers.
5. **Regression detective:** reads `LOCUS_BISECT` from the `bisect-regression` job log and acts only on a commit S that bisect named.
   It writes the exact inverse on `revert/<S>` with one `create_commit` only if S is not a merge and renamed no file,
   the default branch still holds S's version of every path, and every file came back whole. Then it opens the MR (labels, branch removal and
   squash pinned by tool options, so the model can't change them). Otherwise, or when the commit says the change is
   intended, it files one re-layout issue per graph (`locus-request` + `regression`, D6). It explains once: a comment on
   an assigned issue, or one `regression` issue for a pipeline event. guard-revert stays the check that the inverse is
   exact.
6. **Log lines:** GitLab job logs put a timestamp and stream marker before every line (job 17217175501:
   `2026-10-15T22:23:08.315163Z 01O LOCUS_REPORT {...}`, one 3,228-character line). So the prompts say the line
   *contains* `LOCUS_...` and tell the agent to join parts of a split line.
7. **guard-scope also reads the committer.** Because `create_commit` lets the model set the author, an agent commit could
   carry a person's name and skip guard-scope. A commit is now the flow's when its author **or committer** (name or email
   local part) matches `agents.json`; the committer of an API commit is the account that called the API. This is
   stricter than contracts §7 ("checks the commit author"), not different. Shawki: say if you read it otherwise.
8. **`yaml` 2.9.1** is a dev dependency of `locus/` (exact pin, 11 Sep 2026). 2.6.1 was tried first and has
   [GHSA-48c2-rrv3-qjmp](https://github.com/advisories/GHSA-48c2-rrv3-qjmp). This changes `locus/package*.json`, a
   `library-impact` path.
9. **Freeze:** with `JUDGING_FREEZE=true`, library-recheck only logs, so no failed pipeline starts `locus-ops`. Also turn
   its trigger off (the custom flow's Trigger conditions toggle).

**Test Duo first: `locus-probe`** (`.gitlab/duo/flows/locus-probe.yml`). It's a one-off probe for the test bed only: not a Locus agent,
not in the video, never enabled in the team project. Started by a person's mention on an issue, it: reads the issue;
reads a job log and copies the `LOCUS_REPORT` text (D8); commits `probe/<iid>.txt` on `probe/<iid>` with
`create_commit`, then reads the commit's author and committer; deletes the file in a second commit; and posts one
note with each tool's result. Its writes are outside contracts §7 on purpose, on a throwaway branch, which is then deleted. Its
service account (`ai-locus-probe-...`) matches no `agents.json` pattern, so guard-scope counts its commits as a
person's. That's expected for the probe and is not evidence about the real flows.

**How Ashfaq runs it** (Claude Code never starts a flow, H6):
1. Test bed > **AI > Flows > New flow**: display name `locus-probe`, visibility Private, Flow; paste
   `.gitlab/duo/flows/locus-probe.yml`; **Create flow**. Then **Enable** in the same project with trigger **Mention**.
   Note the service account name it shows.
2. Open an issue (for example "Duo probe") and comment: `@<service account> job:
   https://gitlab.com/gitlab-ai-hackathon/transcend-october-2026/43396940/showcase/-/jobs/17217175501`
   (pipeline 2952980743's touchcheck job, which has a `LOCUS_REPORT` line).
3. Record here: whether the session started and finished, the session URL, the note, `git fetch gitlab probe/<iid>` +
   `git log --format='%an <%ae> | %cn <%ce>' gitlab/probe/<iid>` (author vs committer), whether the delete commit
   exists, and the Credits dashboard row (service account with an "Automated flow" badge, or Ashfaq). Then delete
   `probe/<iid>`.

**Running `locus-ops` end to end needs more than the YAML:** library-impact and library-recheck only fail when a
**shipped** graph (a `graph-<iid>-v<n>` tag) breaks, and the test bed has no tags and a `main` without our history.
Gate 5b therefore waits for S.3 Next item 0 and one released graph. Then: a person's MR with a seeded generator
regression (impact reviewer), merged anyway (recheck, bisect, detective).

## 16 Oct 2026 (f): first pipeline on GitLab, in Ashfaq's Showcase as a test bed (Ashfaq)

- **Projects.** Each participant has their own public Showcase:
  `gitlab-ai-hackathon/transcend-october-2026/<user id>/showcase`. Ashfaq (`Ashfaq909`, id 43396940) is Developer on
  his (project 87669530) through the group. Shawki's is `.../43384339/showcase` (project 87666718); Ashfaq has no access
  there yet. Both `main` branches hold only the organisers' `README.md`.
- **Decision (Ashfaq):** until Ashfaq is added to Shawki's project, his own Showcase is the test bed: remote `gitlab`,
  branch `feat/gate2-render` only (no tags, `main` untouched). It is not the submission project.
- **Access from this machine:** `glab` 1.123.0, signed in as `Ashfaq909` with Ashfaq's personal access token, kept in
  the OS keyring; Git uses `glab auth git-credential` for `gitlab.com` only. No token in the repo or any file (H8).
- **Pipeline 2952962152** (push of `b7e8b2bc`, shared runners) is the first Locus pipeline that ran in our account:
  - Passed: `render` (the example, print A, 100.0 x 100.0 mm), `touchcheck` (the example failed as expected, not a
    gate), `upstream-test` on Node 20 and 22, `semgrep-sast`, `secret_detection`. `guard-maths` and
    `guard-description` passed with **0 requests checked** (no `requests/` folder yet), so they show the jobs run, not
    that a graph passed.
  - `locus-test`: 176 of 182. The 6 failures (`cli/bundle.test.js`, `guards/cli.test.js`) were the runner's
    `CI_COMMIT_BRANCH` leaking into the tests' throwaway repos, so guard-scope saw `feat/gate2-render` instead of
    `graph/12`. Fixed: those tests (and `cli/monitor.test.js`) now drop every `CI_*` variable and `RELEASE_MODE`.
    All 22 new monitor and guard-revert tests passed on the runner, including `git bisect` in a worktree.
  - `guard-scope` failed closed (exit 2): no base commit, because a first push has no commit before it and the
    Showcase `main` shares no history with our branch. Correct behaviour; its message now says this. `bundle` was
    skipped because it needs guard-scope.
  - Not in this pipeline, as designed: `library-recheck` and `bisect-regression` (default branch only),
    `library-impact` (MRs), `guard-revert` (`revert/*`).
- **Pipeline 2952980743** (push of `cc69d522`): all 9 jobs passed. `locus-test` 182 of 182 on the runner. guard-scope
  checked only the 1 commit since the previous push (`b7e8b2bc`, by a person), not the branch; `bundle` and the
  guards had 0 requests. So the jobs run on GitLab; no graph has been through them there yet.
- **Open:** the Showcase `main` needs our history before MRs and guard-scope can work there (Shawki's working repo
  `main` pushed over the organisers' README, or code imported into Shawki's project). That changes `main`, so it waits
  for Ashfaq's and Shawki's go-ahead.

## 16 Oct 2026 (e): group access and credits (reported by Ashfaq)

- The team has group access for the hackathon, and the Duo credits are there (15 Oct: "No credits remain for this
  billing period"). Reported by Ashfaq on 16 Oct; no flow has run in our account yet, so nothing is claimed as working
  (H3). Gate 5 is no longer blocked on credits; it still records whose credits a triggered flow uses.
- `docs/contracts.md` §10 still lists "credits for triggered flows" as waiting; it is left as written (H5) until Gate 5
  answers whose credits are used.

## 16 Oct 2026 (d): library-impact, library-recheck, bisect-regression and guard-revert (Gate 5b code, Ashfaq)

No change to `docs/contracts.md`. This is how the four jobs follow §6 and §7 and plan §11 and S.4 steps 9 and 10. The
agents that read their output (impact reviewer, regression detective in `locus-ops`) are not built yet.

- **Order.** library-impact and library-recheck are one operation, so neither comes first: `locus recheck` re-checks
  every shipped graph with the code of the checkout it runs in, and `--impact` only changes the output
  (`out/impact/report.json` + `LOCUS_IMPACT` instead of `out/recheck/report.json` + `LOCUS_RECHECK`). bisect-regression
  reuses the same per-graph check (`locus/cli/shipped.js`), so "fails" means the same thing in all three.
- **Shipped graph** = the newest release tag `graph-<iid>-v<n>` of a request (D5), re-checked from the request files
  **at that tag**, i.e. what was released. A request with no release tag is not shipped and is left to the render and
  touchcheck jobs.
- **Fails** = render exits non-zero, or touchcheck fails a rule or cannot run. Not guard-maths: the plan says re-render
  and touch-check. (Open: re-checking the maths too would also catch a generator bug that draws a well-spaced but
  wrong curve.)
- **Report fields** (contracts §6 names the file and the log line, not the fields): `kind` (`recheck` | `impact`),
  `commit`, `pipelineId`, `pass`, `graphs: [{ requestId, releaseTag, releaseCommit, pass, stage?, error?, failures }]`.
  `failures` are the report's failing results (`rule`, `message`, `measuredMm`, `requiredMm`, `at`). Exit 0 = all pass
  or nothing shipped, 1 = a shipped graph fails, 2 = a release tag lacks its request files.
- **bisect-regression** reads `out/recheck/report.json` (it must be for HEAD) and, for each failing graph, runs
  `git bisect run` between the graph's release commit and HEAD in a separate worktree (the job's checkout is not
  touched). Each step renders and touch-checks the released request files with **that commit's own CLI**, so a commit
  that changed the generator, a touchcheck rule or a profile is found alike. Both ends are tested first: if the graph
  also fails at its release commit, or passes at HEAD, no commit is named (H3). Output: `out/bisect/report.json` +
  `LOCUS_BISECT` line: per graph `goodCommit`, `firstBadCommit`, `subject`, `authorName`, `merge`, `paths`,
  `failures`, `steps` (every commit tested and its verdict) and `revertBranch` = `revert/<full sha>`; `commits` groups
  the graphs by first bad commit. Exit 0 = a commit named for every failing graph, 1 = not for all, 2 = no or stale
  re-check report.
- **Dependencies per step:** when a commit's `locus/package*.json` and `packages/` equal HEAD's, the step uses the job's
  `locus/node_modules` (through `NODE_PATH`); otherwise it runs `npm ci` in the worktree. **The `npm ci` path is not
  covered by the tests** (no commit in the test range changes dependencies).
- **guard-revert = the diff reversed**, which is stricter than "contents equal to `<sha>^`": the branch holds one plain
  commit; `<sha>` is on the default branch and has a parent; the commit changes exactly the paths `<sha>` changed; and
  for each path the branch's base still holds `<sha>`'s version (mode + blob) and the commit puts back the version from
  before `<sha>`. So when a later commit changed one of those files, no exact inverse exists and the guard blocks, even
  a clean `git revert`; a person reverts it, or the detective files re-layout requests (D6). guard-revert does not
  re-prove that `<sha>` is guilty: bisect named it on `main`, and library-impact on the revert MR shows whether the
  shipped graphs pass again.
- **guard-scope refined** (16 Oct (b) said agents may not delete files): on `revert/<sha>` an agent may delete a file
  only if `<sha>` added it, because that delete is the inverse. **Open (Gate 5):** whether Duo's `create_commit` can
  delete a file at all.
- **CI:** `guard-revert` on `revert/*` MR and branch pipelines; `library-impact` on MRs changing exactly the contract's
  paths (`locus/core/**`, `packages/**`, `package*.json` at the root and in `locus/`); `library-recheck` on every
  default-branch pipeline (pushes and the nightly schedule Shawki sets up); `bisect-regression` after it fails
  (`needs: library-recheck`, `when: on_failure`). With `JUDGING_FREEZE=true`, library-recheck is `allow_failure` (it
  only logs, so the pipeline does not fail and no flow starts) and bisect-regression does not run (plan §14).
- **Proposal (needs both, H5):** a shipped graph's result also depends on `locus/touchcheck/**` and `profiles/**`, which
  contracts §6 does not list for library-impact. Add them? Until then the job follows the contract; library-recheck on
  `main` still catches such a change after merge.
- **Checked locally only** (H3): `locus/cli/monitor.test.js` builds a throwaway repo carrying its own copy of `locus/`
  and `profiles/`, releases print B as `graph-12-v1`, then a person's commit (between unrelated ones) makes the curve
  0.6 mm wide. library-recheck fails it on TL-5 (0.6 mm, needs 1 mm); bisect tests both ends and the steps and names
  that commit; its `git revert` passes guard-revert and guard-scope and library-impact passes again; a near-inverse,
  an extra file, a second commit and a revert after a later edit of the same file are blocked; a graph that fails at
  its own release commit gets no commit named. None of these jobs has run on GitLab yet: `needs:` with
  `when: on_failure` and `git worktree` on the runner are untested there.

## 16 Oct 2026 (c): the bundle job and manifest (Ashfaq)

No change to `docs/contracts.md`. This is how `locus bundle` and the `bundle` CI job follow §3, §5 and §6.

- **Zip name.** Plan §9 says `graph-<iid>.zip`; contracts §3 says `out/bundle/graph-<iid>-v<n>.zip`. The code follows
  the contract (H5). Shawki: plan §9 can say `graph-<iid>-v<n>.zip` to match.
- **Where each manifest field comes from** (nothing is typed in by hand):

  | Field | Source |
  |---|---|
  | `artifactId`, `brailleId`, `requestIssue` | `spec.json` `requestId` + the version `<n>` |
  | `sourceCommit` | `CI_COMMIT_SHA`, else `git rev-parse HEAD` (a warning if the request folder has uncommitted changes) |
  | `pipelineId` | `CI_PIPELINE_ID`, else 0, which means "built outside a pipeline" |
  | `generatorVersion` | `locus/package.json` `version`, now 0.1.0 (was 0.0.0; 0.1.0 is the first version that makes bundles) |
  | `profile` | `profiles/<profileId>.json` `id` + `version` |
  | `hashes` | sha256 of the bundled `graph.stl`, `graph.svg`, `description.txt` (the render job's bytes, copied unchanged) |
  | `touchcheck` | `touchcheck-report.json`: `pass`, and `attempts` = the report's `attempt` |
  | `guards` | `pass` in `out/guards/scope.json`, `maths-<name>.json`, `description-<name>.json` |
  | `agentSessions` | `--agent-session <url>` (repeatable); empty for now, see the open point below |
  | `releaseMode` | `--release-mode`, else `RELEASE_MODE`, else `hands-off`. The pipeline sets `RELEASE_MODE: "hands-off"` |
  | `releaseTag` | always `null`; the `release` job fills it in (§5) |

- **No bundle for a failed check.** If touchcheck or any of the three guards did not pass, `locus bundle` refuses
  (exit 1) and says which. A missing or stale input (no guard file, a report for another request or profile, folder
  number not equal to `requestId`) exits 2. So in a real bundle `touchcheck.pass` and every `guards` value are true:
  they record that the checks ran and passed. In CI the job `needs:` render, touchcheck and the three guards anyway.
- **Version `<n>`** = the newest release tag `graph-<iid>-v<n>` + 1 (D5: the `release` job creates that tag). If the
  request folder is unchanged since that tag, there is nothing new to bundle (exit 0), so a `main` pipeline does not
  re-release every old graph. The job fetches `refs/tags/graph-*` explicitly. `--bundle-version <n>` overrides.
- **README.txt**: print at 100% scale; the size the slicer must show, read from the STL's vertices (100.0 x 100.0 x
  3.6 mm for print B); the settings the prototype prints used (`tools/prints/README.md`: PLA, 0.12 to 0.16 mm
  layers, flat, no supports); triangle top-left, braille ID top-right; what each file is; the limitations line.
- **Zip**: our own small writer (`locus/core/zip.js`, deflate, no new dependency). Entries sit in a
  `graph-<iid>-v<n>/` folder and carry the source commit's time (UTC), so the same commit gives the same zip. Checked
  with Info-ZIP `unzip -t` (in the tests when installed) and Python's `zipfile`.
- **Where it runs**: MR and branch pipelines (not schedules). On an MR the bundle is a preview artifact; on `main` it
  is what `publish-package`, `release` and `deploy-staging` take (§6).
- **Local runs**: guard results are read from `out/guards/`, which the bundle can't date. Delete `out/` before a local
  chain; CI jobs always start clean.
- `fixtures/touchcheck/good-print-b/` now has `request.lock.json`, so the whole chain runs on it locally:
  `locus bundle fixtures/touchcheck/good-print-b` gives `graph-0-v1`, the D9 sample name. Run its guards with
  `--base HEAD`: with the default base, guard-maths rightly blocks it (the lock was added after this branch's first
  commit, as a fixture, not by an intake agent), and the bundle is refused.
- The guards' `git` helper now captures git's stderr (it is still in the error), so expected failed probes don't
  print `fatal:` lines. `listCommits` now reads a commit's changed paths only when used (agent commits only):
  guard-scope over this branch's 2,136 commits (the JSCAD import) went from minutes to under 2 seconds locally.
- **Open (Gate 5):** how a flow's session URL reaches the bundle job for `agentSessions`. Until a flow has run in our
  account, the list stays empty rather than holding a made-up link (H3).

## 16 Oct 2026 (b): guards scope, maths and description (Gate 8, Ashfaq)

- **Agent identity is the commit author.** Each flow's service account is `ai-<flow>-<group>` (15 Oct (b), row 10), so
  `locus/guards/agents.json` matches `ai-locus-request-` and `ai-locus-ops-` against the author name or email local
  part. **Unconfirmed:** Gate 5 must record the real author of a `create_commit` commit.
- **Intake vs fixer** share one service account (`locus-request`), so the commit's place decides: the first commit on
  `graph/<iid>` is intake's (contracts §7, "first commit"), every later one is the fixer's (`layout.json` only).
  `locus-ops` agents are told apart by branch: `rollback/<n>` (release guard), `revert/<sha>` (regression detective;
  paths limited to those `<sha>` changed until `guard-revert` checks the content). Agents may not delete files or merge.
- **People's commits are not checked by guard-scope**; CODEOWNERS and protected branches cover them. They are counted
  in the output, so a person editing a `graph/*` branch during a recorded run is visible.
- **guard-maths checks what was rendered, with its own arithmetic** (Horner and the derivative written again in the
  guard), not `locus/core`: a generator bug can't pass its own check. Every curve point is mapped back with the
  layout's scales and must lie within 0.000001 mm of the locked polynomial; marks must be on the curve, at slope 0 for
  a vertex or turning point, at y = 0 for an x-intercept, at x = 0 for the y-intercept.
- **The lock's history** is checked too: written in the branch's first commit and never again (or not at all if it
  already existed at the base).
- **guard-description reads free text**, because the plan says an agent may write the description. Allowed numbers:
  coefficients (signed or not), powers up to the degree after `^`, domain ends, marked point values, the braille ID.
  A value matching only after rounding to 2 decimals must be preceded by "about". Numbers written as words are not
  checked.
- **Fail closed:** a guard that can't find its base commit or inputs exits 2, which fails the job.
- **guard-revert** waits for `bisect-regression` (Gate 5b).

## 16 Oct 2026: code brought in line with plan v3 and contracts v1 (Ashfaq)

No change to `docs/contracts.md`. These are how the code now follows it, and what that replaced.

**Generator (D1 to D4).**
- Profile `fdm-handheld-v1` lives at `profiles/fdm-handheld-v1.json`, exactly as contracts §2. `fdm-3d-v1` is gone.
- `locus/core` now builds plates the way `tools/prints/prints.js` does: 100 x 100 x 2 mm plate, placement rule, tick
  rules, letters a, b, c next to the points, braille ID top-right, orientation triangle top-left, one boolean union,
  and Shawki's T-junction fix for a watertight STL. `core/prints.test.js` renders A, B and C from their spec + layout
  files and compares the STLs with `tools/prints/`: A and B are byte-identical after the 80-byte header; for C every
  triangle has exactly the same vertices, and only the stored normals of a few sliver triangles differ. Reason: our
  turning points are exact (x = 1 and 3) where `prints.js` finds them numerically, which changes float64 noise below
  float32 precision. Slicers recompute normals from the vertices.
- The example (`examples/projectile.*`) is the demo request with the default layout, which is print A (D4).
- **Added beyond the prints:** if open edges remain after the T-junction fix, vertices on them closer than 0.001 mm
  are welded and the fix runs again. Print B with the grid turned back on needed it: one point had two ids, 0.00003 mm
  apart, on either side of the 0.0001 mm rounding step. A, B and C never reach this step, so their bytes are unchanged.
- Point ids (the keys of `labelOffsets`): `turning-point-1`, `turning-point-2` as in `layout-C.json`; `x-intercepts`
  gives `x-intercept-1`, ... . A spec may not ask for `x-intercepts` together with `x-intercept+` or `x-intercept-`.
- Key mode keeps the letters at the points and adds a key (letter + value) in the bottom-left corner. **Open
  question (Shawki):** labels are single letters now, so switching to key mode no longer makes labels smaller. It is
  still listed as a fix for TL-2 and TL-3 (plan §10), but it rarely helps. Keep it, or drop it from `remedies.json`?

**touchcheck.**
- Rule values come from the profile's `rules` (`minLineGapMm`, `minLabelClearanceMm`, `minLabelPointClearanceMm`,
  `minFeatureWidthMm`, `edgeMarginMm`).
- TL-1 now measures the curve against every other line, as plan §10 says ("curve and axis/grid"), not every pair of
  lines. A line end inside the unavoidable stretch next to a real crossing is now excused. The 14 Oct rule failed it as
  a stub, but print B's curve ends just past the x-axis at both ends, and the prints' check (`prints.js`) excuses that
  stretch. This applies to every request, not only print B.
- TL-2 measures every label (letters, key rows, braille ID) to every line (6.4 mm) and to every point, its own
  included (3.2 mm). Labels running off the plate are now TL-5 (edge margin), as in the prints' check.
- TL-5 is now the edge margin and the feature width on the fixed plate. There is no bed check: the plate is the bed limit.
- Results on the prints match `tools/prints/README.md`: A fails TL-1 (curve on grid line y = 3 at the vertex), TL-2
  (label b on the curve) and TL-5 (label c 2.31 mm from the edge); B and C pass. Measured values differ slightly from
  `report.json` where the methods differ: for example the closest TL-1 gap on C is 3.23 mm here and 4.5 mm in
  `prints.js`, because our excused stretch around a crossing is shorter.
- Report format is contracts §4: `requestId`, `attempt`, `profileId`, `pass`, `results`. A passing rule gives one
  `{ rule, pass: true }`; a failing rule gives one result per place, with the rule's plain words from plan §10,
  `measuredMm` and `at` to 0.1 mm, and `allowedFixes` from `remedies.json`. The CLI prints it after `LOCUS_REPORT `.
  The CI job passes `--attempt` = number of commits that changed the request's `layout.json`.
- `remedies.json` ids: `rescale-x`, `rescale-y`, `hide-grid`, `move-label`, `key-mode`, `reduce-scale` (the contract
  example uses `rescale-y` and `hide-grid`).

**Other.**
- Manifest schema is contracts §5 (`artifactId`, `brailleId` = `G` + issue number, ...). Our 14 Oct sample bundle in
  `fixtures/bundle-sample/` was in the old format, so it is removed. `fixtures/bundle-sample/graph-0-v1/` from print B
  is Shawki's task (S.3, D9).
- Flow drafts: the four files became `locus-request.yml` (intake + fixer) and `locus-ops.yml` (triage, impact reviewer,
  regression detective, release guard), still marked as drafts until Gate 5.
- `docs/STATE.md` is removed; the status board is `projectLocus.md` S.3. `CLAUDE.md` carries S.2's hard rules word for word.
- H1: the `Co-Authored-By` lines were removed from our four unpushed commits (messages only; content and authorship unchanged).

**Superseded from 14 Oct:** `fdm-3d-v1` and its values (180 x 180 bed, 2.0 mm curve, NLS 800 cell size), separate
shells instead of a union, value labels next to points, braille ID `L<iid>-<n>`, the TL-2 rule that skipped a label's
own mark, the report fields `note`/`subject`, and the line-end stub rule inside an excused stretch.

---

## 16 Oct 2026: GitLab's answers to our follow-up questions (Discord)

| Question | GitLab's answer | What we do |
|---|---|---|
| Teammates added to the project? | `ashfaq909` and `nourin.richi.2026` are **not** in the hackathon group and have no workspace yet | Each confirms they submitted the form at [contributors.gitlab.com/transcend-hackathon](https://contributors.gitlab.com/transcend-hackathon), or submits it now. If they already did, they send GitLab the time they submitted. Until Ashfaq is provisioned, the Gate 5 test runs in Shawki's account, with Ashfaq pairing on a screen share |
| "No credits remain" in Duo Chat | Set the Transcend group as the **default GitLab Duo group** at [gitlab.com/-/profile/preferences](https://gitlab.com/-/profile/preferences) | Shawki sets it now; each teammate does the same once provisioned |
| Credits for triggered flows | They run as the flow's service account and are billed at **namespace level**, separate from personal credits. GitLab can't confirm the pool size | Gate 5 is the first test of whether triggered flows run at all. Keep the number of runs low (no polling loops, early exit in `locus-ops`). If triggered runs fail for credits, test whether starting the flow from Agentic Chat (slash command) runs on personal credits, and ask GitLab before relying on it |
| `run_command` / `edit_file` / `read_file` in CI flows | **Available.** Use `create_commit` to commit through the API | D8 becomes: the fixer runs `touchcheck` itself with `run_command`, edits `layout.json` with `edit_file`, and commits each attempt with `create_commit`. The `LOCUS_REPORT` log line stays as the audit record and fallback |
| Can a flow merge? | Yes, through the merge request API; there's no dedicated merge tool | **Keep D7:** the deterministic `auto-merge` CI job merges, because only a fully green pipeline should decide. Agent merging is a fallback only |
| Secret FP Detection, Breaking Change Resolution | Both in the AI Catalog; enable them from **AI > Flows** | Shawki enables both now (T2.9) |

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
