# Calibration test piece

`calibration.stl` is a 100 × 45 × 2 mm plate. It tests what the printer reproduces cleanly and what a fingertip can tell apart. The results set the real values for the touch rules (TL-1, TL-2, TL-5) before any graph is printed.

Regenerate with `npm install && npm run build`.

## Printing

- **100% scale. Never resize**, because every measurement is real millimetres.
- PLA, layer height 0.12–0.16 mm, flat on the bed, no supports.
- Optional: change filament colour at 2 mm height (where the base ends), so the raised parts stand out on camera.

## Layout (hold it with the triangle at the top-left)

```
 ◤   ||      | |      |  |      |   |      |     |     Row A: line pairs, gap between the lines
      •      ••       •••      ••••      •••••         index dots = column number 1–5
      |       |        |        ▌         █            Row B: single lines of increasing width
  LOCUS (low dots)          LOCUS (high dots)          Row C: braille, two dot heights
```

| Column (index dots) | Row A: gap between the two lines | Row B: line width |
|---|---|---|
| 1 (•) | 2.0 mm | 0.8 mm |
| 2 (••) | **3.2 mm** (our current minimum, TL-1) | 1.0 mm |
| 3 (•••) | 4.0 mm | **1.2 mm** (our current line width) |
| 4 (••••) | **6.4 mm** (our current label clearance, TL-2) | 1.6 mm |
| 5 (•••••) | 9.5 mm | 2.0 mm |

- **Row A lines and Row B lines** are 1.0 mm high.
- **Row C:** the word **LOCUS** in Grade 1 braille, twice. Dots are 1.5 mm wide, spaced 2.5 mm within a cell and 6.2 mm between cells. The left copy has **0.5 mm** high dots and the right copy **0.8 mm**.
- **Index dots** are 0.6 mm high.

## What to check after printing

**By eye (printer quality):**
1. Is every gap in row A still open, especially column 1 (2.0 mm)? Note any where the lines merged.
2. Do all row B lines print as clean, separate bars? The 0.8 mm line may be too thin for a 0.4 mm nozzle. Note the thinnest clean one.
3. Are the braille dots round and separate, or blobby and stringy?

**By touch (eyes closed, ideally someone who hasn't seen it):**
1. Row A: in which column do you first feel **two separate lines** rather than one? That's the real minimum gap.
2. Row B: which widths feel clearly like a line? Do the wide ones feel different from the thin ones? (This informs how the curve and axes are made to feel different.)
3. Row C: are the low or high dots easier to read, and does either feel sharp?
4. Can you count the index dots (1–5) without looking?

Write the answers in `docs/decisions.md`, along with a photo. Ashfaq then updates the rule values and printer profile from these measured results instead of the published placeholders.
