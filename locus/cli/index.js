#!/usr/bin/env node
// Local CLI and the `render` CI job's entry point.
//   locus <requests/<iid> | spec.json> [--out <dir>]
// A request folder holds spec.json + layout.json (+ request.lock.json); a spec file `x.json` uses `x.layout.json`.
// Writes graph.stl, graph.svg, description.txt and scene.json (docs/contracts.md §5).
const fs = require('fs')
const path = require('path')

const { validateSpec, validateLayout, checkLock } = require('../core/validate')
const { render, writeOutputs } = require('../core/render')

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'))

const resolveInputs = (target) => {
  if (fs.statSync(target).isDirectory()) {
    const lock = path.join(target, 'request.lock.json')
    return {
      name: path.basename(path.resolve(target)),
      specFile: path.join(target, 'spec.json'),
      layoutFile: path.join(target, 'layout.json'),
      lockFile: fs.existsSync(lock) ? lock : null
    }
  }
  const name = path.basename(target, '.json')
  return { name, specFile: target, layoutFile: path.join(path.dirname(target), `${name}.layout.json`), lockFile: null }
}

const main = (argv) => {
  const args = argv.slice(2)
  const outIndex = args.indexOf('--out')
  const outArg = outIndex >= 0 ? args.splice(outIndex, 2)[1] : null
  const target = args[0]
  if (!target) {
    console.error('usage: locus <requests/<iid> | spec.json> [--out <dir>]')
    return 64
  }

  const { name, specFile, layoutFile, lockFile } = resolveInputs(target)
  const spec = readJson(specFile)
  const layout = readJson(layoutFile)
  const errors = [
    ...validateSpec(spec).map((e) => `spec.json ${e}`),
    ...validateLayout(layout).map((e) => `layout.json ${e}`),
    ...(lockFile ? checkLock(spec, readJson(lockFile)).map((e) => `spec.json ${e}`) : [])
  ]
  if (errors.length) {
    console.error(`${target}: invalid request\n  ${errors.join('\n  ')}`)
    return 1
  }

  const outDir = outArg || path.join('out', name)
  const result = render(spec, layout)
  writeOutputs(outDir, result)
  const { widthMm, heightMm } = result.scene.plate
  console.log(`${target}: rendered ${widthMm.toFixed(1)} x ${heightMm.toFixed(1)} mm plate to ${outDir}`)
  for (const m of result.scene.missing) console.log(`  missing: ${m.mark} (${m.reason})`)
  console.log('  Not touch-checked yet: touchcheck arrives with Gate 7.')
  return 0
}

process.exitCode = main(process.argv)
