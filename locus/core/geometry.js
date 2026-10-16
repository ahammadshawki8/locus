// Scene -> one printable JSCAD solid, built exactly as tools/prints/prints.js builds the prototype prints
// (docs/contracts.md D3): a 2 mm plate with 3 mm rounded corners, the orientation triangle, raised lines with round
// ends, point marks and braille dots as domes (squashed spheres centred on the plate surface), all in one union.
// The union leaves T-junctions in the mesh; stl.js closes them before writing (watertight STL).
const { booleans, expansions, extrusions, geometries, primitives, transforms } = require('@jscad/modeling')

const EPS = 0.01 // raised parts start this far inside the plate, so the union fuses them

const toSolid = (scene) => {
  const { widthMm: W, heightMm: H, thicknessMm: TOP } = scene.plate
  const raisedPath = (pts, w, h) => transforms.translate([0, 0, TOP - EPS], extrusions.extrudeLinear({ height: h + EPS },
    expansions.expand({ delta: w / 2, corners: 'round', segments: 16 }, geometries.path2.fromPoints({ closed: false }, pts))))
  const dome = (x, y, d, h) => transforms.translate([x, y, TOP], transforms.scale([1, 1, h / (d / 2)], primitives.sphere({ radius: d / 2, segments: 24 })))

  const plate = extrusions.extrudeLinear({ height: TOP }, primitives.roundedRectangle({ size: [W, H], roundRadius: 3, center: [W / 2, H / 2] }))
  const corner = transforms.translate([0, 0, TOP - EPS], extrusions.extrudeLinear({ height: scene.orientation.heightMm + EPS }, primitives.polygon({ points: scene.orientation.points })))
  return booleans.union(
    plate, corner,
    ...scene.lines.map((l) => raisedPath(l.points, l.widthMm, l.heightMm)),
    ...scene.marks.map((m) => dome(m.xMm, m.yMm, m.diameterMm, m.heightMm)),
    ...scene.labels.flatMap((l) => l.dots.map(([x, y]) => dome(x, y, l.dotDiameterMm, l.dotHeightMm)))
  )
}

module.exports = { toSolid }
