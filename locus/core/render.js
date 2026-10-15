const fs = require('fs')
const path = require('path')
const { measurements } = require('@jscad/modeling')

const { buildScene } = require('./scene')
const { toSolid } = require('./geometry')
const { toBinaryStl } = require('./stl')
const { toSvg } = require('./svg')
const { describe } = require('./describe')
const { formatPolynomial } = require('./polynomial')
const { loadProfile } = require('./profiles')

/**
 * Render a validated spec + layout into graph.stl, graph.svg, description.txt and scene.json.
 * @param {object} [options.brailleIdNumber] number embossed top-right; defaults to the request's issue number
 */
const render = (spec, layout, profile = loadProfile(spec.profileId), options = {}) => {
  const scene = buildScene(spec, layout, profile, options)
  const solid = toSolid(scene)
  return {
    scene,
    solid,
    stl: toBinaryStl(solid, `Locus request ${spec.requestId}, ${profile.id}, millimetres`),
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
