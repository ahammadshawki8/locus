# Decisions

Dated, newest last. Contract changes and rule-value changes must be recorded here.

## 2026-10-14 — Import JSCAD with full history (Ashfaq)
Merged `jscad/OpenJSCAD.org` `master` at `f245ea3a` into this repo with `--allow-unrelated-histories`, so upstream
authorship and the MIT LICENSE stay intact and visible. Upstream README kept as `README.jscad.md`; root `README.md` is Locus.

## 2026-10-14 — Two small upstream config changes (Ashfaq)
- `jsdoc.json` output moved from `./docs` to `./docs/api`, and `.gitignore` now ignores only `/docs/api/` at the root,
  because Locus keeps its own docs in `docs/`.
- Root `package.json` gains `test:locus` and `locus` scripts. Upstream workspaces and lerna packages are unchanged.

## 2026-10-14 — `locus/` is standalone until Gate 2 (Ashfaq)
`locus/` has its own `package.json` with zero dependencies and uses `node:test`. It becomes an npm workspace depending
on `packages/modeling` when geometry work starts (Gate 2), together with a regenerated `package-lock.json`.

## 2026-10-14 — No placeholder CI jobs (Ashfaq)
`.gitlab-ci.yml` contains only jobs that do real work. Planned jobs are listed as comments. An `echo ok` job would be a
faked pass (truth rule).

## 2026-10-14 — Initial rule values from published guidance only (Ashfaq)
TL-1 ≥ 3.2 mm (tactilegraphics.org, 1/8 in absolute minimum), TL-2 ≥ 6.4 mm (1/4 in), TL-5 bed 180×180 mm and min
feature width 1.2 mm in `fdm-3d-v1`. To be checked against BANA 2022, a practitioner (Gate 4) and the calibration
print (Gate 7b). Any change is recorded here with its source.

## 2026-10-14 — Gate 2 rendering choices (Ashfaq)
- **In-repo JSCAD via `file:`**: `locus` depends on `@jscad/modeling` as `file:../packages/modeling` (it has no
  dependencies), so Locus renders with the imported JSCAD and a JSCAD change reaches shipped graphs (what the nightly
  re-check guards). This replaces the earlier plan to make `locus` a root workspace, which would install the whole monorepo.
- **Own binary STL writer** instead of `@jscad/stl-serializer`, which needs other workspace packages installed.
- **Separate watertight shells, no boolean union.** The projectile union left 1,766 open edges (T-junctions);
  `generalize({snap, triangulate})` only halved them. Each shell on its own has 0 open edges, which a test enforces.
  Slicers merge overlapping shells. Confirm on the calibration print (Gate 7b).
- **One scene for everything**: STL, SVG and (next) touchcheck all read the same mm-space scene.
- **Geometry defaults** in `fdm-3d-v1.geometry` (curve 2.0 mm wide × 1.2 mm high, axis 1.2 × 0.8, grid 1.2 × 0.4,
  mark dots 4.0 mm × 1.6 mm, 10 mm margin, 2 mm base) are design starting values, not from a published source.
- **Marks**: `vertex` only for quadratics (rejected at validation otherwise); `x-intercept+` / `x-intercept-` mark every
  positive / negative root. A requested mark that isn't on the graph is carried as `missing` (for TL-4 and the description).

