# Safety: why hands-off is responsible here

- **Nothing ships unless every deterministic check passes.** `release` needs touchcheck, all guards, security scans,
  the licence check and bundle; `promote-production` needs `validate-staging` ([contracts.md](contracts.md) §6).
- **Agents act only inside their allowed paths** (`guard-scope`, see [contracts.md](contracts.md) §7). Each flow has its own service account, so `guard-scope` checks the commit author, the branch and the paths. The fixer can edit
  `layout.json` only. It cannot change the rules, the profile values or the maths.
- **The maths is locked.** `request.lock.json` is written with the first commit; `guard-maths` blocks any spec change and
  checks plotted points against the locked function.
- **The learner description is checked.** `guard-description` rejects any number that doesn't match computed values.
- **Bounded retries.** If the fixer can't make a graph pass in 3 attempts, it refuses and explains (`cannot-make-readable`) instead of shipping.
- **Reversible lifecycle actions.** Rollback is a one-line revision pointer change, reviewed by the pipeline.
  A regression revert must be the exact inverse of the commit `bisect-regression` found (`guard-revert`).
- **No code from requests.** Expressions are parsed against an allowlist; nothing is `eval`-ed.
- **Secrets** live only in protected, masked CI variables. Secret detection and SAST run on every pipeline.
- **Humans stay responsible for the physical output.** Every bundle states that automated checks don't certify comprehension.

## Guards

| Guard | Blocks |
|---|---|
| `guard-scope` | any agent commit outside that agent's allowed paths, checked by commit author and branch |
| `guard-maths` | spec differs from `request.lock.json`, or plotted points don't match the locked maths |
| `guard-description` | any number in the learner description that doesn't match computed values |
| `guard-revert` | a regression-detective MR that isn't the exact inverse of the commit `bisect-regression` identified |

Plus protected branches and tags, CODEOWNERS, `secret-detection`, `sast` and a licence check.
