# Before → after (Path B)

Upstream: [JSCAD / OpenJSCAD.org](https://github.com/jscad/OpenJSCAD.org) (MIT), imported at `f245ea3a` (21 Feb 2026 release).

| | Before: JSCAD on GitHub | After: Locus on GitLab |
|---|---|---|
| Lifecycle | One GitHub Actions job: `npm test` on Node 20/22 (`.github/workflows/node.yml`) | Migrated tests (`upstream-test`) + a 9-stage automated lifecycle |
| Making a tactile graph | Write a script by hand, guess the dimensions, hope it's readable | Email a sentence; an agent delivers a checked file |
| Safety | None | Touch checks + guards decide what ships |
| Downstream | A JSCAD change that alters geometry goes unnoticed | A nightly re-check of every shipped graph catches it (downstream contract test for JSCAD) |

## Upstream vs new

- **Upstream (unchanged except as noted in [decisions.md](decisions.md)):** `packages/**`, `jsdoc/`, root config, `.github/`, `README.jscad.md`, `LICENSE`.
- **New for Locus (dated on or after 14 Oct 2026):** `locus/`, `requests/`, `examples/`, `fixtures/`, `deploy/`, `docs/`,
  `.gitlab-ci.yml`, `.gitlab/`, `CLAUDE.md`, `README.md`, `projectLocus.md`.

## Migrated CI

| GitHub Actions (`node.yml`) | GitLab CI (`.gitlab-ci.yml`) |
|---|---|
| `strategy.matrix.node: [20, 22]` | `upstream-test` with `parallel:matrix` `NODE_VERSION: ["20", "22"]` |
| `npm install` → `npm test` → `npm run test:tsd` | same commands |
| runs on every push | runs when `packages/**`, root `package.json`/lockfile or `lerna.json` change |
