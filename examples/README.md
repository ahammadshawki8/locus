# Examples

Local example requests (`requestId: 0` is reserved for examples).

- `projectile.json`: "Where does the ball land?" `y = -0.5x² + 2x + 1` for x from -0.5 to 4.5, marking the vertex
  (the peak), the y-intercept (launch height) and the positive x-intercept (where the ball lands).
- `projectile.layout.json`: a starting layout for it.

```sh
npm run locus -- examples/projectile.json
```
