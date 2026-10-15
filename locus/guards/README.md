# guards

Deterministic CI checks that block unsafe agent changes (projectLocus.md §11, [docs/safety.md](../../docs/safety.md)).
Each exits 0 (pass), 1 (blocked) or 2 (could not check: fails closed), and writes `out/guards/*.json`.

| Guard | Command (what CI runs) | Blocks |
|---|---|---|
| `guard-scope` | `locus guard scope [--base <sha>] [--branch <name>]` | Any agent commit outside its allowed paths or branch (contracts §7): `locus-request` on `graph/<iid>` writes `requests/<iid>/{spec,request.lock,layout}.json` in the first commit, then only `layout.json`; `locus-ops` only `deploy/gcp/production-revision` on `rollback/<n>`, or paths of the named commit on `revert/<sha>`. No deletes, no merges. People's commits are counted, not checked |
| `guard-maths` | `locus guard maths requests/<iid> --out out/<iid>` | `spec.json` differs from `request.lock.json`; the lock changed after the branch's first commit; any rendered curve point or mark not on the locked polynomial (own arithmetic, not `locus/core`) |
| `guard-description` | `locus guard description requests/<iid> --out out/<iid>` | Any number in `description.txt` that is not a coefficient, power, domain end, marked point value or the braille ID; a rounded number without "about" |
| `guard-revert` | not built (needs `bisect-regression`, Gate 5b) | A regression-detective MR that isn't the exact inverse of the commit `bisect-regression` named |

**Agent identity** (`agents.json`): a commit belongs to a flow when its author name, or the local part of its email,
matches `ai-<flow>-`. That is how the docs name each flow's service account; **Gate 5 must confirm the real author of a
`create_commit` commit** and update the patterns if needed.

**Base commit:** `--base`, else the MR diff base (`CI_MERGE_REQUEST_DIFF_BASE_SHA`), else the commit before a push
(`CI_COMMIT_BEFORE_SHA`), else where HEAD left the default branch.

Tests: `scope.test.js`, `maths.test.js`, `description.test.js` (pure checks), `cli.test.js` (end to end in a throwaway
git repo: intake commit, fixer commit, then a rogue lock edit).
