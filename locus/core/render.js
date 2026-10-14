const fs = require('fs')
const path = require('path')
const { measurements } = require('@jscad/modeling')

const { buildScene } = require('./scene')
const { toSolids } = require('./geometry')
const { toBinaryStl } = require('./stl')
const { toSvg } = require('./svg')
const { describe } = require('./describe')
const { formatPolynomial } = require('./polynomial')

const loadProfile = (profileId) => JSON.parse(fs.readFileSync(path.join(__dirname, 'profiles', `${profileId}.json`), 'utf8'))

/** Render a validated spec + layout into the render-job outputs (docs/contracts.md §5). */
const render = (spec, layout, profile = loadProfile(spec.profileId)) => {
  const scene = buildScene(spec, layout, profile)
  const solids = toSolids(scene)
  return {
    scene,
    solids,
    stl: toBinaryStl(solids, `Locus request ${spec.requestId} ${profile.id}`),
    svg: toSvg(scene, formatPolynomial(spec.graph.coeffs)),
    description: describe(spec, { points: scene.marks, missing: scene.missing }, { labelMode: scene.labelMode }),
    bounds: measurements.measureAggregateBoundingBox(solids)
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
