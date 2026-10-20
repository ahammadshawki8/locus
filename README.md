# Locus: tactile maths graphs, made and shipped by an agent

**A teacher emails a maths graph. An AI agent makes a version a blind student can read by touch, checks it the way a
fingertip would, fixes its own mistakes, and ships it. One request in, no human after that.**

```text
 Teacher request ──> Duo agent drafts graph ──> Touch check
                              ▲                      │
                              └── fails: agent fixes ┘
                                                     │ passes
                                                     ▼
            Reply with print-ready file <── Release + deploy
```

Other tools draw tactile graphs ([related work](docs/related-work.md)). Locus **checks** them against measured
touch-legibility rules, has an agent **fix** what fails within an allowed set of changes, and **ships only what passes**.

> **Status (20 Oct 2026):** one email in, print files back by email, with the agent fixing its own layout in between,
> runs end to end on GitLab (see below). The guards run in CI. Merge, release and deploy are not built yet, and nothing
> is validated with an educator or reader yet. Current status: the board in [projectLocus.md](projectLocus.md) S.3.
> Automated checks measure spacing and size; they do not certify that a learner can understand the graphic
> ([limitations](docs/limitations.md)).

## See it working

A real run on 20 Oct 2026 in our GitLab test bed ([evidence](docs/decisions.md), entry 20 Oct (e)):

1. One plain email with the request became
   [issue #7](https://gitlab.com/gitlab-ai-hackathon/transcend-october-2026/43396940/showcase/-/issues/7) and started
   the `locus-request` GitLab Duo flow. Nobody did anything after sending it.
2. The intake agent wrote the request files and opened
   [MR !5](https://gitlab.com/gitlab-ai-hackathon/transcend-october-2026/43396940/showcase/-/merge_requests/5).
   Attempt 1 failed the touch check (lines too close, labels touching lines).
3. The fixer agent changed only the layout (grid off, two labels moved), and attempt 2 passed every check.
4. About 8.5 minutes after the email, the agent replied on the issue with the print files:
   [the whole bundle](https://gitlab.com/api/v4/projects/87669530/jobs/artifacts/refs%2Fmerge-requests%2F5%2Fhead/raw/out/bundle/graph-7-v1.zip?job=bundle)
   and [the STL alone](https://gitlab.com/api/v4/projects/87669530/jobs/artifacts/refs%2Fmerge-requests%2F5%2Fhead/raw/out/bundle/graph-7-v1/graph.stl?job=bundle)
   (no sign-in needed), with braille ID G7 on the plate.

The refusal path also ran: [issue #6](https://gitlab.com/gitlab-ai-hackathon/transcend-october-2026/43396940/showcase/-/issues/6)
asks for a parabola that only touches the x-axis, which no layout can make readable; after 3 attempts the agent
refused and nothing was released.

## Try it locally

```sh
npm --prefix locus ci
npm run test:locus
npm run locus -- examples/projectile.json              # renders out/projectile/{graph.stl,graph.svg,description.txt,scene.json}
npm run locus -- touchcheck examples/projectile.json   # the default layout (print A) fails; report + overlay in out/projectile
```

## Docs

[Touch rules](docs/touch-rules.md) · [Safety](docs/safety.md) · [Contracts](docs/contracts.md) ·
[Before and after](docs/before-after.md) · [Related work](docs/related-work.md) · [Limitations](docs/limitations.md) ·
[Decisions](docs/decisions.md) · [Prototype prints](tools/prints/README.md) · [Full plan](projectLocus.md)

## How it was built

**Claude Code** is the tool we used to build Locus. **GitLab Duo Agent Platform** runs the agents inside Locus. Every
agent action in the product and its pipeline history is done by Duo flows.

## Upstream and licence

Locus is built on [JSCAD / OpenJSCAD.org](https://github.com/jscad/OpenJSCAD.org), imported with its full history.
JSCAD is MIT-licensed ([LICENSE](LICENSE)); its original README is [README.jscad.md](README.jscad.md). What is upstream
and what is new is listed in [docs/before-after.md](docs/before-after.md). Locus's own code is also MIT.
