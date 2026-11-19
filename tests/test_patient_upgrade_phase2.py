import unittest
import json
from app import app
from database import get_user_by_username, create_appointment, get_appointments_for_patient, get_appointments_for_provider

class TestPatientUpgradePhase2(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    def test_demo_patient_account_exists_and_hydrated(self):
        with app.app_context():
            patient = get_user_by_username('patient')
            self.assertIsNotNone(patient)
            self.assertEqual(patient['email'], 'patient@guardianangel.ae')
            self.assertEqual(patient['full_name'], 'Tariq Al-Mansoor')
            self.assertEqual(patient['role'], 'patient')

    def test_demo_provider_account_exists(self):
        with app.app_context():
            provider = get_user_by_username('provider')
            self.assertIsNotNone(provider)
            self.assertEqual(provider['email'], 'provider@guardianangel.ae')
            self.assertEqual(provider['full_name'], 'Dr. Mariam Al Mansoori')
            self.assertEqual(provider['role'], 'provider')

    def test_demo_logins_via_api(self):
        # Patient login
        res_patient = self.app.post('/api/login', json={
            'username': 'patient@guardianangel.ae',
            'password': 'Patient123!'
        })
        self.assertEqual(res_patient.status_code, 200)
        p_data = json.loads(res_patient.data)
        self.assertEqual(p_data['status'], 'success')
        self.assertEqual(p_data['user']['role'], 'patient')

        # Provider login
        res_provider = self.app.post('/api/login', json={
            'username': 'provider@guardianangel.ae',
            'password': 'Provider123!'
        })
        self.assertEqual(res_provider.status_code, 200)
        pr_data = json.loads(res_provider.data)
        self.assertEqual(pr_data['status'], 'success')
        self.assertEqual(pr_data['user']['role'], 'provider')

    def test_multi_tab_session_isolation_via_header(self):
        with app.app_context():
            p_user = get_user_by_username('patient')
            pr_user = get_user_by_username('provider')

        # Patient Tab request using header
        res1 = self.app.get('/api/profile', headers={'X-Session-User-Id': str(p_user['id'])})
        self.assertEqual(res1.status_code, 200)
        data1 = json.loads(res1.data)
        self.assertEqual(data1['profile']['user_id'], p_user['id'])

        # Provider Tab request using header in same client
        res2 = self.app.get('/api/profile', headers={'X-Session-User-Id': str(pr_user['id'])})
        self.assertEqual(res2.status_code, 200)
        data2 = json.loads(res2.data)
        self.assertEqual(data2['profile']['user_id'], pr_user['id'])

    def test_consent_based_encrypted_booking(self):
        with app.app_context():
            p_user = get_user_by_username('patient')
            p_id = p_user['id']

        # Book appointment with share_personal_details = 0
        res = self.app.post(
            '/api/appointments',
            headers={'X-Session-User-Id': str(p_id)},
            json={
                'provider_id': 1,
                'assessment_type': 'self',
                'slot': 'Next Monday at 11:00 AM',
                'notes': 'Privacy test booking',
                'share_personal_details': 0
            }
        )
        self.assertEqual(res.status_code, 201)
        data = json.loads(res.data)
        appt_id = data['appointment_id']

        # Verify Patient sees their appointment with encrypted reference
        res_pat = self.app.get('/api/appointments', headers={'X-Session-User-Id': str(p_id)})
        self.assertEqual(res_pat.status_code, 200)
        pat_appts = json.loads(res_pat.data)['appointments']
        target_pat = next((a for a in pat_appts if a['id'] == appt_id), None)
        self.assertIsNotNone(target_pat)
        self.assertEqual(target_pat['share_personal_details'], 0)
        self.assertTrue(target_pat['encrypted_patient_ref'].startswith('REF-'))

        # Verify Provider view masks the patient identity
        with app.app_context():
            prov_appts = get_appointments_for_provider(1)
            target_prov = next((a for a in prov_appts if a['id'] == appt_id), None)
            self.assertIsNotNone(target_prov)
            self.assertTrue('REF-' in target_prov['patient_name'])
            self.assertEqual(target_prov['patient_email'], '[Confidential - Encrypted Booking]')

    def test_conditions_and_providers_endpoints(self):
        res_cond = self.app.get('/api/patient/conditions')
        self.assertEqual(res_cond.status_code, 200)
        c_data = json.loads(res_cond.data)
        self.assertEqual(c_data['status'], 'success')
        self.assertEqual(len(c_data['conditions']), 6)

        res_prov = self.app.get('/api/patient/providers')
        self.assertEqual(res_prov.status_code, 200)
        p_data = json.loads(res_prov.data)
        self.assertEqual(p_data['status'], 'success')
        self.assertEqual(len(p_data['providers']), 5)

if __name__ == '__main__':
    unittest.main()

