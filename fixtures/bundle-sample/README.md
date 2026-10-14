# Sample bundle (FIXTURE)

A **fake** bundle that follows [docs/contracts.md](../../docs/contracts.md) §2–§4, so `publish-package`, `release` and
`deploy-*` jobs can be built before real bundles exist. Every file says it is a fixture and `manifest.json` has
`"fixture": true`. Nothing here was rendered or checked. Never publish it as a real graph.

Unzipped on purpose: jobs that need the archive zip this folder as `graph-0-v1.zip`.
`locus/contracts.test.js` checks the manifest against the schema and the hashes against the files.
If you change a file here, regenerate its hash in `manifest.json`.
