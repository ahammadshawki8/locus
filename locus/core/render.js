const fs = require('fs')
const path = require('path')
const { measurements } = require('@jscad/modeling')

const { buildScene } = require('./scene')
const { clipToPlate, toParts, toSolid } = require('./geometry')
const { countOpenEdges, toBinaryStl, writeBinaryStl } = require('./stl')
const { manifoldMesh } = require('./manifold')
const { toSvg } = require('./svg')
const { describe } = require('./describe')
const { formatPolynomial } = require('./polynomial')
const { loadProfile } = require('./profiles')

/**
 * Render a validated spec + layout into graph.stl, graph.svg, description.txt and scene.json.
 * `mesh` says which step closed the STL: "jscad" (the repaired JSCAD union) or "manifold" (the fallback, manifold.js).
 * @param {object} [options.brailleIdNumber] number embossed top-right; defaults to the request's issue number
 */
const render = (spec, layout, profile = loadProfile(spec.profileId), options = {}) => {
  const scene = buildScene(spec, layout, profile, options)
  const parts = toParts(scene)
  const solid = clipToPlate(toSolid(scene, parts), scene.plate)
  const header = `Locus request ${spec.requestId}, ${profile.id}, millimetres`
  let stl
  let mesh = 'jscad'
  try {
    stl = toBinaryStl(solid, header)
  } catch (error) {
    if (!/unpaired edges/.test(error.message)) throw error
    stl = writeBinaryStl(manifoldMesh(parts, scene.plate), header)
    mesh = 'manifold'
    const open = countOpenEdges(stl)
    if (open !== 0) throw new Error(`${error.message}, and the manifold fallback left ${open}`)
  }
  return {
    scene,
    solid,
    stl,
    mesh,
    svg: toSvg(scene, formatPolynomial(spec.graph.coeffs)),
    description: describe(spec, { points: scene.marks, missing: scene.missing }, { labelMode: scene.labelMode, brailleIdNumber: scene.brailleIdNumber }),
    bounds: measurements.measureBoundingBox(solid)
  }
}

const writeOutputs = (outDir, { scene, stl, svg, description }) => {
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(path.join(outDir, 'graph.stl'), stl)
  fs.writeFileSync(path.join(outDir, 'graph.svg'), svg)
  fs.writeFileSync(path.join(outDir, 'description.txt'), description)
  fs.writeFileSync(path.join(outDir, 'scene.json'), JSON.stringify(scene, null, 2) + '\n')
}

module.exports = { render, writeOutputs, loadProfile }
