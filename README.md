# GuardianAngel — Clinical Genomics Intelligence Platform

**GuardianAngel** is an enterprise-grade clinical genetics and hereditary risk intelligence platform designed for precision medicine, pre-marital couple compatibility screening, and multi-generational consanguineous pedigree analysis.

The user interface is faithfully crafted according to the institutional clinical design system in `ui-screen/` with deep Pine (`#0c322c`), vibrant Jungle Green (`#30ba78`), Midnight Navy (`#192072`), and Waterhole Blue (`#2453ff`).

---

## 🌟 Key Features

1. **Secure Login & Minimal Zero-Knowledge Vault Access (`/login`)**:
   - **Clean & Minimal Interface**: Clean dual-panel layout with left Pine brand narrative panel preserved.
   - **Default Sign In**: Quick Fill for `admin` / `admin` with button label **"Sign in"**.
   - **Streamlined Workflow**: Biometric prompts and external SSO buttons removed for a focused, institutional experience.
   - **Create Account Flow with OTP Verification**:
     - Fields: Full Legal Name, Email ID, Password, Date of Birth, Location / City.
     - **Send OTP Feature**: Sends verification code to the entered email (integrated with static testing OTP **`9090`**).
     - Submitting valid OTP (`9090`) registers the user, initializes their zero-knowledge profile with DOB and location, and opens the dashboard.
   - Protected session management with unauthorized access redirection.

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

### 1. Requirements
- Python 3.10+
- Flask & Gunicorn (already installed)

### 2. Quick Start
Run the startup script:
```bash
./run.sh
```

Or run directly with Python:
```bash
python3 app.py
```

Open your browser to:
**[http://127.0.0.1:8080](http://127.0.0.1:8080)**

Sign in with:
- **Username:** `admin`
- **Password:** `admin`

### 3. Running Unit Tests
To verify all routes, database operations, and API endpoints:
```bash
python3 -m unittest tests/test_app.py -v
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

## 📂 Project Directory Structure

```
Guradian-Angel/
├── app.py                     # Main Flask application & clinical API endpoints
├── clinical_engine.py         # Dynamic clinical genetics calculation & dashboard generation engine
├── config.py                  # Application configuration & GCP environment variables
├── database.py                # SQLite schema & persistence (user, pedigree, privacy)
├── gcp_services.py            # GCP Storage (GCS) & Vertex AI (Gemini) integrations
├── Dockerfile                 # Container image for Google Cloud Run
├── .dockerignore              # Docker build exclusions
├── cloudbuild.yaml            # Google Cloud Build deployment pipeline
├── deploy-gcp.sh              # 1-click GCP deployment script
├── run.sh                     # Local development startup script
├── requirements.txt           # Python package dependencies
├── templates/                 # Jinja2 HTML templates matching the UI designs
│   ├── base.html              # Institutional sidebar, topbar, global Add Member modal
│   ├── login.html             # Secure login screen (admin / admin)
│   ├── dashboard.html         # Dynamic Clinical Web Dashboard & Guided Intake Stepper
│   ├── pedigree.html          # Interactive Family Tree Builder & Visualizer
│   ├── risk_analysis.html     # AI Genetic Risk Intelligence
│   ├── couple_assessment.html # Pre-Marital Couple Hereditary Assessment
│   ├── privacy_security.html  # Privacy & Security Center with ZK-Delegations
│   └── profile.html           # Patient Profile & Clinical Demographics
├── tests/
│   └── test_app.py            # Automated test suite (15 tests)
└── ui-screen/                 # Original UI screen designs and prototypes
```

