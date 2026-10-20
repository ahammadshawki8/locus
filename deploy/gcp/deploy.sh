#!/usr/bin/env bash
# Cloud Run steps of the default-branch pipeline (projectLocus.md S.4 step 7; docs/contracts.md §9). Runs in the
# google/cloud-sdk image. Login is keyless: GitLab's ID token GITLAB_OIDC_TOKEN, exchanged through Workload Identity
# Federation for the deploy service account (deploy/gcp/setup.sh). Needs GCP_PROJECT_ID, GCP_REGION, GCP_WIF_PROVIDER,
# GCP_SERVICE_ACCOUNT and CI_PIPELINE_ID. One Cloud Run service, `locus-site`:
#   deploy/gcp/deploy.sh staging   build out/site into a new revision locus-site-p<pipeline id> that gets no traffic,
#                                  tagged `staging`; writes STAGING_URL, REVISION to deploy.env (a dotenv report)
#   deploy/gcp/deploy.sh promote   give production traffic to the revision deploy/gcp/production-revision names, or,
#                                  when it says UNSET, to this pipeline's validated revision; writes PRODUCTION_URL,
#                                  PROMOTED (true when this pipeline's revision now serves production) to promote.env
# The pointer file is how a person or the release guard pins production (rollback); while it names a revision, new
# releases are still built and checked on staging but production stays where the pointer says.
set -euo pipefail

SERVICE="locus-site"
POINTER="deploy/gcp/production-revision"

login() {
  printf '%s' "$GITLAB_OIDC_TOKEN" > .gitlab_oidc_token
  gcloud iam workload-identity-pools create-cred-config "$GCP_WIF_PROVIDER" \
    --service-account="$GCP_SERVICE_ACCOUNT" --credential-source-file=.gitlab_oidc_token \
    --output-file=.gcp_credentials.json --quiet
  gcloud auth login --cred-file=.gcp_credentials.json --quiet
  gcloud config set project "$GCP_PROJECT_ID" --quiet
  gcloud config set run/region "$GCP_REGION" --quiet
}

# When a build fails, Cloud Run only says INTERNAL: print Cloud Build's own log of the newest build into the job log.
build_log() {
  local id
  id="$(gcloud builds list --region "$GCP_REGION" --limit 1 --format='value(id)' 2>/dev/null || true)"
  [ -n "$id" ] || { echo "no Cloud Build found in $GCP_REGION"; return 0; }
  echo "== Cloud Build ${id} (last 60 lines)"
  gcloud builds log "$id" --region "$GCP_REGION" 2>&1 | tail -60 || true
}

service_exists() { gcloud run services describe "$SERVICE" --format='value(metadata.name)' >/dev/null 2>&1; }

staging() {
  local revision="${SERVICE}-p${CI_PIPELINE_ID}"
  local common=(--source out/site --revision-suffix "p${CI_PIPELINE_ID}" --tag staging --allow-unauthenticated
    --min-instances 0 --max-instances 2 --memory 256Mi --cpu 1 --concurrency 80 --port 8080 --quiet
    --labels "managed-by=gitlab-ci,pipeline=p${CI_PIPELINE_ID}")
  if service_exists; then
    gcloud run deploy "$SERVICE" "${common[@]}" --no-traffic || { build_log; exit 1; }
  else
    # Cloud Run cannot create a service with --no-traffic: the first revision serves production at once.
    gcloud run deploy "$SERVICE" "${common[@]}" || { build_log; exit 1; }
  fi
  local url
  url="$(gcloud run services describe "$SERVICE" --format=json \
    | python3 -c 'import json,sys; t=[x for x in json.load(sys.stdin)["status"]["traffic"] if x.get("tag")=="staging"]; print(t[0]["url"])')"
  printf 'STAGING_URL=%s\nREVISION=%s\n' "$url" "$revision" > deploy.env
  echo "deploy-staging: ${revision} at ${url} (no production traffic)"
}

promote() {
  local pinned target
  pinned="$(tr -d '[:space:]' < "$POINTER")"
  if [ "$pinned" = "UNSET" ]; then
    target="${REVISION:?REVISION comes from deploy-staging}"
  else
    target="$pinned"
    echo "promote-production: ${POINTER} pins production to ${pinned}; ${REVISION:-this revision} stays on staging only"
  fi
  gcloud run services update-traffic "$SERVICE" --to-revisions "${target}=100" --quiet
  local url
  url="$(gcloud run services describe "$SERVICE" --format='value(status.url)')"
  printf 'PRODUCTION_URL=%s\nPROMOTED=%s\nPRODUCTION_REVISION=%s\n' "$url" "$([ "$target" = "${REVISION:-}" ] && echo true || echo false)" "$target" > promote.env
  echo "promote-production: ${target} serves 100% of ${url}"
}

case "${1:-}" in
  staging) login; staging ;;
  promote) login; promote ;;
  *) echo "usage: deploy/gcp/deploy.sh staging|promote" >&2; exit 64 ;;
esac
