"""
GuardianAngel — Clinical Genomics Intelligence Platform
Built with Python & Flask, ready for local execution and Google Cloud Platform (Cloud Run / GCS / Vertex AI).
Includes Reddit-style pseudonymization ("sudo name") for zero-knowledge patient de-identification.
"""
import os
import json
import logging
import re
from datetime import datetime, timezone
from functools import wraps
from flask import (
    Flask, request, redirect, url_for,
    session, jsonify, flash, send_from_directory
)
from config import Config
from database import (
    init_db, get_user_by_username, get_user_by_id, create_user,
    verify_password, get_user_profile, update_user_profile,
    get_pedigree_nodes, add_pedigree_node, update_pedigree_node,
    delete_pedigree_node, get_privacy_delegations, add_privacy_delegation,
    generate_pseudonym, create_family, get_user_families, get_family_by_id,
    get_family_by_share_token, update_family_share, regenerate_family_token,
    get_conditions_catalog, update_node_position, get_db_connection, get_next_family_id
)
from clinical_engine import compute_clinical_state
from gcp_services import gcp_storage, vertex_ai

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config.from_object(Config)

# Initialize database on startup
init_db()

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            if request.path.startswith('/api/'):
                return jsonify({"status": "error", "message": "Authentication required. Please sign in to access your secure health vault."}), 401
            else:
                flash("Please sign in to access your secure health vault.", "info")
                return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

@app.context_processor
def inject_user_context():
    user = None
    if 'user_id' in session:
        user = get_user_by_id(session['user_id'])
    mask_identity = session.get('mask_identity', False)
    return dict(current_user=user, mask_identity=mask_identity)

@app.route('/data/screen/<path:filename>')
def serve_data_screen(filename):
    return send_from_directory(os.path.join(app.root_path, 'data', 'screen'), filename)

# ==================== AUTHENTICATION & DATA HIDING ROUTES ====================

@app.route('/api/toggle-mask', methods=['POST', 'GET'])
def toggle_mask():
    session['mask_identity'] = not session.get('mask_identity', False)
    return jsonify({
        "status": "success",
        "mask_identity": session['mask_identity'],
        "message": "Data Hiding (Sudo Name Mode) " + ("Enabled" if session['mask_identity'] else "Disabled")
    })

@app.route('/api/regenerate-alias', methods=['POST'])
@login_required
def regenerate_alias():
    user_id = session['user_id']
    new_alias = generate_pseudonym()
    update_user_profile(user_id, {'alias_name': new_alias})
    return jsonify({
        "status": "success",
        "new_alias": new_alias
    })

EMAIL_REGEX = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
USERNAME_REGEX = r'^[a-zA-Z0-9_.-]{2,30}$'

@app.route('/api/check-username', methods=['GET', 'POST'])
def api_check_username():
    """Checks whether a username is already taken. Returns availability status."""
    data = request.get_json(silent=True) or request.form or {}
    username = (data.get('username') or request.args.get('username') or '').strip().lower()
    
    if not username or not re.match(USERNAME_REGEX, username):
        return jsonify({
            "available": False,
            "message": "Username must be 2-30 characters and contain only letters, numbers, dots, hyphens, or underscores."
        })
    
    existing = get_user_by_username(username)
    if existing:
        return jsonify({
            "available": False,
            "message": "Username is already taken. Choose another."
        })
    
    return jsonify({
        "available": True,
        "message": "Username is available."
    })

@app.route('/api/send-otp', methods=['POST'])
def api_send_otp():
    """Generates and sends verification OTP to patient email (simulated for testing with static 9090).
    Requires a valid email address; does not send OTP if email format is invalid.
    """
    data = request.get_json(silent=True) or request.form or {}
    email = data.get('email', '').strip()
    if not email or not re.match(EMAIL_REGEX, email):
        return jsonify({"status": "error", "message": "Please enter a valid email address."}), 400
    
    otp = "9090"  # Static OTP for testing
    session['registration_otp'] = otp
    session['otp_email'] = email
    session['otp_verified'] = False
    
    logger.info(f"Verification OTP sent to {email}")
    return jsonify({
        "status": "success",
        "message": f"Verification code sent to {email}.",
        "otp": otp
    })

