<div align="center">
<img src="/static/screen/logo.png" alt="GuardianAngel Logo" width="150" height="150">

# GuardianAngel
**Enterprise Clinical Genomics & Hereditary Risk Intelligence Platform**

</div>

**GuardianAngel** is an enterprise-grade clinical genetics and hereditary risk intelligence platform designed for precision medicine, pre-marital couple compatibility screening, and multi-generational consanguineous pedigree analysis.

<img width="1414" height="814" alt="Screenshot 2026-11-20 at 11 54 22 AM" src="https://github.com/user-attachments/assets/10540363-2455-4fb4-9f19-3c828913052d" />

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
- **AI Intelligence:** [Google Vertex AI](https://cloud.google.com/vertex-ai) (Gemini 1.5 / 2.5 Flash for the Care AI clinical genomics assistant)
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

## 🧠 Air-Gapped / Offline AI Stack vs Online Mode with Gemini Key

GuardianAngel supports a **Dual-Mode AI Architecture**, allowing healthcare institutions to run fully connected in the cloud or in complete air-gapped isolation with zero data egress.

| Dimension | 🌐 Online Cloud Mode (Gemini) | 🔒 Air-Gapped / Offline Mode |
| :--- | :--- | :--- |
| **Primary Intelligence Brain** | Google Gemini Studio / Vertex AI (`gemini-2.5-flash`, `gemini-3.x`) | Local Qwen2.5 / Qwen3 via Ollama OR Embedded In-Process Engine |
| **Embeddings Model** | Gemini Multimodal Embeddings | BAAI BGE-M3 (1024-D) OR In-Process Dense Vectorizer |
| **Vector Storage** | Persistent Vector Store / Cloud-backed Cache | Qdrant (`http://127.0.0.1:6333`) OR Embedded SQLite Cache |
| **Network Egress** | Requires outbound internet to Google APIs | **Zero network egress (100% offline air-gap)** |
| **Compliance Level** | HIPAA-eligible enterprise cloud | Military / Hospital On-Premises Air-Gap |
| **Setup Complexity** | Zero local setup (provide `GEMINI_API_KEY`) | Single-command Docker Compose OR standalone in-process |

---

### 1. Online Mode with Google Gemini API Key

To enable Google Gemini for Ask Care AI, medical report synthesis, and couple genetics reasoning:

1. Obtain an API key from [Google AI Studio](https://aistudio.google.com/).
2. Export the key before launching the backend:
   ```bash
   export GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere..."
   ```
3. Start or restart the backend:
   ```bash
   python3 app.py
   ```
4. **Features Unlocked in Online Mode**:
   - Access to `gemini-2.5-flash`, `gemini-3.0-flash`, and `gemini-3.1-pro-preview`.
   - Multimodal analysis of screening reports and pedigree structures.
   - Low-latency conversational answers with semantic RAG grounding.

---

### 2. Air-Gapped / Offline AI Stack (Zero Network Egress)

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

#### Option A: Single-Command Docker Setup (Recommended)

Run Qdrant, Ollama, and auto-download local models with one command:

```bash
# Start Qdrant, Ollama, and automatically pull Qwen2.5 and BGE-M3 models:
docker compose -f docker-compose.ai.yml up -d

# Check operational status:
docker compose -f docker-compose.ai.yml ps

# Stop the stack when done:
docker compose -f docker-compose.ai.yml down
```

Configure endpoints in `.env` or export before starting the backend:
```bash
# 1. Qwen LLM Brain
export QWEN_API_BASE="http://127.0.0.1:11434"
export QWEN_MODEL_NAME="qwen2.5:latest"      # or "qwen3"
export QWEN_TIMEOUT=45

# 2. BAAI BGE-M3 Semantic Search Embeddings
export BGE_M3_API_BASE="http://127.0.0.1:11434"
export BGE_M3_MODEL_NAME="bge-m3"
export BGE_M3_DIMENSION=1024

# 3. Qdrant Vector Storage
export QDRANT_URL="http://127.0.0.1:6333"
export QDRANT_COLLECTION="health_policies"
export QDRANT_API_KEY=""                     # Optional if Qdrant requires an API key
```

If running without Docker Compose, manual endpoints are supported:
- **Qdrant**: `docker run -d -p 6333:6333 -p 6334:6334 -v $(pwd)/data/qdrant_storage:/qdrant/storage:z qdrant/qdrant:latest`
- **Ollama**: Install from [ollama.com](https://ollama.com/), run `ollama serve`, and pull models with `ollama pull qwen2.5:latest` and `ollama pull bge-m3`.

#### Option B: Embedded In-Process Zero-Docker Engine (Zero Daemons Required)

GuardianAngel features a self-contained **Embedded In-Process AI Stack** that requires zero Docker daemon and zero external background processes:
- **In-Process Dense Vectorizer**: Generates 1024-dimensional normalized dense vectors directly in-process using NumPy.
- **Embedded Persistent Vector DB**: Stores document text chunks and vector embeddings permanently in SQLite (`policy_chunks`) and local memory cache with hybrid semantic cosine and lexical scoring.
- **Embedded Clinical Reasoning Brain**: Directly parses, quotes, and synthesizes answers from retrieved PDF passages, citing exact clauses, titles, and match confidence scores without external API calls.
- **Zero Data Leakage**: All patient data and health policy embeddings remain 100% confined to the local machine process.
- **Optional Hybrid Scaling**: If external Ollama (Qwen3 / BGE-M3) or Qdrant server is running, the system automatically discovers and switches to high-throughput daemon endpoints.

---

### 3. Uploading Nationwide Health Policy Documents & Interacting via Vector DB

1. **Accessing Settings**:
   - **Left-hand side menu (Sidebar)**: Click the **Settings** button with gear logo located directly above the Sign Out button.
   - **Top-right corner User Profile (Navbar)**: Click your profile avatar to open the menu, then click **Settings** (with gear logo) located directly above Sign Out.
2. **Uploading Policy Documents**:
   - In the Settings window, drag and drop or select multiple policy documents (PDF, JPG, PNG).
   - Documents are automatically chunked, embedded via **BGE-M3**, and stored in **Qdrant**.
   - View your indexed documents, chunk counts, and manage/purge records.
3. **Interacting with Policy Knowledge**:
   - **Ask Care AI (`/dashboard`)**: Ask questions about screening center locations, eligibility rules, and protocols. The AI retrieves semantic context from the vector database and cites relevant documents.
   - **AI Genetic Intelligence (`/risk-analysis`)**: Analyzes uploaded screening reports and performs couple assessments detailing next possible steps and interactive Q&A.
   - **Couple Assessment (`/couple-assessment`)**: Review pre-conception compatibility guidance, next steps, and ask follow-up questions.

---

## 🔒 Security & Privacy Architecture
- **Zero-Knowledge Encryption**: Patient health data and genomic dossiers are isolated using 256-bit AES encryption.
- **Sudo Pseudonymization**: Automatically replaces patient identifying details with institutional pseudonyms during pedigree generation and clinical sharing.
- **Air-Gapped Operation**: Full compliance with sensitive healthcare guidelines requiring zero external network transmission.
