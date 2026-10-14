# STATE

_Last updated: 14 Oct 2026, late evening (Ashfaq). Update at the end of every working session._

## Next task

1. **Braille labels + key mode (Ashfaq):** then TL-2 / TL-3 become real checks (they fail, not pass, if labels appear
   before the checks exist). Add seeded bad fixtures for Gate 7 ("seeded bad fixtures fail correctly").
2. **Together (1 h):** agree [contracts.md](contracts.md) + [fixtures/bundle-sample/](../fixtures/bundle-sample/) → Gate C,
   including the additive touchcheck report fields (`note`, `subject`, nullable `at`) proposed in contracts §4 on 14 Oct.
3. **Needs GitLab access:** import this repo into the hackathon group, set MIT in About, run the pipeline → Gates 1 + 2 close.
4. **16 Oct:** Duo loop spike (Gate 5). Convert `.gitlab/duo/flows/locus-request.yml` + `locus-fixer.yml` to real flow syntax.

## Gates

| # | Gate | Status | Notes |
|---|---|---|---|
| 0 | Devpost team, GitLab onboarding, Discord, Claude Code | ? | not tracked in repo |
| C | Contracts agreed | **draft** | awaiting Shawki; `scene.json` added to §5, touchcheck report fields to §4 on 14 Oct |
| 1 | JSCAD imported, MIT in About, `node.yml` migrated, `CLAUDE.md` + `STATE.md` | **partial** | done on GitHub fork (`ashfaqstu/locus`); `upstream-test` **not yet run on GitLab** |
| 2 | Polynomial → STL + SVG + overlay in CI | **partial** | STL + SVG + description + overlay locally (83 tests); `render` + `touchcheck` CI jobs written, **not yet run on GitLab** |
| 3 | 3D print access | Shawki | |
| 4 | Practitioner booked / spoken to | not started | |
| 5 | Duo loop hands-off twice | not started | due 16 Oct |
| 5b | Regression detective | not started | |
| 5c | Release guard | Shawki | |
| 6 | Service Desk intake | not started | |
| 6b | Hosting skeleton | Shawki | |
| 7 | touchcheck 5 rules + overlay | **partial** | TL-1, TL-4, TL-5 measured + report + overlay + CI job; TL-2/TL-3 wait for braille labels; seeded bad fixtures not yet |
| 7b | Calibration print | Shawki | also confirm separate overlapping shells slice correctly (decisions.md) |
| 8 | Guards block bad diffs | not started | |

## Tier status

- Tier 1: validation, polynomial roots/marks, mm scene, STL (watertight shells), SVG preview, description, CLI, `render` job,
  touchcheck TL-1/TL-4/TL-5 + report + overlay + `touchcheck` job.
  Not yet: braille labels + key mode (→ TL-2/TL-3), guards, bundle/manifest, flows, Service Desk.
- Tier 2 / 3: not started.

## What exists (and what is only a placeholder)

- Real: JSCAD import; CI jobs `render`, `upstream-test`, `locus-test`, secret detection, SAST; schemas; validation;
  `fdm-3d-v1` (rule values from published guidance, geometry values are design defaults; both unconfirmed);
  `remedies.json`; rendering pipeline; contract tests on `examples/` and `fixtures/`; touchcheck report schema;
  `locus touchcheck` CLI + `touchcheck` CI job (gates `requests/*`; the example is checked but not a gate).
- **Projectile example fails TL-1 on purpose** (8 places: curve ends 1.53 mm clear of the x-axis near both ends, grid-y-3
  along the vertex at 0 mm, y-axis + grid-x stubs 1.93 mm below the x-axis). A remedy-only layout (`showGrid: false`,
  `yScaleMm: 40`) passes; that's the fixer's path. How real crossings are excused: decisions.md 2026-10-14.
- Placeholder: `.gitlab/duo/flows/*.yml` are design drafts, **not** Duo flow syntax. `fixtures/bundle-sample/` is fake
  (`"fixture": true`). `.gitlab/CODEOWNERS` uses placeholder owners. Description has no braille-label text yet.

## Branches

- `chore/init-project`: JSCAD import + scaffolding. `feat/gate2-render` (on top): rendering + touchcheck v1. Neither pushed yet.

## Blockers / open questions

- GitLab hackathon group access (onboarding) needed before Gates 1/2 can close and before the Duo spike.
- CODEOWNERS needs real GitLab usernames.
- TL-1 open question for the practitioner / BANA 2022: should very shallow crossings fail (a minimum crossing angle)?
  Today they are excused while the lines keep separating (decisions.md 2026-10-14).
- Office-hours questions: projectLocus.md §16 (15 Oct 19:00 UTC).
