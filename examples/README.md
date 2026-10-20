# Examples

Local example requests (`requestId: 0` is reserved for examples).

- `projectile.json`: "Where does the ball land?" `y = -0.5x² + 2x + 1` for x from -0.5 to 4.5, marking the vertex
  (the peak), the y-intercept (launch height) and the positive x-intercept (where the ball lands).
  It is the demo request, the same as `tools/prints/spec.json`.
- `projectile.layout.json`: the profile's default layout, the one the intake agent writes first. It is print A's layout
  (`tools/prints/layout-A.json`, contracts D4), so it fails touchcheck on purpose: TL-1, TL-2 and TL-5.

```sh
npm run locus -- examples/projectile.json
npm run locus -- touchcheck examples/projectile.json
```
