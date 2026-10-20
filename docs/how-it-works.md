# How Locus works (the short version, for Shawki)

No code here. Just what each part does, in pictures, and how to test it yourself. The details live in
[HANDOVER.md](../HANDOVER.md); the evidence for every claim is in [decisions.md](decisions.md).

## In one line

A teacher **emails** a maths function. A **GitLab Duo agent** turns it into a raised-line graph a blind student can
read by touch. **GitLab's pipeline** checks it the way a fingertip would. If it fails, the agent **fixes its own
layout** and tries again. When it passes, the teacher gets the **print file back by email**.

## The whole flow

```mermaid
flowchart TD
    A["Teacher sends an email"] --> B["GitLab turns it into an issue"]
    B --> C["Agent starts: INTAKE<br/>reads the request, writes the graph files,<br/>opens a merge request"]
    C --> D["PIPELINE draws the graph<br/>and checks it by touch rules"]
    D --> E{"Readable by touch?"}
    E -- "no" --> F["Agent: FIXER<br/>changes only the layout<br/>(grid, label positions, scale)"]
    F --> D
    E -- "yes" --> G["PIPELINE packs the files<br/>(print file, picture, description)"]
    G --> H["Agent replies on the issue<br/>with the download links"]
    H --> I["GitLab emails the reply<br/>to the teacher"]
    E -- "still no after 3 tries" --> R["Agent REFUSES politely<br/>explains why, nothing is printed"]

    I -.-> J["NOT BUILT YET (your part):<br/>merge, release, graph website on Google Cloud"]

    classDef person fill:#fde68a,stroke:#b45309,color:#000
    classDef agent fill:#bfdbfe,stroke:#1d4ed8,color:#000
    classDef pipe fill:#bbf7d0,stroke:#15803d,color:#000
    classDef todo fill:#e5e7eb,stroke:#6b7280,stroke-dasharray: 5 5,color:#000
    class A,I person
    class C,F,H,R agent
    class B,D,G pipe
    class J todo
```

Yellow is a person or an email, blue is the AI agent, green is GitLab and our pipeline, grey is not built yet.

## Who does what

```mermaid
flowchart LR
    subgraph GL["GitLab (ready-made features)"]
      g1["Email to issue"]
      g2["Starts the agent when a person assigns it"]
      g3["Emails every reply"]
    end
    subgraph AG["The agent (our prompts, run by GitLab Duo)"]
      a1["Intake: understands the request"]
      a2["Fixer: repairs the layout, up to 3 tries"]
      a3["Writes the replies"]
    end
    subgraph PL["The pipeline (our code, run by GitLab CI)"]
      p1["Render: draws the 3D plate"]
      p2["Touchcheck: 5 touch rules"]
      p3["Guards: the agent did not cheat"]
      p4["Bundle: packs the files"]
    end
    GL --> AG --> PL --> AG
```

