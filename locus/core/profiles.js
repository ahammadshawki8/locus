// Printer profiles live in profiles/<id>.json at the repository root (docs/contracts.md §2).
const fs = require('fs')
const path = require('path')

const profileDir = path.join(__dirname, '..', '..', 'profiles')
const profileFile = (profileId) => path.join(profileDir, `${profileId}.json`)

const profileExists = (profileId) => fs.existsSync(profileFile(profileId))

const loadProfile = (profileId) => JSON.parse(fs.readFileSync(profileFile(profileId), 'utf8'))

module.exports = { profileDir, profileExists, loadProfile }
