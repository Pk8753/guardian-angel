
<div align="center">
<img src="/static/screen/logo.png" alt="GuardianAngel Logo" width="150" height="150">

<h1>Guardian Angel</h1>
<p><strong>Genomics Intelligence Platform</strong></p>

</div>



**GuardianAngel** is an enterprise-grade clinical genetics and hereditary risk intelligence platform designed for precision medicine, pre-marital couple compatibility screening, and multi-generational consanguineous pedigree analysis..

---

## 🌟 Key Features

1. **Secure Login & Minimal Zero-Knowledge Vault Access (`/login`)**:
   - **Clean & Minimal Interface**: Clean dual-panel layout with left Pine brand narrative panel preserved.

2. **Executive Web Dashboard (`/dashboard`)**:
   - Matches `ui-screen/guardianangel_web_dashboard/`.
   - **92% Completeness Index** radial chart & Proband clinical locus indexing.
   - 4 Live Metric Badges: Pedigree Size, Reported Phenotypes, AI Surveillance Alerts, and Spousal Harmony.
   - 3-Generation Lineage Model interactive preview with consanguinity double-line notations.
   - Action directives for Pre-Marital Gene Panel scheduling & Dr. Alisha Patel genetic consultation booking.
   - Interactive **Ask GenWell AI** assistant with suggested queries and real-time clinical responses.

4. **Reddit-Style Data Hiding & Anonymization Mode**:
   - Every registered user account and family member receives an automated, unique Reddit-style pseudonym/sudo name (e.g. `Silent-Falcon-9214`, `Curious-Cheetah-4921`).
   - **1-Click Data Hiding Toggle**: A prominent security button in the top navigation bar toggles masking on/off across all UI screens (Dashboard, Pedigree Tree, Profile).
   - Allows clinicians or patients to present their clinical pedigree and genomic data without exposing legal identities.
   - Pseudonyms can also be randomized or regenerated on demand from the Profile settings.

5. **New User Zero-Data State & Guided Family Lineage Intake**:
   - **Admin Only Historical Benchmark**: Pre-filled clinical dataset (Tariq Al-Mansoor, 92% completeness, 11-member tree, Beta-Thal & G6PD) is retained exclusively for `admin`.
   - **Blank Slate for New Signups**: When a new patient signs up (`mode: register`), all clinical values start blanked out:
     - **Priority Diagnostic**: Blank with prompt to begin pedigree intake.
     - **Metric Badges**: Pedigree Size (0), Phenotypes (0), AI Surveillance (0), Spousal Harmony (0) prompting to add details.
     - **Guided Intake Stepper**: Prominently guides the user with 1-click modals to input **Father**, **Mother**, and **Sibling** details.
   - **Reactive Dashboard Generation**: As soon as the user enters Father, Mother, or Sibling records:
     - **Completeness Index**: Dynamically calculated (from 0% up to 100%) based on documented relatives and clinical profiles.
     - **Priority Diagnostic**: Calculated from family carrier traits (e.g. Carrier Surveillance Advised or Low Risk).
     - **Pedigree Size & Phenotypes**: Live counts and molecular variant badges.
     - **AI Surveillance Alerts**: Real-time monogenic risk alerts derived from parental and filial concordance.
     - **Lineage Canvas Preview**: Dynamically maps Father, Mother, Siblings, and Proband with relationship lines.

6. **Interactive Family Pedigree Tree Builder (`/pedigree`)**:
   - Matches `ui-screen/interactive_family_tree_builder/`.
   - 3 Generations rendered (Gen I Grandparents, Gen II Parents/Uncles/Aunts, Gen III Proband/Siblings).
   - Interactive SVG connectors with dual consanguinity notation (1st cousins F=0.0625).
   - **Add Family Member Feature**: Interactive modal to record relatives (Tier, Sex, Relationship, Carrier Status, Condition/Locus, Birth Year, Notes) dynamically saved to the database, automatically assigned a Sudo pseudonym, and rendered on the tree!
   - Real-time search filter and Tier filters (All Tiers, Gen I, Gen II, Gen III).
   - Interactive Zoom (In, Out, Fit, Reset) and clinical Dossier Inspector updating on node click.
   - Multi-format Export (Clinical PDF, JSON, and Google Cloud Storage sync).