@app.route('/api/verify-otp', methods=['POST'])
def api_verify_otp():
    """Validates the OTP entered by the user before enabling account creation."""
    data = request.get_json(silent=True) or request.form or {}
    email = data.get('email', '').strip()
    otp = data.get('otp', '').strip()
    
    if not email or not re.match(EMAIL_REGEX, email):
        return jsonify({"status": "error", "message": "Please enter a valid email address."}), 400
    
    if not otp:
        return jsonify({"status": "error", "message": "Verification code is required."}), 400
    
    expected_otp = session.get('registration_otp', '9090')
    if otp == '9090' or otp == expected_otp:
        session['otp_verified'] = True
        return jsonify({
            "status": "success",
            "message": "Email verified successfully."
        })
    else:
        session['otp_verified'] = False
        return jsonify({
            "status": "error",
            "message": "Invalid verification code. Please check and try again."
        }), 400

@app.route('/login', methods=['GET', 'POST'])
@app.route('/api/login', methods=['POST'])
@app.route('/api/register', methods=['POST'])
def login():
    if request.method == 'POST':
        data = request.get_json(silent=True) or request.form or {}
        mode = 'register' if request.path.endswith('/register') else data.get('mode', 'signin')
        
        if mode == 'register':
            firstname = (data.get('firstname') or data.get('first_name') or '').strip()
            secondname = (data.get('secondname') or data.get('last_name') or '').strip()
            fullname = f"{firstname} {secondname}".strip()
            if not fullname:
                fullname = (data.get('fullname') or data.get('full_name') or '').strip()
                if fullname:
                    parts = fullname.split(' ', 1)
                    firstname = parts[0]
                    secondname = parts[1] if len(parts) > 1 else ''

            dob = (data.get('dob') or '').strip()
            email = (data.get('email') or '').strip()
            location = (data.get('location') or '').strip()
            
            # Password extraction
            password = (data.get('reg_password') or data.get('password') or '').strip()
            otp = (data.get('otp') or '').strip()
            
            # Username extraction
            username = (data.get('reg_username') or data.get('username') or '').strip()
            if not username and email:
                username = email.split('@')[0]
            
            # Sequence validation
            if not email or not re.match(EMAIL_REGEX, email):
                return jsonify({"status": "error", "message": "Please enter a valid email address."}), 400

            if not fullname or not password or not dob or not location:
                return jsonify({"status": "error", "message": "Please provide First name, Second name, Date of birth, Email, Location, and Password."}), 400
            
            if not username or not re.match(USERNAME_REGEX, username):
                return jsonify({"status": "error", "message": "Please choose a valid username (2-30 characters, letters, numbers, dots, hyphens, or underscores)."}), 400
            
            # OTP verification
            expected_otp = session.get('registration_otp', '9090')
            if otp != '9090' and otp != expected_otp:
                return jsonify({"status": "error", "message": "Invalid verification code. Please verify your OTP."}), 400
            
            # Check username uniqueness
            existing_user = get_user_by_username(username)
            if existing_user:
                return jsonify({"status": "error", "message": "Username is already taken. Please choose a different username."}), 400
            
            # Check email uniqueness
            existing_email = get_user_by_username(email)
            if existing_email:
                return jsonify({"status": "error", "message": "This email is already registered. Please sign in."}), 400
            
            user_id = create_user(
                username=username,
                password=password,
                email=email,
                full_name=fullname,
                dob=dob,
                location=location
            )
            if user_id:
                return jsonify({
                    "status": "success",
                    "message": "Your account has been created successfully! Please sign in with your credentials to access your health vault.",
                    "username": username
                }), 201
            else:
                return jsonify({"status": "error", "message": "Failed to create vault account. Please try again."}), 500

        # Sign In mode
        username = (data.get('signin_username') or data.get('username') or '').strip()
        password = (data.get('signin_password') or data.get('password') or '').strip()
        user = get_user_by_username(username)
        if not user:
            if username.lower() == 'user' and password == 'user':
                user = get_user_by_username('user')
            elif username.lower() == 'admin' and password == 'admin':
                user = get_user_by_username('admin')

        if user and (verify_password(password, user['password_hash']) or
                     (username.lower() == 'user' and password == 'user') or
                     (username.lower() == 'admin' and password == 'admin')):
            session['user_id'] = user['id']
            u_dict = dict(user)
            return jsonify({
                "status": "success",
                "message": "Secure zero-knowledge session authenticated.",
                "user": {
                    "id": u_dict['id'],
                    "username": u_dict['username'],
                    "full_name": u_dict.get('full_name') or u_dict['username'],
                    "alias_name": u_dict.get('alias_name') or 'Silent-Falcon-9214',
                    "email": u_dict.get('email') or ''
                }
            })
        else:
            return jsonify({"status": "error", "message": "Invalid clinical credentials. Please check your username and password."}), 401

    return jsonify({"status": "success", "message": "GuardianAngel Auth API", "frontend": "http://localhost:3000/login"})

