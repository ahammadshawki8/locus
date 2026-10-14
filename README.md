# Locus — tactile maths graphs, made and shipped by an agent

**A teacher emails a maths graph. An AI agent makes a version a blind student can read by touch, checks it the way a
fingertip would, fixes its own mistakes, and ships it. No human in between.**

```text
 ✉ Teacher email ──▶ 🤖 Duo agent drafts graph ──▶ ☝ Touch check
                              ▲                        │
                              └──── fails: agent fixes ┘
                                                       │ passes
                                                       ▼
                     ✉ Reply with print-ready file ◀── 🚀 Release + deploy
```

Other tools draw tactile graphs ([related work](docs/related-work.md)). Locus **checks** them against measured
touch-legibility rules, has an agent **fix** what fails within an allowed set of changes, and **ships only what passes**.

> **Status (14 Oct 2026): rendering works (polynomial → STL + SVG); nothing is touch-checked yet**, and nothing is validated with an
> educator or reader yet. See [docs/STATE.md](docs/STATE.md). Automated checks never certify that a reader will
> understand a graphic by touch ([limitations](docs/limitations.md)).

## Try it locally

```sh
npm --prefix locus ci
npm run test:locus
npm run locus -- examples/projectile.json   # renders out/projectile/{graph.stl,graph.svg,description.txt}
```

## Docs

[Touch rules](docs/touch-rules.md) · [Safety](docs/safety.md) · [Contracts](docs/contracts.md) ·
[Before → after](docs/before-after.md) · [Related work](docs/related-work.md) · [Limitations](docs/limitations.md) ·
[Decisions](docs/decisions.md) · [Full plan](projectLocus.md)

## How it was built

**Claude Code** is the tool we used to build Locus. **GitLab Duo Agent Platform** runs the agents inside Locus. Every
agent action in the product and its pipeline history is done by Duo flows.

## Upstream and licence

Locus is built on [JSCAD / OpenJSCAD.org](https://github.com/jscad/OpenJSCAD.org), imported with its full history.
JSCAD is MIT-licensed ([LICENSE](LICENSE)); its original README is [README.jscad.md](README.jscad.md). What is upstream
and what is new is listed in [docs/before-after.md](docs/before-after.md). Locus's own code is also MIT.
