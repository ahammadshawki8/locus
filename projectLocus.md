# Locus: GitLab Transcend Blueprint (v3: simple to show, hard to beat)

**Locus: tactile maths graphs, made and shipped by an agent.**

| | |
|---|---|
| **Competition** | Life After Code: GitLab Transcend Hackathon |
| **Path** | B: Bring Your Own (upstream: [JSCAD / OpenJSCAD.org](https://github.com/jscad/OpenJSCAD.org), MIT) |
| **Targets** | Path B **Best Hands-off Agent** ($5k) + **Most Stages Covered** ($5k). Also eligible for Most Creative (= highest Innovation score); you can win only one special prize. |
| **Bonus** | Google Cloud deployment (up to +0.2; max final 5.2) |
| **Fallback** | Path B Best Supervised Agent: the same build with one approval gate switched on |
| **Deadline** | 27 Oct 2026, 13:00 UTC. **Internal: 27 Oct 10:00 UTC.** |
| **Status** | See the status board in S.3. |
| **Team** | **Ashfaq** leads the core build (13-21 Oct) → **Shawki** hosts, completes, finalises and submits (parallel hosting track from 13 Oct, lead from 21 Oct). **Nourin** joined on 16 Oct (role to be decided). Built with **Claude Code**. See Part IV. |

---

# PART S: START HERE (read this first, every session)

This file is the project's central document and its memory. Anyone, in any session, after any handover, must be able to continue from here alone. Read Part S in full. Then read `docs/contracts.md` and the newest entries in `docs/decisions.md`. Read the rest of this file as your task needs it.

## S.1 How to resume

1. `git pull`. Then check your identity: `git config user.name` and `git config user.email` must be your own account (rule H1).
2. Read S.2 (hard rules), S.3 (status board) and S.4 (project flow).
3. Read `docs/contracts.md` (fixed interfaces) and the newest entries in `docs/decisions.md` (what changed and why).
4. Run `git log --oneline -15` to see recent work.
5. Pick the next task from S.3 or from your column in Part IV.
6. At the end of the session, follow S.6.

## S.2 Hard rules (no exceptions)

| # | Rule |
|---|---|
| H1 | **Git identity.** Commit and push only as **`ahammadshawki8 <ahammadshawki8@users.noreply.github.com>`** or as **Ashfaq's own account**. Never list Claude, Anthropic, `srotdev`, or any other AI tool or account as author, committer, co-author or contributor. No `Co-Authored-By` lines and no "Generated with ..." lines in commits, merge requests, pull requests, issues or release notes. |
| H2 | **No emojis and no long dashes, anywhere in the project:** code, comments, docs, commit messages, issues, MR text, the site, video captions and Devpost text. "Long dashes" means the em dash (U+2014) and the en dash (U+2013); also avoid the minus sign (U+2212). Use a hyphen, colon, comma, "to" or "-" instead. Braille cells (U+2800 block) are allowed only where they show braille. |
| H3 | **Truth rule.** A planned stage is not a completed stage. Never claim a graphic is understandable by touch because it passed automated rules. Never claim a GitLab capability works until it has run in our account. Never fake a failure, a pass or an agent action. |
| H4 | **Simplicity rule.** If a judge can't explain Locus in one sentence after watching the video once with the sound off, the video has failed. Every feature either appears in the one story or stays in the README. |
| H5 | **Contracts are law.** `docs/contracts.md` v1 is final. Change it only through a dated entry in `docs/decisions.md` that both Ashfaq and Shawki agree to. |
| H6 | **Role boundary.** Claude Code is how we build Locus; GitLab Duo runs every agent inside Locus. Never use Claude Code to make in-product fixes during a recorded or demo run. |
| H7 | **Agents stay in scope.** Never edit `locus/touchcheck/rules` to make a request pass. Each agent writes only its allowed paths (`docs/contracts.md` §7), enforced by `guard-scope`. |
| H8 | **No secrets** in code, prompts, commits or logs. Use protected, masked CI variables only. Write variable names in docs, never values. |
| H9 | **Prints.** The only physical prints are the 4 prototype plates from 15 and 16 Oct (calibration, A, B, C; `tools/prints/README.md`). There will be no more printing. Video captions call them "prototype prints". |
| H10 | **Sources.** Every external fact in the docs links to its source. |
| H11 | **Record and push.** Every decision gets a dated entry in `docs/decisions.md`. Every session ends with the S.3 board updated, committed and pushed. |
| H12 | **Freeze.** Nothing in the repo, video or Devpost form changes after 27 Oct 2026, 13:00 UTC. |

These rules are mirrored in `CLAUDE.md`, so Claude Code sessions load them automatically. Keep both lists identical.

## S.3 Status board (update at the end of every session)

**Last updated: 16 Oct 2026 (Ashfaq).**

| Area | State |
|---|---|
| Onboarding | Shawki, Ashfaq (`ashfaq909`) and Nourin (`nourin.richi.2026`) onboarded to the GitLab hackathon group. Shawki asked on Discord (16 Oct) for Ashfaq and Nourin to be added to the Showcase project. 16 Oct: Ashfaq reports the team now has group access for the hackathon |
| GitLab project | Each participant has a public Showcase, `gitlab-ai-hackathon/transcend-october-2026/<user id>/showcase`. Shawki's (`.../43384339/showcase`) is the team project: foundational flows enabled (Code Review, Fix CI/CD Pipeline, Developer, Convert to CI/CD, Resolve SAST Vulnerability, SAST False Positive Detection); code not imported; Ashfaq has no access yet. Test bed: Ashfaq's (`.../43396940/showcase`), branch `feat/gate2-render` pushed 16 Oct; first pipeline ran: render, touchcheck, upstream-test, SAST, secret detection pass; guard-scope fails closed until `main` shares our history (`docs/decisions.md` 16 Oct (f)). Already enabled there: Developer (with a trigger), Code Review, Fix CI/CD and the SAST flows. 16 Oct: Ashfaq created and enabled the custom flow `locus-probe` there (service account `ai-locus-probe-gitlab-ai-hackathon`) and **it ran** from his mention on issue #2 (session 9598935, 16 Oct (l)) |
| Credits | 15 Oct: Duo Chat showed "No credits remain for this billing period". 16 Oct: Ashfaq reports the credits are there now. First used by a flow run on 16 Oct (`locus-probe`, session 9598935); whose row it is on is not yet read from the Credits dashboard (H3). The triggers doc says triggered flows bill the flow's service account through the namespace's credit pool, not the person; Gate 5 records what our account shows (`docs/decisions.md` 16 Oct (g)) |
| Design | Pipeline v2 (S.4) adopted after checking the Duo docs (`docs/decisions.md`, 15 Oct b). Contracts v1 final on 16 Oct; Ashfaq's blocker window closes 17 Oct, 18:00 GMT+6 |
| Prints | Calibration piece printed and judged good. Prototype plates A, B and C sent to print on 16 Oct (`tools/prints/`). About 500 tk budget |
| Code | Working repo: GitHub `ahammadshawki8/locus` (private). Contains the plan, docs, `tools/calibration/` and `tools/prints/`. Product code is on Ashfaq's fork `ashfaqstu/locus`, branch `feat/gate2-render` (JSCAD import, `locus/`), not merged yet ([PR 1](https://github.com/ahammadshawki8/locus/pull/1) into the working repo's `main`, opened 16 Oct, waiting for Shawki; merge commit only, 16 Oct (i)): it follows contracts v1, reproduces prints A, B and C (CI test), and `touchcheck` measures TL-1 to TL-5 with report, overlay and `LOCUS_REPORT` line (A fails, B and C pass). All four guards built with CI jobs (Gate 8 locally). `locus bundle` + `bundle` CI job build `out/bundle/graph-<iid>-v<n>/` + zip, with `manifest.json` from the render, touchcheck and guard output only (contracts §3, §5; `docs/decisions.md` 16 Oct (c)). Gate 5b code: `library-impact` (MR), `library-recheck` (main + nightly) and `bisect-regression` jobs re-check every shipped graph from its release tag and name the first bad commit with `git bisect`; `guard-revert` checks a `revert/<sha>` branch is the exact inverse (16 Oct (d)). Flows (16 Oct (g)): `locus-ops.yml` (triage, impact reviewer, regression detective; release guard routes to end until Gate 5c) and the test-bed probe `locus-probe.yml` are real flow registry v1 YAML, checked by `locus/flows/check.js` against the documented schema, GitLab's own flow JSON schema (since the AI Catalog rejected `max_cycles`, 16 Oct (k)) and the live GitLab.com tool list; `locus-probe` **ran on 16 Oct** (16 Oct (l)): it read a job log's `LOCUS_REPORT`, committed and deleted a file with `create_commit`, and the `Locus-Session` trailer survived; `locus-ops` has not run. Agent commits carry the flow's **display name** as author and committer, so `agents.json` now matches `^locus-request# Locus: GitLab Transcend Blueprint (v3: simple to show, hard to beat)

**Locus: tactile maths graphs, made and shipped by an agent.**

| | |
|---|---|
| **Competition** | Life After Code: GitLab Transcend Hackathon |
| **Path** | B: Bring Your Own (upstream: [JSCAD / OpenJSCAD.org](https://github.com/jscad/OpenJSCAD.org), MIT) |
| **Targets** | Path B **Best Hands-off Agent** ($5k) + **Most Stages Covered** ($5k). Also eligible for Most Creative (= highest Innovation score); you can win only one special prize. |
| **Bonus** | Google Cloud deployment (up to +0.2; max final 5.2) |
| **Fallback** | Path B Best Supervised Agent: the same build with one approval gate switched on |
| **Deadline** | 27 Oct 2026, 13:00 UTC. **Internal: 27 Oct 10:00 UTC.** |
| **Status** | See the status board in S.3. |
| **Team** | **Ashfaq** leads the core build (13-21 Oct) → **Shawki** hosts, completes, finalises and submits (parallel hosting track from 13 Oct, lead from 21 Oct). **Nourin** joined on 16 Oct (role to be decided). Built with **Claude Code**. See Part IV. |

---

# PART S: START HERE (read this first, every session)

This file is the project's central document and its memory. Anyone, in any session, after any handover, must be able to continue from here alone. Read Part S in full. Then read `docs/contracts.md` and the newest entries in `docs/decisions.md`. Read the rest of this file as your task needs it.

## S.1 How to resume

1. `git pull`. Then check your identity: `git config user.name` and `git config user.email` must be your own account (rule H1).
2. Read S.2 (hard rules), S.3 (status board) and S.4 (project flow).
3. Read `docs/contracts.md` (fixed interfaces) and the newest entries in `docs/decisions.md` (what changed and why).
4. Run `git log --oneline -15` to see recent work.
5. Pick the next task from S.3 or from your column in Part IV.
6. At the end of the session, follow S.6.

## S.2 Hard rules (no exceptions)

| # | Rule |
|---|---|
| H1 | **Git identity.** Commit and push only as **`ahammadshawki8 <ahammadshawki8@users.noreply.github.com>`** or as **Ashfaq's own account**. Never list Claude, Anthropic, `srotdev`, or any other AI tool or account as author, committer, co-author or contributor. No `Co-Authored-By` lines and no "Generated with ..." lines in commits, merge requests, pull requests, issues or release notes. |
| H2 | **No emojis and no long dashes, anywhere in the project:** code, comments, docs, commit messages, issues, MR text, the site, video captions and Devpost text. "Long dashes" means the em dash (U+2014) and the en dash (U+2013); also avoid the minus sign (U+2212). Use a hyphen, colon, comma, "to" or "-" instead. Braille cells (U+2800 block) are allowed only where they show braille. |
| H3 | **Truth rule.** A planned stage is not a completed stage. Never claim a graphic is understandable by touch because it passed automated rules. Never claim a GitLab capability works until it has run in our account. Never fake a failure, a pass or an agent action. |
| H4 | **Simplicity rule.** If a judge can't explain Locus in one sentence after watching the video once with the sound off, the video has failed. Every feature either appears in the one story or stays in the README. |
| H5 | **Contracts are law.** `docs/contracts.md` v1 is final. Change it only through a dated entry in `docs/decisions.md` that both Ashfaq and Shawki agree to. |
| H6 | **Role boundary.** Claude Code is how we build Locus; GitLab Duo runs every agent inside Locus. Never use Claude Code to make in-product fixes during a recorded or demo run. |
| H7 | **Agents stay in scope.** Never edit `locus/touchcheck/rules` to make a request pass. Each agent writes only its allowed paths (`docs/contracts.md` §7), enforced by `guard-scope`. |
| H8 | **No secrets** in code, prompts, commits or logs. Use protected, masked CI variables only. Write variable names in docs, never values. |
| H9 | **Prints.** The only physical prints are the 4 prototype plates from 15 and 16 Oct (calibration, A, B, C; `tools/prints/README.md`). There will be no more printing. Video captions call them "prototype prints". |
| H10 | **Sources.** Every external fact in the docs links to its source. |
| H11 | **Record and push.** Every decision gets a dated entry in `docs/decisions.md`. Every session ends with the S.3 board updated, committed and pushed. |
| H12 | **Freeze.** Nothing in the repo, video or Devpost form changes after 27 Oct 2026, 13:00 UTC. |

These rules are mirrored in `CLAUDE.md`, so Claude Code sessions load them automatically. Keep both lists identical.

## S.3 Status board (update at the end of every session)

**Last updated: 16 Oct 2026 (Ashfaq).**

| Area | State |
|---|---|
| Onboarding | Shawki, Ashfaq (`ashfaq909`) and Nourin (`nourin.richi.2026`) onboarded to the GitLab hackathon group. Shawki asked on Discord (16 Oct) for Ashfaq and Nourin to be added to the Showcase project. 16 Oct: Ashfaq reports the team now has group access for the hackathon |
| GitLab project | Each participant has a public Showcase, `gitlab-ai-hackathon/transcend-october-2026/<user id>/showcase`. Shawki's (`.../43384339/showcase`) is the team project: foundational flows enabled (Code Review, Fix CI/CD Pipeline, Developer, Convert to CI/CD, Resolve SAST Vulnerability, SAST False Positive Detection); code not imported; Ashfaq has no access yet. Test bed: Ashfaq's (`.../43396940/showcase`), branch `feat/gate2-render` pushed 16 Oct; first pipeline ran: render, touchcheck, upstream-test, SAST, secret detection pass; guard-scope fails closed until `main` shares our history (`docs/decisions.md` 16 Oct (f)). Already enabled there: Developer (with a trigger), Code Review, Fix CI/CD and the SAST flows. 16 Oct: Ashfaq created and enabled the custom flow `locus-probe` there (service account `ai-locus-probe-gitlab-ai-hackathon`) and **it ran** from his mention on issue #2 (session 9598935, 16 Oct (l)) |
| Credits | 15 Oct: Duo Chat showed "No credits remain for this billing period". 16 Oct: Ashfaq reports the credits are there now. First used by a flow run on 16 Oct (`locus-probe`, session 9598935); whose row it is on is not yet read from the Credits dashboard (H3). The triggers doc says triggered flows bill the flow's service account through the namespace's credit pool, not the person; Gate 5 records what our account shows (`docs/decisions.md` 16 Oct (g)) |
| Design | Pipeline v2 (S.4) adopted after checking the Duo docs (`docs/decisions.md`, 15 Oct b). Contracts v1 final on 16 Oct; Ashfaq's blocker window closes 17 Oct, 18:00 GMT+6 |
| Prints | Calibration piece printed and judged good. Prototype plates A, B and C sent to print on 16 Oct (`tools/prints/`). About 500 tk budget |
| Code | Working repo: GitHub `ahammadshawki8/locus` (private). Contains the plan, docs, `tools/calibration/` and `tools/prints/`. Product code is on Ashfaq's fork `ashfaqstu/locus`, branch `feat/gate2-render` (JSCAD import, `locus/`), not merged yet ([PR 1](https://github.com/ahammadshawki8/locus/pull/1) into the working repo's `main`, opened 16 Oct, waiting for Shawki; merge commit only, 16 Oct (i)): it follows contracts v1, reproduces prints A, B and C (CI test), and `touchcheck` measures TL-1 to TL-5 with report, overlay and `LOCUS_REPORT` line (A fails, B and C pass). All four guards built with CI jobs (Gate 8 locally). `locus bundle` + `bundle` CI job build `out/bundle/graph-<iid>-v<n>/` + zip, with `manifest.json` from the render, touchcheck and guard output only (contracts §3, §5; `docs/decisions.md` 16 Oct (c)). Gate 5b code: `library-impact` (MR), `library-recheck` (main + nightly) and `bisect-regression` jobs re-check every shipped graph from its release tag and name the first bad commit with `git bisect`; `guard-revert` checks a `revert/<sha>` branch is the exact inverse (16 Oct (d)). Flows (16 Oct (g)): `locus-ops.yml` (triage, impact reviewer, regression detective; release guard routes to end until Gate 5c) and the test-bed probe `locus-probe.yml` are real flow registry v1 YAML, checked by `locus/flows/check.js` against the documented schema, GitLab's own flow JSON schema (since the AI Catalog rejected `max_cycles`, 16 Oct (k)) and the live GitLab.com tool list;  / `^locus-ops# Locus: GitLab Transcend Blueprint (v3: simple to show, hard to beat)

**Locus: tactile maths graphs, made and shipped by an agent.**

| | |
|---|---|
| **Competition** | Life After Code: GitLab Transcend Hackathon |
| **Path** | B: Bring Your Own (upstream: [JSCAD / OpenJSCAD.org](https://github.com/jscad/OpenJSCAD.org), MIT) |
| **Targets** | Path B **Best Hands-off Agent** ($5k) + **Most Stages Covered** ($5k). Also eligible for Most Creative (= highest Innovation score); you can win only one special prize. |
| **Bonus** | Google Cloud deployment (up to +0.2; max final 5.2) |
| **Fallback** | Path B Best Supervised Agent: the same build with one approval gate switched on |
| **Deadline** | 27 Oct 2026, 13:00 UTC. **Internal: 27 Oct 10:00 UTC.** |
| **Status** | See the status board in S.3. |
| **Team** | **Ashfaq** leads the core build (13-21 Oct) → **Shawki** hosts, completes, finalises and submits (parallel hosting track from 13 Oct, lead from 21 Oct). **Nourin** joined on 16 Oct (role to be decided). Built with **Claude Code**. See Part IV. |

---

# PART S: START HERE (read this first, every session)

This file is the project's central document and its memory. Anyone, in any session, after any handover, must be able to continue from here alone. Read Part S in full. Then read `docs/contracts.md` and the newest entries in `docs/decisions.md`. Read the rest of this file as your task needs it.

## S.1 How to resume

1. `git pull`. Then check your identity: `git config user.name` and `git config user.email` must be your own account (rule H1).
2. Read S.2 (hard rules), S.3 (status board) and S.4 (project flow).
3. Read `docs/contracts.md` (fixed interfaces) and the newest entries in `docs/decisions.md` (what changed and why).
4. Run `git log --oneline -15` to see recent work.
5. Pick the next task from S.3 or from your column in Part IV.
6. At the end of the session, follow S.6.

## S.2 Hard rules (no exceptions)

| # | Rule |
|---|---|
| H1 | **Git identity.** Commit and push only as **`ahammadshawki8 <ahammadshawki8@users.noreply.github.com>`** or as **Ashfaq's own account**. Never list Claude, Anthropic, `srotdev`, or any other AI tool or account as author, committer, co-author or contributor. No `Co-Authored-By` lines and no "Generated with ..." lines in commits, merge requests, pull requests, issues or release notes. |
| H2 | **No emojis and no long dashes, anywhere in the project:** code, comments, docs, commit messages, issues, MR text, the site, video captions and Devpost text. "Long dashes" means the em dash (U+2014) and the en dash (U+2013); also avoid the minus sign (U+2212). Use a hyphen, colon, comma, "to" or "-" instead. Braille cells (U+2800 block) are allowed only where they show braille. |
| H3 | **Truth rule.** A planned stage is not a completed stage. Never claim a graphic is understandable by touch because it passed automated rules. Never claim a GitLab capability works until it has run in our account. Never fake a failure, a pass or an agent action. |
| H4 | **Simplicity rule.** If a judge can't explain Locus in one sentence after watching the video once with the sound off, the video has failed. Every feature either appears in the one story or stays in the README. |
| H5 | **Contracts are law.** `docs/contracts.md` v1 is final. Change it only through a dated entry in `docs/decisions.md` that both Ashfaq and Shawki agree to. |
| H6 | **Role boundary.** Claude Code is how we build Locus; GitLab Duo runs every agent inside Locus. Never use Claude Code to make in-product fixes during a recorded or demo run. |
| H7 | **Agents stay in scope.** Never edit `locus/touchcheck/rules` to make a request pass. Each agent writes only its allowed paths (`docs/contracts.md` §7), enforced by `guard-scope`. |
| H8 | **No secrets** in code, prompts, commits or logs. Use protected, masked CI variables only. Write variable names in docs, never values. |
| H9 | **Prints.** The only physical prints are the 4 prototype plates from 15 and 16 Oct (calibration, A, B, C; `tools/prints/README.md`). There will be no more printing. Video captions call them "prototype prints". |
| H10 | **Sources.** Every external fact in the docs links to its source. |
| H11 | **Record and push.** Every decision gets a dated entry in `docs/decisions.md`. Every session ends with the S.3 board updated, committed and pushed. |
| H12 | **Freeze.** Nothing in the repo, video or Devpost form changes after 27 Oct 2026, 13:00 UTC. |

These rules are mirrored in `CLAUDE.md`, so Claude Code sessions load them automatically. Keep both lists identical.

## S.3 Status board (update at the end of every session)

**Last updated: 16 Oct 2026 (Ashfaq).**

| Area | State |
|---|---|
| Onboarding | Shawki, Ashfaq (`ashfaq909`) and Nourin (`nourin.richi.2026`) onboarded to the GitLab hackathon group. Shawki asked on Discord (16 Oct) for Ashfaq and Nourin to be added to the Showcase project. 16 Oct: Ashfaq reports the team now has group access for the hackathon |
| GitLab project | Each participant has a public Showcase, `gitlab-ai-hackathon/transcend-october-2026/<user id>/showcase`. Shawki's (`.../43384339/showcase`) is the team project: foundational flows enabled (Code Review, Fix CI/CD Pipeline, Developer, Convert to CI/CD, Resolve SAST Vulnerability, SAST False Positive Detection); code not imported; Ashfaq has no access yet. Test bed: Ashfaq's (`.../43396940/showcase`), branch `feat/gate2-render` pushed 16 Oct; first pipeline ran: render, touchcheck, upstream-test, SAST, secret detection pass; guard-scope fails closed until `main` shares our history (`docs/decisions.md` 16 Oct (f)). Already enabled there: Developer (with a trigger), Code Review, Fix CI/CD and the SAST flows. 16 Oct: Ashfaq created and enabled the custom flow `locus-probe` there (service account `ai-locus-probe-gitlab-ai-hackathon`) and **it ran** from his mention on issue #2 (session 9598935, 16 Oct (l)) |
| Credits | 15 Oct: Duo Chat showed "No credits remain for this billing period". 16 Oct: Ashfaq reports the credits are there now. First used by a flow run on 16 Oct (`locus-probe`, session 9598935); whose row it is on is not yet read from the Credits dashboard (H3). The triggers doc says triggered flows bill the flow's service account through the namespace's credit pool, not the person; Gate 5 records what our account shows (`docs/decisions.md` 16 Oct (g)) |
| Design | Pipeline v2 (S.4) adopted after checking the Duo docs (`docs/decisions.md`, 15 Oct b). Contracts v1 final on 16 Oct; Ashfaq's blocker window closes 17 Oct, 18:00 GMT+6 |
| Prints | Calibration piece printed and judged good. Prototype plates A, B and C sent to print on 16 Oct (`tools/prints/`). About 500 tk budget |
| Code | Working repo: GitHub `ahammadshawki8/locus` (private). Contains the plan, docs, `tools/calibration/` and `tools/prints/`. Product code is on Ashfaq's fork `ashfaqstu/locus`, branch `feat/gate2-render` (JSCAD import, `locus/`), not merged yet ([PR 1](https://github.com/ahammadshawki8/locus/pull/1) into the working repo's `main`, opened 16 Oct, waiting for Shawki; merge commit only, 16 Oct (i)): it follows contracts v1, reproduces prints A, B and C (CI test), and `touchcheck` measures TL-1 to TL-5 with report, overlay and `LOCUS_REPORT` line (A fails, B and C pass). All four guards built with CI jobs (Gate 8 locally). `locus bundle` + `bundle` CI job build `out/bundle/graph-<iid>-v<n>/` + zip, with `manifest.json` from the render, touchcheck and guard output only (contracts §3, §5; `docs/decisions.md` 16 Oct (c)). Gate 5b code: `library-impact` (MR), `library-recheck` (main + nightly) and `bisect-regression` jobs re-check every shipped graph from its release tag and name the first bad commit with `git bisect`; `guard-revert` checks a `revert/<sha>` branch is the exact inverse (16 Oct (d)). Flows (16 Oct (g)): `locus-ops.yml` (triage, impact reviewer, regression detective; release guard routes to end until Gate 5c) and the test-bed probe `locus-probe.yml` are real flow registry v1 YAML, checked by `locus/flows/check.js` against the documented schema, GitLab's own flow JSON schema (since the AI Catalog rejected `max_cycles`, 16 Oct (k)) and the live GitLab.com tool list; , and a service account matching no flow is blocked on agent branches. `locus-request.yml` (16 Oct (h)) is now real flow YAML too: `intake > fixer_1 > fixer_2 > fixer_3 > refuse` with no route back, so at most 3 attempts by construction; each fixer step polls the MR pipeline and accepts only the `LOCUS_REPORT` of its own attempt; write tools, pinned labels and the remedies list are test-pinned; **not run**. Every `locus-request` commit ends with a `Locus-Session: <session URL>` trailer, and `bundle` fills `agentSessions` from the agent commits' trailers (16 Oct (j); the probe showed the trailer survives). 218 tests, including a seeded regression found by bisect, its inverse passing guard-revert and near-inverses blocked. Not built: release guard, Service Desk. On GitLab: the CI jobs ran (16 Oct (f); pipeline 2953759450 for `84e654a7` all green, 212 of 212, 16 Oct (i); pipeline 2953818513 for `4cb3bda8` all green, 212 of 212, 16 Oct (j)); the first flow run was `locus-probe` (16 Oct (l)); `locus-request` and `locus-ops` are not created yet |
| Hosting | Google Cloud not set up yet (Shawki, Gate 6b, 17 Oct) |

**Next:**
0. Ashfaq + Shawki: give the Showcase `main` our history (push the working repo's `main` over the organisers' README, or import into Shawki's project and add Ashfaq), so MRs and guard-scope work on GitLab (16 Oct (f)).
1. Ashfaq: `locus-probe` ran (16 Oct (l)); still read the GitLab Credits dashboard for its row. Then Gate 5 run (create the flow with display name exactly `locus-request`): `locus-request.yml` is written (16 Oct (h)); it needs a default branch with our code (item 0, or the test bed's default branch set to `feat/gate2-render` for the run), then a person files an issue and assigns it, and one session runs spec, red, fix, green (steps in 16 Oct (h)).
2. Shawki: Google Cloud + Cloud Run staging and production skeleton (Gate 6b, 17 Oct).
3. Shawki: generate `fixtures/bundle-sample/graph-0-v1/` from print B (contracts D9). It can now come from the real code: render, touchcheck, the three guards, then `npm run locus -- bundle fixtures/touchcheck/good-print-b` (`docs/decisions.md` 16 Oct (c)). Also: plan §9 says `graph-<iid>.zip`, contracts §3 says `graph-<iid>-v<n>.zip`; the code follows the contract.
4. Record the calibration touch results in `docs/decisions.md` (which gap felt like two lines; 0.5 or 0.8 mm braille dots).
5. Decide Nourin's role.
6. Shawki: review and merge [PR 1](https://github.com/ahammadshawki8/locus/pull/1) (`feat/gate2-render` into the working repo, **merge commit only**, 16 Oct (i)). Then Ashfaq: get it into the GitLab Showcase project once code import is allowed, so `render`, `touchcheck`, the guards and `locus-test` run in CI.
8. Ashfaq: Gate 5b run: `locus-ops.yml` is written and schema-checked but not run (16 Oct (g)). Running it needs item 0 and one released graph tag, then a person's MR with a seeded regression (impact reviewer), merged anyway (detective). Create it with display name exactly `locus-ops` (agents.json, 16 Oct (l)). Author, delete and trailer were answered by the probe.
9. Both: should `library-impact` also run on MRs changing `locus/touchcheck/**` and `profiles/**` (contracts §6 change, `docs/decisions.md` 16 Oct (d))?
11. Shawki: agree the contracts §7 wording proposal in 16 Oct (l) item 4 (author and committer carry the flow's display name).
10. Both: should each failing TL-2 / TL-3 result in `touchcheck-report.json` name the label it means (contracts §4 change)? The fixer now works it out from `at` and the plate geometry (16 Oct (h)).
7. Shawki: answer the key-mode question in `docs/decisions.md` (16 Oct): with single-letter labels, is `key-mode` still a useful fix for TL-2 and TL-3?

**Waiting on GitLab (Discord):** whether triggered flows use personal credits; which tools ambient flows get; whether flows can merge; Secret FP Detection and Breaking Change Resolution.

## S.4 Project flow, end to end (pipeline v2)

Every chain starts with **one person's action**, because GitLab only starts flows on a person's action (`docs/decisions.md`, 15 Oct). After that, agents and CI finish the job.

1. **Request (Plan).** A teacher files a graph request issue from the template, which starts the flow (trigger: work item created). Or they email Service Desk, and a person assigns the new issue to the Locus bot with one click (trigger: assign).
2. **Intake agent (Plan, Create).** Duo flow `locus-request` reads the request. If it's ambiguous, it asks one question and stops. Otherwise it writes `requests/<iid>/spec.json`, `request.lock.json` and `layout.json` (the profile's default layout), opens branch `graph/<iid>` and an MR, and commits attempt 1.
3. **Touch check (Verify).** The MR pipeline renders the graph and runs `touchcheck` (rules TL-1 to TL-5). The default layout usually fails, for example when the curve merges with a grid line. The job draws a red/green overlay and prints a `LOCUS_REPORT` line to its log.
4. **Fixer agent (Create, Verify).** It continues in the same flow session. It reads the report, changes only `layout.json` using allowed fixes (hide grid, rescale an axis, move a label, key mode), and commits each attempt, so the pipeline history shows red then green. After 3 failed attempts it refuses: label `cannot-make-readable`, an explanation, no release.
5. **Guards and security (Secure).** `guard-scope`, `guard-maths`, `guard-description`, secret detection, SAST and the licence check must all pass. The foundational Code Review flow reviews the MR.
6. **Merge.** The deterministic `auto-merge` CI job merges a fully green `graph/*` MR (hands-off mode). In supervised mode, a person approves first.
7. **Package, release, deploy (Package, Release, Configure).** The `main` pipeline builds the bundle (`graph-<iid>-v<n>`: STL, SVG, overlay, description, report, manifest), publishes it to the Package Registry, creates a GitLab release, deploys to Cloud Run staging, validates it, then promotes to production.
8. **Reply (Govern).** `reply-teacher` posts the summary note on the issue, and Service Desk emails it to the teacher: page link, download, checks passed, braille ID. The braille ID on the plate (number sign + issue number) traces every print to its release.
9. **Impact reviewer (Verify, Monitor).** When a developer opens an MR that changes generator code or dependencies, `library-impact` re-renders every shipped graph. If any would break, Duo flow `locus-ops` explains why on the MR **before merge**.
10. **Regression detective (Monitor, Create).** If a person merges such a change anyway and `library-recheck` fails on `main`, `bisect-regression` finds the commit. `locus-ops` explains the cause and opens an exact inverse-commit MR (checked by `guard-revert`), or files one re-layout issue per affected graph. The nightly schedule only opens an issue as a safety net.
11. **Release guard (Release, Monitor).** If `validate-staging` or `post-deploy-smoke` fails on `main`, `locus-ops` opens an MR that moves `deploy/gcp/production-revision` back to the last good revision (GitOps rollback) and posts an incident note.
12. **Judging freeze.** With `JUDGING_FREEZE=true`, re-checks and smoke tests only log. Nothing is committed, released or deployed.

Details: agents and triggers §6b, architecture §8, jobs §13, interfaces `docs/contracts.md`.

## S.5 Document map

| File | What it holds | Update when |
|---|---|---|
| `projectLocus.md` | This file: rules, status, flow, full plan, gates, team, video, scorecard, checklist | Status board every session; plan sections when a decision changes them |
| `CLAUDE.md` | The hard rules for Claude Code sessions, plus a pointer here | Whenever S.2 changes |
| `docs/contracts.md` | Fixed interfaces between the parts (files, profile, bundle, reports, CI jobs, labels, agent scopes) | Only by a decision both agree to (H5) |
| `docs/decisions.md` | Dated decisions and GitLab's answers, newest first | Every decision |
| `tools/calibration/` | Calibration test piece (STL + generator + what to check) | Done; record results in `docs/decisions.md` |
| `tools/prints/` | The prototype plates A, B, C: specs, layouts, generator, prototype touch checks, measurements | Only if the plates must change (they're already printed) |
| `Locus_3D_print_request.pdf` | The print request sent to our printer friend | Historical |
| `assets/` | Poster images (16:9 and 4:3) for the video and Devpost | When the artwork changes |
| `HANDOVER.md` (planned) | What works, what's flaky, configs, CI variable names | 20 to 21 Oct (§15.4) |

## S.6 End of every session

1. Update the S.3 status board: the date, what changed, and the next steps.
2. Add any decision to `docs/decisions.md`, dated.
3. Check rule H2 on everything you wrote (no emojis, no long dashes).
4. Commit as yourself (H1) with a plain, descriptive message, then push.

---

# PART 0: WHAT CHANGED IN v3 AND WHY

## 0.1 What the research found (13 Oct)

| Finding | Source | What it means for us |
|---|---|---|
| Tools that turn equations into tactile graphs **already exist**: [TactileView](https://specialneedscomputers.ca/products/tactileview-software) math module (~$775), [ViewPlus Audio Graphing Calculator](https://accessinghigherground.org/wp/wp-content/uploads/2025/04/Creating-Tactile-Graphs-with-the-ViewPlus-Audio-Graphing-Calculator.pdf), [SVGPlott](https://www.springerprofessional.de/svgplott-generating-adaptive-and-accessible-audio-tactile-functi/2191120) (research), [Desmos-based workflows](https://accessinghigherground.org/wp/wp-content/uploads/2025/04/CreatingTactileGraphsWithDesMos.pdf) | [AHG: automated tactile maths](https://accessinghigherground.org/automated-generation-of-tactile-mathematics/), [TactileView](https://specialneedscomputers.ca/products/tactileview-software), [SVGPlott](https://www.springerprofessional.de/svgplott-generating-adaptive-and-accessible-audio-tactile-functi/2191120), [ViewPlus calculator guide](https://accessinghigherground.org/wp/wp-content/uploads/2025/04/Creating-Tactile-Graphs-with-the-ViewPlus-Audio-Graphing-Calculator.pdf) | **"We generate tactile graphs" is not novel.** Don't claim it. |
| A [July 2026 paper](https://www.emergentmind.com/papers/2607.01214) builds a **JSCAD-based** pipeline that makes tactile STL charts with Grade 1 braille labels, and reports manual CAD takes **~2 hours per chart**. It has **no automated legibility validation**, **no user study**, and its LLM step needs teacher review. | [arXiv 2607.01214 (summary)](https://www.emergentmind.com/papers/2607.01214) | (1) Strong evidence for the problem (2 h/chart). (2) It confirms JSCAD is the right engine. (3) **The open gap is verifying readability and fixing failures automatically.** That's Locus. Cite it as related work and don't overlap with it: it does statistical charts, we do function graphs. |
| A [practitioner source](https://accessinghigherground.org/wp/wp-content/uploads/2025/04/CreatingTactileGraphsWithDesMos.pdf) notes that Desmos-based methods "do not create acceptable braille labels presently". | [AHG Desmos guide](https://accessinghigherground.org/wp/wp-content/uploads/2025/04/CreatingTactileGraphsWithDesMos.pdf) | Label collisions are a known pain point. Our label rules target exactly that. |
| Spacing guidance: **1/8 in (3.2 mm) absolute minimum** between elements; **1/4 in (6.4 mm)** may be needed (e.g. capsule paper); separate elements at least 1/4 in. Braille map labels should be **3/8 in (9.5 mm)** from unrelated elements. | [tactilegraphics.org readability](https://tactilegraphics.org/readability.html), [NPS tactile map guidelines 2008](https://www.npshistory.com/publications/interpretation/hfc/tactile-map-guidelines-2008.pdf), [BANA Tactile Graphics 2022](https://www.brailleauthority.org/tg/web-manual/tgmanual.html) | Rule values now cite a source. Still check them against BANA 2022 and a practitioner. |
| Evidence for 3D-printed maths graphs is promising but thin (e.g. [SenseMath](https://www.visio.org/visio.org/media/Visio/Downloads/KEI/Vision-2017/Does-multisensory-presentation-of-mathematical-graphs-improve-visually-impaired-students-performance-on-identifying-mathematical-graphs-A-comparison.pdf), n=8). | [Visio SenseMath study](https://www.visio.org/visio.org/media/Visio/Downloads/KEI/Vision-2017/Does-multisensory-presentation-of-mathematical-graphs-improve-visually-impaired-students-performance-on-identifying-mathematical-graphs-A-comparison.pdf), [Sci Am: 3D prints for blind students](https://blogs.scientificamerican.com/guest-blog/teaching-blind-students-with-3-d-prints/) | Don't over-claim the learning benefit. Claim time saved and quality checked. |
| GitLab custom flows can reportedly be triggered on **pipeline state changes, including Failed**. The docs history says the feature flag was removed in 19.1, but one older source says it's still flagged. | [GitLab blog: agentic flows](https://about.gitlab.com/blog/multi-step-software-delivery-with-agentic-flows/), [custom flows docs](https://docs.gitlab.com/user/duo_agent_platform/flows/custom/) | **Superseded on 15 Oct:** triggers need a person's action, so a flow can't wake another flow. The fixer now runs inside the request flow (S.4, `docs/decisions.md`). |

## 0.2 The new positioning (one line)

> **Other tools draw tactile graphs. Locus is the first to *check* them the way a fingertip would, fix what fails, and ship only what passes, automatically.**

## 0.3 What's in the video vs. only in the repo

| In the story (video) | In the build, shown in the README and repo | Cut entirely |
|---|---|---|
| Email request → agent → touch check fails → agent fixes → passes → live → reply email → print → braille ID; **one lifecycle-agent beat (regression detective)**; one eval-score caption | Guards, security scans, package registry, staging validation details, **release guard agent**, judging freeze, migrated JSCAD CI, and all Tier 2/3 depth (§7.2-7.3): more function families, swell-paper profile, agent eval suite, injection guard, Code Review Flow, library site, MCP, AI Catalog | `guard-remedy` and `guard-attempts` as separate jobs (the attempt cap lives in the flow), image input, statistical charts |

The 9 stages are **shown with one on-screen tracker bar** that lights up as the real run progresses, not explained one by one.

## 0.4 The demo trick that makes it obvious: print both attempts

**Updated 16 Oct:** our printer friend could only print on 15 and 16 Oct, so we printed **prototype plates** before the agent existed (`tools/prints/`). **A** uses the profile's default layout (the intake agent's attempt 1), so it fails the touch check: the curve merges with a grid line. **B** is the corrected layout and passes. **C** is a second graph (a cubic). The generator must reproduce A, B and C exactly (contracts D3, D4), so the agent's real attempt 1 renders the same geometry as print A. In the video, a hand (eyes closed) moves across A, then B, with the caption "prototype prints of the same graph", and the agent's real run is shown on screen. Never call the plates the agent's printed output (H3).

---

# PART I: THE IDEA (JUDGE-FACING)

## 1. The 10-second version
**A teacher emails a maths graph. An AI agent makes a version a blind student can read by touch, checks it the way a fingertip would, fixes its own mistakes, and ships it. One request in, no human after that.**

## 2. The 30-second version
- **Who:** teachers of students with visual impairments (TVIs).
- **Pain:** modelling one tactile graph by hand takes about 2 hours ([2026 study](https://www.emergentmind.com/papers/2607.01214)). Graphs printed straight from a screen fail under a fingertip: lines merge and braille labels collide.
- **Locus:** email in → GitLab Duo agent → touch-legibility checks in CI → the agent fixes what fails → automatic release and deploy → reply email with a print-ready file.
- **Why GitLab:** the pipeline is the quality gate that decides whether a student ever gets the file. The agent can only change the layout. It can't change the rules or the maths.
- **Agents across the lifecycle, not just content:** a **release guard** agent rolls production back if a live graph fails validation, and a **regression detective** agent finds the commit that broke a shipped graph and opens the revert. Five Duo agents in two flows, each owning a lifecycle job (§6b).

## 3. The one diagram (README, Devpost, and video)

```text
 Teacher request ──> Duo agent drafts graph ──> Touch check
                              ▲                      │
                              └── fails: agent fixes ┘
                                                     │ passes
                                                     ▼
            Reply with print-ready file <── Release + deploy
```

Five boxes, one loop. Every other detail goes in the README.

## 4. Path B: before → after (one slide, 10 seconds in the video)

| | Before: JSCAD on GitHub | After: Locus on GitLab |
|---|---|---|
| Lifecycle | One GitHub Actions job: `npm test` on Node 20/22 ([`.github/workflows/node.yml`](https://github.com/jscad/OpenJSCAD.org/blob/master/.github/workflows/node.yml), checked 13 Oct) | Migrated tests + a 9-stage automated lifecycle |
| Making a tactile graph | Write a script by hand, guess the dimensions, hope it's readable | Email a sentence; an agent delivers a checked file |
| Safety | None | Touch checks + guards decide what ships |
| Downstream | A JSCAD change that alters geometry goes unnoticed | Every code change re-renders every shipped graph, before and after merge; an agent explains what would break (**downstream contract test for JSCAD**) |

## 4b. Why not just use existing tools? (README + Devpost)

| | [TactileView](https://specialneedscomputers.ca/products/tactileview-software) math module | [ViewPlus Audio Graphing Calculator](https://accessinghigherground.org/wp/wp-content/uploads/2025/04/Creating-Tactile-Graphs-with-the-ViewPlus-Audio-Graphing-Calculator.pdf) | [2026 JSCAD STL pipeline (paper)](https://www.emergentmind.com/papers/2607.01214) | **Locus** |
|---|---|---|---|---|
| Makes tactile function graphs | Yes | Yes | Statistical charts only | Yes |
| Cost / setup | ~$775, Windows software | Paid, embosser workflow | Research code | Free; send an email |
| **Checks readability by touch before delivery** | No (relies on the designer) | No | No (fixed parameters) | **Yes: 5 measured rules, release blocked on failure** |
| **Fixes its own failed output** | No | No | No | **Yes: agent, allowed fixes only, refuses otherwise** |
| Versioned, traceable output | No | No | No | **Yes: release + braille ID on every print** |
| Re-checks old graphs when the generator changes | No | No | No | **Yes: on every code change, with impact-reviewer and regression-detective agents** |

State this table carefully: "No" means we found no such feature in the public material we reviewed (sources in §0.1). Don't overstate it, and correct it if a practitioner tells you otherwise.

## 5. Why it needs an LLM agent (judges will ask)
1. **Lesson language → maths.** "Where the ball lands" means mark the positive x-intercept, and "peak" means the vertex. If the request is ambiguous, it asks rather than guessing.
2. **Fixing conflicting failures.** Scaling up fixes merged lines but can overflow the print bed. Moving a label can create a new collision. The agent combines fixes from an allowed list.
3. **The learner description.** It writes the plain-language description that goes with the graphic. A guard checks that every number in it matches the computed values.
4. **Diagnosis in plain language.** The release guard and regression detective read logs, reports and diffs and explain *why* something broke, for example "commit a1b2 changed curve thickness from 1.6 to 1.0 mm, so graph 7 now fails TL-5". Then they choose a constrained action: roll back, revert, or ask for a human.

## 6. Why hands-off is responsible here
Nothing ships unless every deterministic check passes. The agent can only edit `layout.json`. If it can't make a graph readable in 3 attempts, it **refuses and explains** instead of shipping. The teacher still handles the physical output. Every file says that automated checks don't certify comprehension.

## 6b. Five agents, each owning a lifecycle job

This answers the most likely judge objection: *"the agent makes content; the DevSecOps part is just a pipeline."* In Locus, agents own work in **Plan, Create, Verify, Release, Monitor and Secure**. Deterministic CI decides pass or fail, and agents decide what to do about it.

**Trigger rule (checked against the [triggers docs](https://docs.gitlab.com/user/duo_agent_platform/triggers/), 15 Oct):** only a person's action starts a flow. Bots, service accounts, scheduled pipelines and other flows can't. So each chain starts with one person's action, and agents and CI finish it. Full check: [`docs/decisions.md`](docs/decisions.md) (15 Oct b).

| Agent | Flow | Trigger (a person's action) | Reads | May do (enforced by guards) | Stages | Tier |
|---|---|---|---|---|---|---|
| **intake** | `locus-request` | Work item created (person files the request) **or** Assign (person assigns a Service Desk email issue to the bot) | The request | Write `requests/<iid>/`; open MR (attempt 1 committed, so CI shows red); or ask one question | Plan, Create | 1 |
| **layout fixer** | `locus-request` (same session, router loop) | - (continues after intake) | touchcheck report (run in the flow container; fallback: MR job logs) | Edit `layout.json` only, commit each attempt; refuse after 3 | Create, Verify | 1 |
| **impact reviewer** (new) | `locus-ops` | Pipeline failed: `library-impact` on a **person's MR** that changes generator code or dependencies | Impact report (every shipped graph re-rendered with the MR's code) + diff | Plain-language review on the MR; request changes or list graphs needing re-layout. **Catches the regression before merge** | Verify, Monitor | 1 |
| **regression detective** | `locus-ops` | Pipeline failed: `library-recheck` on a human-merged `main`; or a person assigns a nightly `regression` issue | Re-check report + `bisect-regression` result | Explain the cause; open an inverse-commit MR (written with `create_commit`, checked by `guard-revert`), or re-layout requests if intentional | Monitor, Create | 1 |
| **release guard** | `locus-ops` | Pipeline failed: `validate-staging` / `post-deploy-smoke` on `main` | Validation/smoke report, manifest, previous revision | Rollback MR changing **only** `deploy/gcp/production-revision`; incident note | Release, Monitor, Configure | 1 |
| Code Review, SAST Vulnerability Resolution, Secret FP Detection | GitLab foundational flows (switched on, not built) | MR created; default-branch scans | MR diff; security findings | Review comments with Locus invariants; fix MRs for High/Critical SAST findings | Verify, Secure | 2 (replaces T2.9) |

`locus-ops` is one flow: a `triage` component reads the pipeline webhook payload and routes to one of three subagents, or ends straight away for unrelated failures. The green `graph/*` MR is merged by a deterministic `auto-merge` CI job, since flows have no merge tool. Graph-only releases are protected by `promote-production` needing `validate-staging`.

**Why the actions are safe:** each flow has its own service account (`ai-<flow>-<group>`), with rights = service account ∩ triggering person. `guard-scope` checks the commit **author** and the allowed paths. Each component's `toolset` lists only the tools it needs. `agent-config.yml` limits network access to npm + GitLab. Rollback is just a revision pointer, so it's reviewable and reversible. A revert must exactly invert the target commit (`guard-revert`). Everything goes through the full pipeline before it merges.

**Duo Agent Platform features used:**
- 2 custom flows with 5 agent components: router loop, supervisor + subagents, per-component toolsets.
- Triggers: work item created, assign, pipeline failed.
- Per-flow service accounts and `agent-config.yml` (image, setup script, cache, network policy).
- `HumanInputComponent` (supervised mode).
- Foundational Code Review + security flows.
- AI Catalog (Tier 3).

---

# PART II: WHAT TO BUILD

## 7. Scope: three tiers

We build with Claude Code (§7.4), so the build goes beyond a minimal MVP. **But the video still tells one story** (Part V). Tier 2 and 3 work makes the product deeper and the repo stronger for judges. It never adds beats to the video, except the single eval caption.

**Rule:** start Tier 2 work in an area only after that area's Tier 1 gate has passed. Start Tier 3 only after Gate 9.

### 7.1 Tier 1: the core loop (must ship)
- Polynomials up to degree 3: `y = a·x³ + b·x² + c·x + d`, with bounded coefficients and domain. Evaluator without `eval`.
- Marks: vertex/turning points, y-intercept, real x-intercepts (found numerically).
- Short braille labels (digits, single letters), using a built-in Grade 1 → Unicode braille table; key mode.
- Profile `fdm-3d-v1` (STL for 3D printing) + SVG preview. *Why 3D print first:* a printer is far easier to get in Dhaka than a swell-paper fuser.
- `touchcheck`: 5 rules + overlay (§10).
- 2 Duo flows (§6b):
  - `locus-request`: intake → fixer loop, with the attempt cap and refusal.
  - `locus-ops`: triage → impact reviewer / regression detective / release guard.
- `.gitlab/duo/agent-config.yml`: Node image, `npm ci`, cache, network allowlist.
- 4 guards (§11).
- Service Desk email intake (a person assigns it to the bot) + reply.
- Bundle → Package Registry → release → Cloud Run staging → validate → production → reply email.
- `library-impact` on MRs + `library-recheck` on `main` (nightly as a safety net) + deterministic `bisect-regression` job.
- Local CLI: `npm run locus -- examples/projectile.json`.

### 7.2 Tier 2: depth (expected, because Claude Code makes it affordable)
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
| T2.9 | **Foundational security flows** switched on (SAST Vulnerability Resolution, Secret False Positive Detection) instead of a custom security triage agent. They need Ultimate, so confirm the group tier | Agents in the Secure stage at almost no build cost |

### 7.3 Tier 3: stretch
- MCP tools exposing `render` and `touchcheck`, so the agent can pre-check a layout before pushing.
- Publish the Locus agent/flow to the AI Catalog.

**Never build:** image-to-tactile, arbitrary user code, accounts, printer control, contracted braille, statistical charts (already covered by the [2026 paper](https://www.emergentmind.com/papers/2607.01214); don't overlap).

### 7.4 How we build: Claude Code

**Role boundary (Stage One depends on it):** *Claude Code is how we build Locus. GitLab Duo Agent Platform is what runs inside Locus.* Every agent action in the product, in the pipeline history and in the video is done by Duo flows. Never use Claude Code to make in-product fixes during a recorded run. Say this in the README.

**Shared memory in the repo, so either person and either Claude Code session can pick up anywhere:**

| File | Contents | Updated |
|---|---|---|
| `CLAUDE.md` | Commands (install, test, render, CLI), architecture in 10 lines, **invariants** ("never edit `locus/touchcheck/rules` to make a request pass", "agent writes only to `requests/<iid>/`", "no secrets in prompts or code"), file ownership | Whenever conventions change |
| `projectLocus.md` S.3 | The status board: current status per tier and gate, the next task, blockers (replaces the planned `docs/STATE.md`) | End of every working session |
| `docs/decisions.md` | Dated decisions (e.g. hands-off vs supervised, rule values and their sources) | When decided |
| `docs/contracts.md` | The interfaces between parts (§15.2) | Changes need both people to agree |
| `HANDOVER.md` | See §15.4 | 20-21 Oct |

**Session routine** (the msr / superpowers skills if installed; otherwise follow the same steps by hand):
1. Start: follow S.1. `/msr-session-start` can help: it reads the status board and recent commits and proposes the next task.
2. For each module, plan first (brainstorm → written plan), then **test-driven development**: write the failing test, then the code.
3. Before each commit: `/msr-gate` runs the real lint, test and build commands. Review every diff yourself, because the [hackathon FAQ](https://gitlab-transcend.devpost.com/) says you own what the AI creates.
4. End: follow S.6. `/msr-handoff` can help update the status board and propose the commit message.
5. Before submission: `/msr-ship` (Shawki).

**Git hygiene:** feature branch → MR → pipeline, so the history shows the automation. Small commits. `git commit -s` ([DCO 1.1](https://docs.gitlab.com/ee/legal/developer_certificate_of_origin.html) sign-off by the human author). Never paste tokens or keys into prompts; use protected, masked CI variables. Use git worktrees or parallel Claude Code sessions for independent modules (for example touchcheck rules and braille labels).

## 8. Architecture

```text
Teacher files request issue ──┐   (person = trigger: work item created)
Teacher email → Service Desk ─┴─> person assigns issue to bot (trigger: assign)
                                          ▼
   Duo flow "locus-request" (ONE session)
   intake: ambiguous? → ask one question, end
           write requests/<iid>/… → branch + MR → commit attempt 1 ──> MR pipeline RED
   fixer ⟲ (router, max 3): run touchcheck in flow container → edit layout.json
           → commit attempt n ──> MR pipeline        3rd failure → refuse, no release
                                          ▼ green: render → touchcheck → guards → security → bundle
   CI "auto-merge" (hands-off) | HumanInput approval (supervised)
                                          ▼
   main: package → release graph-<iid> → Cloud Run staging → validate → promote production
         → reply-teacher note (Service Desk emails it) → close

Person opens MR changing locus/core, packages/**, package*.json
→ "library-impact" re-renders every shipped graph with the MR's code → fails
→ trigger: pipeline failed → Duo flow "locus-ops" → triage → impact reviewer:
  plain-language review on the MR, before anything is merged

Person merges to main → "library-recheck" fails → "bisect-regression" (deterministic)
→ trigger: pipeline failed → "locus-ops" → regression detective:
  plain-language cause + inverse-commit MR (guard-revert) or re-layout requests
Nightly schedule = safety net only: CI opens a "regression" issue; a person assigns it to the bot

validate-staging / post-deploy-smoke fails on a human-started main pipeline
→ trigger: pipeline failed → "locus-ops" → release guard: MR setting
  deploy/gcp/production-revision to last good revision → checks → merge → incident note
Report-only during judging (JUDGING_FREEZE).
```

## 9. Files

```text
OpenJSCAD.org/                       # imported upstream; MIT LICENSE preserved & visible
├── .gitlab-ci.yml                   # upstream-test (migrated node.yml) + Locus lifecycle
├── .gitlab/duo/flows/{locus-request,locus-ops}.yml   # source of truth; pasted into the AI Catalog
├── .gitlab/duo/agent-config.yml     # flow image, npm ci, cache, network allowlist
├── .gitlab/duo/mr-review-instructions.yaml  # Code Review flow: Locus invariants
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

**The overlay is the hero visual:** a red circle around each violation with the plain-words message and the measured value ("1.4 mm apart, needs 3.2 mm"). After the fix, the same spot is shown with a green circle.

**Allowed fixes (`remedies.json`):** TL-1 → rescale an axis / hide the grid. TL-2, TL-3 → move a label / switch to key mode. TL-5 → reduce scale. TL-4 → none, refuse (never delete features).

## 11. Guards (4, all required)

| Guard | Blocks |
|---|---|
| `guard-scope` | Any agent commit outside its allowed paths: intake/fixer → `requests/<iid>/`; release guard → `deploy/gcp/production-revision`; regression detective → only the exact inverse of the named commit. Checked by commit author (each flow has its own service account) and by path |
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
| **Secure** | 4 guards + secret detection + SAST + licence check + agent network allowlist | Foundational SAST resolution + secret FP flows (T2.9) |
| **Package** | STL/SVG/description bundle → Package Registry; site image → Container Registry | - |
| **Release** | GitLab release per graph; staging → validated → production on Cloud Run; rollback | Release guard |
| **Configure** | Printer profiles, `RELEASE_MODE`, Cloud Run config, `production-revision` pointer, all versioned | Release guard edits the pointer |
| **Monitor** | Post-deploy smoke + re-check of every shipped graph on each change (nightly as a safety net) + bisect | Impact reviewer, regression detective, release guard |
| **Govern** | Manifest + braille ID on every print <-> release; CODEOWNERS; per-agent scopes; audit trail | - |

## 13. Pipeline jobs (compact)

`upstream-test` (Node 20/22 matrix, only when `packages/**` changes) · `validate-spec` · `render` · `touchcheck` (artifacts kept on failure, so attempt 1 can be printed; **also prints its compact JSON report to the job log**, because agents read logs, not artifacts) · `guard-scope` (checks commit author + paths) · `guard-maths` · `guard-description` · `secret-detection` · `sast` · `license-check` · `auto-merge` (hands-off mode; project access token) · `bundle` · `publish-package` · `release` · `deploy-staging` · `validate-staging` · `approve-production` (supervised mode only) · `promote-production` · `post-deploy-smoke` · `reply-teacher` · `library-impact` (MRs changing generator code or dependencies) · `library-recheck` (`main` + nightly) · `bisect-regression` (after a re-check failure) · `guard-revert` · `deploy-production-pointer` (applies `production-revision` on merge) · `flow-config-check` (repo flow YAML is valid).

`release` and `promote-production` must `needs:` touchcheck, all guards, security and bundle.

## 14. Hosting and freeze
- **Cloud Run** for staging and production (static graph library in a container; min instances 0; budget alert). Deployment code in `deploy/gcp/`. **Fallback:** GitLab Pages (loses the 0.2 bonus).
- **Before submitting:** commit `JUDGING_FREEZE=true`. During judging, `library-recheck` and smoke tests only log; there are no issues, commits, releases or deploys. Ask on Discord whether judges may send a test email.

---

# PART III: GATES

| # | Gate | Owner | By | If it fails |
|---|---|---|---|---|
| 0 | Both: Devpost team joined (Shawki = Representative), **GitLab onboarding requested**, Discord joined, Claude Code set up | Both | 13 Oct | - |
| C | **Contracts agreed:** `docs/contracts.md` + `fixtures/bundle-sample/` committed | Both | 14 Oct | Blocks parallel work; do it first |
| 1 | JSCAD imported, MIT in About, [`node.yml`](https://github.com/jscad/OpenJSCAD.org/blob/master/.github/workflows/node.yml) migrated, `CLAUDE.md` in repo | Ashfaq | 15 Oct | Standalone packages against published `@jscad/*` |
| 2 | Polynomial → STL + SVG + overlay in CI | Ashfaq | 15 Oct | SVG first |
| 3 | 3D print access confirmed; quote + turnaround known | Shawki | 15 Oct | Show files only; say so (big Impact hit) |
| 4 | Practitioner booked (15th), spoken to (20th) | Ashfaq | 20 Oct | Narrow the claim; never invent quotes |
| 5 | **Duo loop: a person files the issue → one `locus-request` session → spec → red → fix → green, twice.** Also record: which tools work in the ambient flow (file tools, `run_command` / `run_tests`, `create_commit`), the assign trigger on a Service Desk issue, and whose credits are used | Ashfaq | **16 Oct** | **Switch to Supervised** |
| 5b | Impact reviewer + regression detective: a person's MR with a seeded generator regression → `library-impact` fails → review on the MR; merged anyway → re-check on `main` fails → bisect → inverse-commit MR | Ashfaq | 20 Oct | Agent posts the diagnosis only; revert is manual |
| 5c | Release guard: a seeded bad staging/production deploy → agent's rollback MR → traffic back on the last good revision | Shawki | 23 Oct | Agent posts the incident note; rollback runs as a CI job |
| 6 | Service Desk email intake works | Ashfaq | 17 Oct | Issue template intake; say so |
| 6b | Hosting skeleton: GitLab CI deploys a placeholder site to Cloud Run staging + production | Shawki | 17 Oct | Pages fallback |
| 7 | touchcheck 5 rules + overlay; seeded bad fixtures fail correctly | Ashfaq | 18 Oct | Cut to TL-1, 2, 4 |
| 7b | **Calibration test print** received (line widths, heights, spacing, braille dots) and rule values adjusted | Shawki | 19 Oct | Use published values only; say so |
| 8 | Guards block bad agent diffs | Ashfaq | 20 Oct | Must pass |
| H | **Handover accepted** (§15.4) | Both | 21 Oct | Fix gaps on the pairing day |
| 9 | Release → staging → production → reply email, on real bundles | Shawki | 23 Oct | Pages fallback |
| 10 | **Prototype prints in hand** (A, B, C) | Shawki | 16 Oct | Done (sent to print 16 Oct) |
| 10b | **One blind or low-vision reader** touches both prints (informed consent; no personal data; filmed hands only if they agree) and gives one honest sentence | Shawki (session), Ashfaq (outreach) | 24 Oct | Say plainly that no reader test was done |
| 11 | **Sound-off test:** 2 people who've never heard of Locus watch the draft video once and explain it in one sentence | Shawki | 25 Oct | Recut the video, not the code |

---

# PART IV: TEAM, SCHEDULE AND HANDOVER

## Roles

| | **Ashfaq** | **Shawki** |
|---|---|---|
| Lead period | 13-21 Oct (core build) | Hosting track from 13 Oct; leads from 21 Oct |
| Owns | Project setup, JSCAD import + CI migration, generation, touchcheck + overlay, braille, intake + fixer flows, regression detective + `bisect-regression` + `guard-revert`, Service Desk intake, guards, refusal path, local CLI. Tier 2: T2.1, T2.2, T2.3, T2.4, T2.8, T2.9. Tier 3: MCP. Outreach to practitioners and a blind/low-vision reader | Google Cloud + Cloud Run hosting, print sourcing + calibration print, packaging, release, security jobs, staging → production, GitOps `production-revision` + release guard flow, reply email, the prototype prints + reader session, nightly re-check schedule + freeze. Tier 2: T2.5, T2.6, T2.7. Tier 3: AI Catalog. README, video, Devpost, submission |
| Devpost | Team member | **Team Representative** (submits the entry) |
| GitLab / cloud | Maintainer | Maintainer; owns the Google Cloud project and billing |

## Day by day

| Date | Ashfaq | Shawki |
|---|---|---|
| **Tue 13** | Create the Devpost team; onboarding request; Discord; Claude Code setup; email 3-5 TVIs/schools/disability offices, also asking whether one blind/low-vision reader could try two prints on 23-24 Oct | Join the team; onboarding request; Claude Code setup; Google Cloud account + budget alert; ask 2-3 Dhaka print services/labs for quote + turnaround |
| **Wed 14** | **Together: write `docs/contracts.md` + sample bundle fixture (1 h).** JSCAD polynomial → STL/SVG locally; overlay prototype; check Service Desk | **Together: contracts (1 h).** Cloud Run service skeleton + `deploy/gcp/` |
| **Thu 15** | Import JSCAD, migrate [`node.yml`](https://github.com/jscad/OpenJSCAD.org/blob/master/.github/workflows/node.yml), `CLAUDE.md`; generation in CI; **office hours 19:00 UTC** | Confirm print access; design the calibration STL (spacing ladder, line widths, braille dots) |
| **Fri 16** | **Duo loop spike → hands-off or supervised** (`docs/decisions.md`) | Send the calibration print; storyboard the video from Part V |
| **Sat 17** | Service Desk intake; touchcheck TL-1, TL-2, TL-4 | Hosting skeleton: CI → Cloud Run staging + production (Gate 6b) |
| **Sun 18** | TL-3, TL-5; braille + key mode | Release + package jobs against the sample bundle; **from today, run Ashfaq's loop daily on own machine** and log friction in the S.3 status board |
| **Mon 19** | Full loop on a real emailed request; local CLI; `bisect-regression` + `guard-revert` | Calibration print received → adjust profile values with Ashfaq (Gate 7b); security jobs |
| **Tue 20** | Regression detective flow (Gate 5b); guards + refusal; **office hours 10:00 UTC**; practitioner notes; write `HANDOVER.md` | `production-revision` pointer + `deploy-production-pointer` job; Devpost draft text; README skeleton with the one diagram and the §4b comparison |
| **Wed 21** | **Pairing day:** finish T2.1 function families, T2.2 swell profile, T2.3 eval suite, T2.4, T2.8, T2.9 as far as possible; walkthrough; Gate H | **Pairing day:** walkthrough; run everything alone; Gate H; wire real bundles into release → staging → production |
| **Thu 22** | On call for Phase 1 code (bug fixes only) | Release guard flow (Gate 5c); reply email; T2.5 Code Review Flow |
| **Fri 23** | On call | T2.6 library site + a11y job; T2.7 self-healing re-layout; `JUDGING_FREEZE`; README complete; Gates 9 + 10 |
| **Sat 24** | Help with filming; join the reader session if it happens | Reader session (Gate 10b); two clean runs from fresh emails; record the regression-detective run; film the prints |
| **Sun 25** | Review the video draft | Edit; **sound-off test**; recut. No new features |
| **Mon 26** | Final read of the README and Devpost text | `/msr-ship`; check links while signed out; commit `JUDGING_FREEZE=true` |
| **Tue 27** | - | **Submit by 10:00 UTC.** Nothing changes after 13:00 UTC |

## 15. Making the handover smooth

### 15.1 Principle
There's no hard switch on one day. Shawki works alongside from day 1 on hosting and release, so on 21 Oct they're taking over a system they've already run, not meeting it for the first time.

### 15.2 Contract first (made final by Shawki on 16 Oct)
`docs/contracts.md` v1 fixes the interfaces before either side builds (Ashfaq's blocker window: until 17 Oct, 18:00 GMT+6):
- **Bundle contract:** file list, `manifest.json` schema (fields in §9), naming `graph-<iid>-v<n>`.
- **Job contract:** `bundle` job artifact paths; what `release` / `deploy-*` jobs consume; required `needs:`.
- **Flow contract:** labels (`locus-request`, `needs-info`, `cannot-make-readable`, `incident`, `regression`); the issue summary note format the reply email uses; each agent's allowed paths (for `guard-scope`).
- **Rollback contract:** format of `deploy/gcp/production-revision`; how `deploy-production-pointer` applies it.
- **Site contract:** `build-info.json` fields; per-graph page URL pattern.

`fixtures/bundle-sample/` (generated from print B's geometry) lets Shawki build release and deploy jobs while Ashfaq builds the real generator. After the blocker window, any contract change needs both people to agree, recorded in `docs/decisions.md`.

### 15.3 Daily rhythm (13-21 Oct)
- End of every session: follow S.6 (status board S.3 updated, committed and pushed). `/msr-handoff` can help.
- End of day: a 5-line message: **done / next / blocked / decisions / needs from the other person**.
- From 18 Oct, Shawki runs the full loop on their own machine once a day, so environment problems surface early, not on handover day.

### 15.4 Handover acceptance (Gate H, 21 Oct)
- [ ] Gates 0-8 pass, or failures are written down with the agreed fallback.
- [ ] Shawki has run the full loop alone from a fresh email, using only `CLAUDE.md` and `HANDOVER.md`.
- [ ] `/msr-session-start` on Shawki's machine gives an accurate summary of where the project stands.
- [ ] `HANDOVER.md` covers: what works, what's flaky (and how to re-run it), the hands-off/supervised decision, the two flows' configs, service accounts and triggers, CI variable **names** (never values), Service Desk address, known issues, office-hours answers, Tier 2 status.
- [ ] Shawki has Maintainer access, Duo flow access and the Service Desk mailbox. Secrets live only in protected, masked CI variables.
- [ ] Practitioner notes and print contacts are in `docs/` (no learner personal data).
- [ ] The walkthrough call is recorded for reference.

### 15.5 After handover
Ashfaq is on call for bugs in Phase 1 code until 25 Oct and helps film on 24 Oct. All new feature decisions after 21 Oct are Shawki's.

**Cut order if behind:** Tier 3 → T2.9 → T2.7 → T2.5 → T2.2 → T2.1 → TL-3/TL-5 → key mode → Service Desk (use the issue template) → Cloud Run (use Pages).
**Never cut:** the Duo loop, a real touch failure + overlay, the agent fix, **at least one lifecycle agent beyond intake/fixer (regression detective or release guard)**, guard-scope + guard-maths, release, braille ID, the prototype prints, honest limitations.

## 16. Office-hours questions (15 Oct: Ashfaq; 20 Oct: both)
1. Are pipeline-**failed** triggers for custom flows enabled on the hackathon instance? If not, does a CI-posted MR note that mentions the flow service account trigger it?
2. Is Service Desk enabled, and does a Service Desk-created issue fire a "work item created" trigger?
3. During judging, can scheduled pipelines run read-only, and may judges trigger the flow?
4. Are any registries or security templates limited by the group's tier?
5. Is it fine to state that Claude Code was used to build the project while GitLab Duo runs the in-product agents?
6. Do pipeline-failed triggers also fire for **scheduled** pipelines and for pipelines on `main`, and can a flow open an MR that contains a `git revert`?

**Answered 15 Oct (Discord):** each teammate onboards separately; credits are personal. Triggers need a human action, so scheduled pipelines, bots and other flows can't start them. A human-merged `main` pipeline does qualify. A revert MR isn't a documented capability. Impact and proposed redesign: [`docs/decisions.md`](docs/decisions.md).

7. Triggered flows bill the service account through the namespace's Monthly Commitment Pool. Does the hackathon group have one, or do triggered flows use the triggering member's credits?
8. Is the hackathon group Ultimate (needed for the SAST resolution, secret FP and breaking-change flows)?
9. In CI-executed (`ambient`) custom flows, are `run_command`, `edit_file` and `read_file` available?
10. Can a flow merge an MR or set auto-merge?

---

# PART V: THE VIDEO (2:55, 9 beats, one real run + one lifecycle-agent moment)

**Principles:** one request (#N) from start to finish, plus one short lifecycle-agent beat. A stage tracker bar (Plan … Govern) sits at the bottom and lights up only when the real event appears on screen. Use plain words on screen and don't explain YAML. AI narration and captions are allowed. No third-party trademarks or music. YouTube Public or Unlisted. **Nine beats, no more.**

| # | Time | Show | Say | Tracker |
|---|---|---|---|---|
| 1 | 0:00-0:25 | Prototype prints A and B side by side. A hand, eyes closed, over **A** (curve and grid line merge), then **B** (clearly separate). Captions: "Prototype prints of the same graph" and "Modelling one tactile graph by hand: ~2 hours." | "Same graph, two prints. On the left, a fingertip can't tell the curve from the axis. Teachers spend hours making these by hand." | - |
| 2 | 0:25-0:45 | Teacher's email → issue appears → Duo intake session → MR with spec | "With Locus, a teacher just sends an email. A GitLab Duo agent turns it into a graph." | Plan, Create |
| 3 | 0:45-1:05 | Red pipeline → **overlay**: red circle "1.4 mm apart, needs 3.2 mm", "label touches line" | "Locus checks it the way a fingertip would. It fails." | Verify |
| 4 | 1:05-1:25 | Fixer session → diff in plain words → guards green | "The agent fixes its own work, and it can only change the layout, never the rules or the maths." | Create, Secure |
| 5 | 1:25-1:50 | Green overlay → package → release → staging validated → production | "Every check passes. GitLab packages it, releases it, validates it on staging and puts it live. No human touched it." | Verify, Package, Release, Configure |
| 6 | 1:50-2:05 | Reply in the teacher's inbox → the print → finger finds the braille ID → same ID on the release page | "The teacher gets a print-ready file. The braille ID traces each print to its release." | Govern |
| 7 | 2:05-2:25 | **Impact reviewer / regression detective:** a developer's MR changes the generator → every shipped graph is re-rendered → graph 7 now fails → agent's plain-language review on the MR (or, after merge, bisect → inverse-commit MR → green) | "A developer changed the code. Another agent re-checked every graph already shipped, found the one it would break, and said why, before anyone printed it." | Monitor, Create |
| 8 | 2:25-2:40 | The one diagram + all 9 stages lit + caption with the **real** eval score (T2.3) | "Five agents, nine lifecycle stages, and every agent is tested on real teacher requests." | all 9 |
| 9 | 2:40-2:55 | Name + tagline + URLs + limitation line + reader's/practitioner's sentence **only if real, with consent** | "Locus. Graphs a fingertip can read." | - |

**In the README only (not in the video):** the release guard's rollback run, the refusal path, the foundational security flows and the comparison table. Each links to the real issue, MR or pipeline.

---

# PART VI: HONEST SCORECARD (1-5 per criterion, equal weight)

Earlier versions of this plan scored themselves higher with each revision, even though nothing new had been proven. These numbers are deliberately conservative. Nothing is built yet.

| Criterion | Floor | **Realistic** | Ceiling | What decides it |
|---|---:|---:|---:|---|
| **Technological Implementation** (tie-breaker) | 3.0 | **4.0** | 4.5 | Five agents with real lifecycle jobs (fix, impact review, rollback, bisect + revert), per-agent scopes, pipeline-failed triggers, eval suite. It drops if the rollback or detective loops stay half-working |
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

**Biggest risks:** (1) the Duo loop by 16 Oct; (2) trigger limits: only a person's action starts a flow (answered 15 Oct, pipeline v2 in `docs/decisions.md`), plus open questions on credits for triggered flows and which tools ambient flows get (office-hours questions 7-10); (3) prints: solved, prototype plates printed 16 Oct (H9); (4) a practitioner and a reader; (5) handover friction (fixed by contracts, the S.3 status board, and Shawki running the loop from 18 Oct); (6) scope creep; (7) credits: Duo showed zero credits on 15 Oct (asked on Discord).

---

# PART VII: SUBMISSION CHECKLIST

- [ ] Public GitLab repo, MIT LICENSE visible in About, upstream attribution, `docs/related-work.md` citing the tools and paper in §0.1.
- [ ] Original JSCAD URL; production URL (Cloud Run); Google Cloud link.
- [ ] Visible pipeline history: a failing touchcheck → agent fix → pass → release → staging → production; impact review on a developer MR; re-check on `main` → bisect → inverse-commit MR; release-guard rollback run.
- [ ] Agent evidence judges can see: sessions are visible only to Developer+ and are deleted 30 days after last activity. So each agent posts a reasoning-summary note, session logs are exported to `docs/evidence/`, and the full demo is re-run around 25 Oct so the sessions last through judging.
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
