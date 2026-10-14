# locus

The Locus package. Standalone (`npm --prefix locus ci`); uses the in-repo JSCAD through `file:../packages/modeling`.

| Folder | What | Status (14 Oct) |
|---|---|---|
| `core/` | schemas + validation, profiles, polynomial (no `eval`), marks, scene (mm), JSCAD solids → STL, SVG, description, render; next: braille, bundle, manifest | validation, polynomial + marks, scene, STL, SVG, description, render (Gate 2) |
| `touchcheck/` | rules TL-1..TL-5 (`rules/`), report, overlay renderer, `remedies.json` | TL-1, TL-4, TL-5 measured; TL-2/TL-3 "not applicable: no labels yet"; report + overlay |
| `guards/` | `guard-scope`, `guard-maths`, `guard-description`, `guard-revert` | not started |
| `site/` | graph library site + `build-info.json` (Shawki) | not started |
| `cli/` | `npm run locus -- <spec.json>`, `npm run locus -- touchcheck <spec.json>` | validates + renders; touch-checks the render output |

Tests: `npm run test:locus` from the repo root (node:test, `*.test.js`).
