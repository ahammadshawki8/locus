// Locus calibration test piece (MIT).
// Generates calibration.stl: a 100 x 45 mm plate that tests which line gaps,
// line widths and braille dot heights a given printer reproduces and a
// fingertip can feel. All values are real millimetres; print at 100% scale.

const fs = require('fs')
const path = require('path')
const { primitives, booleans, transforms, extrusions } = require('@jscad/modeling')
const stlSerializer = require('@jscad/stl-serializer')

const PLATE = { w: 100, h: 45, t: 2, cornerR: 3 }
const TOP = PLATE.t
const LINE = { width: 1.2, height: 1.0 }
const DOT = { diameter: 1.5, pitch: 2.5, cellPitch: 6.2 }
const COLUMNS = [12, 30, 48, 66, 85] // x centres of the five test columns

const GAPS_MM = [2.0, 3.2, 4.0, 6.4, 9.5] // row A: edge-to-edge gap between two lines
const WIDTHS_MM = [0.8, 1.0, 1.2, 1.6, 2.0] // row B: single line widths

// Grade 1 braille dot numbers (1-3 left column top to bottom, 4-6 right column)
const BRAILLE = { L: [1, 2, 3], O: [1, 3, 5], C: [1, 4], U: [1, 3, 6], S: [2, 3, 4] }

const EPS = 0.01 // overlap so raised parts fuse with the plate

const plate = () => extrusions.extrudeLinear({ height: PLATE.t },
  primitives.roundedRectangle({ size: [PLATE.w, PLATE.h], roundRadius: PLATE.cornerR, center: [PLATE.w / 2, PLATE.h / 2] }))

// A raised bar running along y, centred on (cx, cy)
const vline = (cx, cy, length, width = LINE.width, height = LINE.height) =>
  primitives.cuboid({ size: [width, length, height + EPS], center: [cx, cy, TOP + (height - EPS) / 2] })

// A domed dot: a sphere flattened to the requested height; its lower half sits inside the plate
const dot = (x, y, height) => transforms.translate([x, y, TOP],
  transforms.scale([1, 1, height / (DOT.diameter / 2)],
    primitives.sphere({ radius: DOT.diameter / 2, segments: 24 })))

// Row A: pairs of lines with increasing gaps
const gapPairs = () => GAPS_MM.flatMap((gap, i) => {
  const offset = gap / 2 + LINE.width / 2
  return [vline(COLUMNS[i] - offset, 36, 10), vline(COLUMNS[i] + offset, 36, 10)]
})

// Column index: 1..5 dots between rows A and B, so each column can be identified by touch
const indexDots = () => COLUMNS.flatMap((cx, i) =>
  Array.from({ length: i + 1 }, (_, k) => dot(cx + (k - i / 2) * DOT.pitch, 27.5, 0.6)))

// Row B: single lines of increasing width
const widthLines = () => WIDTHS_MM.map((w, i) => vline(COLUMNS[i], 18.5, 9, w))

// Row C: the word LOCUS in braille, twice, at two dot heights
const brailleWord = (word, startX, topY, height) => [...word].flatMap((ch, c) =>
  BRAILLE[ch].map((n) => {
    const col = n <= 3 ? 0 : 1
    const row = (n - 1) % 3
    return dot(startX + c * DOT.cellPitch + col * DOT.pitch, topY - row * DOT.pitch, height)
  }))

// Orientation mark: a raised triangle in the top-left corner (points counter-clockwise, as JSCAD requires)
const cornerMark = () => extrusions.extrudeLinear({ height: 1 + EPS },
  primitives.polygon({ points: [[3, 37], [8, 42], [3, 42]] }))

const model = () => booleans.union(
  plate(),
  transforms.translate([0, 0, TOP - EPS], cornerMark()),
  ...gapPairs(),
  ...indexDots(),
  ...widthLines(),
  ...brailleWord('LOCUS', 8, 9, 0.5),
  ...brailleWord('LOCUS', 58, 9, 0.8)
)

const out = path.join(__dirname, 'calibration.stl')
const data = stlSerializer.serialize({ binary: true }, model())
fs.writeFileSync(out, Buffer.concat(data.map((d) => Buffer.from(d))))
console.log(`wrote ${out}`)
