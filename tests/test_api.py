import os
import unittest
import json
import sys
import tempfile
import shutil

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from config import Config
from app import app
from database import init_db, get_user_by_username

class GuardianAngelAPITestCase(unittest.TestCase):
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
        data = response.get_json()
        self.assertEqual(data['status'], 'healthy')
        self.assertEqual(data['platform'], 'GuardianAngel')

    def test_check_username_availability(self):
        """Verify /api/check-username returns available=True for new username and False for taken ones"""
        res = self.client.get('/api/check-username?username=brand_new_genomic_id_99')
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.get_json()['available'])

        res_taken = self.client.get('/api/check-username?username=admin')
        self.assertEqual(res_taken.status_code, 200)
        self.assertFalse(res_taken.get_json()['available'])

    def test_send_and_verify_otp(self):
        """Verify send-otp and verify-otp REST endpoints"""
        res_send = self.client.post('/api/send-otp', json={'email': 'test.patient@institution.org'})
        self.assertEqual(res_send.status_code, 200)
        self.assertEqual(res_send.get_json()['status'], 'success')

        res_verify = self.client.post('/api/verify-otp', json={'email': 'test.patient@institution.org', 'otp': '9090'})
        self.assertEqual(res_verify.status_code, 200)
        self.assertEqual(res_verify.get_json()['status'], 'success')

        res_invalid = self.client.post('/api/verify-otp', json={'email': 'test.patient@institution.org', 'otp': '0000'})
        self.assertEqual(res_invalid.status_code, 400)
        self.assertEqual(res_invalid.get_json()['status'], 'error')

    def test_login_api_success_and_failure(self):
        """Verify REST login API with valid and invalid credentials"""
        res_fail = self.client.post('/api/login', json={'username': 'admin', 'password': 'wrongpassword'})
        self.assertEqual(res_fail.status_code, 401)

        res_ok = self.client.post('/api/login', json={'username': 'admin', 'password': 'admin'})
        self.assertEqual(res_ok.status_code, 200)
        data = res_ok.get_json()
        self.assertEqual(data['status'], 'success')
        self.assertEqual(data['user']['username'], 'admin')

    def test_register_api_flow(self):
        """Verify REST registration API creates user and allows login"""
        reg_payload = {
            'first_name': 'Aarav',
            'last_name': 'Mehta',
            'username': 'aarav_genomics',
            'dob': '1998-05-15',
            'email': 'aarav@clinical.org',
            'location': 'Mumbai, India',
            'password': 'StrongPassword123!',
            'otp': '9090'
        }
        res_reg = self.client.post('/api/register', json=reg_payload)
        self.assertEqual(res_reg.status_code, 201)
        self.assertEqual(res_reg.get_json()['status'], 'success')

        # Test sign-in with newly created account
        res_login = self.client.post('/api/login', json={
            'username': 'aarav_genomics',
            'password': 'StrongPassword123!'
        })
        self.assertEqual(res_login.status_code, 200)
        self.assertEqual(res_login.get_json()['user']['username'], 'aarav_genomics')

    def test_gcp_sync_export(self):
        """Verify GCS / Cloud sync export endpoint generates export safely"""
        with self.client.session_transaction() as sess:
            u = get_user_by_username('admin')
            sess['user_id'] = u['id']
        res = self.client.post('/api/gcp/sync-pedigree')
        self.assertEqual(res.status_code, 200)
        self.assertIsNotNone(res.get_json())

    def test_genwell_ai_query(self):
        """Verify GenWell AI assistant provides genomic answers"""
        with self.client.session_transaction() as sess:
            u = get_user_by_username('admin')
            sess['user_id'] = u['id']
        res = self.client.post('/api/ai/ask', json={'query': 'What is autosomal recessive inheritance?'})
        self.assertEqual(res.status_code, 200)
        self.assertIsNotNone(res.get_json())

    def test_canonical_database_path_resolution(self):
        """Verify enterprise-grade canonical database path resolution across root and backend contexts"""
        from config import _resolve_paths
        base_dir, data_dir, db_path = _resolve_paths()
        # Verify base_dir is normalized and canonical
        self.assertTrue(os.path.isabs(base_dir))
        self.assertTrue(os.path.isabs(data_dir))
        self.assertTrue(os.path.isabs(db_path))
        self.assertTrue(db_path.endswith('guardian_angel.db'))
        self.assertEqual(data_dir, os.path.dirname(db_path))

        # Verify environment variable override priority
        with tempfile.TemporaryDirectory() as custom_dir:
            custom_db = os.path.join(custom_dir, 'custom_isolated.db')
            os.environ['DATABASE_PATH'] = custom_db
            try:
                _, _, resolved_custom_db = _resolve_paths()
                self.assertEqual(resolved_custom_db, custom_db)
            finally:
                os.environ.pop('DATABASE_PATH', None)

    def test_unauthenticated_protected_api_returns_401(self):
        """Verify unauthenticated requests return 401 and are NEVER silently mutated to admin"""
        res = self.client.get('/api/families')
        self.assertEqual(res.status_code, 401)
        data = res.get_json()
        self.assertEqual(data.get('status'), 'error')

    def test_api_me_unauthenticated_and_authenticated(self):
        """Verify /api/me synchronizes user identity and rejects unauthenticated requests"""
        # Unauthenticated request
        res_unauth = self.client.get('/api/me')
        self.assertEqual(res_unauth.status_code, 401)
        self.assertEqual(res_unauth.get_json().get('status'), 'unauthenticated')

        # Authenticated request
        with self.client.session_transaction() as sess:
            u = get_user_by_username('admin')
            sess['user_id'] = u['id']

        res_auth = self.client.get('/api/me')
        self.assertEqual(res_auth.status_code, 200)
        data = res_auth.get_json()
        self.assertEqual(data.get('status'), 'success')
        self.assertEqual(data['user']['username'], 'admin')

    def test_api_logout_clears_session(self):
        """Verify /api/logout clears backend session so frontend and backend logout stay in sync"""
        with self.client.session_transaction() as sess:
            u = get_user_by_username('admin')
            sess['user_id'] = u['id']

        res_logout = self.client.post('/api/logout')
        self.assertEqual(res_logout.status_code, 200)

        # After logout, /api/me must return 401
        res_me = self.client.get('/api/me')
        self.assertEqual(res_me.status_code, 401)

    def test_family_ownership_enforcement(self):
        """Verify non-admin users cannot access family charts belonging to another user"""
        from database import create_family, create_user
        admin_u = get_user_by_username('admin')
        fam = create_family(admin_u['id'], {'family_name': 'Admin Secret Family'})
        fam_id = fam['family_id']

        # Create a regular non-admin patient
        create_user(
            username='patient_sarah',
            password='Password123!',
            email='sarah@patient.org',
            full_name='Sarah Jenkins',
            dob='1990-01-01',
            location='Boston'
        )
        sarah = get_user_by_username('patient_sarah')

        # Access family as Sarah -> must be denied (403)
        with self.client.session_transaction() as sess:
            sess['user_id'] = sarah['id']

        res = self.client.get(f'/api/families/{fam_id}')
        self.assertEqual(res.status_code, 403)

if __name__ == '__main__':
    unittest.main()
