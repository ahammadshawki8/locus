# Prototype prints

These are the only graphs we print, all with profile `fdm-handheld-v1`:
- **A and B:** the demo request in `spec.json` (y = -0.5x² + 2x + 1, x from -0.5 to 4.5; marks: vertex, y-intercept, positive x-intercept).
- **C:** a second request in `spec-C.json` (y = 0.5x³ - 3x² + 4.5x + 2, x from -0.1 to 4; marks: both turning points, y-intercept). It shows Locus isn't a one-graph trick.

| File | Layout | touchcheck (`report.json`) | Braille ID |
|---|---|---|---|
| `graph-A-attempt1.stl` | `layout-A.json`: the profile's **default** layout, which the intake agent writes first (grid on, y scale 8 mm, labels next to their points) | **FAIL**: TL-1 the curve merges with the grid line at the vertex (-1.1 mm, needs 3.2); TL-2 label "b" sits on the curve; TL-5 label "c" is 2.3 mm from the edge (needs 3) | ⠼⠁ (1) |
| `graph-B-corrected.stl` | `layout-B.json`: only allowed fixes (grid hidden, y scale 16 mm, labels moved) | **PASS**: closest line gap 3.4 mm (≥ 3.2); closest label 6.5 mm (≥ 6.4); 5.5 mm from the edge | ⠼⠃ (2) |
| `graph-C-cubic.stl` | `layout-C.json`: corrected layout only (x 19 mm, y 12 mm, labels a = peak, b = dip, c = y-intercept) | **PASS**: closest line gap 4.5 mm; closest label 6.7 mm; 6 mm from the edge | ⠼⠉ (3) |

Rebuild with `npm install && npm run build`. Each build rewrites all three STLs and `report.json`. The build also closes the T-junction seams the CSG union leaves, and stops if any mesh edge is still unpaired, so every STL is watertight.

Generator rules that came out of making C (Ashfaq: keep them in `locus/core`):
- A tick is left out when it would sit on a point mark or closer to the curve than the minimum line gap.
- The x-axis counts when placing the graph: the lower of the curve and the x-axis sits 20 mm from the bottom.

**Honesty note (for the video and README):** these are **prototype prints**, made on 15 Oct before the agent existed. They come from the same request and the same default and corrected layouts as the demo run. In the video, say so in a caption ("prototype prints of the same graph"), and show the agent's real run on screen. Don't call them the agent's printed output.

**For Ashfaq:**
- Port the placement rule (domain minimum 12 mm from the left edge; the lower of the curve and the x-axis 20 mm from the bottom) and the feature sizes into `locus/core`.
- Use `layout-A.json` as the profile's default layout. The agent's attempt 1 then renders exactly print A.
- The checks in `prints.js` are a prototype of TL-1 to TL-5. They measure in plate millimetres and skip only the unavoidable stretch around a real crossing; a tangent still counts as too close.

## Printing

- **100% scale, no resizing.** In the slicer, each part must measure **100 × 100 × 3.6 mm** (2 mm plate plus raised features up to 1.6 mm).
- About 23-25 g of PLA each (about 125-140 tk at 5.5 tk/g).
- Flat on the bed, no supports, PLA, 0.12-0.16 mm layers, same settings as the calibration piece.
- Optional colour change at **2.0 mm** height so the raised parts stand out on camera.
- Hold each plate with the triangle at the **top-left**. The braille ID is at the top-right.

## Feature sizes (mm)

| Feature | Width | Height above plate |
|---|---|---|
| Curve | 1.2 | 1.0 |
| Axes | 1.0 | 0.7 |
| Ticks (every unit, 4 mm long plus rounded ends) | 1.0 | 0.7 |
| Grid (print A only) | 1.0 | 0.5 |
| Point marks (domes) | 3.0 across | 1.6 |
| Braille dots | 1.5 across, 2.5 apart, 6.2 between cells | 0.8 |
| Orientation triangle | 5 mm sides | 1.0 |

## Measured from the STL meshes (15 Oct)

Probe lines run across each mesh at 0.02 mm steps, independently of the code that made it. Widths read about 0.04 mm low because of the step size.

| Check | Designed | Measured |
|---|---|---|
| Plate | 100 × 100 × 2 | 100 × 100, top of tallest feature 3.6 |
| Axis | 1.0 wide, 0.7 high | 0.96, 0.70 |
| Curve | 1.2 wide, 1.0 high | 1.26 (crossed at a slant), 1.00 |
| Point dome | 1.6 high | 1.60 |
| Print A at the vertex | curve and grid merge | one 1.64 mm ridge: the fingertip feels one line |
| Print C | axis 1.0 × 0.7, dome 3.0 across × 1.6, curve 1.0 high | 0.96 × 0.70, 2.96 × 1.60, 1.00 |
| Calibration row A gaps | 2.0 / 3.2 / 4.0 / 6.4 / 9.5 | 2.02 / 3.20 / 4.02 / 6.42 / 9.52 |
| Calibration row B widths | 0.8 / 1.0 / 1.2 / 1.6 / 2.0 | 0.76 / 0.98 / 1.20 / 1.58 / 1.98 |
| Calibration braille | 1.5 dots, 2.5 pitch, 6.2 cells, 0.5 and 0.8 high | 1.48, 2.50, 6.20, 0.50 and 0.80 |
