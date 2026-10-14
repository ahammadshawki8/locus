// Scene -> printable JSCAD solids: a base plate with raised lines, mark dots and braille dots on top.
// A braille dot is a dome: an ellipsoid centred on the plate surface, so its lower half sits inside the plate.
// Returned as separate closed shells, not one boolean union: JSCAD's union leaves T-junctions (open edges) in the
// mesh, while every shell here is watertight. Slicers merge overlapping shells (docs/decisions.md, 2026-10-14).
const { expansions, extrusions, geometries, primitives, transforms } = require('@jscad/modeling')

const toSolids = (scene) => {
  const { widthMm, heightMm, thicknessMm } = scene.plate
  const parts = [primitives.cuboid({ size: [widthMm, heightMm, thicknessMm], center: [widthMm / 2, heightMm / 2, thicknessMm / 2] })]

  for (const line of scene.lines) {
    const path = geometries.path2.fromPoints({ closed: false }, line.points)
    const outline = expansions.expand({ delta: line.widthMm / 2, corners: 'round', segments: 16 }, path)
    parts.push(transforms.translateZ(thicknessMm, extrusions.extrudeLinear({ height: line.heightMm }, outline)))
  }

  for (const mark of scene.marks) {
    parts.push(primitives.cylinder({
      radius: mark.diameterMm / 2,
      height: mark.heightMm,
      center: [mark.xMm, mark.yMm, thicknessMm + mark.heightMm / 2],
      segments: 24
    }))
  }

  for (const label of scene.labels) {
    for (const [x, y] of label.dots) {
      const r = label.dotDiameterMm / 2
      parts.push(primitives.ellipsoid({ radius: [r, r, label.dotHeightMm], center: [x, y, thicknessMm], segments: 12 }))
    }
  }

  return parts
}

module.exports = { toSolids }
