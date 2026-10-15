# locus

The Locus package. Standalone (`npm --prefix locus ci`); uses the in-repo JSCAD through `file:../packages/modeling`.

| Folder | What | Status (16 Oct) |
|---|---|---|
| `core/` | schemas + validation, profile loader (`profiles/` at the repo root), polynomial (no `eval`), marks, braille + labels, scene (mm), JSCAD solid to watertight STL, SVG, description, render; next: bundle, manifest | reproduces prototype prints A, B and C (`core/prints.test.js`, contracts D3) |
| `touchcheck/` | rules TL-1 to TL-5 (`rules/`), report + `LOCUS_REPORT` line, overlay renderer, `remedies.json` | all five measured; A fails, B and C pass; seeded fixtures in `fixtures/touchcheck/` |
| `guards/` | `guard-scope`, `guard-maths`, `guard-description`, `guard-revert` | not started |
| `site/` | graph library site + `build-info.json` (Shawki) | not started |
| `cli/` | `npm run locus -- <spec.json>`, `npm run locus -- touchcheck <spec.json> [--attempt <n>]` | validates + renders; touch-checks the render output |

Tests: `npm run test:locus` from the repo root (node:test, `*.test.js`).
