# CLAUDE.md — Locus

Locus turns a teacher's emailed maths-graph request into a tactile graph (STL + SVG), checks it the way a
fingertip would (`touchcheck`), lets a GitLab Duo agent fix layout failures, and ships only what passes.
The full plan is in [projectLocus.md](projectLocus.md). Current status is in [docs/STATE.md](docs/STATE.md).

**Role boundary:** Claude Code is how we *build* Locus. GitLab Duo Agent Platform is what *runs inside* Locus.
Never use Claude Code to make in-product fixes (editing `requests/<iid>/`) during a recorded or judged run.

## Commands

```sh
npm run test:locus                                 # Locus tests (node:test, no install needed yet)
npm run locus -- examples/projectile.json          # local CLI (stub until Gate 2)
npm install && npm test && npm run test:tsd        # upstream JSCAD tests (what `upstream-test` runs in CI)
```

## Architecture (10 lines)

1. `packages/**` is upstream JSCAD (MIT), imported with full history. Change it only to fix CI; record why in `docs/decisions.md`.
2. `locus/core`: spec schema, polynomial evaluator (no `eval`), layout, JSCAD geometry → STL, SVG, braille, description, bundle, manifest.
3. `locus/touchcheck`: rules TL-1..TL-5 measured on the rendered geometry, overlay SVG, `remedies.json` (allowed fixes).
4. `locus/guards`: `guard-scope`, `guard-maths`, `guard-description`, `guard-revert`. Deterministic, run in CI.
5. `locus/site`: graph library site + `build-info.json`. `locus/cli`: local entry point.
6. `requests/<iid>/{spec.json,request.lock.json,layout.json}`: one folder per teacher request, written by agents.
7. `.gitlab/duo/flows/*.yml`: the four Duo flows (request, fixer, release-guard, regression-detective).
8. `.gitlab-ci.yml`: the pipeline is the quality gate. `release`/`promote-production` `needs:` touchcheck + all guards + security + bundle.
9. `deploy/gcp/`: Cloud Run config + `production-revision` (GitOps rollback pointer).
10. Interfaces between parts are fixed in [docs/contracts.md](docs/contracts.md). Changing them needs both people.

## Invariants (never break these)

- Never edit `locus/touchcheck/rules`, profile rule values or `remedies.json` to make a specific request pass.
- Agents write only to their allowed paths (see `docs/contracts.md` §Flow): intake/fixer → `requests/<iid>/`;
  release guard → `deploy/gcp/production-revision`; security triage → `package.json` + lockfile.
- The fixer edits `layout.json` only. `request.lock.json` is never changed after the first commit.
- No `eval`/`Function` on anything derived from a request. Expressions are parsed against an allowlist.
- No secrets in prompts, code, fixtures or docs. Use protected, masked CI variables; document variable **names** only.
- Never add a CI job that fakes a pass (`echo ok`). A job that isn't built yet stays out of the pipeline.
- Never claim a graphic is understandable by touch because it passed automated rules.
- Every manifest is generated from real job output only. Fixtures must say `"fixture": true`.

## Conventions

- Plan first, then TDD: failing test → code. Tests live next to code as `*.test.js` (node:test).
- Feature branch → MR → pipeline. Small commits, `git commit -s` (DCO 1.1).
- End of each session: update `docs/STATE.md`. Decisions with a date go in `docs/decisions.md`.

## Ownership

| Area | Owner |
|---|---|
| JSCAD import + CI migration, `locus/core`, `locus/touchcheck`, `locus/guards`, `locus/cli`, intake/fixer/regression-detective flows, Service Desk | Ashfaq |
| `deploy/gcp/`, release/package/security jobs, release-guard flow, reply email, `locus/site`, nightly schedule + freeze, README/video/Devpost | Shawki |
| `docs/contracts.md`, `fixtures/bundle-sample/` | Both (changes need agreement) |
