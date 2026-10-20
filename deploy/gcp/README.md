# deploy/gcp

Cloud Run hosting for the graph library site (staging + production). **Owner: Shawki** (Gates 6b, 9, 5c).

| File | What |
|---|---|
| `setup.sh` | One-time setup, run in Cloud Shell: project, APIs, image repository (keeps the 5 newest images), deploy service account, Workload Identity Federation for GitLab CI (our project's protected `main` only, no key file), 5 USD budget alert. Prints the four `GCP_*` values for `.gitlab-ci.yml` |
| `deploy.sh` | What the CI jobs run: `staging` (new revision `locus-site-p<pipeline>`, no production traffic, tag `staging`) and `promote` (production traffic to that revision, or to the one `production-revision` pins) |
| `production-revision` | GitOps rollback pointer: `UNSET`, or the one Cloud Run revision production must serve (docs/contracts.md §9). Only the release guard (`locus-ops`) and people change it, through an MR |

**Service:** one Cloud Run service `locus-site` in `us-central1`, min instances 0, max 2, 256 MiB: it costs nothing while nobody visits. Staging is the `staging` tag URL of the newest revision; production is the service URL.

**CI variables** (in `.gitlab-ci.yml`, not secrets): `GCP_PROJECT_ID`, `GCP_REGION`, `GCP_WIF_PROVIDER`, `GCP_SERVICE_ACCOUNT`. The deploy jobs run only when all are set. Login uses GitLab's ID token `GITLAB_OIDC_TOKEN`; there is no Google key anywhere.
