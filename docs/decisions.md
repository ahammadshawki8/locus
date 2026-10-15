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
