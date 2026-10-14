# locus

The Locus package. Standalone (`npm --prefix locus ci`) until Gate 2 makes it an npm workspace on `packages/modeling`.

| Folder | What | Status (14 Oct) |
|---|---|---|
| `core/` | spec/layout/manifest schemas + validation, printer profiles; next: polynomial evaluator (no `eval`), layout, JSCAD geometry → STL, SVG, braille, description, bundle, manifest | schemas + validation only |
| `touchcheck/` | rules TL-1..TL-5, overlay renderer, `remedies.json` | `remedies.json` only |
| `guards/` | `guard-scope`, `guard-maths`, `guard-description`, `guard-revert` | not started |
| `site/` | graph library site + `build-info.json` (Shawki) | not started |
| `cli/` | `npm run locus -- <spec.json>` | validates only |

Tests: `npm run test:locus` from the repo root (node:test, `*.test.js`).
