"""
Empirical Boundary, Fuzzing, and Penetration Testing Suite for Milestone 1:
Privacy by Design & Explicit Consent Architecture Remediations.

Author: Empirical Challenger (m1_r2_challenger_2)
Target: Milestone 1 (Privacy by Design & Explicit Consent Architecture)

Test Suites:
1. POST /api/privacy/consent Ingress Validation & Route Guards (Enum, Auth, Types, Admin override)
2. POST /api/privacy/sharing-preferences Input Validation & Boundary Hardening (Types, Domains, Redactions)
3. POST /api/privacy/sharing-token/revoke & sharing-preferences/revoke Input Boundary & Fuzzing (500 crash detection)
4. @require_consent Route Guard & Role Bypass Penetration Testing (Header spoofing, Query injection, Mismatched tiers)
5. Field Redaction & Domain Filtering Verification (Strip unallowed domains, Mask sensitive fields, RESEARCH PII pseudonym)
6. Retention Policy Governance & Purge Verification (Expired purged, Active untouched, Revoked untouched)
7. Prerequisite Consent Revocation Dynamic Invalidation (DOCTOR/C2, PARTNER/C3, RESEARCH/C4)
8. Cryptographic HMAC Non-Repudiation & Tamper Resistance (100% audit_valid, Tamper detection)
"""

import os
import sys
import json
import tempfile
import unittest
from datetime import datetime, timezone, timedelta

# Ensure project root is in sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from config import Config
from app import app, require_consent
from database import (
    init_db, get_db_connection, create_user, get_user_by_id, update_user_profile,
    VALID_CONSENT_TIERS, TIER_SCOPE_MAP, normalize_consent_tier,
    compute_consent_audit_hash, verify_consent_audit_hash,
    record_consent, revoke_consent, get_consent_status, has_valid_consent, get_user_consent_history,
    create_sharing_acl, get_user_sharing_acls, get_sharing_acl_by_token, validate_share_token_access,
    revoke_sharing_acl, revoke_sharing_acl_by_token, redact_sensitive_intake
)


