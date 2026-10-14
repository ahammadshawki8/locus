# locus

The Locus package. Standalone (`npm --prefix locus ci`); uses the in-repo JSCAD through `file:../packages/modeling`.

| Folder | What | Status (14 Oct) |
|---|---|---|
| `core/` | schemas + validation, profiles, polynomial (no `eval`), marks, scene (mm), JSCAD solids → STL, SVG, description, render; next: braille, bundle, manifest | validation, polynomial + marks, scene, STL, SVG, description, render (Gate 2) |
| `touchcheck/` | rules TL-1..TL-5, overlay renderer, `remedies.json` | `remedies.json` only |
| `guards/` | `guard-scope`, `guard-maths`, `guard-description`, `guard-revert` | not started |
| `site/` | graph library site + `build-info.json` (Shawki) | not started |
| `cli/` | `npm run locus -- <spec.json>` | validates + renders |

Tests: `npm run test:locus` from the repo root (node:test, `*.test.js`).
