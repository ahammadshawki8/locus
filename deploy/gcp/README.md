# deploy/gcp

Cloud Run hosting for the graph library site (staging + production). **Owner: Shawki** (Gates 6b, 9, 5c).

| File | What |
|---|---|
| `production-revision` | GitOps rollback pointer: one line, the Cloud Run revision that gets 100% of production traffic, or `UNSET` (docs/contracts.md §7). Only `locus-release-guard` and humans may change it. |
| _to add_ | Cloud Run service config for staging and production (min instances 0), budget alert notes |

CI variable **names** go here once they exist. Never commit values.
