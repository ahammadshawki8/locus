# STATE

_Last updated: 14 Oct 2026 (Ashfaq). Update at the end of every working session._

## Next task

1. **Together (1 h):** review and agree [contracts.md](contracts.md) + [fixtures/bundle-sample/](../fixtures/bundle-sample/) → Gate C.
2. Import this repo into GitLab (hackathon group), set MIT in About, run the pipeline once so `upstream-test` is proven on GitLab → Gate 1.
3. Gate 2: make `locus` an npm workspace depending on `packages/modeling`; polynomial → STL + SVG (TDD), then `render` job in CI.

## Gates

| # | Gate | Status | Notes |
|---|---|---|---|
| 0 | Devpost team, GitLab onboarding, Discord, Claude Code | ? | not tracked in repo |
| C | Contracts agreed | **draft** | `docs/contracts.md` + `fixtures/bundle-sample/` committed, awaiting Shawki |
| 1 | JSCAD imported, MIT in About, `node.yml` migrated, `CLAUDE.md` + `STATE.md` | **partial** | Imported with full history on GitHub fork; `upstream-test` written in `.gitlab-ci.yml` but **not yet run on GitLab**; About pending GitLab project |
| 2 | Polynomial → STL + SVG + overlay in CI | not started | |
| 3 | 3D print access | Shawki | |
| 4 | Practitioner booked / spoken to | not started | |
| 5 | Duo loop hands-off twice | not started | due 16 Oct |
| 5b | Regression detective | not started | |
| 5c | Release guard | Shawki | |
| 6 | Service Desk intake | not started | |
| 6b | Hosting skeleton | Shawki | |
| 7 | touchcheck 5 rules + overlay | not started | |
| 7b | Calibration print | Shawki | |
| 8 | Guards block bad diffs | not started | |

## Tier status

- Tier 1: scaffolding only. No generation, touchcheck, guards or flows run yet.
- Tier 2 / 3: not started.

## What exists (and what is only a placeholder)

- Real: JSCAD import, `upstream-test` + `locus-test` + security template jobs in `.gitlab-ci.yml`, JSON schemas, profile `fdm-3d-v1` values (from published guidance, unconfirmed), `remedies.json`, contract tests on `examples/` and `fixtures/`.
- Placeholder: `.gitlab/duo/flows/*.yml` are design drafts, **not** validated against the Duo custom-flow schema. `locus/cli` only validates input. `fixtures/bundle-sample/` is fake (`"fixture": true`). `.gitlab/CODEOWNERS` uses placeholder owners.

## Blockers / open questions

- GitLab hackathon group access (onboarding) needed before Gate 1 can close.
- CODEOWNERS needs real GitLab usernames.
- Office-hours questions: projectLocus.md §16 (15 Oct 19:00 UTC).
