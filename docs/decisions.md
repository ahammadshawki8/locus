# Locus decisions log

Dated entries, newest first. Any change to `docs/contracts.md` gets a line here.

---

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