7. **AI Hereditary Risk Analysis (`/risk-analysis`)**:
   - Matches `ui-screen/ai_hereditary_risk_analysis/`.
   - V-Genomics 4.2 analysis for Beta-Thalassemia Trait (94% match) and G6PD Mediterranean Variant (82% match).
   - Maternal lineage transmission tracking and Offspring Inheritance Punnett Probability distribution.
   - Trigger avoidance checklist (fava beans, primaquine, nitrofurantoin, rasburicase).

8. **Couple Hereditary Assessment (`/couple-assessment`)**:
   - Matches `ui-screen/couple_hereditary_assessment/`.
   - Pre-conception dual-lineage synthesis for Tariq Al-Mansoor & Fatima Al-Zahra.
   - Autosomal recessive concordance and Sanger sequencing protocol status.

9. **Privacy & Security Center (`/privacy-security`)**:
   - Matches `ui-screen/privacy_security_center/`.
   - Active Lineage Delegations with SHA-256 tokens and granular sharing scopes.
   - Zero-Knowledge backup seeds, hardware passkey status, and emergency revocation trigger.

10. **Patient Profile & Demographic Details (`/profile`)**:
   - "User can add their details": Manage legal name, date of birth, blood group, phone, address, consanguinity lineage degree, phenotypic medical notes, emergency surrogate, and Sudo pseudonym.

---

## 🚀 Running on Local Machine

The platform is divided into two dedicated components:
- **`backend/`**: Headless Python / Flask REST API (Port 5000)
- **`frontend/`**: Next.js (App Router) + TypeScript (strict) + Tailwind CSS + Custom SVG Pedigree Engine (Port 3000)

---

### 📋 Prerequisites
- **Node.js**: v18.17+ or v20+ (tested up to v26)
- **Python**: 3.10+
- **npm** (comes with Node.js)

---

### Step 1: Start the Backend REST API (Port 5000)

1. Open a terminal and navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the Flask API server:
   ```bash
   python3 app.py
   ```
   *The backend REST API runs on **`http://127.0.0.1:5000`**.*

---

### Step 2: Start the Next.js Frontend (Port 3000)

1. Open a second terminal and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Generate Prisma ORM client:
   ```bash
   npx prisma generate
   ```
4. Start the Next.js development server:
   ```bash
   npm run dev
   ```
