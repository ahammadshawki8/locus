# Locus

Before doing anything, read **Part S of `projectLocus.md`** (start here, hard rules, status board, project flow, document map, session routine). Then read `docs/contracts.md` and the newest entries in `docs/decisions.md`.

## Hard rules (mirror of `projectLocus.md` S.2; keep both identical)

- **H1 Git identity.** Commit and push only as `ahammadshawki8 <ahammadshawki8@users.noreply.github.com>` or as Ashfaq's own account. Never list Claude, Anthropic, `srotdev`, or any other AI tool or account as author, committer, co-author or contributor. No `Co-Authored-By` lines and no "Generated with ..." lines in commits, merge requests, pull requests, issues or release notes.
- **H2 No emojis and no long dashes, anywhere:** code, comments, docs, commit messages, issues, MR text, the site, video captions and Devpost text. No em dash (U+2014), en dash (U+2013) or minus sign (U+2212). Use a hyphen, colon, comma or "to" instead. Braille cells (U+2800 block) are allowed only where they show braille.
- **H3 Truth rule.** A planned stage is not a completed stage. Never claim touch readability from automated rules alone. Never claim a GitLab capability works until it has run in our account. Never fake a failure, a pass or an agent action.
- **H4 Simplicity rule.** One story a judge can explain after one sound-off viewing. Everything else stays in the README.
- **H5 Contracts are law.** `docs/contracts.md` v1 is final. Change it only through a dated entry in `docs/decisions.md` that both Ashfaq and Shawki agree to.
- **H6 Role boundary.** Claude Code builds Locus; GitLab Duo runs every agent inside Locus. Never use Claude Code for in-product fixes during a recorded or demo run.
- **H7 Agents stay in scope.** Never edit `locus/touchcheck/rules` to make a request pass. Each agent writes only its allowed paths (`docs/contracts.md` §7).
- **H8 No secrets** in code, prompts, commits or logs. Use protected, masked CI variables; write only their names in docs.
- **H9 Prints.** The only physical prints are the 4 prototype plates (calibration, A, B, C). There will be no more printing. Captions call them "prototype prints".
- **H10 Sources.** Every external fact in the docs links to its source.
- **H11 Record and push.** Decisions go in `docs/decisions.md`, dated. Every session ends with the status board in `projectLocus.md` S.3 updated, committed and pushed.
- **H12 Freeze.** Nothing in the repo, video or Devpost form changes after 27 Oct 2026, 13:00 UTC.
