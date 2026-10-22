# deploy/gcp

Cloud Run hosting for the graph library site, with a staging step and GitOps rollback.

| File | What |
|---|---|
| `setup.sh` | One-time setup, run in Cloud Shell: project, APIs, image repository (keeps the 5 newest images), deploy service account, Workload Identity Federation for GitLab CI (your project's protected `main` only, no key file), 5 USD budget alert. Prints the four `GCP_*` values for `.gitlab-ci.yml` |
| `deploy.sh` | What the CI jobs run: `staging` (a new revision `locus-site-p<pipeline>`, no production traffic, tag `staging`) and `promote` (production traffic to that revision, or to the one `production-revision` pins) |
| `production-revision` | GitOps rollback pointer: `UNSET`, or the one Cloud Run revision production must serve (docs/contracts.md §9). Changed only through a merge request |

**Live:** project `locus-tactile-2026`, service `locus-site` in `us-central1`,
<https://locus-site-742642312166.us-central1.run.app>. Min instances 0, max 2, 256 MiB: it costs nothing while nobody
visits.

**CI variables** (in `.gitlab-ci.yml`, not secrets): `GCP_PROJECT_ID`, `GCP_REGION`, `GCP_WIF_PROVIDER`,
`GCP_SERVICE_ACCOUNT`. The deploy jobs run only when all four are set. Login uses GitLab's ID token
(`GITLAB_OIDC_TOKEN`) through Workload Identity Federation; there is no Google key anywhere.

Setting up your own: [docs/setup.md, step 5](../../docs/setup.md#5-google-cloud).
