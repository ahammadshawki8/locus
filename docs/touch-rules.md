# Touch rules (`touchcheck`)

Five deterministic rules measured on the rendered scene, the same scene the STL and SVG are made from. Values live in
the printer profile ([`profiles/fdm-handheld-v1.json`](../profiles/fdm-handheld-v1.json), [contracts](contracts.md) §2),
not in the rule code. The overlay shows each result in plain words with the measured value, e.g. "1.4 mm apart, needs
3.2 mm". The report (`touchcheck-report.json`, contracts §4) is also printed to the job log after `LOCUS_REPORT `.

| ID | Plain words | Measured | `fdm-handheld-v1` value | Source |
|---|---|---|---|---|
| TL-1 | "These lines are too close: a fingertip feels one line" | clear gap between the curve and every axis, tick and grid line, outside real crossings | ≥ 3.2 mm (`minLineGapMm`) | 1/8 in absolute minimum, [tactilegraphics.org](https://tactilegraphics.org/readability.html) |
| TL-2 | "This label touches a line" | clear gap from each braille label box to every line, and to every point mark | ≥ 6.4 mm to lines (`minLabelClearanceMm`); ≥ 3.2 mm to points (`minLabelPointClearanceMm`) | 1/4 in separation, [tactilegraphics.org](https://tactilegraphics.org/readability.html); NPS map labels use 9.5 mm ([NPS 2008](https://www.npshistory.com/publications/interpretation/hfc/tactile-map-guidelines-2008.pdf)) |
| TL-3 | "These labels overlap" | label box intersection | none | - |
| TL-4 | "Something requested is missing" | inventory: axes, curve, each requested mark with its label, key if used | all present | - |
| TL-5 | "Too big for the printer / features too thin" | every feature's distance to the plate edge; feature width | ≥ 3 mm from the edge (`edgeMarginMm`); ≥ 1.0 mm wide (`minFeatureWidthMm`) | profile-defined |

**How TL-1 measures:** the clear gap between the raised *edges* of the curve and each other line, sampled every 0.5 mm.
Where they really cross or join, only the stretch where they are still moving apart is excused, and so is a line end
inside that stretch (a curve that crosses the x-axis and stops just past it). A curve that touches a line without
crossing it fails, and so does a line end that stops less than 3.2 mm short of the curve. Details and reasons:
[decisions.md](decisions.md), 14 and 16 Oct 2026.

**How TL-2 / TL-3 measure:** every label box (the point letters, key rows and the braille ID) is measured to the raised
edge of every line and to every point mark, its own included. TL-3 fails when two label boxes overlap. Nothing yet
checks that a label stays near its own point (open question).

**On the prototype prints** (`tools/prints/`): print A (the default layout) fails TL-1, TL-2 and TL-5; prints B and C
pass. A test checks this.

**Seeded fixtures:** [`fixtures/touchcheck/`](../fixtures/touchcheck/) has one request seeded to break each rule and one
that passes; a test requires exactly the expected failures.

**Status:** values come from published guidance only. They have **not** yet been checked against
[BANA 2022](https://www.brailleauthority.org/tg/web-manual/tgmanual.html), a practitioner (Gate 4) or the calibration
print touch test (Gate 7b). Changes are recorded in [decisions.md](decisions.md).

## Allowed fixes

From [`locus/touchcheck/remedies.json`](../locus/touchcheck/remedies.json). The fixer agent may only apply these, and only
to `layout.json`. Each failing result in the report lists its rule's fixes as `allowedFixes`.

| Rule | Allowed fixes |
|---|---|
| TL-1 | `rescale-x`, `rescale-y`; `hide-grid` |
| TL-2, TL-3 | `move-label`; `key-mode` |
| TL-5 | `reduce-scale` |
| TL-4 | none: refuse (never delete requested features) |

Passing these rules means the spacing and size checks passed. It does **not** mean a learner can understand the graphic.
