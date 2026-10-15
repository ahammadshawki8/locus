# Locus contracts

**Status: DRAFT for Ashfaq and Shawki to review together.** Once both agree, any change needs both people's sign-off and a dated line in `docs/decisions.md`.

These are the interfaces between the parts each person builds. Ashfaq's side produces graphs, bundles and agent changes. Shawki's side packages, releases, deploys, monitors and replies. If both sides follow this file, they can build in parallel against `fixtures/bundle-sample/`.

---

## 1. Request files (`requests/<iid>/`)

Written by the intake agent in the first commit of a `graph/<iid>` branch. `<iid>` is the GitLab issue number.

| File | Written by | Editable later by | Purpose |
|---|---|---|---|
| `spec.json` | intake agent | nobody (must stay equal to the lock) | What to draw |
| `request.lock.json` | intake agent, first commit only | nobody | Frozen copy of `graph` + `mark` for `guard-maths` |
| `layout.json` | intake agent (defaults from profile) | fixer agent only | How to draw it |

### `spec.json`
```json
{
  "schemaVersion": 3,
  "requestId": 12,
  "graph": {
    "type": "polynomial",
    "coeffs": [0, -0.5, 2, 1],
    "domain": { "min": -0.5, "max": 4.5 }
  },
  "mark": ["vertex", "y-intercept", "x-intercept+"],
  "labels": "braille-grade1",
  "profileId": "fdm-handheld-v1"
}
```
- `coeffs` are highest power first: `[a, b, c, d]` for `a·x³ + b·x² + c·x + d`. Tier 2 adds `"type": "expression"` with an allowlisted `expr` string. That extension needs a new `schemaVersion`.
- `mark` values: `vertex`, `turning-points`, `y-intercept`, `x-intercept+`, `x-intercept-`, `x-intercepts`.
- `profileId` must match a file in `profiles/`.

### `layout.json`
```json
{ "xScaleMm": 18, "yScaleMm": 10, "labelMode": "inline", "labelOffsets": {}, "showGrid": false }
```
- `labelMode`: `inline` | `key`.
- `labelOffsets`: `{ "<mark>": [dxMm, dyMm] }`.

## 2. Printer profiles (`profiles/<id>.json`)

```json
{
  "id": "fdm-handheld-v1",
  "version": 1,
  "kind": "fdm",
  "plateMm": [100, 100],
  "baseThicknessMm": 2,
  "curve": { "widthMm": 1.2, "heightMm": 1.0 },
  "axis": { "widthMm": 1.0, "heightMm": 0.7 },
  "braille": { "dotDiameterMm": 1.5, "dotHeightMm": 0.6, "dotPitchMm": 2.5, "cellPitchMm": 6.2 },
  "rules": { "minLineGapMm": 3.2, "minLabelClearanceMm": 6.4, "minFeatureWidthMm": 1.0 },
  "source": "placeholder values; replace with calibration-print results (Gate 7b)"
}
```
Values are placeholders until the calibration print (`tools/calibration/`) is felt and recorded. Shawki reports the results; Ashfaq updates the profile.

## 3. Bundle (output of the `bundle` job)

**Artifact path:** `out/bundle/graph-<iid>-v<n>/`, plus a zip with the same name at `out/bundle/graph-<iid>-v<n>.zip`.
**Naming:** `<n>` starts at 1 and goes up on every re-release of the same request (e.g. after a regression re-layout).

| File | Required | Notes |
|---|---|---|
| `graph.stl` | yes | Binary STL, millimetres, plate on z = 0 |
| `graph.svg` | yes | Same geometry from above; `viewBox` in millimetres |
| `overlay.svg` | yes | touchcheck results: red/green circles + plain-words messages |
| `description.txt` | yes | Agent-written learner description (checked by `guard-description`) |
| `touchcheck-report.json` | yes | See §4 |
| `manifest.json` | yes | See §5 |
| `README.txt` | yes | How to print + the limitations line |

**Sample:** `fixtures/bundle-sample/graph-0-v1/` contains the same files with fake but valid content. Shawki builds the release/deploy jobs against it before the real generator exists.

## 4. `touchcheck-report.json`

