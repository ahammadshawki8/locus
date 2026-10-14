# Contracts

> **Status: DRAFT (14 Oct 2026, proposed by Ashfaq).** Becomes binding when both Ashfaq and Shawki agree (Gate C).
> After that, any change needs both people and a dated entry in [decisions.md](decisions.md).

These are the interfaces between the generation side (Ashfaq) and the release/hosting side (Shawki).
[`fixtures/bundle-sample/`](../fixtures/bundle-sample/) is a fake bundle that follows this contract, so release and
deploy jobs can be built before real bundles exist.

## 1. Request files (`requests/<iid>/`)

`<iid>` is the GitLab issue IID of the teacher's request.

| File | Written by | Changes allowed |
|---|---|---|
| `spec.json` | intake agent (`locus-request`) | never after the first commit, except `profileId` by a human |
| `request.lock.json` | intake agent, same commit as `spec.json` | **never** (`guard-maths` compares against it) |
| `layout.json` | intake agent, then fixer agent | fixer only, using allowed fixes from `locus/touchcheck/remedies.json` |

**`spec.json`** — schema [`locus/core/schema/spec.schema.json`](../locus/core/schema/spec.schema.json):

```json
{ "schemaVersion": 3, "requestId": 12,
  "graph": { "type": "polynomial", "coeffs": [0, -0.5, 2, 1], "domain": { "min": -0.5, "max": 4.5 } },
  "mark": ["vertex", "y-intercept", "x-intercept+"],
  "labels": "braille-grade1", "profileId": "fdm-3d-v1" }
```

`coeffs` are highest degree first: `[a, b, c, d]` means `y = a·x³ + b·x² + c·x + d`. Degree ≤ 3, so length ≤ 4.

**`request.lock.json`**: `{ "schemaVersion": 3, "requestId": <iid>, "graph": <same as spec.graph>, "mark": <same as spec.mark> }`.

**`layout.json`** — schema [`locus/core/schema/layout.schema.json`](../locus/core/schema/layout.schema.json):
`{ "xScaleMm": number, "yScaleMm": number, "labelMode": "inline" | "key", "labelOffsets": { "<markId>": { "dxMm": number, "dyMm": number } }, "showGrid": boolean }`

## 2. Bundle

- **Name:** `graph-<iid>-v<n>` (`n` starts at 1 and increments on each re-release of the same request, e.g. after a self-healing re-layout).
- **Archive:** `graph-<iid>-v<n>.zip`, containing exactly:

| File | What |
|---|---|
| `graph.stl` | print file for the profile (binary STL) |
| `graph.svg` | visual preview (and the print file for SVG profiles) |
| `description.txt` | plain-language learner description; every number checked by `guard-description` |
| `touchcheck-report.json` | the touchcheck report for the released layout (§4) |
| `overlay.svg` | the graph with each rule result circled (red = violation, green = fixed/passed) |
| `manifest.json` | provenance (§3) |

## 3. `manifest.json`

Schema [`locus/core/schema/manifest.schema.json`](../locus/core/schema/manifest.schema.json). Generated from real job output only.

```json
{
  "schemaVersion": 1,
  "fixture": false,
  "bundle": "graph-12-v1",
  "requestId": 12,
  "version": 1,
  "brailleId": "L12-1",
  "commit": "<full SHA the bundle was built from>",
  "pipelineId": 123456,
  "profileId": "fdm-3d-v1",
  "hashes": { "graph.stl": "sha256:…", "graph.svg": "sha256:…", "description.txt": "sha256:…",
              "touchcheck-report.json": "sha256:…", "overlay.svg": "sha256:…" },
  "checks": { "touchcheck": "passed", "guard-scope": "passed", "guard-maths": "passed",
              "guard-description": "passed", "secret-detection": "passed", "sast": "passed" },
  "attempts": 2,
  "release": { "tag": "graph-12-v1", "url": "<release URL, filled by the release job>" },
  "limitations": "Automated checks measure spacing and completeness. They do not certify that a reader will understand this graphic by touch."
}
```

- `hashes` cover every other file in the bundle, never `manifest.json` itself.
- `attempts` = number of layout commits the pipeline checked for this request (1 = passed first time).
- `release.url` is `null` in the `bundle` job and filled in by `release`. The release job re-uploads the updated manifest.

**Braille ID:** `L<iid>-<n>`, embossed on every print in Grade 1 braille (number sign before each number) and shown on the release page.

