// Scene -> one printable JSCAD solid, built exactly as tools/prints/prints.js builds the prototype prints
// (docs/contracts.md D3): a 2 mm plate with 3 mm rounded corners, the orientation triangle, raised lines with round
// ends, point marks and braille dots as domes (squashed spheres centred on the plate surface), all in one union.
// The union leaves T-junctions in the mesh; stl.js closes them before writing (watertight STL).
const { booleans, expansions, extrusions, geometries, measurements, primitives, transforms } = require('@jscad/modeling')

const EPS = 0.01 // raised parts start this far inside the plate, so the union fuses them
const STRAIGHT_MM = 1e-5 // a sample this close to the chord of its neighbours adds nothing a printer can make

/**
 * A path that is straight from end to end (a line, degree 1: 401 collinear samples) becomes its two ends: the union
 * cannot fuse the long collinear outline of so many samples. Any other path keeps every sample, so curves, including
 * the nearly straight middle of a cubic, are built exactly as before (prints A, B and C unchanged, contracts D3).
 */
const dropStraightSamples = (pts) => {
  if (pts.length < 3) return pts
  const [ax, ay] = pts[0]
  const [cx, cy] = pts[pts.length - 1]
  const chord = Math.hypot(cx - ax, cy - ay)
  if (chord === 0) return pts
  const straight = pts.every(([bx, by]) => Math.abs((cx - ax) * (ay - by) - (ax - bx) * (cy - ay)) / chord < STRAIGHT_MM)
  return straight ? [pts[0], pts[pts.length - 1]] : pts
}

const toSolid = (scene) => {
  const { widthMm: W, heightMm: H, thicknessMm: TOP } = scene.plate
  const raisedPath = (pts, w, h) => transforms.translate([0, 0, TOP - EPS], extrusions.extrudeLinear({ height: h + EPS },
    expansions.expand({ delta: w / 2, corners: 'round', segments: 16 }, geometries.path2.fromPoints({ closed: false }, dropStraightSamples(pts)))))
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

/**
 * A layout can put features past the plate edge (a default scale that is too wide). TL-5 fails it from scene.json, so
 * it is never bundled, but the render job must still write a closed STL for touchcheck and the fixer: cut the solid to
 * the plate's footprint. A solid that fits the plate is returned unchanged (prints A, B and C stay byte-identical).
 */
const clipToPlate = (solid, plate) => {
  const [[x0, y0], [x1, y1]] = measurements.measureBoundingBox(solid)
  const { widthMm: W, heightMm: H } = plate
  const tol = 1e-6
  if (x0 >= -tol && y0 >= -tol && x1 <= W + tol && y1 <= H + tol) return solid
  const [, [, , z1]] = measurements.measureBoundingBox(solid)
  return booleans.intersect(solid, primitives.cuboid({ size: [W, H, z1 + 2], center: [W / 2, H / 2, z1 / 2] }))
}

module.exports = { toSolid, clipToPlate }
