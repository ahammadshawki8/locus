# Seeded touchcheck fixtures (FIXTURE)

Requests built to break one touch rule each, plus one that passes (Gate 7: "seeded bad fixtures fail correctly").
Every `expected.json` says `"fixture": true`, names the rule it was `seeded` to break (`null` for the good one), lists
the exact rules that must `fail`, and says `why` in plain words. `locus/touchcheck/fixtures.test.js` renders and
touch-checks each one and requires exactly those failures.

| Folder | Seeded | What is wrong |
|---|---|---|
| `good-projectile-key` | — | Nothing: the projectile after allowed fixes only (grid hidden, y 40 mm/unit, key mode, labels moved) |
| `tl1-lines-too-close` | TL-1 | Starting projectile layout, nothing marked: curve ends and axis/grid stubs too close, grid line along the vertex |
| `tl2-label-on-curve` | TL-2 | The y-intercept letter at its default place, 2.43 mm from the curve |
| `tl3-labels-overlap` | TL-3 | Two letters moved into the same empty spot |
| `tl4-mark-outside-domain` | TL-4 | The y-intercept is requested but x = 0 is outside the domain (no allowed fix: refuse or ask) |
| `tl5-key-too-tall` | TL-5 | Key mode plus y 45 mm/unit: the plate is 195.5 mm tall on a 180 mm bed (fixes conflict) |

These are test inputs, not teacher requests: `requestId` is 0. Render one with
`npm run locus -- fixtures/touchcheck/<folder>` and check it with `npm run locus -- touchcheck fixtures/touchcheck/<folder>`.
