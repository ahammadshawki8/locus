# Locus handover (DRAFT, 17 Oct 2026, Ashfaq)

For Shawki, who leads from 21 Oct (`projectLocus.md` §15). This file says what exists, what has really run, what is
flaky and how to re-run it. It does not repeat the plan: rules are in `projectLocus.md` S.2, the status board in S.3,
interfaces in `docs/contracts.md`, and every decision with its evidence in `docs/decisions.md`. Draft: it is finished
on 20 Oct (Gate H checklist, §15.4) and kept true after that.

## 1. Where things are

| What | Where |
|---|---|
| Product code | Ashfaq's fork `ashfaqstu/locus`, branch `feat/gate2-render`; [PR 1](https://github.com/ahammadshawki8/locus/pull/1) into the working repo `ahammadshawki8/locus` (merge commit only), not merged |
| GitLab test bed | Ashfaq's Showcase, `gitlab-ai-hackathon/transcend-october-2026/43396940/showcase` (project 87669530). Ashfaq is a Developer there, not a Maintainer. `main` holds our code (fast-forward merges `3e0af8ea`, then `820fd236`) |
| Team project | Shawki's Showcase, `.../43384339/showcase`. Our code is not in it yet (S.3 Next item 0) |
| Flows | `.gitlab/duo/flows/locus-request.yml` (intake, fixer, refuse), `locus-ops.yml` (impact reviewer, regression detective; release guard routes to end), `locus-probe.yml` (test only). The repo file is the source of truth; it is pasted into the AI Catalog unchanged |
| Pipeline | `.gitlab-ci.yml`: render, touchcheck, guard-scope, guard-maths, guard-description, guard-revert, library-impact, library-recheck, bisect-regression, bundle, upstream-test, locus-test, plus GitLab's Secret Detection and SAST templates |

## 2. What works, seen in our account (H3)

Each line links to the `docs/decisions.md` entry that holds the evidence.

- **Pipeline:** on test bed `main`, every job that ran passed (pipeline 2955199583: 12 jobs, 16 Oct (m); pipeline
  2955873544: 11 jobs, 16 Oct (o)). `bisect-regression` was skipped both times: it runs only after a failed recheck,
  so it has run locally and in tests, not on GitLab.
- **locus-request, end to end, twice:**
  - Issue #3, started by **assign**, MR !1, session 9601992: attempt 1 red, the agent's own layout fix, attempt 2
    green, bundle `graph-3-v1` (16 Oct (m)).
  - Service Desk ticket #5, started by a **mention**, MR !3, session 9616199: same shape, bundle `graph-5-v1`, and the
    requester's inbox got the Support Bot thank-you and both agent notes (16 Oct (o) item 7).
- **guard-scope** reads the commit author: agent commits carry the flow's display name (`locus-request`), 16 Oct (l).
- **agentSessions** in the manifest come from the `Locus-Session:` trailer on agent commits (16 Oct (j), (m)).
- **locus-probe** (16 Oct (l)): a flow can read a job log, commit and delete a file.

## 3. What has not run yet

- The refusal path (`cannot-make-readable`): both runs passed on attempt 2. See S.3 for the planned request.
- `locus-ops` (impact reviewer, regression detective): written and schema-checked, never created in the AI Catalog.
- Not built: `auto-merge`, `publish-package`, `release`, `deploy-staging`, `validate-staging`, `promote-production`,
  `post-deploy-smoke`, `reply-teacher`, the release guard, `license-check`. No graph has been merged or released, so
  no `graph-<iid>-v<n>` tag exists and `library-recheck` has nothing to re-check.
- The "work item created" trigger, and the issue template (`.gitlab/issue_templates/` does not exist yet).
- Credits per run: nothing appeared on the Credits page for Ashfaq (a Developer); unknown whether a Maintainer sees more.

## 4. Flows, service accounts and triggers

| Flow | Display name (must be exact, `locus/guards/agents.json`) | Service account | Trigger seen working |
|---|---|---|---|
| `locus-request` | `locus-request` | `ai-locus-request-gitlab-ai-hackathon` | Assign on an issue (#3); mention on a Service Desk ticket (#5) |
| `locus-probe` | `locus-probe` | `ai-locus-probe-gitlab-ai-hackathon` | Mention (#2) |
| `locus-ops` | `locus-ops` | not created | none |

- GitLab refuses to assign a flow's service account to a Service Desk ticket ("Cannot assign"), so on a ticket a person
  mentions the account in one comment, for example `@ai-locus-request-gitlab-ai-hackathon please make this graph.`
- Flows start only on a person's action. Claude Code never starts one (H6).
- To change a flow: edit the repo file, run `node locus/flows/check.js` (exit 0), then paste the whole file into the
  flow's AI Catalog entry, replacing the old YAML.

## 5. Service Desk

- Enabled on the test bed. **Use the `incoming+<project slug>-<id>-issue-@incoming.gitlab.com` address.** The
  `contact-project+...` address that GraphQL returns as `serviceDeskAddress` created no ticket (two emails, 16 Oct (o)).
- A ticket is a confidential work item of type Ticket, author `support-bot`. Notes on it are emailed to the requester
  by the Support Bot.

## 6. CI variables (names only, H8)

- `RELEASE_MODE` (`hands-off` or `supervised`), set in `.gitlab-ci.yml`, recorded in every manifest.
- No secret variables exist yet. The Google Cloud deploy jobs will need protected, masked variables; list their
  names here when they are added.

## 7. Flaky or limited, and how to re-run

- **render, about 3 in 100 requests:** "mesh still has N unpaired edges" (overlapping marks or labels, very steep
  cubics; 16 Oct (n)). In a flow run the fixer reports BROKEN and asks a person to look. Re-run locally with
  `npm run locus -- requests/<iid>/spec.json`. S.3 Next item 12 is the fix.
- **GitLab.com outages** cut off three sessions on ticket #4 (16 Oct (o)). A new mention on the same ticket does not
  restart it (intake answers `exists`); file a fresh request instead.
- **A session dropped mid-run** leaves the MR open and red. Close it with a note; never finish it by hand (H3, H6).

## 8. Open questions for GitLab (Discord)

In S.3, "Waiting on GitLab". Office-hours answers so far: `docs/decisions.md` 15 Oct (a).

## 9. Decisions that need both of us

S.3 Next items 0, 9, 10, 11 and the owner of `auto-merge`.
