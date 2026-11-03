#!/usr/bin/env bash
# ==============================================================================
# GuardianAngel — Google Cloud Platform (GCP) Deployment Script
# Deploys GuardianAngel to Google Cloud Run with optional Google Cloud Storage (GCS)
# ==============================================================================

set -e

# Default settings (override via command line arguments or environment variables)
PROJECT_ID=${GCP_PROJECT_ID:-$(gcloud config get-value project 2>/dev/null || echo "your-gcp-project-id")}
REGION=${GCP_REGION:-"us-central1"}
SERVICE_NAME="guardian-angel"
IMAGE_TAG="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest"

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
echo "==> Enabling GCP APIs (Cloud Run, Cloud Build, Container Registry, Vertex AI)..."
gcloud services enable \
    run.googleapis.com \
    cloudbuild.googleapis.com \
    containerregistry.googleapis.com \
    aiplatform.googleapis.com \
    storage.googleapis.com \
    --project="${PROJECT_ID}"

# Build and Push Image via Google Cloud Build
echo "==> Submitting build to Google Cloud Build..."
gcloud builds submit --tag "${IMAGE_TAG}" --project="${PROJECT_ID}"

# Deploy to Cloud Run
echo "==> Deploying container to Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
    --image="${IMAGE_TAG}" \
    --platform=managed \
    --region="${REGION}" \
    --allow-unauthenticated \
    --port=8080 \
    --memory=1Gi \
    --cpu=1 \
    --set-env-vars="GCP_PROJECT_ID=${PROJECT_ID},GCP_REGION=${REGION}" \
    --project="${PROJECT_ID}"

echo "=================================================================="
echo "  GuardianAngel is successfully deployed to Google Cloud Run!    "
echo "=================================================================="
gcloud run services describe "${SERVICE_NAME}" --platform=managed --region="${REGION}" --format='value(status.url)' --project="${PROJECT_ID}"

