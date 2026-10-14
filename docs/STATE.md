# STATE

_Last updated: 14 Oct 2026, evening (Ashfaq). Update at the end of every working session._

## Next task

1. **touchcheck v1 (Ashfaq, next session):** `locus/touchcheck` rules **TL-1, TL-4, TL-5** measured on `out/<iid>/scene.json`,
   `touchcheck-report.json` (contracts §4, all five rules listed; TL-2/TL-3 report "not applicable: no labels yet"
   until braille labels exist), `overlay.svg` (red circle + plain words + measured value), a `touchcheck` CI job with
   `artifacts:when: always`. Expected first real failure: the projectile example (curve ≈ 3.1 mm from the x-axis near both
   ends; grid line through the vertex). Do not tune rule values to make it pass.
2. **Together (1 h):** agree [contracts.md](contracts.md) + [fixtures/bundle-sample/](../fixtures/bundle-sample/) → Gate C.
3. **Needs GitLab access:** import this repo into the hackathon group, set MIT in About, run the pipeline → Gates 1 + 2 close.
4. **16 Oct:** Duo loop spike (Gate 5). Convert `.gitlab/duo/flows/locus-request.yml` + `locus-fixer.yml` to real flow syntax.

## Gates

| # | Gate | Status | Notes |
|---|---|---|---|
| 0 | Devpost team, GitLab onboarding, Discord, Claude Code | ? | not tracked in repo |
| C | Contracts agreed | **draft** | awaiting Shawki; `scene.json` added to §5 on 14 Oct |
| 1 | JSCAD imported, MIT in About, `node.yml` migrated, `CLAUDE.md` + `STATE.md` | **partial** | done on GitHub fork (`ashfaqstu/locus`); `upstream-test` **not yet run on GitLab** |
| 2 | Polynomial → STL + SVG + overlay in CI | **partial** | STL + SVG + description render locally (40 tests); `render` CI job written, **not yet run on GitLab**; overlay comes with touchcheck |
| 3 | 3D print access | Shawki | |
| 4 | Practitioner booked / spoken to | not started | |
| 5 | Duo loop hands-off twice | not started | due 16 Oct |
| 5b | Regression detective | not started | |
| 5c | Release guard | Shawki | |
| 6 | Service Desk intake | not started | |
| 6b | Hosting skeleton | Shawki | |
| 7 | touchcheck 5 rules + overlay | not started | next task |
| 7b | Calibration print | Shawki | also confirm separate overlapping shells slice correctly (decisions.md) |
| 8 | Guards block bad diffs | not started | |

## Tier status

- Tier 1: validation, polynomial roots/marks, mm scene, STL (watertight shells), SVG preview, description, CLI, `render` job.
  Not yet: braille labels + key mode, touchcheck, overlay, guards, bundle/manifest, flows, Service Desk.
- Tier 2 / 3: not started.

## What exists (and what is only a placeholder)

- Real: JSCAD import; CI jobs `render`, `upstream-test`, `locus-test`, secret detection, SAST; schemas; validation;
  `fdm-3d-v1` (rule values from published guidance, geometry values are design defaults; both unconfirmed);
  `remedies.json`; rendering pipeline; contract tests on `examples/` and `fixtures/`.
- Placeholder: `.gitlab/duo/flows/*.yml` are design drafts, **not** Duo flow syntax. `fixtures/bundle-sample/` is fake
  (`"fixture": true`). `.gitlab/CODEOWNERS` uses placeholder owners. Description has no braille-label text yet.

## Branches

- `chore/init-project`: JSCAD import + scaffolding. `feat/gate2-render` (on top): rendering. Neither pushed yet.

## Blockers / open questions

- GitLab hackathon group access (onboarding) needed before Gates 1/2 can close and before the Duo spike.
- CODEOWNERS needs real GitLab usernames.
- Office-hours questions: projectLocus.md §16 (15 Oct 19:00 UTC).