## 4. `touchcheck-report.json`

```json
{
  "schemaVersion": 1,
  "profileId": "fdm-3d-v1",
  "passed": false,
  "rules": [
    { "id": "TL-1", "passed": false,
      "violations": [ { "message": "These lines are too close: a fingertip feels one line",
                        "measuredMm": 1.4, "requiredMm": 3.2, "at": { "xMm": 41.0, "yMm": 12.5 } } ] }
  ]
}
```

`rules` always lists all five rules (TL-1..TL-5) in order. `passed` is true only if every rule passed.

## 5. Jobs

| Job | Consumes | Produces (artifacts) |
|---|---|---|
| `render` | `requests/<iid>/*` | `out/<iid>/graph.stl`, `out/<iid>/graph.svg`, `out/<iid>/description.txt` |
| `touchcheck` | `out/<iid>/*` | `out/<iid>/touchcheck-report.json`, `out/<iid>/overlay.svg` — **kept on failure** (`artifacts:when: always`) |
| `bundle` | `out/<iid>/*` | `dist/graph-<iid>-v<n>.zip` + `dist/graph-<iid>-v<n>/` (unzipped) + dotenv `bundle.env` |
| `publish-package` | `bundle.env`, `dist/` | generic package `graph-<iid>`, version `<n>.0.0`, file `graph-<iid>-v<n>.zip` |
| `release` | `bundle.env` | GitLab release, tag `graph-<iid>-v<n>`, asset link to the package file |

`bundle.env` (dotenv report) variables: `LOCUS_IID`, `LOCUS_VERSION`, `LOCUS_BUNDLE`, `LOCUS_BUNDLE_ZIP`, `LOCUS_BRAILLE_ID`.

`release` and `promote-production` must `needs:` `touchcheck`, `guard-scope`, `guard-maths`, `guard-description`,
the security template jobs (`secret_detection` and the SAST analyzer jobs, as named by GitLab's templates) and `bundle`.
In `manifest.json` these are recorded under the keys `secret-detection` and `sast`.

## 6. Flows

**Labels:** `locus-request` (new request), `needs-info` (agent asked one question), `cannot-make-readable` (fixer refused after 3 attempts), `incident` (release guard acted), `regression` (regression detective acted).

**Allowed paths** (enforced by `guard-scope`, keyed on the committing service account):

| Flow | Allowed paths |
|---|---|
| `locus-request` | `requests/<iid>/spec.json`, `requests/<iid>/request.lock.json`, `requests/<iid>/layout.json` |
| `locus-fixer` | `requests/<iid>/layout.json` |
| `locus-release-guard` | `deploy/gcp/production-revision` |
| `locus-regression-detective` | the exact inverse of the commit named by `bisect-regression` (`guard-revert`), or new `requests/<iid>/` re-layout requests |
| `locus-security-triage` (T2.9) | `package.json`, `package-lock.json` |

**Issue summary note** (posted by `reply-teacher`; Service Desk emails it to the teacher). Plain text, no markdown tables:

```text
Your tactile graph is ready: y = -0.5x² + 2x + 1, x from -0.5 to 4.5.
Braille ID on the print: L12-1
Download (print-ready): <package/release URL>
Description for the learner: <description.txt contents>
Checks passed: spacing, labels, completeness, printer size (touchcheck), maths match.
Attempts: 2
Note: automated checks do not certify that a reader will understand this graphic by touch.
```

## 7. Rollback

`deploy/gcp/production-revision` holds one line: the Cloud Run revision name that should receive 100% of production
traffic (e.g. `locus-site-00007-xyz`), or `UNSET` before the first production deploy. No other content.

`deploy-production-pointer` runs on `main` when that file changes and routes all production traffic to the named revision
(`gcloud run services update-traffic … --to-revisions=<rev>=100`). It fails if the revision does not exist.

## 8. Site

**`build-info.json`** (served at `/build-info.json`):
`{ "commit": "<sha>", "pipelineId": <id>, "builtAt": "<ISO-8601 UTC>", "graphs": [ { "requestId": 12, "version": 1, "brailleId": "L12-1", "page": "/graphs/12/v1/", "release": "<url>" } ] }`

**Per-graph page URL:** `/graphs/<iid>/v<n>/`. Latest version: `/graphs/<iid>/` redirects to the highest `v<n>`.
