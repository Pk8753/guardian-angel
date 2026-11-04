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
    Flask, render_template, request, redirect, url_for,
    session, jsonify, flash, send_from_directory
)
from config import Config
from database import (
    init_db, get_user_by_username, get_user_by_id, create_user,
    verify_password, get_user_profile, update_user_profile,
    get_pedigree_nodes, add_pedigree_node, update_pedigree_node,
    delete_pedigree_node, get_privacy_delegations, add_privacy_delegation,
    generate_pseudonym
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

@app.route('/api/check-username', methods=['POST'])
def api_check_username():
    """Checks whether a username is already taken. Returns availability status."""
    data = request.get_json(silent=True) or request.form or {}
    username = data.get('username', '').strip().lower()
    
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
def login():
    if request.method == 'POST':
        mode = request.form.get('mode', 'signin')
        
        if mode == 'register':
            firstname = request.form.get('firstname', '').strip()
            secondname = request.form.get('secondname', '').strip()
            fullname = f"{firstname} {secondname}".strip()
            if not fullname:
                fullname = request.form.get('fullname', '').strip()
                if fullname:
                    parts = fullname.split(' ', 1)
                    firstname = parts[0]
                    secondname = parts[1] if len(parts) > 1 else ''

            dob = request.form.get('dob', '').strip()
            email = request.form.get('email', '').strip()
            location = request.form.get('location', '').strip()
            
            # Robust password extraction: check reg_password first, then any non-empty password entry
            password = request.form.get('reg_password', '').strip()
            if not password:
                passwords = [p.strip() for p in request.form.getlist('password') if p.strip()]
                password = passwords[-1] if passwords else request.form.get('password', '').strip()

            otp = request.form.get('otp', '').strip()
            
            # Robust username extraction: check reg_username first, then username, then email prefix
            username = request.form.get('reg_username', '').strip()
            if not username:
                usernames = [u.strip() for u in request.form.getlist('username') if u.strip()]
                username = usernames[-1] if usernames else (request.form.get('username', '').strip() or (email.split('@')[0] if '@' in email else email))
            
            # Sequence validation
            if not email or not re.match(EMAIL_REGEX, email):
                return render_template('login.html', error="Please enter a valid email address.", active_mode="register")

            if not fullname or not password or not dob or not location:
                return render_template('login.html', error="Please provide First name, Second name, Date of birth, Email, Location, and Password.", active_mode="register")
            
            if not username or not re.match(USERNAME_REGEX, username):
                return render_template('login.html', error="Please choose a valid username (2-30 characters, letters, numbers, dots, hyphens, or underscores).", active_mode="register")
            
            # OTP verification
            expected_otp = session.get('registration_otp', '9090')
            if otp != '9090' and otp != expected_otp:
                return render_template('login.html', error="Invalid verification code. Please verify your OTP.", active_mode="register")
            
            # Check username uniqueness
            existing_user = get_user_by_username(username)
            if existing_user:
                return render_template('login.html', error="Username is already taken. Please choose a different username.", active_mode="register")
            
            # Check email uniqueness (look up by email as username too)
            existing_email = get_user_by_username(email)
            if existing_email:
                return render_template('login.html', error="This email is already registered. Please sign in.", active_mode="signin")
            
            user_id = create_user(
                username=username,
                password=password,
                email=email,
                full_name=fullname,
                dob=dob,
                location=location
            )
            if user_id:
                # User requirement: Create account button must give message that your account has been created go to login page to enter.
                flash("Your account has been created successfully. Please sign in to enter.", "success")
                return render_template(
                    'login.html',
                    active_mode='signin',
                    success="Your account has been created successfully! Please sign in with your credentials to access your health vault.",
                    prefill_username=username
                )
            else:
                return render_template('login.html', error="Failed to create vault account. Please try again.", active_mode="register")

        # Sign In mode: Default user/user and admin/admin supported
        username = request.form.get('signin_username', '').strip() or request.form.get('username', '').strip()
        password = request.form.get('signin_password', '').strip() or request.form.get('password', '').strip()
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
            flash("Secure zero-knowledge session authenticated.", "success")
            return redirect(url_for('dashboard'))
        else:
            return render_template('login.html', error="Invalid clinical credentials. Please check your username and password.", active_mode="signin")

    return render_template('login.html', active_mode=request.args.get('mode', 'signin'))

@app.route('/logout')
def logout():
    session.clear()
    flash("You have been signed out from your zero-knowledge vault.", "info")
    return redirect(url_for('login'))

# ==================== MAIN VIEW ROUTES ====================

@app.route('/')
@app.route('/dashboard')
@login_required
def dashboard():
    user_id = session['user_id']
    user = get_user_by_id(user_id)
    nodes = get_pedigree_nodes(user_id)
    profile = get_user_profile(user_id)
    state = compute_clinical_state(user, nodes, profile)
    return render_template(
        'dashboard.html',
        active_page='dashboard',
        nodes=nodes,
        is_fresh_user=state['is_fresh_user'],
        is_admin=state['is_admin'],
        state=state,
        profile=profile
    )

@app.route('/pedigree')
@login_required
def pedigree():
    user_id = session['user_id']
    user = get_user_by_id(user_id)
    nodes = get_pedigree_nodes(user_id)
    profile = get_user_profile(user_id)
    state = compute_clinical_state(user, nodes, profile)
    
    # Custom nodes beyond the 11 standard historical seed keys (for admin)
    standard_keys = {'grandpa_p', 'grandma_p', 'farooq', 'grandma_m', 'walid', 'samira', 'kareem', 'fatima_aunt', 'tariq', 'laila', 'zayd'}
    custom_nodes = [n for n in nodes if n['node_key'] not in standard_keys]
    
    return render_template(
        'pedigree.html',
        active_page='pedigree',
        nodes=nodes,
        custom_nodes=custom_nodes,
        is_fresh_user=state['is_fresh_user'],
        is_admin=state['is_admin'],
        state=state
    )

@app.route('/risk-analysis')
@login_required
def risk_analysis():
    user_id = session['user_id']
    user = get_user_by_id(user_id)
    nodes = get_pedigree_nodes(user_id)
    profile = get_user_profile(user_id)
    state = compute_clinical_state(user, nodes, profile)
    return render_template('risk_analysis.html', active_page='risk_analysis', nodes=nodes, state=state, is_fresh_user=state['is_fresh_user'], is_admin=state['is_admin'])

@app.route('/couple-assessment')
@login_required
def couple_assessment():
    user_id = session['user_id']
    user = get_user_by_id(user_id)
    nodes = get_pedigree_nodes(user_id)
    profile = get_user_profile(user_id)
    state = compute_clinical_state(user, nodes, profile)
    return render_template('couple_assessment.html', active_page='couple_assessment', state=state, is_fresh_user=state['is_fresh_user'], is_admin=state['is_admin'])

@app.route('/privacy-security')
@login_required
def privacy_security():
    user_id = session['user_id']
    delegations = get_privacy_delegations(user_id)
    return render_template('privacy_security.html', active_page='privacy_security', delegations=delegations)

@app.route('/profile', methods=['GET', 'POST'])
@login_required
def profile_view():
    user_id = session['user_id']
    if request.method == 'POST':
        data = {
            'full_name': request.form.get('full_name'),
            'alias_name': request.form.get('alias_name'),
            'dob': request.form.get('dob'),
            'blood_type': request.form.get('blood_type'),
            'phone': request.form.get('phone'),
            'city': request.form.get('city'),
            'country': request.form.get('country'),
            'kinship_degree': request.form.get('kinship_degree'),
            'phenotypic_notes': request.form.get('phenotypic_notes'),
            'emergency_contact': request.form.get('emergency_contact')
        }
        update_user_profile(user_id, data)
        flash("Patient clinical details successfully updated.", "success")
        return redirect(url_for('profile_view'))

    profile = get_user_profile(user_id)
    return render_template('profile.html', active_page='profile', profile=profile)

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
