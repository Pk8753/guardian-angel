#!/usr/bin/env bash
# ==============================================================================
# GuardianAngel — Local Development Startup Script
# ==============================================================================

set -e

PORT=${PORT:-8080}
HOST=${HOST:-"127.0.0.1"}

echo "=================================================================="
echo "         Starting GuardianAngel Clinical Platform Local Server    "
echo "=================================================================="
echo "  URL:         http://${HOST}:${PORT}"
echo "  Admin User:  admin"
echo "  Password:    admin"
echo "  GCP Enclave: Local Mode (Fallback active until GCS/Vertex keys configured)"
echo "=================================================================="

export FLASK_DEBUG=1
export PORT=${PORT}

python3 app.py

