# locus

The Locus package: everything between a teacher's request and a released, deployed, printable graph. It is
standalone (`npm --prefix locus ci`) and uses the in-repo JSCAD through `file:../packages/modeling`.

| Folder | What it does |
|---|---|
| `core/` | Spec schema and validation, the printer profile loader, a polynomial parser with an allowlist (no `eval`), marks, braille and labels, the scene in millimetres, JSCAD solids to a watertight STL (with a Manifold fallback), SVG, the learner description, the bundle and manifest, a zip writer. Reproduces prototype prints A, B and C exactly (`core/prints.test.js`) |
| `touchcheck/` | Rules TL-1 to TL-5 (`rules/`), the report and its `LOCUS_REPORT` log line, the overlay drawing, `remedies.json` (the only fixes the agent may use). Seeded fixtures in `fixtures/touchcheck/` break each rule |
| `guards/` | `guard-scope`, `guard-maths`, `guard-description`, `guard-revert`: deterministic CI checks on every agent change |
| `release/` | `license-check`, `auto-merge`, `publish-package`, `release`, `reply-teacher`, `print-order`, `print-reprints`, and a small GitLab API client |
| `site/` | The graph library site (3D plates, touch-check drawings, downloads, Request and Print again), and `validate-site`, the staging and post-deploy check |
| `flows/` | `check.js`: checks `.gitlab/duo/flows/*.yml` against the Duo flow registry schema, the custom-flow limits and the tool list, and pins each agent's write tools to its allowed paths |
| `cli/` | `npm run locus -- ...`: render, `touchcheck`, `guard`, `bundle`, `recheck`, `bisect`, every release command, `doctor`; and `setup.js` (`npm run setup`) |

Tests: `npm run test:locus` from the repository root (node:test, `*.test.js` next to the code).
