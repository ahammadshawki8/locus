# Locus

Locus turns a teacher's emailed maths function into a raised-line, 3D-printable tactile graph. GitLab Duo agents write
and fix it, the GitLab pipeline checks it by touch rules TL-1 to TL-5 and four guards, and Google Cloud Run serves the
graph library. Start with [README.md](README.md), [docs/architecture.md](docs/architecture.md) and
[docs/contracts.md](docs/contracts.md).

## Hard rules

- **H1 Git identity.** Commit and push only as **`ahammadshawki8 <ahammadshawki8@users.noreply.github.com>`** or as
  **Ashfaq's own account**. Never list Claude, Anthropic, `srotdev`, or any other AI tool or account as author,
  committer, co-author or contributor. No `Co-Authored-By` lines and no "Generated with ..." lines in commits, merge
  requests, pull requests, issues or release notes.
- **H2 No emojis and no long dashes, anywhere in the project:** code, comments, docs, commit messages, issues, MR
  text, the site, video captions and Devpost text. "Long dashes" means the em dash (U+2014) and the en dash (U+2013);
  also avoid the minus sign (U+2212). Use a hyphen, colon, comma, "to" or "-" instead. Braille cells (U+2800 block)
  are allowed only where they show braille.
- **H3 Truth rule.** Never claim a feature works until it has run. Never claim a graphic is understandable by touch
  because it passed automated rules. Never fake a failure, a pass or an agent action.
- **H4 Simplicity rule.** Every feature either appears in the one story (from a lesson idea to a print in hand) or
  stays in the docs.
- **H5 Contracts are law.** `docs/contracts.md` v1 is final. A change is an MR that both maintainers approve.
- **H6 Role boundary.** Claude Code is how we build Locus; GitLab Duo runs every agent inside Locus. Claude Code never
  starts a flow and never makes in-product fixes during a recorded or demo run.
- **H7 Agents stay in scope.** Never edit `locus/touchcheck/rules`, profile rule values or `remedies.json` to make a
  request pass. Each agent writes only its allowed paths (`docs/contracts.md` §7), enforced by `guard-scope`.
- **H8 No secrets** in code, prompts, commits or logs. Use masked CI variables only. Write variable names in docs,
  never values. Never repeat a personal "Email a new issue" address.
- **H9 Prints.** The only physical prints are the 4 prototype plates (calibration, A, B, C; `tools/prints/README.md`).
- **H10 Sources.** Every external fact in the docs links to its source.
- **H11 Record and push.** Every session ends with its work committed and pushed (GitLab `gitlab` and GitHub `origin`).
- **H12 Freeze.** Nothing in the repo, video or Devpost form changes after 27 Oct 2026, 13:00 UTC.

## Commands

```sh
npm run setup                                         # install, check flows, render + touch-check requests/4, doctor
npm run test:locus                                    # Locus tests (node:test), including the prints A, B, C reproduction
npm run locus -- examples/projectile.json             # validate + render to out/projectile (STL, SVG, description, scene)
npm run locus -- touchcheck examples/projectile.json  # TL-1 to TL-5: report + overlay + LOCUS_REPORT line (exit 1 = failed)
npm run locus -- guard maths requests/<iid> --base <sha>  # guards write out/guards/*.json (also: scope, description, revert)
npm run locus -- recheck [--impact]                   # every shipped graph (newest graph-<iid>-v<n> tag) with this code
npm run locus -- bisect                               # after a failed recheck: first bad commit per graph
npm run locus -- bundle requests/<iid>                # out/bundle/graph-<iid>-v<n>/ + .zip + manifest
npm run locus -- doctor --project <path>              # with GITLAB_TOKEN: is a GitLab project set up to run Locus?
node locus/flows/check.js                             # the Duo flow files against the flow schema (exit 0)
npm install && npm test && npm run test:tsd           # upstream JSCAD tests (what `upstream-test` runs in CI)
```

## Architecture

1. `packages/**` is upstream JSCAD (MIT), imported with full history. Change it only to fix CI.
2. `locus/core`: spec schema, polynomial parser (no `eval`), placement, JSCAD geometry to STL, SVG, braille,
   description, bundle. Reproduces `tools/prints/` exactly (contracts D3).
3. `locus/touchcheck`: rules TL-1 to TL-5 measured on the rendered scene, overlay SVG, `remedies.json`.
4. `locus/guards`: `guard-scope`, `guard-maths`, `guard-description`, `guard-revert`. Deterministic, run in CI.
5. `locus/release`: auto-merge, license-check, publish, release, reply, print-order, print-reprints.
6. `locus/site`: the graph library site and `validate-site`. `locus/cli`: the local entry point, `setup`, `doctor`.
7. `profiles/<id>.json`: printer profiles (contracts §2). `requests/<iid>/{spec.json,request.lock.json,layout.json}`:
   one folder per teacher request, written by agents.
8. `.gitlab/duo/flows/`: `locus-request` (intake, fixer, refuse) and `locus-ops` (triage, impact reviewer,
   regression detective). `locus/flows/check.js` checks their schema.
9. `.gitlab-ci.yml`: the pipeline is the quality gate. `release` needs touchcheck, all guards, security and bundle;
   `promote-production` needs `validate-staging`. The reprints schedule sets the input `schedule: reprints`.
10. `deploy/gcp/`: Cloud Run setup and deploy, and `production-revision` (GitOps rollback pointer).

## Also never

- Change `request.lock.json` after the first commit. The fixer edits `layout.json` only.
- Run `eval`/`Function` on anything derived from a request. Expressions are parsed against an allowlist.
- Add a CI job that fakes a pass (`echo ok`). A job that isn't built stays out of the pipeline.
- Hand-write a manifest. Every manifest is generated from real job output only.

## Conventions

- Plan first, then TDD: failing test, then code. Tests live next to code as `*.test.js` (node:test).
- Feature branch, MR, pipeline. Small commits, `git commit -s` (DCO 1.1), as yourself (H1).
- Docs show Locus at its best and state only what is true (H3): no status boards, planning notes or internal logs in
  the repository.
- Claude Code sessions: at the end of each step, explain what was done and why, say whether to start a new session,
  and give a ready-to-paste prompt for the next one (branch, last commit, next task, the rules that matter).

## Ownership

| Area | Owner |
|---|---|
| JSCAD import + CI migration, `locus/core`, `locus/touchcheck`, `locus/guards`, `locus/cli`, `locus-request` flow, regression detective | Ashfaq |
| `deploy/gcp/`, release, package and security jobs, reply and print orders, `locus/site`, README, video and Devpost | Shawki |
| `docs/contracts.md` | Both (changes need agreement) |