```json
{
  "requestId": 12,
  "attempt": 1,
  "profileId": "fdm-handheld-v1",
  "pass": false,
  "results": [
    { "rule": "TL-1", "pass": false, "message": "These lines are too close: a fingertip feels one line",
      "measuredMm": 1.4, "requiredMm": 3.2, "at": [12.0, 3.1], "allowedFixes": ["rescale-y", "hide-grid"] },
    { "rule": "TL-2", "pass": true }
  ]
}
```
- `at` is in plate millimetres, origin bottom-left. The overlay draws a circle there.
- The `notify-agent` note and the fixer agent both read this file. Its plain `message` text is what the video shows.

## 5. `manifest.json`

Generated only from real job outputs, never hand-written.

```json
{
  "artifactId": "graph-12-v1",
  "brailleId": "G12",
  "requestIssue": 12,
  "sourceCommit": "<sha>",
  "pipelineId": 0,
  "generatorVersion": "0.1.0",
  "profile": { "id": "fdm-handheld-v1", "version": 1 },
  "hashes": { "graph.stl": "<sha256>", "graph.svg": "<sha256>", "description.txt": "<sha256>" },
  "touchcheck": { "pass": true, "attempts": 2 },
  "guards": { "scope": true, "maths": true, "description": true },
  "agentSessions": ["<duo session url>"],
  "releaseMode": "hands-off",
  "releaseTag": null,
  "limitations": "Automated checks measure spacing and size; they do not certify that a learner can understand the graphic."
}
```
- `releaseTag` is `null` in the bundle and is filled in by the `release` job.
- `brailleId` is `G` + issue number. It's printed in braille in the plate's corner.

## 6. CI jobs between the two sides

| Producer (Ashfaq) | Artifact | Consumer (Shawki) |
|---|---|---|
| `bundle` | `out/bundle/**` | `publish-package`, `release`, `deploy-staging` |
| `touchcheck` | `touchcheck-report.json`, `overlay.svg` (kept on failure: `artifacts:when: always`) | `notify-agent` (fallback), video capture |
| `library-recheck` (schedule set by Shawki) | `out/recheck/report.json` | `bisect-regression` → regression detective |

**Required `needs:`**
- `release` needs: `touchcheck`, `guard-scope`, `guard-maths`, `guard-description`, `secret-detection`, `sast`, `license-check`, `bundle`.
- `promote-production` needs: `validate-staging`.

## 7. Labels and agent permissions

| Label | Set by | Meaning |
|---|---|---|
| `locus-request` | Service Desk / template | New graph request; starts the intake agent |
| `needs-info` | intake agent | Waiting for the teacher's answer |
| `cannot-make-readable` | fixer agent | Refused after 3 attempts; no release |
| `incident` | release guard | Staging/production validation failed; rollback MR opened |
| `regression` | library-recheck / regression detective | A shipped graph now fails touchcheck |

**Allowed paths per agent (`guard-scope`):**

| Agent | May change |
|---|---|
| intake | `requests/<iid>/**` (first commit) |
| fixer | `requests/<iid>/layout.json` |
| release guard | `deploy/gcp/production-revision` |
| regression detective | an exact `git revert` of the commit named by `bisect-regression` (checked by `guard-revert`) |
| security triage (T2.9) | `package.json`, `package-lock.json` |

## 8. Issue summary note (the reply email uses it)

The agent posts this on the issue when a graph is released. Service Desk emails it to the teacher.

```text
Your graph is ready: <production page URL>
Download (print at 100% scale): <release asset URL>
Checks passed: TL-1 … TL-5 (after <n> attempt(s))
Braille ID on the plate: G12
Note: automated checks measure spacing and size; they do not certify that a learner can understand the graphic.
```

## 9. Deploy and site

- **`deploy/gcp/production-revision`:** one line, the Cloud Run revision name currently serving production. Changing it through an MR is the only way production moves, including rollbacks.
- **`build-info.json`** (served at `/build-info.json`): `{ "version": "", "commit": "", "builtAt": "", "graphs": ["graph-12-v1"] }`.
- **Graph page URL:** `/graphs/<artifactId>/`. It shows the SVG preview, the text description, downloads, the braille ID and a link to the GitLab release.

## 10. Open points to agree

- [ ] Plate size: 100 × 100 mm handheld, pending the friend's printer bed size.
- [ ] Do the axes feel different from the curve through height, width, or both? Decide after the calibration print.
- [ ] Release tag format: `graph-<iid>-v<n>`?
- [ ] Where the regression detective's "re-layout" requests go: a new issue per graph, or one issue listing all of them?
