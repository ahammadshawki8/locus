# Seeded touchcheck fixtures (FIXTURE)

Requests built to break one touch rule each, plus one that passes (Gate 7: "seeded bad fixtures fail correctly").
All start from the demo request and print B's corrected layout (`tools/prints/`), profile `fdm-handheld-v1`, and change
one thing. Every `expected.json` says `"fixture": true`, names the rule it was `seeded` to break (`null` for the good
one), lists the exact rules that must `fail`, and says `why` in plain words. `locus/touchcheck/fixtures.test.js` renders
and touch-checks each one and requires exactly those failures.

| Folder | Seeded | Fails | What is wrong |
|---|---|---|---|
| `good-print-b` | - | - | Nothing: print B (grid hidden, y 16 mm per unit, labels moved) |
| `tl1-grid-on-vertex` | TL-1 | TL-1, TL-2 | Grid back on: grid line y = 3 runs along the curve at the vertex; grid lines also come within 6.4 mm of labels |
| `tl2-label-on-curve` | TL-2 | TL-2 | Label b back at the default offset, on the curve |
| `tl3-labels-overlap` | TL-3 | TL-2, TL-3 | Label b moved onto label a (and so onto the curve) |
| `tl4-mark-outside-domain` | TL-4 | TL-4 | The negative x-intercept is requested, but it is outside the domain (no allowed fix: refuse or ask) |
| `tl5-too-tall` | TL-5 | TL-5 | y 22 mm per unit: the y-axis and label a run past the 3 mm edge margin |

These are test inputs, not teacher requests: `requestId` is 0. Render one with
`npm run locus -- fixtures/touchcheck/<folder>` and check it with `npm run locus -- touchcheck fixtures/touchcheck/<folder>`.
