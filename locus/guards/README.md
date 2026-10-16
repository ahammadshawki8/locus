# guards

Deterministic CI checks that block unsafe agent changes (projectLocus.md §11, [docs/safety.md](../../docs/safety.md)).
Each exits 0 (pass), 1 (blocked) or 2 (could not check: fails closed), and writes `out/guards/*.json`.

| Guard | Command (what CI runs) | Blocks |
|---|---|---|
| `guard-scope` | `locus guard scope [--base <sha>] [--branch <name>]` | Any agent commit outside its allowed paths or branch (contracts §7): `locus-request` on `graph/<iid>` writes `requests/<iid>/{spec,request.lock,layout}.json` in the first commit, then only `layout.json`; `locus-ops` only `deploy/gcp/production-revision` on `rollback/<n>`, or paths of the named commit on `revert/<sha>`. No deletes, no merges. People's commits are counted, not checked |
| `guard-maths` | `locus guard maths requests/<iid> --out out/<iid>` | `spec.json` differs from `request.lock.json`; the lock changed after the branch's first commit; any rendered curve point or mark not on the locked polynomial (own arithmetic, not `locus/core`) |
| `guard-description` | `locus guard description requests/<iid> --out out/<iid>` | Any number in `description.txt` that is not a coefficient, power, domain end, marked point value or the braille ID; a rounded number without "about" |
| `guard-revert` | `locus guard revert [--base <sha>] [--branch revert/<sha>]` | On `revert/<sha>`: anything but one plain commit that is the exact inverse of `<sha>` (a commit on the default branch): the same paths `<sha>` changed, none other; each back to its mode and content before `<sha>`; none changed again since `<sha>` (then no exact inverse exists, even a clean `git revert` is blocked, and a person must revert it) |

**Agent identity** (`agents.json`): a commit belongs to a flow when its author or committer name, or the local part of
either email, matches `ai-<flow>-`. That is how the docs name each flow's service account. The committer counts because
Duo's `create_commit` lets the model set `author_name` and `author_email`, while the committer of an API commit is the
account that called the API. **Gate 5 must confirm the real author and committer of a `create_commit` commit** (the
`locus-probe` flow records both) and update the patterns if needed.

**Base commit:** `--base`, else the MR diff base (`CI_MERGE_REQUEST_DIFF_BASE_SHA`), else the commit before a push
(`CI_COMMIT_BEFORE_SHA`), else where HEAD left the default branch. guard-revert skips the commit before a push: its
base is always where the branch left the default branch.

**Revert branches:** guard-scope lets `locus-ops` on `revert/<sha>` change only the paths `<sha>` changed, and delete
only the files `<sha>` added (the inverse of an add); guard-revert then checks the content. guard-revert does not
re-prove that `<sha>` is guilty: `bisect-regression` named it on `main`, and `library-impact` on the revert MR shows
whether the shipped graphs pass again.

Tests: `scope.test.js`, `maths.test.js`, `description.test.js`, `revert.test.js` (pure checks), `cli.test.js` (end to
end in a throwaway git repo: intake commit, fixer commit, then a rogue lock edit). guard-revert end to end is in
`../cli/monitor.test.js` (a seeded regression, its exact inverse, near-inverses).