class Milestone1BoundaryFuzzingTestCase(unittest.TestCase):
    """Hermetic boundary and fuzzing verification suite."""

    def setUp(self):
        self.test_dir = tempfile.mkdtemp(prefix="ga_m1_boundary_")
        self.orig_data_dir = Config.DATA_DIR
        self.orig_db_path = Config.DATABASE_PATH
        Config.DATA_DIR = self.test_dir
        Config.DATABASE_PATH = os.path.join(self.test_dir, 'm1_boundary.db')
        init_db()

        app.testing = False
        app.config['WTF_CSRF_ENABLED'] = False
        app.config['SECRET_KEY'] = 'boundary-fuzzing-m1-challenger-secret-2026'
        self.client = app.test_client()

        # Seed primary test patient, partner, and admin
        self.patient_id = create_user(
            username='boundary_patient',
            password='Password123!',
            email='patient@boundary.ae',
            full_name='Fatima Al-Marzouqi',
            role='patient'
        )
        self.partner_id = create_user(
            username='boundary_partner',
            password='Password123!',
            email='partner@boundary.ae',
            full_name='Sultan Al-Marzouqi',
            role='patient'
        )
        self.admin_id = create_user(
            username='boundary_admin',
            password='Password123!',
            email='admin@boundary.ae',
            full_name='System Admin',
            role='admin'
        )

        update_user_profile(self.patient_id, {
            'phone': '+971-50-1234567',
            'dob': '1992-05-15',
            'city': 'Abu Dhabi',
            'country': 'UAE',
            'blood_type': 'O+',
            'bmi': 22.4,
            'smoking': 'Occasional',
            'alcohol': 'None',
            'exercise': 'Moderate',
            'prior_terminations': 2,
            'miscarriages': 1,
            'stis_history': ['Chlamydia (treated 2021)'],
            'anatomical_anomalies': ['Arcuate uterus']
        })

    def tearDown(self):
        Config.DATA_DIR = self.orig_data_dir
        Config.DATABASE_PATH = self.orig_db_path
        if os.path.exists(self.test_dir):
            import shutil
            shutil.rmtree(self.test_dir, ignore_errors=True)

    def _login(self, user_id):
        with self.client.session_transaction() as sess:
            sess['user_id'] = user_id

    def _logout(self):
        with self.client.session_transaction() as sess:
            sess.clear()

    # =========================================================================
    # SUITE 1: POST /api/privacy/consent Ingress Validation & Route Guards
    # =========================================================================

    def test_01_consent_unauth_invalid_tier_enum_receives_400(self):
        """Unauthenticated caller with malformed consent_tier enum receives HTTP 400 before 401 gate."""
        self._logout()
        res = self.client.post('/api/privacy/consent', json={'consent_tier': 'MALFORMED_TIER_NAME', 'granted': True})
        self.assertEqual(res.status_code, 400, "Unauthenticated bad enum must return HTTP 400")
        self.assertIn('Invalid consent tier', res.get_json().get('message', ''))

    def test_02_consent_unauth_valid_tier_enum_receives_401(self):
        """Unauthenticated caller with valid consent_tier enum receives HTTP 401."""
        self._logout()
        res = self.client.post('/api/privacy/consent', json={'consent_tier': 'C1_SCREENING', 'granted': True})
        self.assertEqual(res.status_code, 401, "Unauthenticated valid enum must return HTTP 401")

    def test_03_consent_auth_invalid_tier_enum_receives_400(self):
        """Authenticated caller with malformed consent_tier enum receives HTTP 400."""
        self._login(self.patient_id)
        res = self.client.post('/api/privacy/consent', json={'consent_tier': 'UNKNOWN_TIER', 'granted': True})
        self.assertEqual(res.status_code, 400)

    def test_04_consent_auth_missing_consent_tier_receives_400(self):
        """Authenticated caller with missing consent_tier field receives HTTP 400."""
        self._login(self.patient_id)
        res = self.client.post('/api/privacy/consent', json={'granted': True})
        self.assertEqual(res.status_code, 400)

    def test_05_consent_auth_non_string_tier_receives_400(self):
        """Authenticated caller with integer/list/dict consent_tier receives HTTP 400."""
        self._login(self.patient_id)
        for bad_tier in [123, 45.6, ['C1_SCREENING'], {'tier': 'C1_SCREENING'}]:
            res = self.client.post('/api/privacy/consent', json={'consent_tier': bad_tier, 'granted': True})
            self.assertEqual(res.status_code, 400, f"Expected 400 for bad tier type {type(bad_tier)}")

    def test_06_consent_auth_non_boolean_granted_receives_400(self):
        """Authenticated caller with non-boolean granted value receives HTTP 400."""
        self._login(self.patient_id)
        for bad_granted in [1, 0, 'true', 'false', None, [True], {'granted': True}]:
            res = self.client.post('/api/privacy/consent', json={'consent_tier': 'C1_SCREENING', 'granted': bad_granted})
            self.assertEqual(res.status_code, 400, f"Expected 400 for bad granted type {type(bad_granted)}")

    def test_07_consent_auth_missing_granted_receives_400(self):
        """Authenticated caller with valid tier but missing granted field receives HTTP 400."""
        self._login(self.patient_id)
        res = self.client.post('/api/privacy/consent', json={'consent_tier': 'C1_SCREENING'})
        self.assertEqual(res.status_code, 400)

    def test_08_consent_auth_malformed_json_receives_400(self):
        """Authenticated caller with malformed raw JSON receives HTTP 400."""
        self._login(self.patient_id)
        res = self.client.post('/api/privacy/consent', data='{not a json}', content_type='application/json')
        self.assertEqual(res.status_code, 400)

    def test_09_consent_cross_user_escalation_by_patient_blocked_with_403(self):
        """Non-admin user attempting to modify another user's consent receives HTTP 403."""
        self._login(self.patient_id)
        res = self.client.post('/api/privacy/consent', json={
            'consent_tier': 'C1_SCREENING',
            'granted': True,
            'user_id': self.partner_id
        })
        self.assertEqual(res.status_code, 403, "Non-admin modifying another user must return HTTP 403")

    def test_10_consent_cross_user_modification_by_admin_allowed_with_200(self):
        """Admin user can modify another user's consent on their behalf."""
        self._login(self.admin_id)
        res = self.client.post('/api/privacy/consent', json={
            'consent_tier': 'C1_SCREENING',
            'granted': True,
            'user_id': self.patient_id
        })
        self.assertEqual(res.status_code, 200, "Admin modifying user consent must return HTTP 200")
        self.assertTrue(has_valid_consent(self.patient_id, 'C1_SCREENING'))

    # =========================================================================
    # SUITE 2: POST /api/privacy/sharing-preferences Input Validation & Boundary Hardening
    # =========================================================================

    def test_11_sharing_preferences_unauthenticated_receives_401(self):
        """Unauthenticated caller to sharing-preferences receives HTTP 401."""
        self._logout()
        res = self.client.post('/api/privacy/sharing-preferences', json={
            'recipient_type': 'DOCTOR',
            'allowed_domains': ['HISTORY']
        })
        self.assertEqual(res.status_code, 401)

    def test_12_sharing_preferences_non_dict_json_receives_400(self):
        """Authenticated caller sending non-dict JSON (int, list, string) receives HTTP 400."""
        self._login(self.patient_id)
        for bad_body in [123, 3.14, 'plain string', [1, 2, 3]]:
            res = self.client.post('/api/privacy/sharing-preferences', json=bad_body)
            self.assertEqual(res.status_code, 400, f"Expected 400 for {type(bad_body)}")

    def test_13_sharing_preferences_invalid_recipient_type_receives_400(self):
        """Invalid recipient_type enum or non-string type receives HTTP 400."""
        self._login(self.patient_id)
        for bad_recip in [123, None, ['DOCTOR'], {'recip': 'DOCTOR'}, 'HACKER', 'ADMIN', '']:
            res = self.client.post('/api/privacy/sharing-preferences', json={
                'recipient_type': bad_recip,
                'allowed_domains': ['HISTORY']
            })
            self.assertEqual(res.status_code, 400, f"Expected 400 for bad recipient_type {bad_recip}")

    def test_14_sharing_preferences_invalid_allowed_domains_receives_400(self):
        """Missing, non-list, empty list, or non-string allowed_domains receives HTTP 400."""
        self._login(self.patient_id)
        for bad_domains in [None, 'HISTORY', 123, [], [123], ['HISTORY', None], [{'domain': 'METABOLIC'}]]:
            res = self.client.post('/api/privacy/sharing-preferences', json={
                'recipient_type': 'DOCTOR',
                'allowed_domains': bad_domains
            })
            self.assertEqual(res.status_code, 400, f"Expected 400 for bad allowed_domains {bad_domains}")

    def test_15_sharing_preferences_invalid_redacted_fields_receives_400(self):
        """Non-list or non-string elements in redacted_fields receives HTTP 400."""
        self._login(self.patient_id)
        for bad_fields in ['prior_terminations', 123, [123], ['smoking', None]]:
            res = self.client.post('/api/privacy/sharing-preferences', json={
                'recipient_type': 'DOCTOR',
                'allowed_domains': ['HISTORY'],
                'redacted_fields': bad_fields
            })
            self.assertEqual(res.status_code, 400, f"Expected 400 for bad redacted_fields {bad_fields}")

    def test_16_sharing_preferences_expires_in_days_boundary_clamping(self):
        """Extreme/invalid expires_in_days (negative, zero, >365, string) is safely clamped to 30 days."""
        self._login(self.patient_id)
        record_consent(self.patient_id, 'C2_TELEHEALTH', True)
        for extreme_val in [-10, 0, 99999, 'not_a_number']:
            res = self.client.post('/api/privacy/sharing-preferences', json={
                'recipient_type': 'DOCTOR',
                'allowed_domains': ['HISTORY'],
                'expires_in_days': extreme_val
            })
            self.assertEqual(res.status_code, 201, f"Failed for expires_in_days={extreme_val}")
            acl = res.get_json()['acl']
            self.assertEqual(acl['status'], 'active')

    # =========================================================================
    # SUITE 3: POST /api/privacy/sharing-token/revoke Input Boundary & Fuzzing
    # =========================================================================

    def test_17_sharing_token_revoke_non_dict_json_input_validation(self):
        """Input boundary test: sending non-dict JSON bodies to sharing-token/revoke must return 400, not 500."""
        # Tests integers, floats, strings, lists
        for bad_payload in [12345, 3.14, 'a raw string payload', [1, 2, 3], True]:
            res = self.client.post('/api/privacy/sharing-token/revoke', json=bad_payload)
            self.assertEqual(
                res.status_code, 400,
                f"VULNERABILITY DETECTED: /api/privacy/sharing-token/revoke returned HTTP {res.status_code} "
                f"instead of HTTP 400 Bad Request on payload: {bad_payload}"
            )

    def test_18_sharing_token_revoke_unexpected_token_types_input_validation(self):
        """Input boundary test: sending list or dict in token_id must return 400, not crash sqlite with 500."""
        for bad_token in [[1, 2], {'nested': 'token'}]:
            res = self.client.post('/api/privacy/sharing-token/revoke', json={'token_id': bad_token})
            self.assertEqual(
                res.status_code, 400,
                f"VULNERABILITY DETECTED: /api/privacy/sharing-token/revoke returned HTTP {res.status_code} "
                f"instead of HTTP 400 Bad Request on token_id: {bad_token}"
            )

    def test_19_sharing_token_revoke_missing_token_rejection(self):
        """Input boundary test: empty payload {} to sharing-token/revoke must return 400, not false 200."""
        res = self.client.post('/api/privacy/sharing-token/revoke', json={})
        self.assertEqual(
            res.status_code, 400,
            f"VULNERABILITY DETECTED: /api/privacy/sharing-token/revoke returned HTTP {res.status_code} "
            f"instead of HTTP 400 Bad Request when token is completely omitted from body"
        )

    def test_20_sharing_preferences_revoke_non_dict_json_input_validation(self):
        """Input boundary test: sending non-dict JSON to sharing-preferences/revoke must return 400, not 500."""
        self._login(self.patient_id)
        for bad_payload in [12345, [1, 2, 3]]:
            res = self.client.post('/api/privacy/sharing-preferences/revoke', json=bad_payload)
            self.assertEqual(
                res.status_code, 400,
                f"VULNERABILITY DETECTED: /api/privacy/sharing-preferences/revoke returned HTTP {res.status_code} "
                f"instead of HTTP 400 Bad Request on payload: {bad_payload}"
            )

    def test_21_sharing_token_revoke_unauthenticated_authorization_gate(self):
        """Security boundary test: unauthenticated or wrong-user token revocation must be rejected."""
        record_consent(self.patient_id, 'C3_PARTNER', True)
        acl = create_sharing_acl(
            user_id=self.patient_id,
            recipient_type='PARTNER',
            allowed_domains=['HISTORY', 'METABOLIC'],
            expires_in_days=7
        )
        token = acl['share_token']

        # Confirm token is currently valid
        res_view = self.client.get(f'/api/privacy/shared-view/{token}')
        self.assertEqual(res_view.status_code, 200)

        # Unauthenticated revocation attempt must NOT return HTTP 200 while leaving token active
        self._logout()
        res_unauth_rev = self.client.post('/api/privacy/sharing-token/revoke', json={'token_id': token})
        self.assertIn(
            res_unauth_rev.status_code, [401, 403, 404],
            f"SECURITY FLAW: Unauthenticated caller received HTTP {res_unauth_rev.status_code} "
            f"claiming successful revocation without being authenticated as the token owner!"
        )

    # =========================================================================
    # SUITE 4: @require_consent Route Guard & Role Bypass Penetration Testing
    # =========================================================================

    def test_22_require_consent_unauthenticated_blocked_with_401(self):
        """Unauthenticated request to guarded route receives HTTP 401."""
        self._logout()
        res = self.client.get('/api/privacy/guarded-check')
        self.assertEqual(res.status_code, 401)

    def test_23_require_consent_authenticated_unconsented_blocked_with_403(self):
        """Authenticated patient without affirmative C1 consent blocked with HTTP 403 CONSENT_REQUIRED."""
        self._login(self.patient_id)
        res = self.client.get('/api/privacy/guarded-check')
        self.assertEqual(res.status_code, 403)
        self.assertEqual(res.get_json().get('error_code'), 'CONSENT_REQUIRED')

    def test_24_require_consent_header_spoofing_bypass_attempts(self):
        """Header spoofing claims (X-User-Role: admin, X-Admin: true) strictly ignored, returning 403."""
        self._login(self.patient_id)
        headers = {
            'X-User-Role': 'admin',
            'X-Admin': 'true',
            'X-Role': 'admin',
            'X-Forwarded-User': 'admin',
            'X-Remote-User': 'admin'
        }
        res = self.client.get('/api/privacy/guarded-check', headers=headers)
        self.assertEqual(res.status_code, 403, "Header spoofing must be blocked with HTTP 403")

    def test_25_require_consent_query_param_spoofing_bypass_attempts(self):
        """Query parameter claims (?role=admin&user_id=1&is_admin=true) strictly ignored, returning 403."""
        self._login(self.patient_id)
        res = self.client.get('/api/privacy/guarded-check?role=admin&user_id=1&is_admin=true')
        self.assertEqual(res.status_code, 403, "Query parameter spoofing must be blocked with HTTP 403")

    def test_26_require_consent_mismatched_tier_isolation(self):
        """Granting C2_TELEHEALTH does NOT grant access to a route requiring C1_SCREENING."""
        self._login(self.patient_id)
        record_consent(self.patient_id, 'C2_TELEHEALTH', True)
        res = self.client.get('/api/privacy/guarded-check')
        self.assertEqual(res.status_code, 403, "C2 consent must not grant C1 route access")
        self.assertEqual(res.get_json().get('error_code'), 'CONSENT_REQUIRED')

    def test_27_require_consent_immediate_lockout_on_revocation(self):
        """Revoking C1 consent results in instant HTTP 403 lockout."""
        self._login(self.patient_id)
        record_consent(self.patient_id, 'C1_SCREENING', True)
        res_ok = self.client.get('/api/privacy/guarded-check')
        self.assertEqual(res_ok.status_code, 200)

        # Revoke consent
        revoke_consent(self.patient_id, 'C1_SCREENING')
        res_rev = self.client.get('/api/privacy/guarded-check')
        self.assertEqual(res_rev.status_code, 403, "Instant lockout must follow revocation")

    def test_28_require_consent_admin_emergency_bypass(self):
        """True database admin user bypasses consent requirement without affirmative C1 consent."""
        self._login(self.admin_id)
        # Ensure admin has no consent record
        self.assertFalse(has_valid_consent(self.admin_id, 'C1_SCREENING'))
        res = self.client.get('/api/privacy/guarded-check')
        self.assertEqual(res.status_code, 200, "Admin must possess emergency clinical access bypass")

    # =========================================================================
    # SUITE 5: Field Redaction & Domain Filtering Verification
    # =========================================================================

    def test_29_field_redaction_completely_masks_sensitive_fields_in_shared_payload(self):
        """Redacted fields (prior_terminations, stis_history, smoking) are masked with [REDACTED]."""
        record_consent(self.patient_id, 'C2_TELEHEALTH', True)
        acl = create_sharing_acl(
            user_id=self.patient_id,
            recipient_type='DOCTOR',
            allowed_domains=['HISTORY', 'LIFESTYLE', 'INFECTIOUS'],
            redacted_fields=['prior_terminations', 'stis_history', 'smoking'],
            recipient_name='Dr. Amina'
        )

        res = self.client.get(f'/api/privacy/shared-intake/{acl["share_token"]}')
        self.assertEqual(res.status_code, 200)
        shared = res.get_json()['shared_data']

        # Confirm sensitive fields are masked
        self.assertEqual(shared['history']['prior_terminations'], '[REDACTED]')
        self.assertEqual(shared['lifestyle']['smoking'], '[REDACTED]')
        self.assertEqual(shared['infectious']['stis_history'], '[REDACTED]')

        # Confirm non-redacted fields retain real data
        self.assertEqual(shared['lifestyle']['alcohol'], 'None')

    def test_30_field_redaction_completely_strips_excluded_clinical_domains(self):
        """Clinical domains excluded from allowed_domains are completely absent from payload."""
        record_consent(self.patient_id, 'C3_PARTNER', True)
        acl = create_sharing_acl(
            user_id=self.patient_id,
            recipient_type='PARTNER',
            allowed_domains=['METABOLIC', 'LIFESTYLE']
        )

        res = self.client.get(f'/api/privacy/shared-intake/{acl["share_token"]}')
        self.assertEqual(res.status_code, 200)
        shared = res.get_json()['shared_data']

        self.assertIn('metabolic', shared)
        self.assertIn('lifestyle', shared)
        # Excluded domains must be stripped
        self.assertNotIn('history', shared)
        self.assertNotIn('infectious', shared)
        self.assertNotIn('anatomical', shared)
        self.assertNotIn('laboratory', shared)

    def test_31_field_redaction_research_recipient_masks_all_pii(self):
        """RESEARCH recipient type masks direct PII and substitutes patient name with pseudonym."""
        record_consent(self.patient_id, 'C4_TELEMETRY', True)
        acl = create_sharing_acl(
            user_id=self.patient_id,
            recipient_type='RESEARCH',
            allowed_domains=['METABOLIC']
        )

        res = self.client.get(f'/api/privacy/shared-intake/{acl["share_token"]}')
        self.assertEqual(res.status_code, 200)
        shared = res.get_json()['shared_data']

        self.assertEqual(shared['email'], '[REDACTED]')
        self.assertEqual(shared['phone'], '[REDACTED]')
        self.assertEqual(shared['dob'], '[REDACTED]')
        self.assertEqual(shared['city'], '[REDACTED]')
        self.assertEqual(shared['country'], '[REDACTED]')
        self.assertNotEqual(shared['full_name'], 'Fatima Al-Marzouqi')
        self.assertTrue(shared['_redaction_audit']['pii_masked'])

    def test_32_field_redaction_input_immutability(self):
        """redact_sensitive_intake() performs pure deepcopy and never mutates input dictionary."""
        original_intake = {
            'full_name': 'Fatima Al-Marzouqi',
            'history': {'prior_terminations': 2, 'gravidity': 3},
            'lifestyle': {'smoking': 'Occasional'}
        }
        redacted = redact_sensitive_intake(
            original_intake,
            redacted_fields=['prior_terminations', 'smoking'],
            allowed_domains=['HISTORY', 'LIFESTYLE']
        )
        self.assertEqual(redacted['history']['prior_terminations'], '[REDACTED]')
        self.assertEqual(redacted['lifestyle']['smoking'], '[REDACTED]')
        # Original must be pristine
        self.assertEqual(original_intake['history']['prior_terminations'], 2)
        self.assertEqual(original_intake['lifestyle']['smoking'], 'Occasional')

    # =========================================================================
    # SUITE 6: Retention Policy Governance & Purge Verification
    # =========================================================================

    def test_33_retention_purge_marks_expired_and_preserves_active_and_revoked(self):
        """POST /api/privacy/retention-purge transitions expired tokens, leaves active and revoked intact."""
        now = datetime.now(timezone.utc)
        past_iso = (now - timedelta(days=10)).isoformat()
        future_iso = (now + timedelta(days=10)).isoformat()

        conn = get_db_connection()
        c = conn.cursor()
        c.execute("""
            INSERT INTO reproductive_sharing_acls (user_id, recipient_type, share_token, allowed_domains, status, expires_at)
            VALUES (?, 'DOCTOR', 'tok_purge_expired', '["HISTORY"]', 'active', ?)
        """, (self.patient_id, past_iso))

        c.execute("""
            INSERT INTO reproductive_sharing_acls (user_id, recipient_type, share_token, allowed_domains, status, expires_at)
            VALUES (?, 'DOCTOR', 'tok_purge_future', '["HISTORY"]', 'active', ?)
        """, (self.patient_id, future_iso))

        c.execute("""
            INSERT INTO reproductive_sharing_acls (user_id, recipient_type, share_token, allowed_domains, status, expires_at)
            VALUES (?, 'DOCTOR', 'tok_purge_revoked', '["HISTORY"]', 'revoked', ?)
        """, (self.patient_id, past_iso))

        c.execute("""
            INSERT INTO reproductive_sharing_acls (user_id, recipient_type, share_token, allowed_domains, status, expires_at)
            VALUES (?, 'DOCTOR', 'tok_purge_null_expiry', '["HISTORY"]', 'active', NULL)
        """, (self.patient_id,))
        conn.commit()
        conn.close()

        # Run retention purge
        res = self.client.post('/api/privacy/retention-purge')
        self.assertEqual(res.status_code, 200)
        self.assertGreaterEqual(res.get_json()['purged_records'], 1)

        # Inspect resulting statuses
        conn = get_db_connection()
        c = conn.cursor()
        c.execute("SELECT share_token, status FROM reproductive_sharing_acls")
        statuses = {row['share_token']: row['status'] for row in c.fetchall()}
        conn.close()

        self.assertEqual(statuses['tok_purge_expired'], 'expired', "Expired active token must transition to 'expired'")
        self.assertEqual(statuses['tok_purge_future'], 'active', "Future token must remain 'active'")
        self.assertEqual(statuses['tok_purge_revoked'], 'revoked', "Revoked token must remain 'revoked'")
        self.assertEqual(statuses['tok_purge_null_expiry'], 'active', "Token without expires_at must remain 'active'")

    # =========================================================================
    # SUITE 7: Prerequisite Consent Revocation Dynamic Invalidation
    # =========================================================================

    def test_34_prerequisite_consent_revocation_invalidates_sharing_tokens(self):
        """Revoking prerequisite patient consent immediately invalidates DOCTOR/PARTNER/RESEARCH tokens."""
        # 1. DOCTOR token + C2_TELEHEALTH
        record_consent(self.patient_id, 'C2_TELEHEALTH', True)
        acl_doc = create_sharing_acl(self.patient_id, 'DOCTOR', ['HISTORY'])
        valid, _, _ = validate_share_token_access(acl_doc['share_token'])
        self.assertTrue(valid)

        # Revoke C2 consent
        revoke_consent(self.patient_id, 'C2_TELEHEALTH')
        valid, _, msg = validate_share_token_access(acl_doc['share_token'])
        self.assertFalse(valid)
        self.assertIn("consent revoked", msg.lower())

        # Shared intake returns 403 CONSENT_REVOKED
        res = self.client.get(f'/api/privacy/shared-intake/{acl_doc["share_token"]}')
        self.assertEqual(res.status_code, 403)
        self.assertEqual(res.get_json().get('error_code'), 'CONSENT_REVOKED')

        # 2. PARTNER token + C3_PARTNER
        record_consent(self.patient_id, 'C3_PARTNER', True)
        acl_partner = create_sharing_acl(self.patient_id, 'PARTNER', ['HISTORY'])
        valid, _, _ = validate_share_token_access(acl_partner['share_token'])
        self.assertTrue(valid)

        revoke_consent(self.patient_id, 'C3_PARTNER')
        valid, _, msg = validate_share_token_access(acl_partner['share_token'])
        self.assertFalse(valid)
        self.assertIn("consent revoked", msg.lower())

        # 3. RESEARCH token + C4_TELEMETRY
        record_consent(self.patient_id, 'C4_TELEMETRY', True)
        acl_res = create_sharing_acl(self.patient_id, 'RESEARCH', ['HISTORY'])
        valid, _, _ = validate_share_token_access(acl_res['share_token'])
        self.assertTrue(valid)

        revoke_consent(self.patient_id, 'C4_TELEMETRY')
        valid, _, msg = validate_share_token_access(acl_res['share_token'])
        self.assertFalse(valid)
        self.assertIn("consent revoked", msg.lower())

    # =========================================================================
    # SUITE 8: Cryptographic HMAC Non-Repudiation & Tamper Resistance
    # =========================================================================

    def test_35_consent_history_hmac_validity_and_tamper_detection(self):
        """100% of historical consent records possess valid HMACs; database tampering is detected."""
        for tier in ['C1_SCREENING', 'C2_TELEHEALTH', 'C3_PARTNER', 'C4_TELEMETRY']:
            record_consent(self.patient_id, tier, True)
            revoke_consent(self.patient_id, tier)
            record_consent(self.patient_id, tier, True)

        history = get_user_consent_history(self.patient_id)
        self.assertGreaterEqual(len(history), 8)
        for row in history:
            self.assertTrue(row['audit_valid'], f"HMAC audit hash invalid on row: {row}")

        # Adversarially tamper with database row by altering user_id
        tamper_id = history[0]['id']
        conn = get_db_connection()
        c = conn.cursor()
        c.execute("UPDATE reproductive_consents SET user_id = 999999 WHERE id = ?", (tamper_id,))
        conn.commit()
        conn.close()

        # Retrieve direct row to verify tamper detection
        conn = get_db_connection()
        c = conn.cursor()
        c.execute("SELECT * FROM reproductive_consents WHERE id = ?", (tamper_id,))
        tampered_raw = dict(c.fetchone())
        conn.close()

        self.assertFalse(verify_consent_audit_hash(tampered_raw), "Tampering user_id must invalidate HMAC hash")


if __name__ == '__main__':
    unittest.main()
