# locus

The Locus package. Standalone (`npm --prefix locus ci`); uses the in-repo JSCAD through `file:../packages/modeling`.

| Folder | What | Status (16 Oct) |
|---|---|---|
| `core/` | schemas + validation, profile loader (`profiles/` at the repo root), polynomial (no `eval`), marks, braille + labels, scene (mm), JSCAD solid to watertight STL, SVG, description, render, bundle + manifest (`bundle.js`), zip writer (`zip.js`) | reproduces prototype prints A, B and C (`core/prints.test.js`, contracts D3); bundle + `bundle` CI job built |
| `touchcheck/` | rules TL-1 to TL-5 (`rules/`), report + `LOCUS_REPORT` line, overlay renderer, `remedies.json` | all five measured; A fails, B and C pass; seeded fixtures in `fixtures/touchcheck/` |
| `guards/` | `guard-scope`, `guard-maths`, `guard-description`, `guard-revert` | all four built + CI jobs (guard-revert on `revert/*` branches) |
| `flows/` | `check.js`: checks `.gitlab/duo/flows/*.yml` against the Duo flow registry v1 schema, the custom-flow restrictions, the 40 KiB limit and the tool list (`tools.json`: docs + live GitLab.com list) | `locus-request`, `locus-ops` and `locus-probe` pass; `check.test.js` also pins each agent's write tools to contracts §7 and `locus-request`'s 3-attempt cap; no flow has run yet |
| `site/` | graph library site + `build-info.json` (Shawki) | not started |
| `cli/` | `npm run locus -- <spec.json>`, `npm run locus -- touchcheck <spec.json> [--attempt <n>]`, `npm run locus -- guard ...`, `npm run locus -- bundle <requests/<iid>>` (`cli/bundle.js`), `npm run locus -- recheck [--impact]` (`cli/recheck.js`), `npm run locus -- bisect` (`cli/bisect.js`, `cli/bisect-step.js`) | validates + renders; touch-checks the render output; bundles a request that passed touchcheck and the guards; re-checks every shipped graph (newest `graph-<iid>-v<n>` tag) with this code (`library-impact`, `library-recheck`); finds the first commit since a release after which a shipped graph fails (`bisect-regression`) |

Tests: `npm run test:locus` from the repo root (node:test, `*.test.js`).
