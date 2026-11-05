import os

def _resolve_paths():
    """
    Enterprise-grade canonical path resolution for BASE_DIR, DATA_DIR, and DATABASE_PATH.
    Guarantees a single source of truth whether invoked from repo root, backend/,
    subdirectories, or inside Docker containers, with 12-factor environment variable overrides.
    """
    current_dir = os.path.abspath(os.path.dirname(__file__))
    parent_dir = os.path.dirname(current_dir)

    # Check if executed from within the backend/ subdirectory in a monorepo
    if os.path.basename(current_dir) == 'backend' and (
        os.path.isdir(os.path.join(parent_dir, 'data')) or
        os.path.exists(os.path.join(parent_dir, 'package.json')) or
        os.path.exists(os.path.join(parent_dir, 'backend'))
    ):
        base_dir = parent_dir
    else:
        base_dir = current_dir

    env_data_dir = os.environ.get('DATA_DIR')
    env_db_path = os.environ.get('DATABASE_PATH')

    data_dir = os.path.abspath(env_data_dir) if env_data_dir else os.path.join(base_dir, 'data')
    db_path = os.path.abspath(env_db_path) if env_db_path else os.path.join(data_dir, 'guardian_angel.db')

    return base_dir, data_dir, db_path

_BASE_DIR, _DATA_DIR, _DATABASE_PATH = _resolve_paths()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'guardian-angel-clinical-jwt-secret-2026-e2ee')
    PORT = int(os.environ.get('PORT', 5000))
    DEBUG = os.environ.get('FLASK_DEBUG', 'False').lower() in ('true', '1', 't')
    
    # Session Cookie Security
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    SESSION_COOKIE_SECURE = os.environ.get('SESSION_COOKIE_SECURE', 'False').lower() in ('true', '1', 't')
    
    # GCP Configuration
    GCP_PROJECT_ID = os.environ.get('GCP_PROJECT_ID', os.environ.get('GOOGLE_CLOUD_PROJECT', 'guardian-angel-health'))
    GCP_REGION = os.environ.get('GCP_REGION', 'us-central1')
    GCS_BUCKET_NAME = os.environ.get('GCS_BUCKET_NAME', '')
    VERTEX_AI_LOCATION = os.environ.get('VERTEX_AI_LOCATION', 'us-central1')
    
    # Database Configuration (SQLite local, Cloud SQL compatible)
    BASE_DIR = _BASE_DIR
    DATA_DIR = _DATA_DIR
    DATABASE_PATH = _DATABASE_PATH
    
    # Default Admin Credentials
    ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME', 'admin')
    ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin')
    ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@guardianangel.bio')

