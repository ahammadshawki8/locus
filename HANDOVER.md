# Locus handover (20 Oct 2026, Ashfaq)

For Shawki, who leads from 21 Oct (`projectLocus.md` §15). This file says what exists, what has really run, what is
flaky and how to re-run it. It does not repeat the plan: rules are in `projectLocus.md` S.2, the status board in S.3,
interfaces in `docs/contracts.md`, and every decision with its evidence in `docs/decisions.md`. Finished on 20 Oct
(Gate H checklist, §15.4, in section 11); keep it true after that.

## 0. Shawki: start here

New to the flow? Read [docs/how-it-works.md](docs/how-it-works.md) first: the whole system in diagrams, no code, and
three ways to test it yourself.

**State on 20 Oct:** Ashfaq's part is done and has run on GitLab. One email in, the agent writes the request, the
pipeline renders and touch-checks it, the agent fixes its own layout, and the requester gets the print files back by
email (issue #7, section 2). What is left is the release side you own, the move to the team project, and the freeze.
Rules that bite: `projectLocus.md` S.2 (H1 commit as yourself, no AI co-author lines; H2 no emojis or long dashes; H3
never fake a pass; H6 Claude Code never starts a flow; H12 freeze).

**Your tasks, in order:**
1. **Merge [PR 1](https://github.com/ahammadshawki8/locus/pull/1)** (`feat/gate2-render` into the working repo's
   `main`, merge commit only, 16 Oct (i)).
2. **Merge [MR !1 in your Showcase](https://gitlab.com/gitlab-ai-hackathon/transcend-october-2026/43384339/showcase/-/merge_requests/1)**
   (S.3 Next item 0; opened by Ashfaq on 20 Oct, you are the reviewer). Branch `locus/import` holds exactly
   `feat/gate2-render` joined to your project's first commit, so the merge is a fast-forward and replaces only the
   organisers' template README. Then check that the first `main` pipeline is green (job `locus-test`).
3. **Set up the agent in your project** (section 13). Until then every run happens in Ashfaq's test bed, which is fine
   for the video.
4. **Build the release side** you own (S.4 steps 6 to 8, contracts §6, §8, §9): `auto-merge` (or decide supervised),
   `publish-package`, `release` (tag `graph-<iid>-v<n>`), Cloud Run staging and production, `reply-teacher`. When the
   release exists, the reply should link the release and the graph page instead of the pipeline files (20 Oct (d)
   item 3). Never hand-make a tag or manifest.
5. **README and video** (yours): the README now has a "See it working" section with the #7 links; polish it. The
   video follows Part V; issue #7 is the run to film (or a fresh one).
6. **Around 25 Oct: one fresh demo run** (section 9), so its links, MR and session are recent through judging (agent
   sessions are deleted 30 days after their last activity).
7. **At 27 Oct, 13:00 UTC: freeze** (section 14). Switch off every flow trigger; GitLab said a flow that fires during
   judging could commit to the repo and put our eligibility at risk.
8. **Questions only Devpost can answer** (licensing, app scope, whether autonomous rollback counts as Hands-off): the
   Devpost forum, not GitLab (20 Oct (f)).

**Decisions that need both of you:** section 12.

## 1. Where things are

| What | Where |
|---|---|
| Product code | Ashfaq's fork `ashfaqstu/locus`, branch `feat/gate2-render`; [PR 1](https://github.com/ahammadshawki8/locus/pull/1) into the working repo `ahammadshawki8/locus` (merge commit only), not merged |
| GitLab test bed | Ashfaq's Showcase, `gitlab-ai-hackathon/transcend-october-2026/43396940/showcase` (project 87669530). Ashfaq is a Developer there, not a Maintainer. `main` holds our code (fast-forward merges `3e0af8ea`, `820fd236`, then `b011f52c` on 20 Oct, pipeline 2968090159 green) |
| Team project | Shawki's Showcase, `.../43384339/showcase` (project 87666718). Ashfaq and Nourin are Developers there (20 Oct (c)). Our code is not in it yet: `main` is protected and holds the organisers' README only (S.3 Next item 0) |
| Flows | `.gitlab/duo/flows/locus-request.yml` (intake, fixer, refuse), `locus-ops.yml` (impact reviewer, regression detective; release guard routes to end), `locus-probe.yml` (test only). The repo file is the source of truth; it is pasted into the AI Catalog unchanged |
| Request form | `.gitlab/issue_templates/graph-request.md`: function, x range, points to mark, then `/label ~locus-request` and `/assign` to the flow's service account (20 Oct) |
| Pipeline | `.gitlab-ci.yml`: render, touchcheck, guard-scope, guard-maths, guard-description, guard-revert, library-impact, library-recheck, bisect-regression, bundle, upstream-test, locus-test, plus GitLab's Secret Detection and SAST templates |

## 2. What works, seen in our account (H3)

Each line links to the `docs/decisions.md` entry that holds the evidence.

- **Pipeline:** on test bed `main`, every job that ran passed (pipeline 2955199583: 12 jobs, 16 Oct (m); pipeline
  2955873544: 11 jobs, 16 Oct (o)). `bisect-regression` was skipped both times: it runs only after a failed recheck,
  so it has run locally and in tests, not on GitLab.
- **locus-request, four real runs:**
  - Issue #3, started by **assign**, MR !1, session 9601992: attempt 1 red, the agent's own layout fix, attempt 2
    green, bundle `graph-3-v1` (16 Oct (m)).
  - Service Desk ticket #5, started by a **mention**, MR !3, session 9616199: same shape, bundle `graph-5-v1`, and the
    requester's inbox got the Support Bot thank-you and both agent notes (16 Oct (o) item 7).
  - Issue #7, **one email, no comment** (20 Oct (e)): an email to the personal "Email a new issue" address ending
    with `/assign @ai-locus-request-gitlab-ai-hackathon`, session 9753341, MR !5: red, the agent's fix, green, and the
    pass note with the bundle zip and STL links (both download signed out), about 8.5 min after the email. **This is
    the demo.**
  - Issue #6, started by **assign**, MR !4, session 9633187: the **refusal path**. y = (x - 1)^2 touches the x-axis
    at its vertex, which TL-1 can never pass; attempts 1 to 3 red, then label `cannot-make-readable` and a plain
    refusal note, no bundle (17 Oct (b)). Use this request again whenever a refusal must be shown.
- **guard-scope** reads the commit author: agent commits carry the flow's display name (`locus-request`), 16 Oct (l).
- **agentSessions** in the manifest come from the `Locus-Session:` trailer on agent commits (16 Oct (j), (m)).
- **locus-probe** (16 Oct (l)): a flow can read a job log, commit and delete a file.
- **render's mesh fallback** (20 Oct): when the JSCAD union leaves open edges, Manifold unions the same parts. Tested
  locally (tests and a sweep) and in CI (pipeline 2967480283, 232 of 232, 20 Oct); on test bed `main` since `b011f52c` (20 Oct), not yet used by a flow run.

## 3. What has not run yet

- In `locus-request`: the needs-info question, the `exists` answer, a pass on attempt 1 or 3, an immediate refusal
  (a rule with no allowed fix) and the BROKEN note (17 Oct (b) lists the routes that ran).
- The refuse prompt's per-rule suggestions (20 Oct): pasted into the AI Catalog with the pass-note change (Ashfaq's
  report, 20 Oct (e)); no refusal has run since.
- The issue template route (file from the template on the website; its `/assign` starts the flow): the template is
  on test bed `main` since `b011f52c`; the same quick action ran by email on #7, the template itself has not run.
- Service Desk from any address with the start given by replying to GitLab's new-ticket email (20 Oct (e)).
- `locus-ops` (impact reviewer, regression detective): written and schema-checked, never created in the AI Catalog.
- Not built: `auto-merge`, `publish-package`, `release`, `deploy-staging`, `validate-staging`, `promote-production`,
  `post-deploy-smoke`, `reply-teacher`, the release guard, `license-check`. No graph has been merged or released, so
  no `graph-<iid>-v<n>` tag exists and `library-recheck` has nothing to re-check.
- Credits per run: nothing appeared on the Credits page for Ashfaq (a Developer); unknown whether a Maintainer sees more.

## 4. Flows, service accounts and triggers

| Flow | Display name (must be exact, `locus/guards/agents.json`) | Service account | Trigger seen working |
|---|---|---|---|
| `locus-request` | `locus-request` | Test bed: `ai-locus-request-gitlab-ai-hackathon`. **Team project: `ai-locus-request-gitlab-ai-hackathon_b127f8`** (21 Oct) | Assign on an issue (#3, #6); mention on a Service Desk ticket (#5) |
| `locus-probe` | `locus-probe` | `ai-locus-probe-gitlab-ai-hackathon` | Mention (#2) |
| `locus-ops` | `locus-ops` | not created | none |

- GitLab refuses to assign a flow's service account to a Service Desk ticket ("Cannot assign"), so on a ticket a person
  mentions the account in one comment, for example `@ai-locus-request-gitlab-ai-hackathon please make this graph.`
- The template's `/assign` names `ai-locus-request-gitlab-ai-hackathon`. If the flow is created again in another
  project and GitLab gives its service account another name, change that line (and its test, `locus/issue-template.test.js`).
- "Work item created" is not used: it would start the flow on every new issue, not only on requests.
- Flows start only on a person's action. Claude Code never starts one (H6).
- To change a flow: edit the repo file, run `node locus/flows/check.js` (exit 0), then paste the whole file into the
  flow's AI Catalog entry, replacing the old YAML.
- **No `.gitlab/duo/agent-config.yml`** (decided 20 Oct): every flow is `coding_environment: none` with GitLab API
  tools only, so an image, setup script or cache would do nothing. GitLab says `run_command` works in CI flows
  (20 Oct (c)); if a flow ever uses it, this and `locus/flows/check.js` are reopened together.

## 5. Service Desk

- Enabled on the test bed. **Use the `incoming+<project slug>-<id>-issue-@incoming.gitlab.com` address.** The
  `contact-project+...-issue-@incoming.gitlab.com` address that GraphQL returns as `serviceDeskAddress` created no
  ticket (two emails, 16 Oct (o)). GitLab's answer (20 Oct): the `contact-project+` address works only if it is
  exactly the one shown in Settings > General > Service Desk; that page needs Maintainer access, so it is unchecked.
- A ticket is a confidential work item of type Ticket, author `support-bot`. Notes on it are emailed to the requester
  by the Support Bot.

## 6. Release mode

**Hands-off** (`RELEASE_MODE: "hands-off"` in `.gitlab-ci.yml`, recorded in every manifest): the `auto-merge` CI job
is meant to merge a fully green `graph/*` MR. Supervised (one approval before production) is the fallback
(S.4 step 6). Neither has happened: `auto-merge` is not built, so no MR has been merged in either mode. Its owner is
S.3 Next item 13.

## 7. CI variables (names only, H8)

- `RELEASE_MODE` (`hands-off` or `supervised`), set in `.gitlab-ci.yml`, recorded in every manifest.
- `LOCUS_GITLAB_TOKEN` (20 Oct, Shawki): masked and hidden, not protected (MR pipelines need it). Shawki's legacy
  personal access token, scope `api`, expires 30 Nov 2026. Used only by `auto-merge` and `reply-teacher`, the two calls
  the job token cannot make; GitLab shows them under Shawki's name. Project access tokens are not available in the
  hackathon workspace (GitLab, `docs/decisions.md` 20 Oct (i)). Revoke it after judging.
- `GCP_PROJECT_ID`, `GCP_REGION`, `GCP_WIF_PROVIDER`, `GCP_SERVICE_ACCOUNT`: set in `.gitlab-ci.yml`, not secrets
  (`deploy/gcp/README.md`). Google Cloud login is keyless (Workload Identity Federation).
- Print orders (optional, off by default; `locus/release/print-order.js`, `docs/decisions.md` 21 Oct (l)):
  `PRINT_ORDER_ENABLED` (`true` to send), `PRINT_ORDER_TO` (the print shop), `PRINT_ORDER_FROM` (the sending account),
  `PRINT_ORDER_SMTP_PASSWORD` (that account's app password: masked and hidden), and optionally `PRINT_ORDER_REPLY_TO`
  (usually the teacher), `PRINT_ORDER_COPIES` (default copies when the request does not say; a request that says
  "Printed copies needed: 0" gets no order) and `PRINT_ORDER_SMTP_URL`
  (default `smtps://smtp.gmail.com:465`). Not set yet; no order has been sent (H3).

## 8. Flaky or limited, and how to re-run

- **render, open meshes:** the JSCAD union sometimes leaves edges its repair cannot close (overlapping marks or
  labels, very steep cubics; 16 Oct (n)). Since 20 Oct render then unions the same parts with Manifold
  (`locus/core/manifold.js`, a child process) and logs "the manifold fallback closed it". If both fail, render
  throws and in a flow run the fixer reports BROKEN. Re-run locally with `npm run locus -- requests/<iid>`.
- **GitLab.com outages** cut off three sessions on ticket #4 (16 Oct (o)). A new mention on the same ticket does not
  restart it (intake answers `exists`); file a fresh request instead.
- **A session dropped mid-run** leaves the MR open and red. Close it with a note; never finish it by hand (H3, H6).
- **HTML comments in the template** stay in the raw issue text that intake reads. They hold no numbers, so they cannot
  be read as a request; a teacher who leaves a part empty gets the needs-info question or Locus's own x range.

## 9. Run the loop yourself (Gate H)

Local, from a fresh clone (Node 20 or later):
1. `npm --prefix locus ci`, then `npm run test:locus` (all pass) and `node locus/flows/check.js` (exit 0).
2. `npm run locus -- examples/projectile.json`, then `npm run locus -- touchcheck examples/projectile.json`: read the
   `LOCUS_REPORT` line and open `out/projectile/overlay.svg`.

On GitLab (needs Developer access to the project where `locus-request` is enabled; today only the test bed). This is
the demo: one email in, the print files back by email (`docs/decisions.md` 20 Oct (d)).
1. Email a request (one polynomial, its x range, the points to mark) from any mail account to the project's
   `incoming+...` address. A confidential ticket appears and the sender gets the Support Bot's thank-you.
   Or, as a project member, mail your personal "Email a new issue" address (Issues page, three-dot menu) with
   `/assign @ai-locus-request-gitlab-ai-hackathon` as the last line of the body; then skip step 2 (ran on #7,
   20 Oct (e); the replies go to your GitLab account's notification address).
   That address holds a personal token: never paste it into the repo or a log (H8).
2. On the ticket, comment `@ai-locus-request-gitlab-ai-hackathon please make this graph.` A session starts.
3. Watch MR `graph/<iid>`: attempt 1 is the default layout; the fixer commits until touchcheck passes (at most 3), or
   refuses with `cannot-make-readable`.
4. The pass note, emailed to the sender, starts "Your tactile graph is ready to print." with two links that work
   without signing in: the whole bundle (zip) and the STL alone, plus the checks and the braille ID. Open both links
   once from a signed-out browser.
5. Never fix anything by hand during a run (H6). Record what happened in `docs/decisions.md`, read from GitLab.

## 10. Answers from GitLab so far

- **15 Oct (office hours, `docs/decisions.md` 15 Oct (a)):** every trigger needs a person's action (not bots,
  service accounts, other flows or schedules); a person's push or merge to `main` qualifies; CI comments count only
  if a person wrote them; a `git revert` MR is not a documented flow capability; credits are personal.
- **20 Oct (Discord, `docs/decisions.md` 20 Oct):** the `contact-project+` address works only when it matches Settings
  exactly; whether a flow's service account can be assigned to a ticket is not confirmed, and GitLab asked for the
  exact error.
- **Shawki's thread (`docs/decisions.md` 20 Oct (c)):** set the Default GitLab Duo group to the Transcend October 2026
  subgroup for Duo Chat credits. Triggered flows bill the namespace, not a person, and the pool size is unknown.
  GitLab says `run_command` and the file tools work in CI flows; that is not shown, and no Locus flow uses them.
  Flows can merge only through the API, so `auto-merge` stays a CI job. Secret FP Detection and Breaking Change
  Resolution can be enabled from AI > Flows.
- Still open: S.3 "Waiting on GitLab".

## 11. Gate H checklist (§15.4), state on 20 Oct

| Item | State |
|---|---|
| Gates 0 to 8 pass, or failures written down with the fallback | Passed: 1 (code side; the MIT licence in the GitHub About box not checked here), 2, 5 (twice, plus the refusal), 6, 7, 8. Partly: C (contracts final; `fixtures/bundle-sample/` not generated, S.3 Next item 3), 3 (prototype prints made, H9), 7b (calibration piece judged good; results not recorded, item 4). Not yet: 4 (booked, not spoken to), 5b (needs item 0 and a release tag), 6b (Shawki). 0: not checked here |
| Shawki ran the full loop alone from a fresh email | Not yet: Shawki has no access to the test bed, and our code is not in the team project (S.3 Next item 0; Ashfaq can help there as a Developer since 20 Oct) |
| `/msr-session-start` gives an accurate summary on Shawki's machine | Not checked |
| This file covers what §15.4 lists | Yes (sections 2 to 10); Tier 2 status below |
| Shawki has Maintainer, Duo flow access and the Service Desk mailbox | Not yet (needs item 0); no secrets exist yet |
| Practitioner notes and print contacts in `docs/` | Not yet: the practitioner talk has not happened (Gate 4) |
| Walkthrough call recorded | Not yet |

**Tier 2 status:** none built. T2.5 (Code Review flow) and T2.9 (SAST flows) are switched on in the test bed; whether
they ran on our MRs is not recorded. T2.1 to T2.4 and T2.6 to T2.8 are not started (`locus/site/` holds a README only).

## 12. Decisions that need both of us

S.3 Next items 0, 9, 10, 11, the owner of `auto-merge` (item 13), and the contracts §10 wording proposed in
`docs/decisions.md` 20 Oct (c) item 7.

## 13. Moving the agent to the team project

Do this after task 2 (our history on your `main`). Every step is a person's setup action, not an agent action.
1. **Labels:** create `locus-request`, `needs-info`, `cannot-make-readable` (contracts §7; `incident` and
   `regression` when the release guard and detective exist).
2. **Service Desk:** Settings > General > Service Desk, enable it. Use the `incoming+...-issue-@incoming.gitlab.com`
   address shown there (section 5).
3. **Create the flow:** AI > Catalog (or AI > Flows) > new custom flow. Display name **exactly** `locus-request`
   (`locus/guards/agents.json` matches it; another name makes guard-scope block every agent commit). Paste the whole
   of `.gitlab/duo/flows/locus-request.yml`. Run `node locus/flows/check.js` first (exit 0).
4. **Enable it in the project** with the triggers **Assign** and **Mention** (not "Work item created", section 4).
   Note the service account GitLab creates. If its name is not `ai-locus-request-gitlab-ai-hackathon` (it may differ
   because the test bed's flow already has that name in the same group), change the `/assign` line in
   `.gitlab/issue_templates/graph-request.md` and in `locus/issue-template.test.js`, and use the new name in emails.
5. **Check the project is public with public pipelines** (it is, read 20 Oct): the reply's download links need it.
6. **First run:** from the Issues page, three-dot menu, "Email a new issue to this project", mail your personal
   address with a request and `/assign @<the service account>` as the last line (section 9). Expect about 8 to 10
   minutes to the pass note. Record it in `docs/decisions.md` from what GitLab shows.
7. Optional, only if time allows: create `locus-ops` the same way (display name exactly `locus-ops`), for Gate 5b.

## 14. Freeze and judging (H12)

GitLab's answer (20 Oct (f)): switch the triggers off at the deadline; the video and README are the evidence.
- **Before 27 Oct, 13:00 UTC:** the fresh demo run (task 6); `JUDGING_FREEZE=true` set as a CI variable; the README
  links checked from a signed-out browser.
- **At 27 Oct, 13:00 UTC:** switch off the triggers of every custom flow (`locus-request`, `locus-probe`, `locus-ops`)
  in every project where they are enabled, and of any foundational flow that can commit or open MRs (Developer, Fix
  CI/CD Pipeline, SAST Vulnerability Resolution); Code Review only comments, but switching it off too is safest.
  Pause the nightly schedule, or keep it report-only with `JUDGING_FREEZE`.
- **After that:** nothing in the repo, video or Devpost changes until the winners are announced. Judges see the
  recorded runs, download the files from them, and can run the checker locally (section 9, local part). They cannot
  start a run. Bundle artifacts are kept 90 days only for pipelines that run with that setting (on
  `feat/gate2-render` since 20 Oct (f); on test bed `main` once Ashfaq approves the push). The files of #7 were made
  with the old 30 days and expire around 19 Nov; the fresh run of task 6 gets 90 days.