## 2026-10-14 — TL-1: clear gap, and what counts as a real crossing (Ashfaq)
- **Measured edge to edge.** TL-1 measures the empty space between the raised edges of two lines (centre distance
  minus half of each line's width), because that is what a fingertip has to feel. Every line is sampled every 0.5 mm
  against every other line, on the scene that the STL and SVG are made from.
- **Real meetings are excused, but only as far as the meeting explains the closeness.** A real meeting is a *crossing*
  (each centreline passes from one side of the other to the other) or a *join* (an end of one line touches the other:
  raised edges touch). From each real meeting we walk along both lines while the gap keeps growing, until it reaches
  `minLineGapMm`. Only that stretch is excused. If the gap stops growing first (lines cross, then run alongside), the
  rest is measured as usual.
- **A tangent touch is not a real meeting.** The curve touching a line without crossing it (a grid line through the
  projectile's vertex) means the lines run together there, so it fails with 0 mm.
- **Line ends.** Every end either joins the other line or stays `minLineGapMm` clear of it. An end in between fails,
  including a short stub just past a crossing, even inside an excused stretch: the reader cannot tell whether the lines
  join or where one stops.
- **No minimum crossing angle.** A first version treated crossings under 30° as lines running together. 30° was our
  number, not published guidance. With it, the projectile's curve meeting the y-axis at 26.6° failed, and no allowed fix
  cleared it within the bed. Rule values come from published guidance only (see above), so there is no angle threshold.
  **Open question** (practitioner, Gate 4; BANA 2022): a very shallow crossing (e.g. a cubic with an inflection on the
  axis) is excused for as long as the lines keep separating. If a minimum angle is added, it goes in the profile with
  its source.
- **Projectile result with the committed layout and rule values:** TL-1 fails in 8 places: the curve ends 1.53 mm clear of
  the x-axis near both of its ends (after crossing it); grid-y-3 runs along the curve at the vertex (0 mm); the y-axis and
  grid-x-1..4 stop 3.1 mm below the x-axis (1.93 mm clear). A layout using only allowed fixes (`showGrid: false`,
  `yScaleMm: 40`) passes all five rules (tested), so the fixer has a path. Neither the example nor any rule value was changed.

## 2026-10-14 — touchcheck v1 report, overlay and job (Ashfaq)
- **Report** follows contracts §4. Two optional fields are added: rule `note` (plain words on how the rule was
  applied) and violation `subject` (scene ids). `at`, `measuredMm` and `requiredMm` may be `null` when there is no place
  or nothing measured (a missing mark). Schema: `locus/core/schema/touchcheck-report.schema.json`, and the sample bundle
  report passes it. Proposed into contracts §4. This needs Shawki's agreement (Gate C).
- **TL-2 / TL-3** pass as "not applicable: no labels yet" while the scene has no labels. If labels appear before these
  checks exist, they fail rather than pass unchecked.
- **TL-4** compares the spec's `mark` list with the scene (so a mark dropped from both `marks` and `missing` still fails).
  The key is not checked until key mode exists; the report says so.
- **TL-5**: the plate may be turned 90° on the bed. Mark dots count as features for the width check. Height is not
  checked while `minFeatureHeightMm` is null; the report says so.
- **Overlay**: the SVG preview plus a numbered red circle with short plain words and the measured value at each located
  violation. Green marks checks that passed: a ring on each present mark, the closest passing pair of lines when TL-1
  passes, and a dashed plate outline when TL-5 passes. A legend lists all five rules, the full messages and the limitation.
- **CI**: the `touchcheck` job gates `requests/*`. The example is checked too and its report and overlay are kept, but
  its expected failure (exit 1) does not fail the job; a crash (exit > 1) does. Unit tests assert that the example fails.

## 2026-10-14 — Braille labels, key mode, TL-2 / TL-3 (Ashfaq)
- **Braille table**: our own minimal Grade 1 (uncontracted) table in `core/braille.js`. It covers letters, capitals
  (dot 6), digits with a number sign before *each* number, decimal point (256), comma (2), minus (5 + 36) and hyphen (36).
  Any other character is refused, not guessed. **Not checked by a braille transcriber yet**; ask the practitioner
  (Gate 4). Known question: whether lone letters (key letters, "x") need the grade 1 indicator.
- **Cell size** in `fdm-3d-v1.geometry.braille`: NLS Specification 800 values (dot base 1.44 mm, height 0.48 mm, dot
  spacing 2.34 mm, cell spacing 6.2 mm, line spacing 10.16 mm). These are geometry, not rule values, and are to be
  confirmed against the published spec and the calibration print (Gate 7b): 0.48 mm dots are low for FDM. Dots are
  domes (half-ellipsoids), each a separate watertight shell like the other parts.
- **Label text**: the value a reader needs. For a vertex or turning point it is `x,y`; for the y-intercept, y; for an
  x-intercept, x. Values are rounded to 2 decimals (the description says "about" when it rounded; a label cannot).
- **Inline mode**: the label goes up and right of its dot, with the box corner at dot radius + TL-2 gap in both x and y.
  `labelOffsets[markId]` moves it from there. This is deterministic and deliberately simple: it often fails (e.g. a
  vertex at the top of the plot has no room above it), and moving it is the fixer's job.
- **Key mode**: each mark gets a letter (a, b, c… in mark order) next to its dot. A key under the plot lists
  `letter value`, one braille line per entry, at the left margin. The plot moves up so the key's top row sits the TL-2
  gap below the lowest raised feature. The plate grows taller, which can now conflict with TL-5 (seeded fixture
  `tl5-key-too-tall`).
- **TL-2** is measured from each label's box to raised line edges and to other marks (a label's own mark is not counted).
  A label that runs off the plate fails TL-2, measured by how far it runs off, because moving the label is the fix.
  Render does not clip such labels; the STL shows exactly what was checked. **TL-3** fails when label boxes overlap.
- **Not checked (open):** that a label stays near its own mark. A label 40 mm from its point passes TL-2/TL-3 but is
  useless. The five rules have no published value for this; ask the practitioner. Until then the overlay and description
  are the human check.
- **Not built yet:** axis labels ("x", "y"), tick labels, and the braille ID `L<iid>-<n>` on the plate. The braille ID
  needs the bundle version `n`, which render does not know yet; it comes with the bundle job.
- **Seeded fixtures (Gate 7)**: `fixtures/touchcheck/` holds one good request and one seeded to break each rule. A test
  renders and touch-checks each and requires exactly the expected failing rules. The good one shows that allowed fixes
  are enough for the projectile: grid hidden, `yScaleMm` 40, key mode, labels moved.

## Pending
- Hands-off vs Supervised (Gate 5, 16 Oct).
