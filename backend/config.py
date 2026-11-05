import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'guardian-angel-clinical-jwt-secret-2026-e2ee')
    PORT = int(os.environ.get('PORT', 8080))
    DEBUG = os.environ.get('FLASK_DEBUG', 'False').lower() in ('true', '1', 't')
    
    # GCP Configuration
    GCP_PROJECT_ID = os.environ.get('GCP_PROJECT_ID', os.environ.get('GOOGLE_CLOUD_PROJECT', 'guardian-angel-health'))
    GCP_REGION = os.environ.get('GCP_REGION', 'us-central1')
    GCS_BUCKET_NAME = os.environ.get('GCS_BUCKET_NAME', '')
    VERTEX_AI_LOCATION = os.environ.get('VERTEX_AI_LOCATION', 'us-central1')
    
    # Database Configuration (SQLite local, Cloud SQL compatible)
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    DATA_DIR = os.path.join(BASE_DIR, 'data')
    DATABASE_PATH = os.path.join(DATA_DIR, 'guardian_angel.db')
    
    # Default Admin Credentials
    ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME', 'admin')
    ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin')
    ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@guardianangel.bio')

