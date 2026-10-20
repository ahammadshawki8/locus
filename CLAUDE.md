# Locus

Before doing anything, read **Part S of `projectLocus.md`** (start here, hard rules, status board, project flow, document map, session routine). Then read `docs/contracts.md` and the newest entries in `docs/decisions.md`.

## Hard rules (mirror of `projectLocus.md` S.2; keep both identical)

- **H1 Git identity.** Commit and push only as **`ahammadshawki8 <ahammadshawki8@users.noreply.github.com>`** or as **Ashfaq's own account**. Never list Claude, Anthropic, `srotdev`, or any other AI tool or account as author, committer, co-author or contributor. No `Co-Authored-By` lines and no "Generated with ..." lines in commits, merge requests, pull requests, issues or release notes.
- **H2 No emojis and no long dashes, anywhere in the project:** code, comments, docs, commit messages, issues, MR text, the site, video captions and Devpost text. "Long dashes" means the em dash (U+2014) and the en dash (U+2013); also avoid the minus sign (U+2212). Use a hyphen, colon, comma, "to" or "-" instead. Braille cells (U+2800 block) are allowed only where they show braille.
- **H3 Truth rule.** A planned stage is not a completed stage. Never claim a graphic is understandable by touch because it passed automated rules. Never claim a GitLab capability works until it has run in our account. Never fake a failure, a pass or an agent action.
- **H4 Simplicity rule.** If a judge can't explain Locus in one sentence after watching the video once with the sound off, the video has failed. Every feature either appears in the one story or stays in the README.
- **H5 Contracts are law.** `docs/contracts.md` v1 is final. Change it only through a dated entry in `docs/decisions.md` that both Ashfaq and Shawki agree to.
- **H6 Role boundary.** Claude Code is how we build Locus; GitLab Duo runs every agent inside Locus. Never use Claude Code to make in-product fixes during a recorded or demo run.
- **H7 Agents stay in scope.** Never edit `locus/touchcheck/rules` to make a request pass. Each agent writes only its allowed paths (`docs/contracts.md` §7), enforced by `guard-scope`.
- **H8 No secrets** in code, prompts, commits or logs. Use protected, masked CI variables only. Write variable names in docs, never values.
- **H9 Prints.** The only physical prints are the 4 prototype plates from 15 and 16 Oct (calibration, A, B, C; `tools/prints/README.md`). There will be no more printing. Video captions call them "prototype prints".
- **H10 Sources.** Every external fact in the docs links to its source.
- **H11 Record and push.** Every decision gets a dated entry in `docs/decisions.md`. Every session ends with the S.3 board updated, committed and pushed.
- **H12 Freeze.** Nothing in the repo, video or Devpost form changes after 27 Oct 2026, 13:00 UTC.

## Commands

```sh
npm --prefix locus ci                                 # once: installs ajv + links packages/modeling
npm run test:locus                                    # Locus tests (node:test), including the prints A, B, C reproduction
npm run locus -- examples/projectile.json             # validate + render to out/projectile (STL, SVG, description, scene)
npm run locus -- touchcheck examples/projectile.json  # TL-1 to TL-5 on out/projectile: report + overlay + LOCUS_REPORT line (exit 1 = failed)
npm run locus -- guard maths requests/<iid> --base <sha>  # guards write out/guards/*.json (also: scope, description, revert)
npm run locus -- recheck [--impact]                   # every shipped graph (newest graph-<iid>-v<n> tag) with this code: out/recheck or out/impact + LOCUS_RECHECK/LOCUS_IMPACT line
npm run locus -- bisect                               # after a failed recheck: first bad commit per graph (git bisect in a worktree): out/bisect + LOCUS_BISECT line
npm run locus -- bundle requests/<iid>                # out/bundle/graph-<iid>-v<n>/ + .zip + manifest from render, touchcheck, guard output
npm install && npm test && npm run test:tsd           # upstream JSCAD tests (what `upstream-test` runs in CI)
```

## Architecture (10 lines)

1. `packages/**` is upstream JSCAD (MIT), imported with full history. Change it only to fix CI; record why in `docs/decisions.md`.
2. `locus/core`: spec schema, polynomial evaluator (no `eval`), placement, JSCAD geometry to STL, SVG, braille, description. Reproduces `tools/prints/` exactly (contracts D3).
3. `locus/touchcheck`: rules TL-1 to TL-5 measured on the rendered scene, overlay SVG, `remedies.json` (allowed fixes).
4. `locus/guards`: `guard-scope`, `guard-maths`, `guard-description`, `guard-revert`. Deterministic, run in CI.
5. `profiles/<id>.json`: printer profiles (contracts §2). `locus/site`: graph library + `build-info.json`. `locus/cli`: local entry point.
6. `requests/<iid>/{spec.json,request.lock.json,layout.json}`: one folder per teacher request, written by agents.
7. `.gitlab/duo/flows/`: the two Duo flows, `locus-request` (intake, fixer) and `locus-ops` (impact reviewer, regression detective, release guard), plus the test-bed probe `locus-probe`; `locus/flows/check.js` checks their schema.
8. `.gitlab-ci.yml`: the pipeline is the quality gate. `release` needs touchcheck, all guards, security and bundle; `promote-production` needs `validate-staging`.
9. `deploy/gcp/`: Cloud Run config + `production-revision` (GitOps rollback pointer).
10. Interfaces between parts are fixed in [docs/contracts.md](docs/contracts.md) (H5).

## Also never

- Edit profile rule values or `remedies.json` to make a specific request pass.
- Change `request.lock.json` after the first commit. The fixer edits `layout.json` only.
- Run `eval`/`Function` on anything derived from a request. Expressions are parsed against an allowlist.
- Add a CI job that fakes a pass (`echo ok`). A job that isn't built yet stays out of the pipeline.
- Hand-write a manifest. Every manifest is generated from real job output only.

## Conventions

- Plan first, then TDD: failing test, then code. Tests live next to code as `*.test.js` (node:test).
- Feature branch, MR, pipeline. Small commits, `git commit -s` (DCO 1.1), as yourself (H1).
- End of each session: follow `projectLocus.md` S.6 (S.3 status board, `docs/decisions.md`, H2 check, commit, push).
- Claude Code sessions: at the end of each step, explain what was done and why (enough depth for a person to carry
  on alone), say whether to start a new session now so context doesn't pile up, and give a ready-to-paste prompt for
  the next session (branch, last commit, next task with how to check it, the rules that matter).

## Ownership

| Area | Owner |
|---|---|
| JSCAD import + CI migration, `locus/core`, `locus/touchcheck`, `locus/guards`, `locus/cli`, `locus-request` flow, regression detective, Service Desk | Ashfaq |
| `deploy/gcp/`, release/package/security jobs, release guard, reply email, `locus/site`, nightly schedule + freeze, README/video/Devpost | Shawki |
| `docs/contracts.md`, `fixtures/bundle-sample/` | Both (changes need agreement) |