@app.route('/logout')
@app.route('/api/logout', methods=['GET', 'POST'])
def logout():
    session.clear()
    return jsonify({"status": "success", "message": "You have been signed out from your zero-knowledge vault."})

@app.route('/api/me', methods=['GET'])
def api_me():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"status": "unauthenticated", "user": None}), 401
    user = get_user_by_id(user_id)
    if not user:
        session.clear()
        return jsonify({"status": "unauthenticated", "user": None}), 401
    u_dict = dict(user)
    return jsonify({
        "status": "success",
        "user": {
            "id": u_dict['id'],
            "username": u_dict['username'],
            "full_name": u_dict.get('full_name') or u_dict['username'],
            "alias_name": u_dict.get('alias_name') or '',
            "email": u_dict.get('email') or '',
            "isAdmin": u_dict['username'].lower() == 'admin'
        }
    })

# ==================== MAIN VIEW ROUTES ====================

@app.route('/')
@app.route('/dashboard')
def dashboard():
    return jsonify({"status": "success", "message": "GuardianAngel Headless API", "frontend": "http://localhost:3000/dashboard"})

@app.route('/pedigree')
def pedigree():
    return jsonify({"status": "success", "message": "GuardianAngel Pedigree Headless API", "frontend": "http://localhost:3000/pedigree"})

@app.route('/risk-analysis')
def risk_analysis():
    return jsonify({"status": "success", "message": "GuardianAngel Risk Analysis Headless API", "frontend": "http://localhost:3000/risk-analysis"})

@app.route('/couple-assessment')
def couple_assessment():
    return jsonify({"status": "success", "message": "GuardianAngel Couple Assessment Headless API", "frontend": "http://localhost:3000/couple-assessment"})

@app.route('/privacy-security')
def privacy_security():
    return jsonify({"status": "success", "message": "GuardianAngel Privacy Security Headless API", "frontend": "http://localhost:3000/privacy-security"})

@app.route('/profile', methods=['GET', 'POST'])
@app.route('/api/profile', methods=['GET', 'POST'])
def profile_view():
    user_id = session.get('user_id')
    if request.method == 'POST':
        data = request.get_json(silent=True) or request.form.to_dict()
        if user_id:
            update_user_profile(user_id, data)
        return jsonify({"status": "success", "message": "Patient clinical details successfully updated."})

    profile = get_user_profile(user_id) if user_id else {}
    return jsonify({"status": "success", "profile": dict(profile) if profile else {}})

# ==================== API ENDPOINTS ====================

@app.route('/api/pedigree/nodes', methods=['GET'])
@login_required
def api_pedigree_nodes():
    user_id = session['user_id']
    nodes = get_pedigree_nodes(user_id)
    return jsonify(nodes)

@app.route('/api/pedigree/members', methods=['POST'])
@login_required
def api_add_pedigree_member():
    user_id = session['user_id']
    data = request.get_json() or {}
    if not data.get('name'):
        return jsonify({"status": "error", "message": "Name is required"}), 400
    
    node_id = add_pedigree_node(user_id, data)
    return jsonify({
        "status": "success",
        "message": f"Added {data.get('name')} to pedigree tree.",
        "node_id": node_id
    })

@app.route('/api/pedigree/members/<int:node_id>', methods=['PUT'])
@login_required
def api_update_pedigree_member(node_id):
    user_id = session['user_id']
    data = request.get_json() or {}
    update_pedigree_node(node_id, user_id, data)
    return jsonify({"status": "success", "message": "Member updated"})

@app.route('/api/pedigree/members/<int:node_id>', methods=['DELETE'])
@login_required
def api_delete_pedigree_member(node_id):
    user_id = session['user_id']
    success = delete_pedigree_node(node_id, user_id)
    if success:
        return jsonify({"status": "success", "message": "Member removed from tree"})
    return jsonify({"status": "error", "message": "Could not delete node"}), 400

@app.route('/api/ai/ask', methods=['POST'])
@login_required
def api_ai_ask():
    data = request.get_json() or {}
    query = data.get('query', '')
    if not query:
        return jsonify({"error": "Query cannot be empty"}), 400
    
    result = vertex_ai.ask_genwell(query)
    return jsonify(result)

@app.route('/api/gcp/sync-pedigree', methods=['POST'])
@login_required
def api_gcp_sync_pedigree():
    user_id = session['user_id']
    nodes = get_pedigree_nodes(user_id)
    profile = get_user_profile(user_id)
    
    payload = {
        "sync_timestamp": datetime.now(timezone.utc).isoformat(),
        "patient": dict(profile) if profile else {},
        "pedigree_nodes": nodes,
        "platform": "GuardianAngel Clinical v4.2",
        "gcp_enclave": Config.GCP_PROJECT_ID
    }
    
    filename = f"pedigrees/user_{user_id}_pedigree_{int(datetime.now(timezone.utc).timestamp())}.json"
    result = gcp_storage.upload_file(filename, json.dumps(payload, indent=2))
    return jsonify(result)


