#!/usr/bin/env bash
# ==============================================================================
# GuardianAngel — Google Cloud Platform (GCP) Deployment Script
# Deploys GuardianAngel Backend and Frontend to Google Cloud Run
# ==============================================================================

set -e

# Default settings (override via command line arguments or environment variables)
PROJECT_ID=${GCP_PROJECT_ID:-$(gcloud config get-value project 2>/dev/null || echo "your-gcp-project-id")}
REGION=${GCP_REGION:-"us-central1"}
SERVICE_NAME="guardian-angel"
IMAGE_TAG="${REGION}-docker.pkg.dev/${PROJECT_ID}/guardian-repo/${SERVICE_NAME}:latest"
BUCKET_NAME="${PROJECT_ID}-clinical-vault"

echo "=================================================================="
echo "  Deploying GuardianAngel to Google Cloud Platform (Cloud Run)   "
echo "=================================================================="
echo "GCP Project ID: ${PROJECT_ID}"
echo "GCP Region:     ${REGION}"
echo "Service Name:   ${SERVICE_NAME}"
echo "Target Image:   ${IMAGE_TAG}"
echo "=================================================================="

# Check for gcloud CLI
if ! command -v gcloud &> /dev/null; then
    echo "Error: Google Cloud SDK (gcloud) is not installed or not in PATH."
    echo "Install it via: brew install google-cloud-sdk"
    exit 1
fi

# Enable necessary Google Cloud APIs
echo "==> Enabling GCP APIs (Cloud Run, Cloud Build, Artifact Registry, Vertex AI)..."
gcloud services enable \
    run.googleapis.com \
    cloudbuild.googleapis.com \
    artifactregistry.googleapis.com \
    aiplatform.googleapis.com \
    storage.googleapis.com \
    --project="${PROJECT_ID}"

# Build and Push Backend Image via Google Cloud Build
echo "==> Submitting backend build to Google Cloud Build..."
gcloud builds submit --tag "${IMAGE_TAG}" --project="${PROJECT_ID}"

# Deploy Backend to Cloud Run
echo "==> Deploying backend container to Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
    --image="${IMAGE_TAG}" \
    --platform=managed \
    --region="${REGION}" \
    --allow-unauthenticated \
    --port=8080 \
    --memory=1Gi \
    --cpu=1 \
    --set-env-vars="GCP_PROJECT_ID=${PROJECT_ID},GCP_REGION=${REGION},GCS_BUCKET_NAME=${BUCKET_NAME},FLASK_ENV=production" \
    --project="${PROJECT_ID}"

BACKEND_LIVE_URL=$(gcloud run services describe "${SERVICE_NAME}" --platform=managed --region="${REGION}" --format='value(status.url)' --project="${PROJECT_ID}")
echo "==> Backend live at: ${BACKEND_LIVE_URL}"

# Build and Deploy Frontend (Next.js) to Cloud Run
FRONTEND_SERVICE_NAME="guardian-angel-web"
FRONTEND_IMAGE_TAG="${REGION}-docker.pkg.dev/${PROJECT_ID}/guardian-repo/${FRONTEND_SERVICE_NAME}:latest"

echo "==> Submitting frontend build to Google Cloud Build..."
gcloud builds submit \
    --tag "${FRONTEND_IMAGE_TAG}" \
    --project="${PROJECT_ID}" \
    frontend

echo "==> Deploying frontend container to Cloud Run..."
gcloud run deploy "${FRONTEND_SERVICE_NAME}" \
    --image="${FRONTEND_IMAGE_TAG}" \
    --platform=managed \
    --region="${REGION}" \
    --allow-unauthenticated \
    --port=3000 \
    --memory=1Gi \
    --cpu=1 \
    --set-env-vars="BACKEND_PORT=8080,NEXT_PUBLIC_API_URL=${BACKEND_LIVE_URL},BACKEND_URL=${BACKEND_LIVE_URL}" \
    --project="${PROJECT_ID}"

FRONTEND_LIVE_URL=$(gcloud run services describe "${FRONTEND_SERVICE_NAME}" --platform=managed --region="${REGION}" --format='value(status.url)' --project="${PROJECT_ID}")

echo "=================================================================="
echo "  GuardianAngel is successfully deployed to Google Cloud Run!    "
echo "=================================================================="
echo "  Backend API:  ${BACKEND_LIVE_URL}"
echo "  Web Frontend: ${FRONTEND_LIVE_URL}"
echo "=================================================================="