5. Open your web browser to:
   **[http://localhost:3000](http://localhost:3000)**

---

### 🔑 Authentication & Login Credentials

- **First-Page Protection**: Visiting `http://localhost:3000` or any protected URL without a session automatically redirects to `http://localhost:3000/login`.
- **Default Accounts**:
  - **Admin**: Username: `admin` | Password: `admin`
  - **Standard User**: Username: `user` | Password: `user`
- **Register a New Account**:
  - Click the **"Create Account"** tab on `/login`.
  - Enter details (First name, Last name, Username, DOB, Email, Location, Password).
  - Use testing verification OTP: **`9090`**.
  - Sign in with your new credentials.

---

### 🧪 Running Test Suites

#### 1. Backend REST API Tests:
```bash
python3 -m unittest discover tests -v
```
*(All 17 tests verify health checks, authentication, OTP, multi-family pedigree engine, and condition catalog)*

#### 2. Frontend Production Build & Typecheck:
```bash
cd frontend
npm run build
```

---

## ☁️ Deploying on Google Cloud Platform (GCP)

GuardianAngel is containerized and engineered to run seamlessly on **Google Cloud Run**, with integrations for **Google Cloud Storage (GCS)** and **Google Cloud Vertex AI**.

### Architecture on GCP
- **Compute:** [Google Cloud Run](https://cloud.google.com/run) (Serverless container deployment with auto-scaling to zero)
- **Object Storage:** [Google Cloud Storage](https://cloud.google.com/storage) (Secure storage of encrypted pedigree exports and lab VCFs)
- **AI Intelligence:** [Google Vertex AI](https://cloud.google.com/vertex-ai) (Gemini 1.5 Flash for the GenWell AI clinical genomics assistant)
- **CI/CD:** [Google Cloud Build](https://cloud.google.com/build) (Automated container builds using `cloudbuild.yaml`)

### Option A: One-Command Automated Deployment (`deploy-gcp.sh`)
Ensure the Google Cloud SDK (`gcloud`) is installed and authenticated:
```bash
# 1. Authenticate with GCP
gcloud auth login

# 2. Set your GCP project
gcloud config set project YOUR_PROJECT_ID

# 3. Run the automated deployment script
./deploy-gcp.sh
```

### Option B: Manual Cloud Run Deploy
```bash
# Build and deploy directly with Google Cloud Run
gcloud run deploy guardian-angel \
    --source . \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --port 8080 \
    --set-env-vars "GCP_PROJECT_ID=YOUR_PROJECT_ID,GCS_BUCKET_NAME=your-genomic-bucket"
```

### Option C: Using Google Cloud Build
```bash
gcloud builds submit --config=cloudbuild.yaml
```

---

## 🧠 Air-Gapped / Offline AI Stack: Qwen3, BAAI BGE-M3 & Qdrant

GuardianAngel supports 100% offline and air-gapped operations using a 3-tier local AI architecture:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        GUARDIANANGEL AIR-GAP STACK                     │
├────────────────────────────────────────────────────────────────────────┤
│  1. QWEN3 (The Brain)          │ LLM for medical reasoning, medical    │
│     http://127.0.0.1:11434      │ report explanations, compassionate    │
│     (qwen2.5 / qwen3)          │ couple assessments & healthcare chat  │
├────────────────────────────────┼───────────────────────────────────────┤
│  2. BAAI BGE-M3 (Search Intel) │ 1024-D multilingual dense vector      │
│     http://127.0.0.1:11434      │ embedding model for PDF/image chunks  │
│     (bge-m3)                   │ and user inquiries                    │
├────────────────────────────────┼───────────────────────────────────────┤
│  3. QDRANT (Vector Storage)    │ Vector database storing policy chunks │
│     http://127.0.0.1:6333      │ and performing cosine similarity      │
│     (Collection: health_policies)                                      │
└────────────────────────────────────────────────────────────────────────┘
```

### 1. Single-Command Docker Setup (Recommended)

Run Qdrant, Ollama, and auto-download both models with a single command without installing anything on your host machine:

```bash
# Start Qdrant, Ollama, and automatically pull Qwen2.5 and BGE-M3 models:
docker compose -f docker-compose.ai.yml up -d

# Check status:
docker compose -f docker-compose.ai.yml ps

# Stop everything cleanly when done:
docker compose -f docker-compose.ai.yml down
```

### 2. Manual Setup (Alternative)

If running outside Docker:
- **Qdrant**: `docker run -d -p 6333:6333 -p 6334:6334 -v $(pwd)/data/qdrant_storage:/qdrant/storage:z qdrant/qdrant:latest`
- **Ollama**: Install from [ollama.com](https://ollama.com/), run `ollama serve`, and pull models with `ollama pull qwen2.5:latest` and `ollama pull bge-m3`.

### 3. Environment Variables Configuration

Configure the endpoints in your `.env` file or export them before running `./run.sh`:

```bash
# 1. Qwen3 - The Brain
export QWEN_API_BASE="http://127.0.0.1:11434"
export QWEN_MODEL_NAME="qwen2.5:latest"      # or "qwen3"
export QWEN_TIMEOUT=45

# 2. BAAI BGE-M3 - The Search Intelligence
export BGE_M3_API_BASE="http://127.0.0.1:11434"
export BGE_M3_MODEL_NAME="bge-m3"
export BGE_M3_DIMENSION=1024

# 3. Qdrant - The Vector Storage
export QDRANT_URL="http://127.0.0.1:6333"
export QDRANT_COLLECTION="health_policies"
export QDRANT_API_KEY=""                     # Optional if Qdrant requires an API key
```

### 4. Uploading Nationwide Health Policy Documents & Interacting via Vector DB

1. **Accessing Settings**:
   - **Left-hand side menu (Sidebar)**: Click the **Settings** button with gear logo located directly above the Sign Out button.
   - **Top-right corner User Profile (Navbar)**: Click your profile avatar to open the menu, then click **Settings** (with gear logo) located directly above Sign Out.
2. **Uploading Policy Documents**:
   - In the Settings window, drag and drop or select multiple policy documents (PDF, JPG, PNG).
   - Documents are automatically chunked, embedded via **BGE-M3**, and stored in **Qdrant**.
   - View your indexed documents, chunk counts, and manage/purge records.
3. **Interacting with Policy Knowledge**:
   - **Ask Care AI (`/dashboard`)**: Ask questions about screening center locations, eligibility rules, and protocols. Qwen3 retrieves semantic context from Qdrant and cites relevant documents.
   - **AI Genetic Intelligence (`/risk-analysis`)**: Qwen3 analyzes uploaded screening reports and performs couple assessments with a positive, motivating vibe, detailing next possible steps and interactive Q&A.
   - **Couple Assessment (`/couple-assessment`)**: Review pre-conception compatibility guidance, next steps, and ask follow-up questions.

### 5. Embedded In-Process Architecture (Zero-Docker / Standalone Air-Gap)

GuardianAngel features a self-contained **Embedded In-Process AI Stack** that requires zero Docker daemon and zero external background processes:
- **Embedded Dense Vectorizer**: Generates 1024-dimensional normalized dense vectors directly in-process via NumPy.
- **Embedded Persistent Vector DB**: Stores document text chunks and vector embeddings permanently in SQLite (`policy_chunks`) and local memory cache with hybrid semantic cosine and lexical scoring.
- **Embedded Clinical Reasoning Brain**: Directly parses, quotes, and synthesizes answers from retrieved PDF passages, citing exact clauses, titles, and match confidence scores.
- **Zero Data Leakage**: All patient data and health policy embeddings remain 100% confined to the local machine process.
- **Optional Hybrid Scaling**: If external Ollama (Qwen3 / BGE-M3) or Qdrant server is running, the system automatically discovers and switches to high-throughput daemon endpoints.

---

## 📂 Project Directory Structure

```
Guradian-Angel/
├── backend/                             # Headless Flask REST API server
│   ├── app.py                           # Clinical & pedigree REST API endpoints
│   ├── clinical_engine.py               # Bayesian carrier & inbreeding (F-calc) engine
│   ├── config.py                        # Backend configuration & environment settings
│   ├── database.py                      # SQLite database layer with multi-family support
│   ├── gcp_services.py                  # GCP Cloud Storage & Vertex AI integrations
│   ├── requirements.txt                 # Python dependencies
│   ├── run.sh                           # Backend startup script
│   └── tests/                           # Backend unit test suite
│
├── frontend/                            # Next.js App Router (TypeScript + Tailwind)
│   ├── package.json                     # Frontend dependencies & scripts
│   ├── tsconfig.json                    # Strict TypeScript configuration
│   ├── tailwind.config.js               # Clinical theme tokens & colors
│   ├── next.config.js                   # API Proxy to backend (http://127.0.0.1:5000)
│   ├── prisma/                          # Prisma ORM schema
│   └── src/
│       ├── middleware.ts                # Next.js Edge route guard (forces /login first)
│       ├── app/
│       │   ├── page.tsx                 # Root redirect to /login
│       │   ├── login/page.tsx           # Clean login & registration view
│       │   ├── dashboard/page.tsx       # Clinical web dashboard matching UI screen
│       │   ├── pedigree/page.tsx        # Layered SVG pedigree tree editor
│       │   ├── pedigree/share/[token]/  # Public de-identified read-only viewer
│       │   ├── couple-assessment/       # Dual-lineage comparative synthesis (F=0.0625)
│       │   ├── risk-analysis/           # ACMG monogenic variant risk intelligence
│       │   ├── privacy-security/        # Sudo de-identification & 256-bit AES vault
│       │   └── profile/                 # Patient clinical demographics
│       └── components/
│           ├── layout/                  # Sidebar, Navbar, and AuthGuard
│           └── pedigree/                # Custom SVG layoutEngine, PedigreeCanvas, Modals
│
├── tests/                               # Root test suite runner
│   ├── test_api.py                      # REST API test cases
│   └── test_pedigree_engine.py          # Pedigree engine & multi-family test cases
│
└── ui-screen/                           # UI screen designs and visual templates
```

