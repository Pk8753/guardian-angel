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

    def test_report_analyze_in_memory_and_pii_masking(self):
        """Verify zero-storage in-memory report analysis, 2-character name masking, dynamic PII, and encrypted persistence"""
        import io
        from database import get_user_scraped_reports, get_db_connection
        admin_u = get_user_by_username('admin')
        with self.client.session_transaction() as sess:
            sess['user_id'] = admin_u['id']

        # 1. Reject invalid file format
        fake_txt = (io.BytesIO(b"Confidential Report"), "report.txt")
        res = self.client.post('/api/reports/analyze', data={'file': fake_txt}, content_type='multipart/form-data')
        self.assertEqual(res.status_code, 400)
        self.assertIn("Invalid file format", res.get_json()['message'])

        # 2. Accept valid PDF file and return masked data with 2-char name masking, screening findings, and pedigree tree creation
        pdf_content = b"%PDF-1.4 (Patient Name: Kabir Sharma, Sex: (Male), DOB: 1994-06-15, Location: Dubai, UAE, SSN: 123-45-6789, Emirates ID: 784-1995-1234567-1, Thalassemia carrier) Tj"
        fake_pdf = (io.BytesIO(pdf_content), "premarital_thalassemia_screen.pdf")
        res_pdf = self.client.post('/api/reports/analyze', data={'file': fake_pdf}, content_type='multipart/form-data')
        self.assertEqual(res_pdf.status_code, 200)
        data = res_pdf.get_json()
        self.assertEqual(data['status'], 'success')
        self.assertIn('masked_data', data)
        self.assertTrue(data['tree_created'])
        self.assertTrue(data['family_id'].startswith('FA-'))
        created_fam_id = data['family_id']
        self.assertEqual(data['sex'], 'male')
        self.assertEqual(data['dob'], '1994-06-15')
        self.assertEqual(data['location'], 'Dubai, UAE')
        # Sudo name format: _____-_____-<2 initials of first name>__number (e.g., Keen-Eagle-ka-8241)
        self.assertIn('-ka-', data['sudo_name'])

        masked = data['masked_data']
        self.assertEqual(masked['condition'], 'Beta-Thalassemia Minor / Trait')
        self.assertIn('HBB', masked['gene_locus'])
        self.assertIn('Heterozygous Carrier', masked['carrier_status'])

        # Verify 2-character and last 2-character name masking (KAXXXXMA)
        self.assertIn('patient_name_masked', masked)
        self.assertTrue(masked['patient_name_masked'].startswith('KA'))
        self.assertIn('XXXX', masked['patient_name_masked'])
        self.assertTrue(masked['patient_name_masked'].endswith('MA'))

        # Verify ONLY present identifiers are in redacted_pii_present
        present_fields = [item['field'] for item in masked['redacted_pii_present']]
        self.assertIn('Social Security Number (SSN)', present_fields)
        self.assertIn('Emirates National ID', present_fields)
        self.assertIn('Patient Name', present_fields)
        # Aadhaar was NOT in this PDF, so it must NOT be in the list
        self.assertNotIn('Aadhaar Card Number', present_fields)

        # Verify screening findings are present with values and clinical meanings
        findings = masked['screening_findings']
        self.assertTrue(len(findings) >= 3)
        hba2_finding = next((f for f in findings if 'HbA2' in f['parameter']), None)
        self.assertIsNotNone(hba2_finding)
        self.assertEqual(hba2_finding['value'], '5.4%')
        self.assertIn('diagnostic', hba2_finding['clinical_meaning'].lower())

        # Verify member was created in pedigree_nodes under this family
        conn = get_db_connection()
        node_row = conn.execute("SELECT * FROM pedigree_nodes WHERE family_id = ? AND alias_name = ?", (created_fam_id, data['sudo_name'])).fetchone()
        conn.close()
        self.assertIsNotNone(node_row)
        self.assertEqual(node_row['sex'], 'male')
        self.assertEqual(node_row['alias_name'], data['sudo_name'])
        self.assertEqual(node_row['location'], 'Dubai, UAE')

        # Verify uploading a second report to existing tree with first name initials in sudo name
        pdf_partner = b"%PDF-1.4 (Patient Name: Fatima Al-Mansoor, Sex: (Female), DOB: 1996-08-20, Location: Abu Dhabi, UAE, Sickle Cell trait carrier) Tj"
        fake_pdf_partner = (io.BytesIO(pdf_partner), "partner_sickle_screen.pdf")
        res_partner = self.client.post('/api/reports/analyze', data={
            'file': fake_pdf_partner,
            'target_tree': 'existing',
            'family_id': created_fam_id
        }, content_type='multipart/form-data')
        self.assertEqual(res_partner.status_code, 200)
        data_partner = res_partner.get_json()
        self.assertFalse(data_partner['tree_created'])
        self.assertEqual(data_partner['family_id'], created_fam_id)
        self.assertEqual(data_partner['sex'], 'female')
        self.assertEqual(data_partner['dob'], '1996-08-20')
        self.assertEqual(data_partner['location'], 'Abu Dhabi, UAE')
        self.assertIn('-fa-', data_partner['sudo_name'])

        # Verify database record saved under original file_name and stored in encrypted format
        conn = get_db_connection()
        row = conn.execute("SELECT file_name, masked_data FROM scraped_reports WHERE user_id = ? ORDER BY id DESC LIMIT 1", (admin_u['id'],)).fetchone()
        conn.close()
        self.assertEqual(row['file_name'], 'partner_sickle_screen.pdf')
        raw_db_masked_data = row['masked_data']
        # Must not be raw plaintext JSON in database (encrypted with fernet or std)
        self.assertTrue(raw_db_masked_data.startswith(('fernet:', 'std:')))

        # Verify helper get_user_scraped_reports decrypts it back
        reports = get_user_scraped_reports(admin_u['id'])
        self.assertTrue(len(reports) > 0)
        latest_report = reports[0]
        self.assertEqual(latest_report['file_name'], 'partner_sickle_screen.pdf')
        self.assertEqual(latest_report['masked_data']['condition'], 'Sickle Cell Anemia / Trait')

        # Verify deduplication: Uploading the exact same report twice recognizes existing user and does not duplicate
        fake_pdf_partner_dup = (io.BytesIO(pdf_partner), "partner_sickle_screen.pdf")
        res_partner_dup = self.client.post('/api/reports/analyze', data={
            'file': fake_pdf_partner_dup,
            'target_tree': 'existing',
            'family_id': created_fam_id
        }, content_type='multipart/form-data')
        self.assertEqual(res_partner_dup.status_code, 200)
        data_partner_dup = res_partner_dup.get_json()
        self.assertTrue(data_partner_dup['already_exists'])
        self.assertEqual(data_partner_dup['sudo_name'], data_partner['sudo_name'])
        self.assertEqual(data_partner_dup['member_id'], data_partner['member_id'])
        self.assertIn("user already exist", data_partner_dup['message'])

        # Test individual report deletion
        del_res = self.client.delete(f'/api/reports/scraped/{data_partner_dup["report_id"]}')
        self.assertEqual(del_res.status_code, 200)
        self.assertIn("successfully deleted", del_res.get_json()['message'])

        # Test bulk report deletion
        bulk_del_res = self.client.post('/api/reports/scraped/bulk-delete', json={'report_ids': [data['report_id']]})
        self.assertEqual(bulk_del_res.status_code, 200)
        self.assertEqual(bulk_del_res.get_json()['status'], 'success')

        # 3. Accept valid JPG file with (Male/Female) gender detection from image
        jpg_content = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00\xff\xfe\x00:Patient Name: Alya Al-Zahra, Gender: (Female), DOB: 1998-04-12, Location: Dubai, UAE\xff\xdb\x00C\x00" + b"\x00" * 100
        fake_jpg = (io.BytesIO(jpg_content), "genetic_test_cftr_female.jpg")
        res_jpg = self.client.post('/api/reports/analyze', data={'file': fake_jpg}, content_type='multipart/form-data')
        self.assertEqual(res_jpg.status_code, 200)
        jpg_data = res_jpg.get_json()
        self.assertEqual(jpg_data['status'], 'success')
        self.assertEqual(jpg_data['sex'], 'female')
        self.assertEqual(jpg_data['dob'], '1998-04-12')
        self.assertEqual(jpg_data['location'], 'Dubai, UAE')
        self.assertIn('-al-', jpg_data['sudo_name'])

        # 4. FlateDecode (zlib-compressed) PDF with TJ kerning arrays and non-user candidate name
        import zlib
        stream_body = b"""
        BT
        /F1 12 Tf
        [(Candidate Name: ) -10 (Rashid ) 5 (Al Ketbi)] TJ
        0 -15 Td
        (Sex: (Male)) Tj
        0 -15 Td
        (Date of Birth: 22/11/1991) Tj
        0 -15 Td
        (Location: Abu Dhabi, UAE) Tj
        0 -15 Td
        (CFTR deltaF508 carrier finding) Tj
        ET
        """
        compressed_stream = zlib.compress(stream_body)
        pdf_compressed = b"%PDF-1.4\n1 0 obj\n<< /Length 200 /Filter /FlateDecode >>\nstream\r\n" + compressed_stream + b"\r\nendstream\nendobj\n%%EOF"
        fake_pdf_comp = (io.BytesIO(pdf_compressed), "ADPHC_compressed_screen.pdf")
        res_comp = self.client.post('/api/reports/analyze', data={'file': fake_pdf_comp}, content_type='multipart/form-data')
        self.assertEqual(res_comp.status_code, 200)
        comp_data = res_comp.get_json()
        self.assertEqual(comp_data['status'], 'success')
        self.assertEqual(comp_data['sex'], 'male')
        self.assertEqual(comp_data['dob'], '22/11/1991')
        self.assertEqual(comp_data['location'], 'Abu Dhabi, UAE')
        self.assertIn('-ra-', comp_data['sudo_name'])
        self.assertTrue(comp_data['masked_data']['patient_name_masked'].startswith('RA'))
        self.assertNotIn('System', comp_data['masked_data']['patient_name_masked'])

        # 5. Report without candidate name must NOT fall back to logged-in user
        pdf_anon = b"%PDF-1.4 (G6PD Mediterranean Variant carrier, Sex: (Female), DOB: 1997-03-15) Tj"
        fake_pdf_anon = (io.BytesIO(pdf_anon), "anon_g6pd_screen.pdf")
        res_anon = self.client.post('/api/reports/analyze', data={'file': fake_pdf_anon}, content_type='multipart/form-data')
        self.assertEqual(res_anon.status_code, 200)
        anon_data = res_anon.get_json()
        self.assertEqual(anon_data['status'], 'success')
        self.assertEqual(anon_data['masked_data']['patient_name_masked'], 'CAXXXXTE')
        self.assertIn('-cn-', anon_data['sudo_name'])
        anon_pii_fields = [p['field'] for p in anon_data['masked_data']['redacted_pii_present']]
        self.assertNotIn('Patient Name', anon_pii_fields)

        # 6. Candidate Pankaj Killura with exact DOB preservation and -pa- initials in pseudonym
        pdf_pankaj = b"""%PDF-1.4
1 0 obj
<< /Length 180 /Filter /FlateDecode >>
stream
""" + zlib.compress(b"""
BT
/F1 12 Tf
[(Candidate Name\n) -100 (Pankaj ) 50 (Killura)] TJ
0 -15 Td
(Date of Birth / \xd8\xaa\xd8\xa7\xd8\xb1\xd9\x8a\xd8\xae \xd8\xa7\xd9\x84\xd9\x85\xd9\x8a\xd9\x84\xd8\xa7\xd8\xaf: 14/08/1995) Tj
0 -15 Td
(Sex: Male) Tj
0 -15 Td
(Beta-Thalassemia Minor Carrier) Tj
ET
""") + b"""
endstream
endobj
%%EOF"""
        fake_pdf_pk = (io.BytesIO(pdf_pankaj), "ADPHC_pankaj_screen.pdf")
        res_pk = self.client.post('/api/reports/analyze', data={'file': fake_pdf_pk}, content_type='multipart/form-data')
        self.assertEqual(res_pk.status_code, 200)
        pk_data = res_pk.get_json()
        self.assertEqual(pk_data['status'], 'success')
        self.assertEqual(pk_data['sex'], 'male')
        self.assertEqual(pk_data['dob'], '14/08/1995')
        self.assertIn('-pa-', pk_data['sudo_name'])
        self.assertTrue(pk_data['masked_data']['patient_name_masked'].startswith('PA'))
        self.assertIn('XXXX', pk_data['masked_data']['patient_name_masked'])

    def test_report_analyze_with_pymupdf_extraction(self):
        """Verify PyMuPDF extracts full text, preserves complete report, unmasked name, and clinical findings"""
        import io
        import pymupdf as fitz
        admin_u = get_user_by_username('admin')
        with self.client.session_transaction() as sess:
            sess['user_id'] = admin_u['id']

        # Generate a valid PDF using PyMuPDF in memory
        doc = fitz.open()
        page = doc.new_page()
        report_text = (
            "Department of Health - Abu Dhabi\n"
            "Premarital Genetic Screening Report\n"
            "Patient Name: Tariq Al-Hashimi\n"
            "Sex: Male\n"
            "DOB: 1993-05-12\n"
            "Location: Abu Dhabi, UAE\n"
            "Condition: Sickle Cell Anemia / Trait\n"
            "Variant: HBB:c.20A>T (p.Glu6Val)\n"
            "Result: Heterozygous Carrier\n"
        )
        page.insert_text((50, 72), report_text)
        pdf_bytes = doc.tobytes()
        doc.close()

        upload_pdf = (io.BytesIO(pdf_bytes), "tariq_sickle_screen.pdf")
        res = self.client.post('/api/reports/analyze', data={'file': upload_pdf}, content_type='multipart/form-data')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['status'], 'success')
        self.assertEqual(data['sex'], 'male')
        self.assertEqual(data['dob'], '1993-05-12')
        self.assertEqual(data['location'], 'Abu Dhabi, UAE')
        self.assertEqual(data['patient_name'], 'TAXXXXMI')
        self.assertIn('complete_report_text', data)
        self.assertIn('TAXXXXMI', data['complete_report_text'])
        self.assertNotIn('Tariq Al-Hashimi', data['complete_report_text'])
        self.assertIn('Sickle Cell Anemia', data['complete_report_text'])
        self.assertEqual(data['masked_data']['condition'], 'Sickle Cell Anemia / Trait')

    def test_uaepass_status_endpoint(self):
        """Verify /api/uaepass/status returns configured environment and endpoints"""
        res = self.client.get('/api/uaepass/status')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['status'], 'success')
        self.assertEqual(data['environment'], 'staging')
        self.assertEqual(data['client_id'], 'sandbox_stage')
        self.assertIn('stg-id.uaepass.ae', data['endpoints']['auth_url'])

    def test_uaepass_login_initiates_oauth(self):
        """Verify /api/uaepass/login returns proper OAuth authorization URL and sets CSRF state"""
        # Test JSON format
        res_json = self.client.get('/api/uaepass/login?format=json')
        self.assertEqual(res_json.status_code, 200)
        data = res_json.get_json()
        self.assertEqual(data['status'], 'success')
        self.assertIn('stg-id.uaepass.ae/idshub/authorize', data['auth_url'])
        self.assertIn('client_id=sandbox_stage', data['auth_url'])
        self.assertIn('response_type=code', data['auth_url'])
        self.assertIn('state=', data['auth_url'])

        # Test Browser redirect format
        res_redir = self.client.get('/api/uaepass/login')
        self.assertEqual(res_redir.status_code, 302)
        self.assertIn('stg-id.uaepass.ae/idshub/authorize', res_redir.headers['Location'])

    def test_uaepass_sandbox_login_bypass(self):
        """Verify /api/uaepass/sandbox-login initiates direct session establishment"""
        res = self.client.get('/api/uaepass/sandbox-login', follow_redirects=True)
        self.assertEqual(res.status_code, 200)
        # Verify authenticated session with /api/me
        res_me = self.client.get('/api/me')
        self.assertEqual(res_me.status_code, 200)
        user_data = res_me.get_json()['user']
        self.assertEqual(user_data['full_name'], 'Fatima Al-Nuaimi')

    def test_uaepass_callback_csrf_rejection(self):
        """Verify callback rejects requests with missing or invalid CSRF state"""
        # Missing state
        res = self.client.get('/api/uaepass/callback?code=mock_sandbox_code')
        self.assertEqual(res.status_code, 302)
        self.assertIn('error=', res.headers['Location'])

        # Mismatched state
        with self.client.session_transaction() as sess:
            sess['uaepass_state'] = 'correct_state_token'
        res_mismatch = self.client.get('/api/uaepass/callback?code=mock_sandbox_code&state=wrong_state')
        self.assertEqual(res_mismatch.status_code, 302)
        self.assertIn('error=', res_mismatch.headers['Location'])

    def test_uaepass_callback_error_param(self):
        """Verify callback handles explicit error from provider"""
        res = self.client.get('/api/uaepass/callback?error=access_denied&error_description=Cancelled+by+user')
        self.assertEqual(res.status_code, 302)
        import urllib.parse
        self.assertIn('Cancelled by user', urllib.parse.unquote(res.headers['Location']))

    def test_uaepass_callback_success_creates_user_and_session(self):
        """Verify callback exchanges mock staging code, creates user, and logs in session"""
        state_token = 'valid_secure_state_12345'
        with self.client.session_transaction() as sess:
            sess['uaepass_state'] = state_token

        res = self.client.get(f'/api/uaepass/callback?code=mock_sandbox_code&state={state_token}')
        self.assertEqual(res.status_code, 302)
        self.assertIn('/dashboard', res.headers['Location'])
        self.assertIn('ga_auth_session=1', res.headers.get('Set-Cookie', ''))

        # Verify authenticated session with /api/me
        res_me = self.client.get('/api/me')
        self.assertEqual(res_me.status_code, 200)
        user_data = res_me.get_json()['user']
        self.assertEqual(user_data['full_name'], 'Fatima Al-Nuaimi')
        self.assertTrue(user_data['alias_name'])
        self.assertIn('-fa-', user_data['alias_name'])

    def test_uaepass_callback_links_existing_user(self):
        """Verify callback links an existing user account by email without duplication"""
        from database import create_user, get_user_by_username
        create_user(
            username='fatima_existing',
            password='Password123!',
            email='fatima.alnuaimi@uaepass.ae',
            full_name='Fatima Al-Nuaimi Existing',
            dob='1992-05-18'
        )

        state_token = 'state_link_user_789'
        with self.client.session_transaction() as sess:
            sess['uaepass_state'] = state_token

        res = self.client.get(f'/api/uaepass/callback?code=mock_sandbox_code&state={state_token}')
        self.assertEqual(res.status_code, 302)

        # Check existing user was linked
        user = get_user_by_username('fatima.alnuaimi@uaepass.ae')
        self.assertIsNotNone(user['uaepass_uuid'])
        self.assertEqual(user['uaepass_uuid'], 'uaepass-stg-cit-88910-fe2')

    def test_ai_system_status(self):
        """Verify GET /api/ai/system-status returns Qwen3, BGE-M3, and Qdrant status"""
        from database import get_user_by_username
        with self.client.session_transaction() as sess:
            u = get_user_by_username('admin')
            sess['user_id'] = u['id']

        res = self.client.get('/api/ai/system-status')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get('airgap_mode'))
        services = data.get('services', {})
        self.assertIn('qwen3', services)
        self.assertIn('bge_m3', services)
        self.assertIn('qdrant', services)

    def test_policy_document_lifecycle_and_qdrant_query(self):
        """Verify upload, vector indexing, retrieval, search, and deletion of health policy documents"""
        import io
        from database import get_user_by_username
        with self.client.session_transaction() as sess:
            u = get_user_by_username('admin')
            sess['user_id'] = u['id']

        # Upload a simulated health policy PDF
        fake_pdf = io.BytesIO(b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< >>\n%%EOF\nNational Premarital Screening Guidelines: Screening Center Alpha provides Beta-Thalassemia and G6PD screening for all couples.")
        res = self.client.post(
            '/api/policy-documents/upload',
            data={
                'file': (fake_pdf, 'uae_health_policy.pdf'),
                'title': 'UAE National Health Policy 2026'
            },
            content_type='multipart/form-data'
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data.get('status'), 'success')
        docs = data.get('documents', [])
        self.assertTrue(len(docs) > 0)
        doc_id = docs[0]['id']

        # Retrieve documents
        res_list = self.client.get('/api/policy-documents')
        self.assertEqual(res_list.status_code, 200)
        all_docs = res_list.get_json()
        self.assertTrue(any(d['id'] == doc_id for d in all_docs))

        # Verify persistent policy chunks in SQLite
        from database import get_policy_chunks
        chunks = get_policy_chunks(doc_id=doc_id)
        self.assertTrue(len(chunks) > 0)
        self.assertEqual(len(chunks[0]['embedding']), 1024)

        # Query Ask Care AI leveraging knowledge and verify excerpt extraction
        res_ask = self.client.post('/api/ai/ask', json={'query': 'Which screening center provides Beta-Thalassemia tests?'})
        self.assertEqual(res_ask.status_code, 200)
        ask_data = res_ask.get_json()
        self.assertIsNotNone(ask_data.get('answer'))
        self.assertIn('matched_chunks', ask_data)

        # Delete document
        res_del = self.client.delete(f'/api/policy-documents/{doc_id}')
        self.assertEqual(res_del.status_code, 200)

        # Verify cascading deletion of chunks from SQLite
        remaining_chunks = get_policy_chunks(doc_id=doc_id)
        self.assertEqual(len(remaining_chunks), 0)

    def test_qwen_couple_assessment(self):
        """Verify POST /api/ai/analyze-assessment returns positive vibe couple assessment and next steps"""
        from database import get_user_by_username
        with self.client.session_transaction() as sess:
            u = get_user_by_username('admin')
            sess['user_id'] = u['id']

        res = self.client.post(
            '/api/ai/analyze-assessment',
            json={'partner_a': 'Tariq Al-Mansoor', 'partner_b': 'Fatima Al-Zahra'}
        )
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn('positive_summary', data)
        self.assertIn('motivational_insight', data)
        self.assertIn('next_possible_ways', data)
        self.assertIn('potential_queries', data)
        self.assertTrue(len(data['next_possible_ways']) > 0)
        self.assertTrue(len(data['potential_queries']) > 0)

if __name__ == '__main__':
    unittest.main()
