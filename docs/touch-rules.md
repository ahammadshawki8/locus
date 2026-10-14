# Touch rules (`touchcheck`)

Five deterministic rules measured on the rendered geometry. Values live in the printer profile
(`locus/core/profiles/<profileId>.json`), not in the rule code. The overlay shows each result in plain words with the
measured value, e.g. "1.4 mm apart — needs 3.2 mm".

| ID | Plain words (on the overlay) | Measured | `fdm-3d-v1` value | Source |
|---|---|---|---|---|
| TL-1 | "These lines are too close: a fingertip feels one line" | min distance between curve and axis/grid, outside real crossings | ≥ 3.2 mm | 1/8 in absolute minimum, [tactilegraphics.org](https://tactilegraphics.org/readability.html) |
| TL-2 | "This label touches a line" | min distance from a braille label box to any line | ≥ 6.4 mm | 1/4 in separation, [tactilegraphics.org](https://tactilegraphics.org/readability.html); NPS map labels use 9.5 mm ([NPS 2008](https://www.npshistory.com/publications/interpretation/hfc/tactile-map-guidelines-2008.pdf)) |
| TL-3 | "These labels overlap" | label box intersection | none | — |
| TL-4 | "Something requested is missing" | inventory: axes, curve, each requested mark, key if used | all present | — |
| TL-5 | "Too big for the printer / features too thin" | bounding box vs bed; min line width / height | bed 180×180 mm; width ≥ 1.2 mm | profile-defined |

**How TL-1 measures:** the clear gap between the raised *edges* of two lines, sampled every 0.5 mm. Where lines
really cross or join, only the stretch where they are still moving apart is excused. A curve that touches a line
without crossing it fails, and so does a line end that stops less than 3.2 mm clear of another line, even a short stub
just past a crossing. Details and reasons: [decisions.md](decisions.md), 2026-10-14. TL-2 and TL-3 are "not
applicable: no labels yet" until braille labels exist.

**Status:** values come from published guidance only. They have **not** yet been checked against
[BANA 2022](https://www.brailleauthority.org/tg/web-manual/tgmanual.html), a practitioner (Gate 4) or our calibration
print (Gate 7b). Changes are recorded in [decisions.md](decisions.md).

## Allowed fixes

From [`locus/touchcheck/remedies.json`](../locus/touchcheck/remedies.json). The fixer agent may only apply these, and only to `layout.json`.

| Rule | Allowed fixes |
|---|---|
| TL-1 | rescale an axis; hide the grid |
| TL-2, TL-3 | move a label; switch to key mode |
| TL-5 | reduce scale |
| TL-4 | none: refuse (never delete requested features) |

Passing these rules means the spacing and completeness checks passed. It does **not** mean a reader will understand the graphic by touch.
