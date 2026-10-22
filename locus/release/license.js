// `locus license-check`: the `license-check` CI job (`release` needs it, docs/contracts.md §6).
// Every package that Locus installs to run (locus/package-lock.json, dev dependencies left out) must carry a licence
// from ALLOWED, read from the installed package's own package.json. A package that is not installed, or has no
// licence, fails: the check never assumes. Writes out/license/report.json and prints `LOCUS_LICENSE <json>`.
// Exit 0 = every licence allowed, 1 = a licence not allowed or missing, 2 = cannot check (not installed).
const fs = require('fs')
const path = require('path')

// Permissive licences only, so the bundles and the site can be shipped under MIT.
const ALLOWED = ['MIT', 'ISC', 'BSD-2-Clause', 'BSD-3-Clause', 'Apache-2.0', '0BSD']

/** The licence ids in an SPDX expression like "(MIT OR Apache-2.0)". */
const licenceIds = (expression) => String(expression).replace(/[()]/g, ' ').split(/\s+(?:OR|AND)\s+|\s+/).filter(Boolean)

/**
 * Whether a licence field is allowed. "A OR B" needs one allowed id, "A AND B" needs all of them.
 * The old `{ type }` and `licenses: [...]` forms are read too.
 */
const allowed = (license) => {
  if (!license) return false
  if (typeof license === 'object') return allowed(license.type)
  const text = String(license).trim()
  if (/\sAND\s/.test(text)) return licenceIds(text).every((id) => ALLOWED.includes(id))
  return licenceIds(text).some((id) => ALLOWED.includes(id))
}

const licenceOf = (pkg) => pkg.license || (Array.isArray(pkg.licenses) ? pkg.licenses.map((l) => l.type || l).join(' OR ') : undefined)

/** The runtime packages of a lockfile v2/v3: [{ name, dir }], links resolved to their target folder. */
const runtimePackages = (lock, root) => Object.entries(lock.packages || {})
  .filter(([key, entry]) => key && key.includes('node_modules/') && !entry.dev)
  .map(([key, entry]) => ({
    name: key.slice(key.lastIndexOf('node_modules/') + 'node_modules/'.length),
    dir: path.join(root, entry.link ? entry.resolved : key)
  }))

const checkLicences = (root) => {
  const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'))
  return runtimePackages(lock, root).map(({ name, dir }) => {
    const file = path.join(dir, 'package.json')
    if (!fs.existsSync(file)) return { name, license: null, pass: false, missing: true }
    const pkg = JSON.parse(fs.readFileSync(file, 'utf8'))
    const license = licenceOf(pkg) || null
    return { name, version: pkg.version, license, pass: allowed(license) }
  }).sort((a, b) => a.name.localeCompare(b.name))
}

const runLicenseCheck = (args, root = path.join(__dirname, '..')) => {
  const outIndex = args.indexOf('--out')
  const outDir = outIndex >= 0 ? args[outIndex + 1] : path.join('out', 'license')
  const results = checkLicences(root)
  const missing = results.filter((r) => r.missing)
  const report = { allowed: ALLOWED, pass: results.every((r) => r.pass), packages: results }
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2) + '\n')
  console.log(`LOCUS_LICENSE ${JSON.stringify({ pass: report.pass, failing: results.filter((r) => !r.pass).map((r) => r.name) })}`)
  if (missing.length) {
    console.error(`license-check: not installed: ${missing.map((r) => r.name).join(', ')}. Run npm --prefix locus ci first.`)
    return 2
  }
  for (const r of results) console.log(`  ${r.pass ? 'ok  ' : 'FAIL'} ${r.name}@${r.version}: ${r.license || 'no licence'}`)
  return report.pass ? 0 : 1
}

module.exports = { ALLOWED, allowed, checkLicences, runtimePackages, runLicenseCheck }
