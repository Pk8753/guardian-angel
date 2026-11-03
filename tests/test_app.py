import os
import unittest
import json
import re
import sys
import tempfile
import shutil

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from config import Config
from app import app
from database import init_db, get_db_connection, get_user_by_username

class GuardianAngelTestCase(unittest.TestCase):
    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        self.orig_data_dir = Config.DATA_DIR
        self.orig_db_path = Config.DATABASE_PATH
        Config.DATA_DIR = self.test_dir
        Config.DATABASE_PATH = os.path.join(self.test_dir, 'test_ga.db')
        init_db()
        app.config['TESTING'] = True
        app.config['WTF_CSRF_ENABLED'] = False
        self.client = app.test_client()

    def tearDown(self):
        Config.DATA_DIR = self.orig_data_dir
        Config.DATABASE_PATH = self.orig_db_path
        shutil.rmtree(self.test_dir, ignore_errors=True)

    def test_healthz(self):
        """Verify GCP Cloud Run health check endpoint"""
        response = self.client.get('/healthz')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'healthy')
        self.assertEqual(data['platform'], 'GuardianAngel')

    def test_login_page_renders(self):
        """Verify login page displays clean layout, no default credentials shown, and removed SSO/biometrics"""
        response = self.client.get('/login')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'GuardianAngel', response.data)
        self.assertIn(b'Sign In', response.data)
        self.assertIn(b'Create Account', response.data)
        self.assertIn(b'Welcome Back to GuardianAngel', response.data)
        self.assertIn(b'Enter your credentials to access your secure genetic health vault.', response.data)
        self.assertIn(b'<span>Sign in</span>', response.data)
        self.assertIn(b'bg-primary-container', response.data)
        # Form uses novalidate so hidden required fields don't block submission
        self.assertIn(b'novalidate', response.data)

        # Verify credentials and helper pills are NOT shown on UI
        self.assertNotIn(b'admin / admin', response.data)
        self.assertNotIn(b'user / user', response.data)
        self.assertNotIn(b'Default Access Credentials', response.data)
        self.assertNotIn(b'Quick Fill', response.data)
        self.assertNotIn(b'vpn_key', response.data)
        self.assertNotIn(b'9090', response.data)

        # Verify requested removals
        self.assertNotIn(b'Sign in with Touch ID / Face ID or Hardware Key', response.data)
        self.assertNotIn(b'Or continue with Single Sign-On', response.data)
        self.assertNotIn(b'Health System SSO', response.data)
        self.assertNotIn(b'Google Workspace', response.data)

    def test_admin_login_success(self):
        """Verify admin / admin authentication succeeds and redirects to dashboard"""
        response = self.client.post('/login', data={
            'mode': 'signin',
            'username': 'admin',
            'password': 'admin'
        }, follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Good Morning', response.data)
        self.assertIn(b'Pedigree Size', response.data)

    def test_user_user_login_success(self):
        """Verify user / user authentication succeeds and redirects to dashboard with benchmark data"""
        response = self.client.post('/login', data={
            'mode': 'signin',
            'username': 'user',
            'password': 'user'
        }, follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Good Morning', response.data)
        self.assertIn(b'Pedigree Size', response.data)

    def test_signin_invalid_credentials_shows_error(self):
        """Verify sign-in with wrong credentials shows an error message on the page"""
        response = self.client.post('/login', data={
            'mode': 'signin',
            'username': 'nonexistent_user',
            'password': 'wrongpass'
        }, follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Invalid clinical credentials', response.data)
        # Should NOT redirect to dashboard
        self.assertNotIn(b'Good Morning', response.data)

    def test_signin_empty_credentials_returns_error(self):
        """Verify sign-in with empty credentials returns error feedback"""
        response = self.client.post('/login', data={
            'mode': 'signin',
            'username': '',
            'password': ''
        }, follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Invalid clinical credentials', response.data)

    def test_unauthorized_redirect(self):
        """Verify unauthenticated user cannot access dashboard directly"""
        response = self.client.get('/dashboard')
        self.assertEqual(response.status_code, 302)
        self.assertIn('/login', response.headers['Location'])

    def test_send_otp_api(self):
        """Verify API sends static testing OTP 9090 to valid email and rejects invalid email without sending"""
        # Valid email
        res = self.client.post('/api/send-otp', data=json.dumps({
            'email': 'dr.eleanor@clinicalgenetics.org'
        }), content_type='application/json')
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertEqual(data['status'], 'success')
        self.assertEqual(data['otp'], '9090')
        self.assertIn('Verification code sent to dr.eleanor@clinicalgenetics.org', data['message'])
        # Ensure testing OTP 9090 is NOT shown in user-facing message
        self.assertNotIn('9090', data['message'])

        # Invalid emails return 400
        for invalid_email in ['', 'invalid-email', 'user@', '@domain.com', 'user@domain']:
            err_res = self.client.post('/api/send-otp', data=json.dumps({
                'email': invalid_email
            }), content_type='application/json')
            self.assertEqual(err_res.status_code, 400)
            err_data = json.loads(err_res.data)
            self.assertEqual(err_data['status'], 'error')
            self.assertIn('valid email', err_data['message'].lower())

    def test_verify_otp_endpoint(self):
        """Verify /api/verify-otp endpoint checks code and rejects invalid attempts"""
        # Send OTP first
        self.client.post('/api/send-otp', data=json.dumps({
            'email': 'test.patient@institution.org'
        }), content_type='application/json')

        # Incorrect OTP returns 400
        fail_res = self.client.post('/api/verify-otp', data=json.dumps({
            'email': 'test.patient@institution.org',
            'otp': '1111'
        }), content_type='application/json')
        self.assertEqual(fail_res.status_code, 400)
        fail_data = json.loads(fail_res.data)
        self.assertEqual(fail_data['status'], 'error')

        # Correct OTP (9090) returns 200
        ok_res = self.client.post('/api/verify-otp', data=json.dumps({
            'email': 'test.patient@institution.org',
            'otp': '9090'
        }), content_type='application/json')
        self.assertEqual(ok_res.status_code, 200)
        ok_data = json.loads(ok_res.data)
        self.assertEqual(ok_data['status'], 'success')

    def test_check_username_availability(self):
        """Verify /api/check-username returns available=True for new username and False for taken ones"""
        # 'admin' and 'user' are seeded accounts, should be taken
        res_admin = self.client.post('/api/check-username', data=json.dumps({
            'username': 'admin'
        }), content_type='application/json')
        self.assertEqual(res_admin.status_code, 200)
        self.assertFalse(json.loads(res_admin.data)['available'])

        res_user = self.client.post('/api/check-username', data=json.dumps({
            'username': 'user'
        }), content_type='application/json')
        self.assertEqual(res_user.status_code, 200)
        self.assertFalse(json.loads(res_user.data)['available'])

        # A brand new username should be available
        res_new = self.client.post('/api/check-username', data=json.dumps({
            'username': 'brand_new_patient'
        }), content_type='application/json')
        self.assertEqual(res_new.status_code, 200)
        self.assertTrue(json.loads(res_new.data)['available'])

        # Invalid username format
        res_bad = self.client.post('/api/check-username', data=json.dumps({
            'username': 'a'
        }), content_type='application/json')
        self.assertEqual(res_bad.status_code, 200)
        self.assertFalse(json.loads(res_bad.data)['available'])

    def test_create_account_page_renders_all_required_fields(self):
        """Verify create account page includes sequence: First name, Second name, Username, Dob, Email, Location, Password, OTP"""
        response = self.client.get('/login?mode=register')
        self.assertEqual(response.status_code, 200)
        
        # Verify required field sequence and labels
        self.assertIn(b'First Name', response.data)
        self.assertIn(b'Second Name', response.data)
        self.assertIn(b'Username', response.data)
        self.assertIn(b'Date of Birth', response.data)
        self.assertIn(b'Email ID', response.data)
        self.assertIn(b'Location', response.data)
        self.assertIn(b'Password', response.data)
        self.assertIn(b'Send OTP', response.data)
        self.assertIn(b'Create Account', response.data)

        # Verify Create Account button is initially disabled / greyed out
        self.assertIn(b'id="reg-submit-btn" type="submit" disabled', response.data)

        # OTP input row is initially hidden
        self.assertIn(b'id="otpInputRow" class="hidden"', response.data)

        # Verify OTP 9090 is NOT shown anywhere on the page
        self.assertNotIn(b'9090', response.data)
        self.assertNotIn(b'Testing OTP', response.data)

    def test_create_account_with_invalid_otp_fails(self):
        """Verify registration is rejected when invalid OTP is provided"""
        res = self.client.post('/login', data={
            'mode': 'register',
            'firstname': 'Marcus',
            'secondname': 'Brody',
            'reg_username': 'marcus_brody',
            'dob': '1975-08-12',
            'email': 'brody@museum.edu',
            'location': 'New York',
            'password': 'safePassword99',
            'otp': '1234'  # Invalid OTP
        }, follow_redirects=True)
        self.assertEqual(res.status_code, 200)
        self.assertIn(b'Invalid verification code', res.data)
        self.assertIsNone(get_user_by_username('marcus_brody'))

    def test_create_account_with_invalid_email_fails(self):
        """Verify registration is rejected when invalid email is provided"""
        res = self.client.post('/login', data={
            'mode': 'register',
            'firstname': 'Invalid',
            'secondname': 'Email',
            'reg_username': 'invalid_email_user',
            'dob': '1990-01-01',
            'email': 'not-an-email',
            'location': 'Riyadh',
            'password': 'password123',
            'otp': '9090'
        }, follow_redirects=True)
        self.assertEqual(res.status_code, 200)
        self.assertIn(b'Please enter a valid email address.', res.data)

    def test_create_account_with_duplicate_username_fails(self):
        """Verify registration is rejected when username is already taken"""
        res = self.client.post('/login', data={
            'mode': 'register',
            'firstname': 'Duplicate',
            'secondname': 'User',
            'reg_username': 'admin',  # 'admin' already exists
            'dob': '1990-01-01',
            'email': 'duplicate@example.com',
            'location': 'Boston',
            'password': 'password123',
            'otp': '9090'
        }, follow_redirects=True)
        self.assertEqual(res.status_code, 200)
        self.assertIn(b'Username is already taken', res.data)

    def test_create_account_successful_with_static_otp_9090(self):
        """Verify create account displays success message that account is created and prompts to log in, and user can then sign in"""
        res = self.client.post('/login', data={
            'mode': 'register',
            'firstname': 'Eleanor',
            'secondname': 'Vance',
            'reg_username': 'eleanor_vance',
            'dob': '1993-06-25',
            'email': 'eleanor.vance@genomics.org',
            'location': 'Boston, MA',
            'reg_password': 'superSecretPassword2026',
            'otp': '9090'  # Static test OTP
        }, follow_redirects=True)
        self.assertEqual(res.status_code, 200)
        # Message confirming account creation and prompting to sign in
        self.assertIn(b'Your account has been created', res.data)
        self.assertIn(b'Sign in', res.data)

        # Verify user exists in database with correct username and full name
        user = get_user_by_username('eleanor_vance')
        self.assertIsNotNone(user)
        self.assertEqual(user['full_name'], 'Eleanor Vance')

        # Check profile
        conn = get_db_connection()
        profile = conn.execute("SELECT * FROM user_profiles WHERE user_id = ?", (user['id'],)).fetchone()
        conn.close()
        self.assertIsNotNone(profile)
        self.assertEqual(profile['dob'], '1993-06-25')
        self.assertEqual(profile['city'], 'Boston, MA')

        # Sign in with newly created credentials to enter the dashboard
        login_res = self.client.post('/login', data={
            'mode': 'signin',
            'signin_username': 'eleanor_vance',
            'signin_password': 'superSecretPassword2026'
        }, follow_redirects=True)
        self.assertEqual(login_res.status_code, 200)
        self.assertIn(b'Good Morning', login_res.data)

    def test_new_user_signup_fresh_state_and_blank_diagnostics(self):
        """Verify that when a new user signs up, their account is created, they log in, and have blank priority diagnostics and empty metric prompts."""
        signup_res = self.client.post('/login', data={
            'mode': 'register',
            'reg_username': 'newpatient99',
            'email': 'newpatient99@guardianangel.bio',
            'firstname': 'Sara',
            'secondname': 'Vance',
            'reg_password': 'securepassword123',
            'dob': '1992-04-18',
            'location': 'Riyadh',
            'otp': '9090'
        }, follow_redirects=True)
        self.assertEqual(signup_res.status_code, 200)
        self.assertIn(b'Your account has been created', signup_res.data)

        # Log in with newly created credentials
        login_res = self.client.post('/login', data={
            'mode': 'signin',
            'signin_username': 'newpatient99',
            'signin_password': 'securepassword123'
        }, follow_redirects=True)
        self.assertEqual(login_res.status_code, 200)
        self.assertIn(b'Good Morning', login_res.data)

        # 1. Verify Priority Diagnostic is blank for fresh user
        self.assertIn(b'Priority Diagnostic', login_res.data)
        self.assertIn(b'Blank', login_res.data)
        self.assertIn(b'0%</span>', login_res.data)

        # 2. Verify metric cards prompt user to click to add details
        self.assertIn(b'Click to Add Family Details', login_res.data)
        self.assertIn(b'Click to Add Details', login_res.data)
        self.assertIn(b'No Partner Linked', login_res.data)

        # 3. Verify user only has 1 node (themselves as proband)
        api_res = self.client.get('/api/pedigree/nodes')
        self.assertEqual(api_res.status_code, 200)
        nodes = json.loads(api_res.data)
        self.assertEqual(len(nodes), 1)
        self.assertTrue(nodes[0]['is_proband'])

        # 4. Check that Reddit-style Sudo alias was automatically assigned
        user = get_user_by_username('newpatient99')
        self.assertIsNotNone(user['alias_name'])
        # Reddit alias pattern: Word-Word-####
        self.assertTrue(re.match(r'^[A-Z][a-z]+-[A-Z][a-z]+-\d{4}$', user['alias_name']))

    def test_reddit_style_alias_and_data_hiding_toggle(self):
        """Verify Reddit-style pseudonym generation, data hiding toggle, and relative pseudonyms"""
        self.client.post('/login', data={'mode': 'signin', 'username': 'admin', 'password': 'admin'})
        
        # 1. Toggle data hiding on
        toggle_res = self.client.post('/api/toggle-mask')
        self.assertEqual(toggle_res.status_code, 200)
        data = json.loads(toggle_res.data)
        self.assertTrue(data['mask_identity'])

        # 2. Access dashboard with data hiding on -> displays sudo name
        dash_res = self.client.get('/dashboard')
        self.assertEqual(dash_res.status_code, 200)
        self.assertIn(b'Silent-Falcon-9214', dash_res.data)

        # 3. Add family member and verify automatic Reddit-style Sudo alias assigned
        add_res = self.client.post('/api/pedigree/members',
                                   data=json.dumps({
                                       'name': 'Uncle Tariq Sr',
                                       'generation': 'gen2',
                                       'sex': 'male',
                                       'relationship': 'Maternal Uncle',
                                       'carrier_status': 'clear'
                                   }),
                                   content_type='application/json')
        self.assertEqual(add_res.status_code, 200)
        
        # 4. Check that new relative has an alias_name in nodes list
        nodes_res = self.client.get('/api/pedigree/nodes')
        nodes = json.loads(nodes_res.data)
        added_node = next((n for n in nodes if n['name'] == 'Uncle Tariq Sr'), None)
        self.assertIsNotNone(added_node)
        self.assertIsNotNone(added_node['alias_name'])
        self.assertTrue(re.match(r'^[A-Z][a-z]+-[A-Z][a-z]+-\d{4}$', added_node['alias_name']))

        # 5. Regenerate alias endpoint
        regen_res = self.client.post('/api/regenerate-alias')
        self.assertEqual(regen_res.status_code, 200)
        regen_data = json.loads(regen_res.data)
        self.assertIn('new_alias', regen_data)
        self.assertTrue(re.match(r'^[A-Z][a-z]+-[A-Z][a-z]+-\d{4}$', regen_data['new_alias']))

    def test_pedigree_page_and_api(self):
        """Verify pedigree page and add family member feature"""
        self.client.post('/login', data={'mode': 'signin', 'username': 'admin', 'password': 'admin'})
        
        response = self.client.get('/pedigree')
        self.assertEqual(response.status_code, 200)

        api_res = self.client.get('/api/pedigree/nodes')
        self.assertEqual(api_res.status_code, 200)
        nodes = json.loads(api_res.data)
        self.assertGreaterEqual(len(nodes), 8)

        new_relative = {
            'name': 'Hassan Al-Mansoor',
            'generation': 'gen2',
            'sex': 'male',
            'relationship': 'Paternal Uncle',
            'carrier_status': 'carrier',
            'condition_locus': 'Beta-Thalassemia Trait',
            'birth_year': '1965',
            'notes': 'Verified carrier'
        }
        add_res = self.client.post('/api/pedigree/members',
                                   data=json.dumps(new_relative),
                                   content_type='application/json')
        self.assertEqual(add_res.status_code, 200)
        add_data = json.loads(add_res.data)
        self.assertEqual(add_data['status'], 'success')
        self.assertIn('node_id', add_data)

    def test_update_patient_details(self):
        """Verify patient can add and update their clinical details"""
        self.client.post('/login', data={'mode': 'signin', 'username': 'admin', 'password': 'admin'})
        
        update_data = {
            'full_name': 'Tariq Al-Mansoor Updated',
            'alias_name': 'Brave-Cheetah-4421',
            'dob': '1994-05-20',
            'blood_type': 'O+',
            'phone': '+966 50 999 8888',
            'city': 'Riyadh',
            'country': 'Saudi Arabia',
            'kinship_degree': '3rd Degree Consanguinity',
            'phenotypic_notes': 'Documented HBB carrier',
            'emergency_contact': 'Fatima Al-Zahra'
        }
        res = self.client.post('/profile', data=update_data, follow_redirects=True)
        self.assertEqual(res.status_code, 200)
        self.assertIn(b'Tariq Al-Mansoor Updated', res.data)
        self.assertIn(b'Riyadh', res.data)

    def test_genwell_ai_query(self):
        """Verify GenWell AI assistant provides genomic answers"""
        self.client.post('/login', data={'mode': 'signin', 'username': 'admin', 'password': 'admin'})
        res = self.client.post('/api/ai/ask',
                               data=json.dumps({'query': 'What does 3rd-degree consanguinity mean?'}),
                               content_type='application/json')
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn('answer', data)
        self.assertIn('0.0625', data['answer'])

    def test_gcp_sync_export(self):
        """Verify GCS / Cloud sync endpoint generates export safely"""
        self.client.post('/login', data={'mode': 'signin', 'username': 'admin', 'password': 'admin'})
        res = self.client.post('/api/gcp/sync-pedigree')
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertEqual(data['status'], 'success')
        self.assertIn('path', data)

    def test_dynamic_dashboard_generation_after_family_intake(self):
        """Verify that when a new user enters Father, Mother, and Siblings, the dashboard values dynamically calculate and generate."""
        # 1. Register new patient
        signup_res = self.client.post('/login', data={
            'mode': 'register',
            'reg_username': 'dr_clara',
            'email': 'dr_clara@clinic.bio',
            'firstname': 'Dr. Clara',
            'secondname': 'Oswald',
            'reg_password': 'pass12345678',
            'dob': '1990-11-23',
            'location': 'London',
            'otp': '9090'
        }, follow_redirects=True)
        self.assertEqual(signup_res.status_code, 200)
        self.assertIn(b'Your account has been created', signup_res.data)

        # Log in with newly created credentials
        login_res = self.client.post('/login', data={
            'mode': 'signin',
            'signin_username': 'dr_clara',
            'signin_password': 'pass12345678'
        }, follow_redirects=True)
        self.assertEqual(login_res.status_code, 200)
        self.assertIn(b'Good Morning', login_res.data)

        # Verify initial blank state
        dash_init_res = self.client.get('/dashboard')
        self.assertEqual(dash_init_res.status_code, 200)
        self.assertIn(b'0%</span>', dash_init_res.data)
        self.assertIn(b'Priority Diagnostic', dash_init_res.data)
        self.assertIn(b'Blank', dash_init_res.data)
        self.assertIn(b'Family Pedigree Lineage Intake', dash_init_res.data)

        # 2. Add Father (Carrier for Beta-Thalassemia Minor)
        father_res = self.client.post('/api/pedigree/members',
                                      data=json.dumps({
                                          'name': 'Dave Oswald',
                                          'generation': 'gen2',
                                          'sex': 'male',
                                          'relationship': 'Father',
                                          'carrier_status': 'carrier',
                                          'condition_locus': 'Beta-Thalassemia Minor',
                                          'birth_year': '1962'
                                      }),
                                      content_type='application/json')
        self.assertEqual(father_res.status_code, 200)

        # 3. Add Mother (Carrier for Sickle Cell Trait)
        mother_res = self.client.post('/api/pedigree/members',
                                      data=json.dumps({
                                          'name': 'Ellie Oswald',
                                          'generation': 'gen2',
                                          'sex': 'female',
                                          'relationship': 'Mother',
                                          'carrier_status': 'carrier',
                                          'condition_locus': 'Sickle Cell Trait',
                                          'birth_year': '1965'
                                      }),
                                      content_type='application/json')
        self.assertEqual(mother_res.status_code, 200)

        # 4. Add Sibling (Brother)
        brother_res = self.client.post('/api/pedigree/members',
                                       data=json.dumps({
                                           'name': 'Thomas Oswald',
                                           'generation': 'gen3',
                                           'sex': 'male',
                                           'relationship': 'Brother',
                                           'carrier_status': 'clear',
                                           'birth_year': '1998'
                                       }),
                                       content_type='application/json')
        self.assertEqual(brother_res.status_code, 200)

        # 5. Fetch Dashboard and verify dynamically generated values
        dash_res = self.client.get('/dashboard')
        self.assertEqual(dash_res.status_code, 200)

        # Completeness Index is now calculated and generated (not 0%)
        self.assertNotIn(b'0%</span>', dash_res.data)
        self.assertIn(b'INDEX</span>', dash_res.data)

        # Priority Diagnostic is now active (not blank)
        self.assertIn(b'Carrier Surveillance Advised', dash_res.data)
        self.assertIn(b'Autosomal Recessive', dash_res.data)

        # Pedigree Size is dynamically generated: 4 members
        self.assertIn(b'>4</span>', dash_res.data)
        self.assertIn(b'Members Documented', dash_res.data)

        # Phenotypes are dynamically generated (2 carrier loci)
        self.assertIn(b'>2</span>', dash_res.data)
        self.assertIn(b'Reported In Lineage', dash_res.data)

        # AI Surveillance alerts generated (dual parental carrier alert)
        self.assertIn(b'High-Priority Alerts', dash_res.data)

        # Lineage model canvas renders Father, Mother, Sibling, and Proband
        self.assertIn(b'Dave Oswald', dash_res.data)
        self.assertIn(b'Ellie Oswald', dash_res.data)
        self.assertIn(b'Thomas Oswald', dash_res.data)
        self.assertIn(b'Dr. Clara Oswald', dash_res.data)

        # Stepper shows core lineage documented
        self.assertIn(b'Core Lineage Documented', dash_res.data)

if __name__ == '__main__':
    unittest.main()