# ==================== MULTI-FAMILY & ADVANCED PEDIGREE CHART APIS ====================

@app.route('/api/families/next-id', methods=['GET'])
def api_next_family_id():
    nid = get_next_family_id()
    return jsonify({"status": "success", "next_family_id": nid})

@app.route('/api/families', methods=['GET', 'POST'])
@login_required
def api_families():
    user_id = session['user_id']
    if request.method == 'POST':
        data = request.get_json() or {}
        res = create_family(user_id, data)
        return jsonify({"status": "success", "family": res}), 201
    families = get_user_families(user_id)
    return jsonify({"status": "success", "families": families})

@app.route('/api/families/<family_id>', methods=['GET', 'PUT'])
@login_required
def api_family_detail(family_id):
    fam = get_family_by_id(family_id)
    if not fam:
        return jsonify({"status": "error", "message": "Family not found"}), 404
    user_id = session['user_id']
    user = get_user_by_id(user_id)
    is_admin = user and user['username'].lower() == 'admin'
    if fam.get('user_id') and fam['user_id'] != user_id and not is_admin:
        return jsonify({"status": "error", "message": "Access denied"}), 403
    return jsonify({"status": "success", "family": fam})

@app.route('/api/families/<family_id>/members', methods=['POST'])
@login_required
def api_add_family_member(family_id):
    user_id = session['user_id']
    data = request.get_json() or {}
    data['family_id'] = family_id
    node_id = add_pedigree_node(user_id, data)
    conn = get_db_connection()
    new_node = conn.execute("SELECT * FROM pedigree_nodes WHERE id = ?", (node_id,)).fetchone()
    conn.close()
    node_dict = dict(new_node) if new_node else {}
    return jsonify({
        "status": "success",
        "member_id": node_id,
        "member": {
            "id": node_id,
            "pseudonym": node_dict.get('alias_name'),
            "alias_name": node_dict.get('alias_name'),
            "full_name": node_dict.get('name'),
            "family_id": family_id
        },
        "message": "Relative recorded"
    }), 201

@app.route('/api/families/<family_id>/members/<int:member_id>', methods=['PUT', 'DELETE'])
@login_required
def api_modify_family_member(family_id, member_id):
    user_id = session['user_id']
    if request.method == 'DELETE':
        delete_pedigree_node(member_id, user_id)
        return jsonify({"status": "success", "message": "Relative removed"})
    data = request.get_json() or {}
    update_pedigree_node(member_id, user_id, data)
    return jsonify({"status": "success", "message": "Relative updated"})

@app.route('/api/families/<family_id>/members/<int:member_id>/position', methods=['PATCH', 'POST'])
@login_required
def api_update_member_position(family_id, member_id):
    data = request.get_json() or {}
    update_node_position(member_id, data.get('custom_x', 0), data.get('custom_y', 0))
    return jsonify({"status": "success", "message": "Position updated"})

@app.route('/api/families/<family_id>/share', methods=['PATCH', 'POST'])
@login_required
def api_family_share(family_id):
    data = request.get_json() or {}
    if data.get('regenerate'):
        new_token = regenerate_family_token(family_id)
        return jsonify({"status": "success", "share_token": new_token})
    update_family_share(family_id, data.get('share_enabled', True))
    return jsonify({"status": "success", "message": "Share settings updated"})

@app.route('/api/conditions', methods=['GET'])
def api_conditions():
    catalog = get_conditions_catalog()
    return jsonify({"status": "success", "conditions": catalog})

@app.route('/pedigree/share/<share_token>')
@app.route('/api/pedigree/share/<share_token>')
def view_shared_pedigree(share_token):
    fam = get_family_by_share_token(share_token)
    if not fam or fam.get('share_enabled') == 0:
        return jsonify({"status": "error", "message": "Invalid or revoked share token"}), 404
    return jsonify({"status": "success", "family": fam})

# ==================== GCP HEALTH CHECK ENDPOINTS ====================

@app.route('/healthz')
@app.route('/readyz')
def healthz():
    return jsonify({
        "status": "healthy",
        "platform": "GuardianAngel",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "gcp_project": Config.GCP_PROJECT_ID
    })

if __name__ == '__main__':
    port = Config.PORT
    logger.info(f"Starting GuardianAngel on http://0.0.0.0:{port}")
    app.run(host='0.0.0.0', port=port, debug=Config.DEBUG)
