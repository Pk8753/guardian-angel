# Guardian Angel — Google Cloud Platform (GCP) Deployment Guide

This guide provides end-to-end instructions for deploying the **Guardian Angel** clinical genomics platform to Google Cloud Platform with a public, shareable HTTPS URL (`https://...a.run.app`).

---

## Architecture Overview

```
                       [ User / Browser ]
                               |
                               v
            +--------------------------------------+
            |    Frontend: Next.js (Cloud Run)     |
            |   (Hosts Dantora animation & UI)     |
            +--------------------------------------+
                               |
                        /api/* rewrites
                               v
            +--------------------------------------+
            |     Backend API: Flask (Cloud Run)   |
            |     (Risk Engine, Auth, Pedigree)    |
            +--------------------------------------+
                    |                      |
                    v                      v
       [ Cloud Storage (GCS) ]    [ Cloud SQL / SQLite ]
        (Genomic files & PDFs)       (Patient Vault DB)
```

* **Frontend:** Next.js 14 App Router, Tailwind CSS, TypeScript, and the Dantora interactive chromosome animation containerized on **Cloud Run**.
* **Backend API:** Python Flask, Clinical Genomics Risk Engine, and Gunicorn on **Cloud Run**.
* **Storage:** Google Cloud Storage (GCS) for patient reports, pedigree PDFs, and genomic screening files.
* **Security:** Google Cloud Secret Manager for UAE PASS secrets and encryption keys.
* **Cost:** Cloud Run scales to zero instances when idle ($0 cost when not accessed) and includes 2 million free requests per month.

---

## Prerequisites

1. **Google Cloud SDK (`gcloud`)**:
   ```bash
   # macOS via Homebrew
   brew install google-cloud-sdk
   ```
2. **Authenticate with GCP**:
   ```bash
   gcloud auth login
   gcloud auth configure-docker
   ```
3. A Google Cloud project with billing enabled.

---

## Step 1: Set Up GCP Project & Enable APIs

Set environment variables and enable the necessary GCP services:

```bash
export PROJECT_ID="your-gcp-project-id"   # Replace with your GCP project ID
export REGION="us-central1"                # Or me-central1 (Doha), europe-west1, etc.

gcloud config set project "${PROJECT_ID}"

# Enable Cloud Run, Cloud Build, Artifact Registry, and Cloud Storage APIs
gcloud services enable \
    run.googleapis.com \
    cloudbuild.googleapis.com \
    artifactregistry.googleapis.com \
    storage.googleapis.com \
    secretmanager.googleapis.com \
    --project="${PROJECT_ID}"
```

---

## Step 2: Create a Cloud Storage (GCS) Bucket

Create a private GCS bucket for clinical files, exports, and genomic screening datasets:

```bash
export BUCKET_NAME="${PROJECT_ID}-clinical-vault"

gcloud storage buckets create "gs://${BUCKET_NAME}" \
    --location="${REGION}" \
    --uniform-bucket-level-access \
    --project="${PROJECT_ID}"
```

---

## Step 3: Deploy the Backend API (Flask) to Cloud Run

### 1. Create an Artifact Registry Docker Repository
```bash
gcloud artifacts repositories create guardian-repo \
    --repository-format=docker \
    --location="${REGION}" \
    --description="Docker repository for Guardian Angel images" \
    --project="${PROJECT_ID}"
```

### 2. Build & Submit Backend Image via Cloud Build
The project root already includes a production `Dockerfile`:

```bash
gcloud builds submit \
    --tag "${REGION}-docker.pkg.dev/${PROJECT_ID}/guardian-repo/guardian-backend:latest" \
    --project="${PROJECT_ID}" \
    .
```

### 3. Deploy Backend to Cloud Run
```bash
gcloud run deploy guardian-angel-api \
    --image="${REGION}-docker.pkg.dev/${PROJECT_ID}/guardian-repo/guardian-backend:latest" \
    --platform=managed \
    --region="${REGION}" \
    --allow-unauthenticated \
    --port=8080 \
    --memory=1Gi \
    --cpu=1 \
    --set-env-vars="GCP_PROJECT_ID=${PROJECT_ID},GCS_BUCKET_NAME=${BUCKET_NAME},FLASK_ENV=production" \
    --project="${PROJECT_ID}"
```

### 4. Capture the Backend URL
```bash
export BACKEND_URL=$(gcloud run services describe guardian-angel-api --region="${REGION}" --project="${PROJECT_ID}" --format='value(status.url)')
echo "Backend API live at: ${BACKEND_URL}"
```

---

## Step 4: Deploy the Frontend (Next.js with Dantora Animation)

### 1. Create `frontend/Dockerfile`
Create `frontend/Dockerfile` for building the production Next.js container:

```dockerfile
# Multi-stage Next.js Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
```

### 2. Build and Deploy Next.js to Cloud Run
```bash
cd frontend

# Submit frontend image to Cloud Build
gcloud builds submit \
    --tag "${REGION}-docker.pkg.dev/${PROJECT_ID}/guardian-repo/guardian-frontend:latest" \
    --project="${PROJECT_ID}" \
    .

# Deploy Frontend to Cloud Run
gcloud run deploy guardian-angel-web \
    --image="${REGION}-docker.pkg.dev/${PROJECT_ID}/guardian-repo/guardian-frontend:latest" \
    --platform=managed \
    --region="${REGION}" \
    --allow-unauthenticated \
    --port=3000 \
    --memory=1Gi \
    --cpu=1 \
    --set-env-vars="BACKEND_PORT=8080,NEXT_PUBLIC_API_URL=${BACKEND_URL}" \
    --project="${PROJECT_ID}"

cd ..
```

---

## Step 5: Access Your Shareable Public URL

Retrieve the live frontend URL:

```bash
gcloud run services describe guardian-angel-web \
    --region="${REGION}" \
    --project="${PROJECT_ID}" \
    --format='value(status.url)'
```

This returns your shareable HTTPS link:
```text
https://guardian-angel-web-xyz123-uc.a.run.app
```

---

## Alternative: Deploy Frontend via Firebase Hosting

If you prefer custom domain routing through Firebase Hosting (`*.web.app`):

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   firebase login
   ```
2. **Initialize in `frontend/`**:
   ```bash
   cd frontend
   firebase init hosting
   ```
3. **Configure Rewrites in `firebase.json`**:
   ```json
   {
     "hosting": {
       "public": "out",
       "rewrites": [
         {
           "source": "/api/**",
           "run": {
             "serviceId": "guardian-angel-api",
             "region": "us-central1"
           }
         }
       ]
     }
   }
   ```
4. **Deploy**:
   ```bash
   firebase deploy --only hosting
   ```

---

## Health Check & Verification

* **Backend Health**: `curl https://<backend-url>/healthz` (should return HTTP 200).
* **Frontend Landing Page**: Visit the public Cloud Run URL in any browser to verify:
  * The Hero section renders the 3D diagonal Dantora chromosome animation.
  * The multicolor circular bokeh discs (80% green, 15% blue, 5% orange) drift around the helix.
  * Interactive cursor parting wake works smoothly.
  * Form submissions and UAE PASS buttons function properly.
