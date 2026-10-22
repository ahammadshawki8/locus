# Set up Locus

From a fresh clone to teachers emailing requests, in eight steps. Steps 1 and 8 are commands; steps 2 to 7 are
settings in GitLab and Google Cloud, and `locus doctor` checks each of them for you.

| Step | What | Time |
|---|---|---|
| [1](#1-run-locus-on-your-computer) | Run Locus on your computer | 2 min |
| [2](#2-the-gitlab-project) | The GitLab project | 3 min |
| [3](#3-labels-and-service-desk) | Labels and Service Desk | 3 min |
| [4](#4-cicd-variables) | CI/CD variables | 2 min |
| [5](#5-google-cloud) | Google Cloud | 10 min |
| [6](#6-the-agents) | The agents | 5 min |
| [7](#7-print-orders-optional) | Print orders (optional) | 5 min |
| [8](#8-check-everything-and-send-the-first-request) | Check everything, send the first request | 10 min |

## 1. Run Locus on your computer

You need [Node.js](https://nodejs.org/) 20 or later and Git.

```sh
git clone https://gitlab.com/gitlab-ai-hackathon/transcend-october-2026/43384339/showcase.git locus
cd locus
npm run setup
```

`npm run setup` installs the Locus package, checks the agent flow files, renders a released graph
(`requests/4`, `y = 0.5x^2 - 2x + 5`), touch-checks it against all five rules and runs `locus doctor`. The plate is in
`out/setup-graph-4/`: open `graph.stl` in any slicer or 3D viewer, and `overlay.svg` in a browser to see every touch
measurement. Add `-- --test` to run the full test suite as well.

Try your own graph:

```sh
npm run locus -- examples/projectile.json              # render: STL, SVG, description, scene
npm run locus -- touchcheck examples/projectile.json   # TL-1 to TL-5, report + overlay in out/projectile
```

The example uses the default layout on purpose, so the touch check shows what it catches. Its corrected layout is
print B in [`tools/prints/`](../tools/prints/).

## 2. The GitLab project

Push this repository to a GitLab project (Settings > General):

- **Visibility: Public**, with public pipelines. Teachers open the release links and graph pages without signing in.
- **Merge requests > Merge checks: "Pipelines must succeed"** ticked. `auto-merge` asks GitLab to merge when the
  pipeline passes, so this is what makes every check binding.
- **Protected branch `main`**, as GitLab sets by default. Only `main` pipelines may deploy (step 5).

## 3. Labels and Service Desk

**Labels** (Manage > Labels > New label):

| Label | Used for |
|---|---|
| `locus-request` | Every graph request (the request template adds it) |
| `needs-info` | The intake agent asked the teacher a question |
| `cannot-make-readable` | The agent explained why a request cannot be made readable |
| `reprint` | A "Print again" request from a graph page |
| `regression` (optional) | A shipped graph that a code change broke, for the regression detective |

**Service Desk** (Settings > General > Service Desk): turn it on. Anyone, with any email address, can then send a
request to the address shown there.

Teachers who are project members can also use their personal address (Issues > the three-dot menu > "Email a new
issue to this project"). That address is private to each member; never paste it into the repository or a log.

## 4. CI/CD variables

Settings > CI/CD > Variables. Variables hold names in this repository and values only in GitLab.

| Variable | Value | Flags |
|---|---|---|
| `LOCUS_GITLAB_TOKEN` | A personal or project access token with the `api` scope. `auto-merge` and `reply-teacher` use it for the two calls the job token cannot make: merging a merge request and posting the reply | Masked and hidden; not protected (merge request pipelines need it) |

Everything else is either set in [`.gitlab-ci.yml`](../.gitlab-ci.yml) (no secrets there) or optional (step 7).
`RELEASE_MODE` in `.gitlab-ci.yml` is `hands-off`: a green graph merge request is merged and released without a
person. Set it to `supervised` and a person merges each green graph merge request instead.

## 5. Google Cloud

The site runs on Cloud Run, deployed by the pipeline with no key file. In [Cloud Shell](https://shell.cloud.google.com):

```sh
git clone https://gitlab.com/gitlab-ai-hackathon/transcend-october-2026/43384339/showcase.git locus
bash locus/deploy/gcp/setup.sh <new-project-id> <billing-account-id> <your-group/your-project>
```

The billing account id is under Billing > Overview, or `gcloud billing accounts list`. The script is safe to run again.
It creates:

- the project, linked to billing, with Cloud Run, Cloud Build and Artifact Registry on;
- an image repository that keeps the 5 newest images;
- a deploy service account, reachable only through **Workload Identity Federation** from your GitLab project's
  protected `main` branch;
- a 5 USD monthly budget alert.

It prints four values. Put them in the `variables:` block of `.gitlab-ci.yml`:

```yaml
GCP_PROJECT_ID: "..."
GCP_REGION: "us-central1"
GCP_WIF_PROVIDER: "projects/<number>/locations/global/workloadIdentityPools/gitlab/providers/gitlab-com"
GCP_SERVICE_ACCOUNT: "locus-deploy@<project>.iam.gserviceaccount.com"
```

After the first `main` pipeline, set `LOCUS_SITE_URL` in the same block to the production URL that
`promote-production` prints. Print orders link to it. More in [`deploy/gcp/README.md`](../deploy/gcp/README.md).

## 6. The agents

Both flows are GitLab Duo Agent Platform custom flows. The files in [`.gitlab/duo/flows/`](../.gitlab/duo/flows/) are
the source of truth.

1. Check them: `node locus/flows/check.js` (exit 0).
2. **Create `locus-request`:** Automate (or AI) > Catalog > New flow. The display name must be exactly
   `locus-request`: `guard-scope` recognises agent commits by it ([`locus/guards/agents.json`](../locus/guards/agents.json)).
   Paste the whole of `locus-request.yml`.
3. **Enable it in the project** with the triggers **Assign** and **Mention**. GitLab creates a service account for it,
   named like `ai-locus-request-<group>`, and adds it to the project.
4. **Point the request template at it.** The last line of
   [`.gitlab/issue_templates/graph-request.md`](../.gitlab/issue_templates/graph-request.md) is
   `/assign @<that service account>`. Change it there and in `locus/issue-template.test.js`. The site's Request page
   reads the same line, so its drafted emails assign the right agent too.
5. **Create `locus-ops`** the same way (display name exactly `locus-ops`), with the triggers **Pipeline events
   (failed)** and **Assign**.

Flows start only on a person's action: an assignment, a mention or a person's failed pipeline.

## 7. Print orders (optional)

To email the school's print shop for every released graph, add these CI/CD variables:

| Variable | Value | Flags |
|---|---|---|
| `PRINT_ORDER_ENABLED` | `true` | |
| `PRINT_ORDER_FROM` | The school's sending account, for example a Gmail address made for Locus | |
| `PRINT_ORDER_SMTP_PASSWORD` | That account's app password (Google Account > Security > 2-Step Verification > App passwords) | Masked and hidden |
| `PRINT_ORDER_TO` | The print shop's inbox | |
| `PRINT_ORDER_REPLY_TO` | Where the shop's reply goes, usually the teacher (optional) | |
| `PRINT_ORDER_COPIES` | Copies when a request does not say (optional) | |
| `PRINT_ORDER_SMTP_URL` | Another mail server (optional, default `smtps://smtp.gmail.com:465`) | |

A request says how many copies it needs ("Printed copies needed: 2"); 0 means digital files only.

**Print again.** Graph pages have a Print again button. It drafts an email that files a `reprint` issue. To order
those, add a pipeline schedule (Build > Pipeline schedules > New): interval `*/30 * * * *`, branch `main`, and under
**Inputs** set `schedule` to `reprints`. That schedule runs only `print-reprints`: it orders every open `reprint`
issue filed by a project member, notes the order on the issue and closes it.

## 8. Check everything and send the first request

```sh
GITLAB_TOKEN=<a token with read_api> npm run locus -- doctor --project <your-group/your-project>
```

`doctor` reads (never writes) the project and reports each setting from steps 2 to 7 as `ok`, `warn` or `FAIL`, with
the fix for anything missing. It prints CI variable names only, never values.

Then send the first request, from the live site's **Request** page or by email:

```text
To: <your Locus address>
Subject: Tactile graph: projectile

Please make a tactile graph of y = -0.5x^2 + 2x + 1 for x from -1 to 5.
Mark the highest point and where the curve crosses the y-axis.
Printed copies needed: 1

/assign @<the locus-request service account>
```

Watch it run: the issue, the `graph/<iid>` merge request with each attempt, the pipeline, the release, the graph page
on the site, and the reply in your inbox, usually within 10 to 20 minutes.

## Operating Locus

| Task | How |
|---|---|
| Roll production back | Set [`deploy/gcp/production-revision`](../deploy/gcp/production-revision) to a revision name in a merge request; set it back to `UNSET` to resume |
| Pause everything | CI/CD variable `JUDGING_FREEZE=true`: nothing new is merged, published, released, replied to or ordered, and re-checks only log |
| Stop the agents | Turn off each flow's triggers (Automate > Flows) |
| Re-check every shipped graph locally | `npm run locus -- recheck` |
| Rebuild one graph locally | `npm run locus -- requests/<iid>/` then `npm run locus -- touchcheck requests/<iid>/` |