| Part | Think of it as | Where it lives |
|---|---|---|
| **GitLab features** | The post office: takes the email in, sends replies out, starts the agent | GitLab settings |
| **The agent** | The worker: reads, writes, fixes, replies. It can only change the layout, never the rules or the maths | `.gitlab/duo/flows/locus-request.yml` (pasted into GitLab's AI Catalog) |
| **The pipeline** | The inspector: decides pass or fail. The agent can never mark its own work as passed | `.gitlab-ci.yml` |
| **The Locus code** | The tools the inspector uses: drawing, measuring, checking | `locus/` |

## What the inspector checks

```text
 ┌──────────────────────── TOUCH RULES (is it readable by a fingertip?) ─────────────────────────┐
 │ TL-1  lines at least 3.2 mm apart      TL-2  labels do not touch lines                         │
 │ TL-3  labels do not overlap            TL-4  every point asked for is on the plate             │
 │ TL-5  everything fits inside the plate                                                         │
 └────────────────────────────────────────────────────────────────────────────────────────────────┘
 ┌──────────────────────── GUARDS (did the agent stay honest?) ──────────────────────────────────┐
 │ scope        the agent changed only the files it is allowed to                                 │
 │ maths        the function itself was never changed                                             │
 │ description  every number in the text for the learner is true                                 │
 └────────────────────────────────────────────────────────────────────────────────────────────────┘
```

Every plate has a **braille ID** in the top-right corner (for example G7 for request 7), so any print can be traced
back to its request, its checks and the agent session that made it.

## A real run: request #7 (20 Oct)

```mermaid
sequenceDiagram
    participant T as Teacher (email)
    participant G as GitLab
    participant A as Agent
    participant P as Pipeline
    T->>G: 14:00 email "graph of y = -0.5x^2 + 2x + 1"
    G->>A: 14:01 issue #7 created, agent started
    A->>P: 14:02 attempt 1 (default layout)
    P-->>A: FAIL: lines too close, labels touching
    A->>P: 14:05 attempt 2 (grid off, 2 labels moved)
    P-->>A: PASS, files packed
    A->>G: 14:09 reply with download links
    G->>T: email "Your tactile graph is ready to print"
```

About 8.5 minutes, and nobody touched anything after sending the email.

## Two ways to send a request

```mermaid
flowchart TD
    subgraph R1["Route 1: personal address (fully automatic)"]
      x1["A project member emails their personal<br/>'Email a new issue' address,<br/>last line: /assign @the-agent"] --> x2["Agent starts by itself"] --> x3["Reply goes to that member's GitLab email"]
    end
    subgraph R2["Route 2: Service Desk (anyone, any email)"]
      y1["Anyone emails the project's<br/>Service Desk address"] --> y2["A team member writes one comment<br/>mentioning the agent"] --> y3["Reply goes to the sender's own email"]
    end
```

Why route 2 needs one comment: GitLab only starts an agent when a **person** acts, and Service Desk tickets are
created by GitLab's Support Bot, not a person.

## What is done and what is yours

```text
 DONE (Ashfaq)                                   YOURS (Shawki)
 ┌─────────────────────────────────────┐         ┌──────────────────────────────────────────┐
 │ email in, agent, touch check,       │         │ merge the green merge request            │
 │ self-fix, guards, files back        │  ────>  │ release it (tag graph-7-v1 etc.)         │
 │ by email, refusal after 3 tries     │         │ graph website on Google Cloud Run        │
 │ README "See it working"             │         │ final reply with the release link        │
 │ HANDOVER.md                         │         │ README polish, video, Devpost, freeze    │
 └─────────────────────────────────────┘         └──────────────────────────────────────────┘
```

Your task list, in order, with exact steps: [HANDOVER.md section 0](../HANDOVER.md).

## How you can test it

**1. Look at the real run (2 minutes, no account needed)**
- [Issue #7](https://gitlab.com/gitlab-ai-hackathon/transcend-october-2026/43396940/showcase/-/issues/7): the request,
  the agent's notes and the final reply with links.
- [Merge request !5](https://gitlab.com/gitlab-ai-hackathon/transcend-october-2026/43396940/showcase/-/merge_requests/5):
  open "Commits" (attempt 1, then the agent's fix) and "Pipelines" (red, then green).
- The two download links in the reply: the zip and the STL open without signing in.
- The refusal: [issue #6](https://gitlab.com/gitlab-ai-hackathon/transcend-october-2026/43396940/showcase/-/issues/6).

**2. Run the checker on your computer (5 minutes, needs Node 20)**

```sh
npm --prefix locus ci
npm run test:locus                                    # all tests pass
npm run locus -- examples/projectile.json             # draws the plate into out/projectile/
npm run locus -- touchcheck examples/projectile.json  # FAILS on purpose: the default layout
```

Open `out/projectile/overlay.svg` in a browser: red circles show where a fingertip would get confused.

**3. Send a real request by email (10 minutes)**
- **Today, in Ashfaq's test bed:** email a request from any address to the test bed's Service Desk address
  `incoming+gitlab-ai-hackathon-transcend-october-2026-43396940-showcase-87669530-issue-@incoming.gitlab.com`,
  then tell Ashfaq. He writes the one comment; your inbox gets the agent's notes and, about 8 minutes later, the
  download links. Example email:

  ```text
  Subject: Tactile graph: projectile
  Please make a tactile graph of y = -0.5x^2 + 2x + 1 for x from -0.5 to 4.5.
  Please mark the highest point and where the curve crosses the y-axis.
  ```
- **Later, in your own project:** after the setup in [HANDOVER.md section 13](../HANDOVER.md), use route 1 from your
  own personal address and it runs with nobody else involved.

**Good requests:** one line, parabola or cubic (nothing above x^3), numbers between -100 and 100, points like "the
highest point", "the turning points", "where it crosses the y-axis". A curve that only touches the x-axis, like
y = (x - 1)^2, is refused on purpose.

## Two rules to remember

- **Never fix a run by hand.** If something breaks, close the merge request with a note and send a fresh request.
- **At 27 Oct, 13:00 UTC switch every agent trigger off.** GitLab said a run during judging could change the repo
  and risk our eligibility. Judges see the recorded runs and the video instead.
