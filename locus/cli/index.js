#!/usr/bin/env node
// Local CLI: npm run locus -- examples/projectile.json
// Validates the spec today. Rendering arrives with Gate 2 (polynomial -> STL + SVG).
const fs = require('fs')

const { validateSpec } = require('../core/validate')

const main = (argv) => {
  const file = argv[2]
  if (!file) {
    console.error('usage: locus <spec.json>')
    return 64
  }
  const errors = validateSpec(JSON.parse(fs.readFileSync(file, 'utf8')))
  if (errors.length) {
    console.error(`${file}: invalid spec\n  ${errors.join('\n  ')}`)
    return 1
  }
  console.log(`${file}: valid spec. Rendering is not implemented yet (Gate 2); nothing was generated.`)
  return 0
}

process.exitCode = main(process.argv)
