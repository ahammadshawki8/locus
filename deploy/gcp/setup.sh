#!/usr/bin/env bash
# One-time Google Cloud setup for Locus (Gate 6b). Run it in Cloud Shell (https://shell.cloud.google.com) as the
# billing account's owner:
#   bash setup.sh <new-project-id> <billing-account-id>
# The billing account id looks like 0X0X0X-0X0X0X-0X0X0X (Billing > Overview, or `gcloud billing accounts list`).
# It is safe to run again: every step skips what already exists.
#
# What it makes:
#   - a project linked to the billing account, with Cloud Run, Cloud Build and Artifact Registry turned on
#   - a deploy service account that GitLab CI uses through Workload Identity Federation: no key file exists anywhere.
#     Only pipelines of our team project on its protected main branch can use it (the attribute condition below).
#   - a 5 USD monthly budget that emails the billing admins at 50%, 90% and 100%
# At the end it prints the four values for .gitlab-ci.yml (none of them is a secret).
set -euo pipefail

PROJECT_ID="${1:?usage: bash setup.sh <new-project-id> <billing-account-id>}"
BILLING="${2:?usage: bash setup.sh <new-project-id> <billing-account-id>}"
REGION="us-central1"
GITLAB_PROJECT="gitlab-ai-hackathon/transcend-october-2026/43384339/showcase"
POOL="gitlab"
PROVIDER="gitlab-com"
SA_NAME="locus-deploy"
SA="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

step() { printf '\n== %s\n' "$*"; }

step "Project ${PROJECT_ID}"
gcloud projects describe "$PROJECT_ID" >/dev/null 2>&1 || gcloud projects create "$PROJECT_ID" --name="Locus"
gcloud billing projects link "$PROJECT_ID" --billing-account="$BILLING"
gcloud config set project "$PROJECT_ID"
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"

step "APIs"
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com \
  iam.googleapis.com iamcredentials.googleapis.com sts.googleapis.com billingbudgets.googleapis.com

step "Artifact Registry repository for the site's container (used by gcloud run deploy --source)"
gcloud artifacts repositories describe cloud-run-source-deploy --location="$REGION" >/dev/null 2>&1 || \
  gcloud artifacts repositories create cloud-run-source-deploy --repository-format=docker --location="$REGION" \
    --description="Locus site images"
# keep storage inside the free 0.5 GB: only the 5 newest images stay
cat > /tmp/locus-cleanup.json <<'EOF'
[{"name": "keep-5-newest", "action": {"type": "Keep"}, "mostRecentVersions": {"keepCount": 5}},
 {"name": "delete-older", "action": {"type": "Delete"}, "condition": {"tagState": "any"}}]
EOF
gcloud artifacts repositories set-cleanup-policies cloud-run-source-deploy --location="$REGION" \
  --policy=/tmp/locus-cleanup.json --no-dry-run

step "Deploy service account ${SA}"
gcloud iam service-accounts describe "$SA" >/dev/null 2>&1 || \
  gcloud iam service-accounts create "$SA_NAME" --display-name="Locus deploy (GitLab CI)"
for role in roles/run.admin roles/cloudbuild.builds.editor roles/storage.admin roles/artifactregistry.writer \
  roles/serviceusage.serviceUsageConsumer roles/logging.viewer; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:${SA}" --role="$role" \
    --condition=None --quiet >/dev/null
done
# Cloud Run runs the site as the default compute service account; the deployer must be allowed to act as it,
# and Cloud Build builds the image as it.
COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
gcloud iam service-accounts add-iam-policy-binding "$COMPUTE_SA" --member="serviceAccount:${SA}" \
  --role=roles/iam.serviceAccountUser --quiet >/dev/null
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:${COMPUTE_SA}" \
  --role=roles/run.builder --condition=None --quiet >/dev/null

step "Workload Identity Federation: GitLab.com, our project, protected main only"
gcloud iam workload-identity-pools describe "$POOL" --location=global >/dev/null 2>&1 || \
  gcloud iam workload-identity-pools create "$POOL" --location=global --display-name="GitLab"
CONDITION="assertion.project_path == '${GITLAB_PROJECT}' && assertion.ref == 'main' && assertion.ref_type == 'branch' && assertion.ref_protected == 'true'"
if gcloud iam workload-identity-pools providers describe "$PROVIDER" --location=global --workload-identity-pool="$POOL" >/dev/null 2>&1; then
  gcloud iam workload-identity-pools providers update-oidc "$PROVIDER" --location=global --workload-identity-pool="$POOL" \
    --attribute-condition="$CONDITION"
else
  gcloud iam workload-identity-pools providers create-oidc "$PROVIDER" --location=global --workload-identity-pool="$POOL" \
    --issuer-uri="https://gitlab.com" \
    --attribute-mapping="google.subject=assertion.sub,attribute.project_path=assertion.project_path,attribute.ref=assertion.ref" \
    --attribute-condition="$CONDITION"
fi
POOL_ID="projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL}"
gcloud iam service-accounts add-iam-policy-binding "$SA" --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/${POOL_ID}/attribute.project_path/${GITLAB_PROJECT}" --quiet >/dev/null

step "Budget: 5 USD a month, alerts at 50%, 90%, 100%"
if ! gcloud billing budgets list --billing-account="$BILLING" --format='value(displayName)' | grep -qx "Locus"; then
  gcloud billing budgets create --billing-account="$BILLING" --display-name="Locus" --budget-amount=5USD \
    --filter-projects="projects/${PROJECT_ID}" \
    --threshold-rule=percent=0.5 --threshold-rule=percent=0.9 --threshold-rule=percent=1.0
fi

step "Done. Put these in .gitlab-ci.yml (variables:); none is a secret:"
cat <<EOF
  GCP_PROJECT_ID: "${PROJECT_ID}"
  GCP_REGION: "${REGION}"
  GCP_WIF_PROVIDER: "${POOL_ID}/providers/${PROVIDER}"
  GCP_SERVICE_ACCOUNT: "${SA}"
EOF
