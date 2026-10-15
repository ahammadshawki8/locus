# guards

Deterministic CI checks that block unsafe agent changes. Not started. See [docs/safety.md](../../docs/safety.md).

- `guard-scope`: agent commits only touch that agent's allowed paths (docs/contracts.md §7)
- `guard-maths`: spec matches `request.lock.json`; plotted points match the locked maths (`core/validate.js` `checkLock` is the spec half)
- `guard-description`: every number in `description.txt` matches computed values
- `guard-revert`: a regression-detective MR is the exact inverse of the commit `bisect-regression` found
