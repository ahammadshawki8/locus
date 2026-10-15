# Locus contracts

**Status: v1, FINAL (16 Oct 2026, set by Shawki).** These are fixed rules for everyone building Locus.
- **Blocker window:** until **17 Oct 2026, 18:00 GMT+6**, Ashfaq may raise a **technical blocker**: something in this file that can't be built as written, for example a Duo tool that doesn't exist. It must come with a proposed alternative, posted as a dated entry in `docs/decisions.md`. Preferences aren't blockers.
- **After the window:** any change needs a dated entry in `docs/decisions.md` that both Ashfaq and Shawki agree to.

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
{ "xScaleMm": 16, "yScaleMm": 8, "labelMode": "inline", "labelOffsets": {}, "defaultLabelOffset": [4.5, 6], "showGrid": true }
```
- This is the profile's default layout, and it matches the prototype print A (`tools/prints/layout-A.json`). The corrected print B is `tools/prints/layout-B.json`.
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
  "grid": { "widthMm": 1.0, "heightMm": 0.5 },
  "tick": { "widthMm": 1.0, "heightMm": 0.7, "lengthMm": 4 },
  "point": { "diameterMm": 3.0, "heightMm": 1.6 },
  "braille": { "dotDiameterMm": 1.5, "dotHeightMm": 0.8, "dotPitchMm": 2.5, "cellPitchMm": 6.2 },
  "rules": { "minLineGapMm": 3.2, "minLabelClearanceMm": 6.4, "minLabelPointClearanceMm": 3.2, "minFeatureWidthMm": 1.0, "edgeMarginMm": 3 },
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
- The fixer agent reads this report. Agents can read job logs but not artifacts, so `touchcheck` also prints this JSON, compacted onto one line, to its job log, prefixed `LOCUS_REPORT `. Its plain `message` text is what the video shows.

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
| `touchcheck` | `touchcheck-report.json`, `overlay.svg` (kept on failure: `artifacts:when: always`) + `LOCUS_REPORT` log line | fixer agent, video capture |
| `library-impact` (MRs changing `locus/core/**`, `packages/**`, `package*.json`) | `out/impact/report.json` + `LOCUS_IMPACT` log line | impact reviewer |
| `library-recheck` (`main` pipelines + nightly schedule set by Shawki) | `out/recheck/report.json` + `LOCUS_RECHECK` log line | `bisect-regression` → regression detective |

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

Each flow has its own service account (`ai-<flow>-<group>`), so `guard-scope` checks the commit author and the branch prefix as well as the paths.

| Agent (flow) | Branch | May change |
|---|---|---|
| intake (`locus-request`) | `graph/<iid>` | `requests/<iid>/**` (first commit) |
| fixer (`locus-request`) | `graph/<iid>` | `requests/<iid>/layout.json` |
| impact reviewer (`locus-ops`) | - | nothing; MR notes only |
| release guard (`locus-ops`) | `rollback/<n>` | `deploy/gcp/production-revision` |
| regression detective (`locus-ops`) | `revert/<sha>` | only the exact inverse of the commit named by `bisect-regression`, written with `create_commit` (checked by `guard-revert`) |

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

## 10. Decided (16 Oct)

| # | Point | Decision | Why |
|---|---|---|---|
| D1 | Plate size | **100 × 100 × 2 mm** (`fdm-handheld-v1`) | The prototype prints are this size, and they're the only prints we'll have |
| D2 | Axes vs curve | **Both height and width:** curve 1.2 wide × 1.0 high; axes and ticks 1.0 × 0.7; grid 1.0 × 0.5; point marks 3.0 mm domes, 1.6 high | Matches the prints. Adjusted only if the calibration touch test says otherwise |
| D3 | Feature sizes and placement | Exactly as `tools/prints/` builds them: placement rule, tick rules, braille 1.5 / 2.5 / 6.2 mm, dots 0.8 high, braille ID top-right, triangle top-left | `locus/core` must reproduce prints A, B and C from their spec + layout files (a CI test compares the STLs) |
| D4 | Default layout | `tools/prints/layout-A.json` (§1) | The agent's attempt 1 then renders exactly print A |
| D5 | Release tag | **`graph-<iid>-v<n>`**, the same as the bundle's `artifactId` | One name everywhere: tag, package, page URL, manifest |
| D6 | Re-layout requests from the regression detective | **One issue per affected graph**, labelled `locus-request` + `regression`, linking the original issue. A person assigns each one to the bot | One issue = one flow session = one release `v<n+1>`. Agent-created issues can't start a flow on their own (`docs/decisions.md`, 15 Oct) |
| D7 | Trigger design | **Pipeline v2** (`docs/decisions.md`, 15 Oct b): `locus-request` = intake → fixer in one session; `locus-ops` = triage → impact reviewer / regression detective / release guard; `auto-merge` CI job | Triggers only fire on a person's action |
| D8 | Agent reads the touchcheck result | From the `LOCUS_REPORT` line in the job log (§4). If the flow can run commands, it also runs touchcheck locally | Works whether or not GitLab confirms that ambient flows get `run_command` |
| D9 | Sample bundle | `fixtures/bundle-sample/graph-0-v1/` is generated from print B's spec and layout | Real geometry, so Shawki's release and deploy jobs are tested against realistic files |

**Still waiting on GitLab (doesn't block building):** credits for triggered flows; whether flows can merge (fallback already chosen: the `auto-merge` CI job).
