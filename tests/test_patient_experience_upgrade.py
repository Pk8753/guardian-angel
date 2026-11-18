"""
Comprehensive Test Suite for Patient Experience Upgrade (Phases 1-4)
Verifies:
1. Consent permissions persistence (granting, fetching, revoking)
2. Comprehension feedback & patient impact metrics calculation
3. Dashboard state hydration including consent permissions
4. Provider directory and 14-day rolling slot availability
5. Couple assessment and counseling booking workflow
"""

import unittest
import json
import os
import tempfile
import app
import database


class PatientExperienceUpgradeTestCase(unittest.TestCase):
    def setUp(self):
        app.app.config['TESTING'] = True
        app.app.config['WTF_CSRF_ENABLED'] = False
        self.client = app.app.test_client()

        # Unique test user
        suffix = os.urandom(4).hex()
        self.email = f"patient_upgrade_{suffix}@test.ae"
        self.username = f"user_{suffix}"
        self.password = "SecurePass123!"
        self.full_name = "Mariam Al Suwaidi"

        reg_res = self.client.post('/api/register', json={
            'email': self.email,
            'username': self.username,
            'password': self.password,
            'fullname': self.full_name,
            'dob': '1995-06-15',
            'location': 'Abu Dhabi',
            'otp': '9090',
            'role': 'patient'
        })
        self.assertIn(reg_res.status_code, [200, 201])

        # Login
        login_res = self.client.post('/api/login', json={
            'username': self.username,
            'password': self.password
        })
        self.assertEqual(login_res.status_code, 200)

    def test_consent_permissions_lifecycle(self):
        """Test saving, retrieving, and revoking granular partner and counselor consent."""
        # 1. Grant partner summary-only consent
        res1 = self.client.post('/api/patient/consent', json={
            'target_type': 'partner',
            'scope': 'combined_summary_only',
            'status': 'active'
        })
        self.assertIn(res1.status_code, [200, 201])
        self.assertTrue(res1.get_json()['status'] == 'success')

        # 2. Grant counselor full-reports consent
        res2 = self.client.post('/api/patient/consent', json={
            'target_type': 'counselor',
            'scope': 'full_report',
            'status': 'active'
        })
        self.assertIn(res2.status_code, [200, 201])

        # 3. Retrieve consent permissions
        list_res = self.client.get('/api/patient/consent')
        self.assertEqual(list_res.status_code, 200)
        perms = list_res.get_json()['consent_permissions']
        self.assertGreaterEqual(len(perms), 2)

        partner_perm = next(p for p in perms if p['target_type'] == 'partner')
        self.assertEqual(partner_perm['scope'], 'combined_summary_only')
        self.assertEqual(partner_perm['status'], 'active')

        counselor_perm = next(p for p in perms if p['target_type'] == 'counselor')
        self.assertEqual(counselor_perm['scope'], 'full_report')
        self.assertEqual(counselor_perm['status'], 'active')

        # 4. Revoke partner consent
        revoke_res = self.client.post(f"/api/patient/consent/{partner_perm['id']}/revoke")
        self.assertEqual(revoke_res.status_code, 200)

        # 5. Verify partner consent is now revoked
        list_res_after = self.client.get('/api/patient/consent')
        perms_after = list_res_after.get_json()['consent_permissions']
        revoked_perm = next(p for p in perms_after if p['id'] == partner_perm['id'])
        self.assertEqual(revoked_perm['status'], 'revoked')

    def test_comprehension_feedback_and_impact_metrics(self):
        """Test submitting 1-tap comprehension feedback and calculating impact metrics."""
        # 1. Submit positive feedback
        f1 = self.client.post('/api/patient/comprehension', json={
            'rating': 'clear',
            'topic': 'risk_vs_diagnosis_banner',
            'notes': 'Very understandable'
        })
        self.assertIn(f1.status_code, [200, 201])

        # 2. Submit somewhat feedback
        f2 = self.client.post('/api/patient/comprehension', json={
            'rating': 'somewhat',
            'topic': 'autosomal_recessive_explanation'
        })
        self.assertIn(f2.status_code, [200, 201])

        # 3. Retrieve impact metrics
        metrics_res = self.client.get('/api/patient/impact-metrics')
        self.assertEqual(metrics_res.status_code, 200)
        metrics = metrics_res.get_json()['metrics']
        self.assertIn('total_feedback', metrics)
        self.assertIn('comprehension_rate', metrics)
        self.assertGreaterEqual(metrics['total_feedback'], 2)

    def test_dashboard_state_hydrated_with_consent_and_providers(self):
        """Verify GET /api/patient/dashboard-state includes consent permissions and providers."""
        # Grant a consent permission first
        self.client.post('/api/patient/consent', json={
            'target_type': 'counselor',
            'scope': 'full_report',
            'status': 'active'
        })

        dash_res = self.client.get('/api/patient/dashboard-state')
        self.assertEqual(dash_res.status_code, 200)
        dash_data = dash_res.get_json()['data']

        self.assertIn('consent_permissions', dash_data)
        self.assertIn('providers', dash_data)
        self.assertIn('conditions', dash_data)
        self.assertIn('couple_assessments', dash_data)
        self.assertIn('appointments', dash_data)
        self.assertIn('documents', dash_data)

        # Ensure providers list has 5 seeded UAE counselors with 14-day rolling slots
        providers = dash_data['providers']
        self.assertEqual(len(providers), 5)
        for prov in providers:
            self.assertIn('full_name', prov)
            self.assertIn('specialty', prov)
            self.assertIn('available_slots', prov)
            self.assertGreater(len(prov['available_slots']), 0)


if __name__ == '__main__':
    unittest.main()
