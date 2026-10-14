# STATE

_Last updated: 14 Oct 2026, night (Ashfaq). Update at the end of every working session._

## Next task

1. **Bundle + manifest + braille ID (Ashfaq):** `bundle` job builds `graph-<iid>-v<n>` from real render + touchcheck
   output (contracts §2–3), and the braille ID `L<iid>-<n>` is embossed on the plate (it needs `n`, so render takes the
   version), checked by TL-2/TL-3/TL-5 like any label. Unblocks Shawki's release jobs on a real bundle.
   Then `guard-scope` + `guard-maths` (never cut).
2. **Together (1 h):** agree [contracts.md](contracts.md) + [fixtures/bundle-sample/](../fixtures/bundle-sample/) → Gate C,
   including the additive touchcheck report fields (`note`, `subject`, nullable `at`) proposed in contracts §4 on 14 Oct.
3. **Needs GitLab access:** import this repo into the hackathon group, set MIT in About, run the pipeline → Gates 1 + 2 close.
4. **16 Oct:** Duo loop spike (Gate 5). Convert `.gitlab/duo/flows/locus-request.yml` + `locus-fixer.yml` to real flow syntax.

## Gates

| # | Gate | Status | Notes |
|---|---|---|---|
| 0 | Devpost team, GitLab onboarding, Discord, Claude Code | ? | not tracked in repo |
| C | Contracts agreed | **draft** | awaiting Shawki; `scene.json` (+ labels, key) added to §5, touchcheck report fields to §4 on 14 Oct |
| 1 | JSCAD imported, MIT in About, `node.yml` migrated, `CLAUDE.md` + `STATE.md` | **partial** | done on GitHub fork (`ashfaqstu/locus`); `upstream-test` **not yet run on GitLab** |
| 2 | Polynomial → STL + SVG + overlay in CI | **partial** | STL + SVG + description + braille labels + overlay locally (115 tests); `render` + `touchcheck` CI jobs written, **not yet run on GitLab** |
| 3 | 3D print access | Shawki | |
| 4 | Practitioner booked / spoken to | not started | |
| 5 | Duo loop hands-off twice | not started | due 16 Oct |
| 5b | Regression detective | not started | |
| 5c | Release guard | Shawki | |
| 6 | Service Desk intake | not started | |
| 6b | Hosting skeleton | Shawki | |
| 7 | touchcheck 5 rules + overlay | **done locally** | all five rules measured, report + overlay + CI job; seeded fixtures (one per rule + one good) fail exactly as expected; not yet run on GitLab |
| 7b | Calibration print | Shawki | also confirm separate overlapping shells slice correctly (decisions.md) |
| 8 | Guards block bad diffs | not started | |

## Tier status

- Tier 1: validation, polynomial roots/marks, mm scene, STL (watertight shells), SVG preview, description, CLI, `render` job,
  Grade 1 braille labels (inline + key mode), touchcheck TL-1..TL-5 + report + overlay + `touchcheck` job, seeded fixtures.
  Not yet: braille ID on the plate, axis labels, guards, bundle/manifest, flows, Service Desk.
- Tier 2 / 3: not started.

## What exists (and what is only a placeholder)

- Real: JSCAD import; CI jobs `render`, `upstream-test`, `locus-test`, secret detection, SAST; schemas; validation;
  `fdm-3d-v1` (rule values from published guidance, geometry values are design defaults; both unconfirmed);
  `remedies.json`; rendering pipeline; contract tests on `examples/` and `fixtures/`; touchcheck report schema;
  `locus touchcheck` CLI + `touchcheck` CI job (gates `requests/*`; the example is checked but not a gate).
- **Projectile example fails TL-1 and TL-2 on purpose**: 8 line problems (curve ends 1.53 mm clear of the x-axis near
  both ends, grid-y-3 along the vertex at 0 mm, y-axis + grid-x stubs 1.93 mm below the x-axis) and 4 label problems
  (vertex and x-intercept labels off the plate, y-intercept label on the curve and 6.02 mm from grid-x-1). A layout using
  allowed fixes only passes all five rules: `fixtures/touchcheck/good-projectile-key` (grid hidden, y 40, key mode,
  labels moved). That's the fixer's path. Rule methods: decisions.md 2026-10-14.
- Placeholder: `.gitlab/duo/flows/*.yml` are design drafts, **not** Duo flow syntax. `fixtures/bundle-sample/` is fake
  (`"fixture": true`). `.gitlab/CODEOWNERS` uses placeholder owners.

## Branches

- `chore/init-project`: JSCAD import + scaffolding. `feat/gate2-render` (on top): rendering + touchcheck + braille labels. Neither pushed yet.

## Blockers / open questions

- GitLab hackathon group access (onboarding) needed before Gates 1/2 can close and before the Duo spike.
- CODEOWNERS needs real GitLab usernames.
- TL-1 open question for the practitioner / BANA 2022: should very shallow crossings fail (a minimum crossing angle)?
  Today they are excused while the lines keep separating (decisions.md 2026-10-14).
- Braille for the practitioner: our Grade 1 table (does a lone key letter need the grade 1 indicator?), NLS 800 cell
  size on FDM (0.48 mm dots), and how close a label must stay to its point (not checked today).
- Office-hours questions: projectLocus.md §16 (15 Oct 19:00 UTC).
