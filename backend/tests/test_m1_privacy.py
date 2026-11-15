"""
Unit and Integration Test Suite for Milestone 1: Privacy by Design & Explicit Consent Architecture
Tests database schemas, HMAC-SHA256 audit trails, tiered consent lifecycles (C1-C4),
user-controlled sharing ACLs, field-level redaction engine, REST endpoints, and zero raw file storage.
"""
import os
import unittest
import json
import sys
import tempfile
import shutil
import sqlite3
import subprocess
from datetime import datetime, timezone, timedelta

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

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

class Milestone1PrivacyTestCase(unittest.TestCase):
    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        self.orig_data_dir = Config.DATA_DIR
        self.orig_db_path = Config.DATABASE_PATH
        Config.DATA_DIR = self.test_dir
        Config.DATABASE_PATH = os.path.join(self.test_dir, 'test_m1_privacy.db')
        init_db()

        app.config['TESTING'] = True
        app.config['WTF_CSRF_ENABLED'] = False
        app.config['SECRET_KEY'] = 'test-secret-key-for-m1-hermetic'
        self.client = app.test_client()

        # Create standard test patient and admin
        self.patient_id = create_user('layla_m1', 'Layla Al-Hashimi', 'layla@emirateshealth.ae', 'SecretPass123!')
        self.partner_id = create_user('tariq_m1', 'Tariq Al-Hashimi', 'tariq@emirateshealth.ae', 'SecretPass123!')

        # Populate profile for test patient
        update_user_profile(self.patient_id, {
            'dob': '1992-04-15',
            'phone': '+971-50-1234567',
            'blood_type': 'O+',
            'city': 'Abu Dhabi',
            'country': 'United Arab Emirates',
            'kinship_degree': 'third_degree',
            'phenotypic_notes': 'Normal baseline phenotype'
        })

    def tearDown(self):
        Config.DATA_DIR = self.orig_data_dir
        Config.DATABASE_PATH = self.orig_db_path
        shutil.rmtree(self.test_dir, ignore_errors=True)

    # ==================== 1. DATABASE SCHEMA & TABLE STRUCTURE ====================

    def test_database_schema_and_indexes(self):
        """Verify reproductive_consents and reproductive_sharing_acls schemas and indexes exist."""
        conn = get_db_connection()
        cursor = conn.cursor()

        # Check reproductive_consents table
        cursor.execute("PRAGMA table_info(reproductive_consents);")
        consent_cols = {row['name'] for row in cursor.fetchall()}
        expected_consent_cols = {'id', 'user_id', 'consent_tier', 'granted', 'granted_at', 'revoked_at', 'consent_version', 'audit_hash'}
        self.assertTrue(expected_consent_cols.issubset(consent_cols), f"Missing columns in reproductive_consents: {expected_consent_cols - consent_cols}")

        # Check reproductive_sharing_acls table
        cursor.execute("PRAGMA table_info(reproductive_sharing_acls);")
        acl_cols = {row['name'] for row in cursor.fetchall()}
        expected_acl_cols = {'id', 'user_id', 'recipient_type', 'recipient_name', 'share_token', 'allowed_domains', 'redacted_fields', 'status', 'expires_at', 'created_at', 'revoked_at'}
        self.assertTrue(expected_acl_cols.issubset(acl_cols), f"Missing columns in reproductive_sharing_acls: {expected_acl_cols - acl_cols}")

        # Check indexes
        cursor.execute("SELECT name FROM sqlite_master WHERE type='index';")
        index_names = {row['name'] for row in cursor.fetchall()}
        self.assertIn('idx_reproductive_consents_user_tier', index_names)
        self.assertIn('idx_reproductive_consents_active', index_names)
        self.assertIn('idx_reproductive_consents_audit', index_names)
        self.assertIn('idx_sharing_acls_user_id', index_names)
        self.assertIn('idx_sharing_acls_token', index_names)
        self.assertIn('idx_sharing_acls_status', index_names)
        conn.close()

    # ==================== 2. TIER NORMALIZATION & VALIDATION ====================

    def test_tier_normalization_and_validation(self):
        """Verify canonical tier resolution for friendly names and case insensitivity."""
        self.assertEqual(normalize_consent_tier('screening'), 'C1_SCREENING')
        self.assertEqual(normalize_consent_tier('c1_screening'), 'C1_SCREENING')
        self.assertEqual(normalize_consent_tier('C1'), 'C1_SCREENING')
        self.assertEqual(normalize_consent_tier('telehealth'), 'C2_TELEHEALTH')
        self.assertEqual(normalize_consent_tier('c2'), 'C2_TELEHEALTH')
        self.assertEqual(normalize_consent_tier('partner'), 'C3_PARTNER')
        self.assertEqual(normalize_consent_tier('pedigree'), 'C3_PARTNER')
        self.assertEqual(normalize_consent_tier('c3'), 'C3_PARTNER')
        self.assertEqual(normalize_consent_tier('telemetry'), 'C4_TELEMETRY')
        self.assertEqual(normalize_consent_tier('c4'), 'C4_TELEMETRY')
        self.assertEqual(normalize_consent_tier('C1_SCREENING'), 'C1_SCREENING')

        with self.assertRaises(ValueError):
            normalize_consent_tier('invalid_scope')

        with self.assertRaises(ValueError):
            normalize_consent_tier('')

        with self.assertRaises(ValueError):
            normalize_consent_tier(None)

    # ==================== 3. HMAC AUDIT TRAIL CRYPTOGRAPHY ====================

    def test_hmac_audit_hash_computation_and_tamper_detection(self):
        """Verify HMAC-SHA256 signature generation and tamper detection for consent records."""
        now_iso = datetime.now(timezone.utc).isoformat()
        digest = compute_consent_audit_hash(
            user_id=self.patient_id,
            consent_tier='C1_SCREENING',
            granted=1,
            timestamp=now_iso,
            consent_version='1.0',
            secret='test-secret-key-for-m1-hermetic'
        )
        self.assertTrue(digest.startswith('HMAC-SHA256-'))

        record = {
            'user_id': self.patient_id,
            'consent_tier': 'C1_SCREENING',
            'granted': 1,
            'granted_at': now_iso,
            'revoked_at': None,
            'consent_version': '1.0',
            'audit_hash': digest
        }
        self.assertTrue(verify_consent_audit_hash(record, secret='test-secret-key-for-m1-hermetic'))

        # Tamper user_id
        tampered_user = dict(record, user_id=self.patient_id + 999)
        self.assertFalse(verify_consent_audit_hash(tampered_user, secret='test-secret-key-for-m1-hermetic'))

        # Tamper tier
        tampered_tier = dict(record, consent_tier='C2_TELEHEALTH')
        self.assertFalse(verify_consent_audit_hash(tampered_tier, secret='test-secret-key-for-m1-hermetic'))

        # Tamper granted state
        tampered_granted = dict(record, granted=0)
        self.assertFalse(verify_consent_audit_hash(tampered_granted, secret='test-secret-key-for-m1-hermetic'))

        # Tamper timestamp
        tampered_time = dict(record, granted_at='2020-01-01T00:00:00Z')
        self.assertFalse(verify_consent_audit_hash(tampered_time, secret='test-secret-key-for-m1-hermetic'))

        # Malformed record
        self.assertFalse(verify_consent_audit_hash({}))
        self.assertFalse(verify_consent_audit_hash(None))

    # ==================== 4. CONSENT LIFECYCLE & HAS_VALID_CONSENT ====================

    def test_consent_record_revoke_and_lifecycle(self):
        """Verify complete affirmative consent grant, revocation, and re-grant lifecycle."""
        # 1. Initially no consent
        self.assertFalse(has_valid_consent(self.patient_id, 'screening'))
        self.assertFalse(has_valid_consent(self.patient_id, 'C1_SCREENING'))
        self.assertFalse(has_valid_consent(self.patient_id, 'telehealth'))

        # 2. Record affirmative consent
        grant_res = record_consent(self.patient_id, 'C1_SCREENING', granted=True)
        self.assertEqual(grant_res['status'], 'success')
        self.assertTrue(grant_res['granted'])
        self.assertEqual(grant_res['consent_tier'], 'C1_SCREENING')
        self.assertTrue(has_valid_consent(self.patient_id, 'screening'))
        self.assertTrue(has_valid_consent(self.patient_id, 'C1_SCREENING'))
        self.assertTrue(verify_consent_audit_hash(grant_res))

        # 3. Revoke consent
        rev_res = revoke_consent(self.patient_id, 'screening')
        self.assertEqual(rev_res['status'], 'revoked')
        self.assertFalse(rev_res['granted'])
        self.assertIsNotNone(rev_res['revoked_at'])
        self.assertFalse(has_valid_consent(self.patient_id, 'screening'))
        self.assertTrue(verify_consent_audit_hash(rev_res))

        # 4. Re-grant consent
        regrant_res = record_consent(self.patient_id, 'screening', granted=True)
        self.assertTrue(regrant_res['granted'])
        self.assertTrue(has_valid_consent(self.patient_id, 'screening'))

        # Nonexistent user raises ValueError
        with self.assertRaises(ValueError):
            record_consent(999999, 'screening')

        with self.assertRaises(ValueError):
            revoke_consent(999999, 'screening')

    def test_consent_status_and_summary(self):
        """Verify get_consent_status returns individual status and multi-tier summary."""
        # Grant C1 and C2
        record_consent(self.patient_id, 'C1_SCREENING', granted=True)
        record_consent(self.patient_id, 'C2_TELEHEALTH', granted=True)

        # Query single tier
        c1_status = get_consent_status(self.patient_id, consent_tier='screening')
        self.assertTrue(c1_status['granted'])
        self.assertTrue(c1_status['is_active'])
        self.assertEqual(c1_status['consent_tier'], 'C1_SCREENING')

        # Query ungranted tier
        c3_status = get_consent_status(self.patient_id, consent_tier='C3_PARTNER')
        self.assertFalse(c3_status['granted'])
        self.assertFalse(c3_status['is_active'])

        # Query all tiers
        all_status = get_consent_status(self.patient_id)
        self.assertEqual(all_status['user_id'], self.patient_id)
        self.assertIn('C1_SCREENING', all_status['active_tiers'])
        self.assertIn('C2_TELEHEALTH', all_status['active_tiers'])
        self.assertNotIn('C3_PARTNER', all_status['active_tiers'])
        self.assertEqual(all_status['summary']['active_count'], 2)
        self.assertEqual(all_status['summary']['total_tiers'], 4)

    def test_user_consent_history_verification(self):
        """Verify get_user_consent_history returns valid audit hashes for all state transitions."""
        record_consent(self.patient_id, 'C1_SCREENING', True)
        revoke_consent(self.patient_id, 'C1_SCREENING')
        record_consent(self.patient_id, 'C1_SCREENING', True)

        history = get_user_consent_history(self.patient_id, 'C1_SCREENING')
        self.assertGreaterEqual(len(history), 2)
        for h in history:
            self.assertTrue(h['audit_valid'], f"Audit signature failed verification for record {h}")

    # ==================== 5. USER-CONTROLLED SHARING ACLs ====================

    def test_sharing_acl_creation_expiration_and_validation(self):
        """Verify creating sharing ACLs, tokens, expiration dates, and access validation."""
        # Pre-grant prerequisite partner consent
        record_consent(self.patient_id, 'C3_PARTNER', True)

        allowed_domains = ['METABOLIC', 'LIFESTYLE']
        redacted_fields = ['prior_terminations', 'stis_history']

        acl = create_sharing_acl(
            user_id=self.patient_id,
            recipient_type='PARTNER',
            allowed_domains=allowed_domains,
            redacted_fields=redacted_fields,
            recipient_name='Tariq Al-Hashimi',
            expires_in_days=30
        )
        self.assertIn('share_token', acl)
        self.assertEqual(len(acl['share_token']), 64)
        self.assertEqual(acl['status'], 'active')
        self.assertEqual(acl['allowed_domains'], allowed_domains)
        self.assertEqual(acl['redacted_fields'], redacted_fields)

        # Validate access
        valid, fetched_acl, msg = validate_share_token_access(acl['share_token'])
        self.assertTrue(valid)
        self.assertEqual(fetched_acl['recipient_type'], 'PARTNER')

        # List user ACLs
        user_acls = get_user_sharing_acls(self.patient_id)
        self.assertEqual(len(user_acls), 1)
        self.assertEqual(user_acls[0]['share_token'], acl['share_token'])

        # Revoke by ACL ID
        revoked = revoke_sharing_acl(self.patient_id, acl['id'])
        self.assertTrue(revoked)

        # Validate after revocation
        valid_rev, fetched_rev, msg_rev = validate_share_token_access(acl['share_token'])
        self.assertFalse(valid_rev)
        self.assertEqual(fetched_rev['status'], 'revoked')
        self.assertIn('revoked', msg_rev.lower())

        # Test revocation by token (pre-grant C2_TELEHEALTH for DOCTOR recipient)
        record_consent(self.patient_id, 'C2_TELEHEALTH', True)
        acl2 = create_sharing_acl(
            user_id=self.patient_id,
            recipient_type='DOCTOR',
            allowed_domains=['HISTORY', 'METABOLIC'],
            recipient_name='Dr. Amina'
        )
        self.assertTrue(revoke_sharing_acl_by_token(self.patient_id, acl2['share_token']))
        valid2, _, msg2 = validate_share_token_access(acl2['share_token'])
        self.assertFalse(valid2)

    def test_sharing_acl_expired_handling(self):
        """Verify expired sharing tokens are correctly marked and rejected."""
        record_consent(self.patient_id, 'C4_TELEMETRY', True)
        acl = create_sharing_acl(
            user_id=self.patient_id,
            recipient_type='RESEARCH',
            allowed_domains=['METABOLIC'],
            expires_in_days=-1  # Expired in the past
        )
        valid, acl_data, msg = validate_share_token_access(acl['share_token'])
        self.assertFalse(valid)
        self.assertIn('expired', msg.lower())

    # ==================== 6. FIELD-LEVEL REDACTION ENGINE ====================

    def test_field_redaction_engine_domain_filtering_and_masking(self):
        """Verify redact_sensitive_intake filters domains, redacts sensitive keys, and masks PII."""
        intake_sample = {
            'full_name': 'Fatima Al-Mansoor',
            'email': 'fatima@almansoor.ae',
            'phone': '+971-50-9998877',
            'history': {
                'gravidity': 3,
                'prior_terminations': 1,
                'miscarriages': 1,
                'kinship_degree': 'first_cousin'
            },
            'metabolic': {
                'fasting_glucose': 95,
                'hba1c': 5.4,
                'bmi': 22.1
            },
            'infectious': {
                'stis_history': ['chlamydia_treated_2021'],
                'rubella_immunity': True
            },
            'anatomical': {
                'antral_follicle_count': 14,
                'anatomical_anomalies': []
            }
        }

        # 1. Partner View: Restricted to METABOLIC and ANATOMICAL; redact prior_terminations
        partner_view = redact_sensitive_intake(
            intake_data=intake_sample,
            redacted_fields=['prior_terminations', 'stis_history'],
            allowed_domains=['METABOLIC', 'ANATOMICAL'],
            recipient_type='PARTNER',
            mask_pii=False
        )

        self.assertIn('metabolic', partner_view)
        self.assertIn('anatomical', partner_view)
        self.assertNotIn('history', partner_view)
        self.assertNotIn('infectious', partner_view)
        self.assertEqual(partner_view['full_name'], 'Fatima Al-Mansoor')
        self.assertEqual(partner_view['_redaction_audit']['recipient_type'], 'PARTNER')

        # 2. Doctor View: Include HISTORY and METABOLIC, but redact prior_terminations
        doctor_view = redact_sensitive_intake(
            intake_data=intake_sample,
            redacted_fields=['prior_terminations'],
            allowed_domains=['HISTORY', 'METABOLIC'],
            recipient_type='DOCTOR'
        )
        self.assertIn('history', doctor_view)
        self.assertEqual(doctor_view['history']['prior_terminations'], '[REDACTED]')
        self.assertEqual(doctor_view['history']['gravidity'], 3)
        self.assertEqual(doctor_view['history']['miscarriages'], 1)

        # 3. Research View: Strips PII and injects pseudonym
        research_view = redact_sensitive_intake(
            intake_data=intake_sample,
            allowed_domains=['METABOLIC', 'ANATOMICAL'],
            recipient_type='RESEARCH'
        )
        self.assertEqual(research_view['email'], '[REDACTED]')
        self.assertEqual(research_view['phone'], '[REDACTED]')
        self.assertNotEqual(research_view['full_name'], 'Fatima Al-Mansoor')
        self.assertTrue(research_view['_redaction_audit']['pii_masked'])

        # 4. Deepcopy safety: Verify original intake_sample was NOT mutated
        self.assertEqual(intake_sample['history']['prior_terminations'], 1)
        self.assertEqual(intake_sample['full_name'], 'Fatima Al-Mansoor')

    # ==================== 7. REST API: PRIVACY CHARTER ====================

    def test_api_privacy_charter_public_bilingual(self):
        """Verify GET /api/privacy/charter is public and returns English and Arabic commitments."""
        # English only
        res_en = self.client.get('/api/privacy/charter?lang=en')
        self.assertEqual(res_en.status_code, 200)
        data_en = res_en.get_json()
        self.assertEqual(data_en['status'], 'success')
        self.assertIn('en', data_en['charter'])
        self.assertNotIn('ar', data_en['charter'])
        en_pillars = data_en['charter']['en']['core_pillars']
        self.assertEqual(len(en_pillars), 5)
        pillar_ids = [p['id'] for p in en_pillars]
        self.assertIn('purpose_limitation', pillar_ids)
        self.assertIn('data_minimization', pillar_ids)
        self.assertIn('granular_consent', pillar_ids)
        self.assertIn('user_controlled_sharing', pillar_ids)
        self.assertIn('revocation_and_erasure', pillar_ids)

        # Arabic only
        res_ar = self.client.get('/api/privacy/charter?lang=ar')
        self.assertEqual(res_ar.status_code, 200)
        data_ar = res_ar.get_json()
        self.assertIn('ar', data_ar['charter'])

        # Both (default)
        res_all = self.client.get('/api/privacy/charter')
        self.assertEqual(res_all.status_code, 200)
        data_all = res_all.get_json()
        self.assertIn('en', data_all['charter'])
        self.assertIn('ar', data_all['charter'])

    # ==================== 8. REST API: CONSENT MANAGEMENT ====================

    def test_api_consent_endpoints_authenticated_and_unauthenticated(self):
        """Verify POST and GET /api/privacy/consent enforce authentication, validation, and HMAC recording."""
        # 1. Unauthenticated calls return 401
        res_unauth = self.client.post('/api/privacy/consent', json={'consent_tier': 'C1_SCREENING', 'granted': True})
        self.assertEqual(res_unauth.status_code, 401)

        res_get_unauth = self.client.get('/api/privacy/consent')
        self.assertEqual(res_get_unauth.status_code, 401)

        # 2. Login as patient
        with self.client.session_transaction() as sess:
            sess['user_id'] = self.patient_id

        # 3. Validation errors
        res_bad_tier = self.client.post('/api/privacy/consent', json={'consent_tier': 'UNKNOWN_TIER', 'granted': True})
        self.assertEqual(res_bad_tier.status_code, 400)

        res_bad_granted = self.client.post('/api/privacy/consent', json={'consent_tier': 'C1_SCREENING', 'granted': 'yes'})
        self.assertEqual(res_bad_granted.status_code, 400)

        # 4. Grant C1_SCREENING
        res_grant = self.client.post('/api/privacy/consent', json={'consent_tier': 'C1_SCREENING', 'granted': True})
        self.assertEqual(res_grant.status_code, 200)
        data_grant = res_grant.get_json()
        self.assertEqual(data_grant['status'], 'success')
        self.assertTrue(data_grant['granted'])
        self.assertTrue(data_grant['audit_hash'].startswith('HMAC-SHA256-'))

        # 5. GET active consent
        res_get = self.client.get('/api/privacy/consent')
        self.assertEqual(res_get.status_code, 200)
        data_get = res_get.get_json()
        self.assertIn('C1_SCREENING', data_get['active_tiers'])

        # GET specific tier
        res_get_tier = self.client.get('/api/privacy/consent?tier=screening')
        self.assertEqual(res_get_tier.status_code, 200)
        self.assertTrue(res_get_tier.get_json()['consent']['granted'])

        # 6. Revoke C1_SCREENING
        res_rev = self.client.post('/api/privacy/consent', json={'consent_tier': 'C1_SCREENING', 'granted': False})
        self.assertEqual(res_rev.status_code, 200)
        self.assertFalse(res_rev.get_json()['granted'])

        # Verify revocation in GET
        res_get_after = self.client.get('/api/privacy/consent?tier=screening')
        self.assertFalse(res_get_after.get_json()['consent']['granted'])

        # 7. GET consent history
        res_hist = self.client.get('/api/privacy/consent/history?tier=screening')
        self.assertEqual(res_hist.status_code, 200)
        self.assertGreaterEqual(len(res_hist.get_json()['history']), 1)

    # ==================== 9. ROUTE DECORATOR: @require_consent ====================

    def test_require_consent_decorator(self):
        """Verify @require_consent decorator blocks unconsented access with 403 CONSENT_REQUIRED and allows admin bypass."""
        # 1. Unauthenticated -> 401
        res_unauth = self.client.get('/api/privacy/guarded-check')
        self.assertEqual(res_unauth.status_code, 401)

        # 2. Authenticated but no consent -> 403 with CONSENT_REQUIRED
        with self.client.session_transaction() as sess:
            sess['user_id'] = self.patient_id

        res_no_consent = self.client.get('/api/privacy/guarded-check')
        self.assertEqual(res_no_consent.status_code, 403)
        self.assertEqual(res_no_consent.get_json()['error_code'], 'CONSENT_REQUIRED')

        # 3. Grant consent -> 200
        record_consent(self.patient_id, 'C1_SCREENING', granted=True)
        res_with_consent = self.client.get('/api/privacy/guarded-check')
        self.assertEqual(res_with_consent.status_code, 200)
        self.assertEqual(res_with_consent.get_json()['status'], 'success')

        # 4. Revoke consent -> immediately 403 again
        revoke_consent(self.patient_id, 'C1_SCREENING')
        res_revoked = self.client.get('/api/privacy/guarded-check')
        self.assertEqual(res_revoked.status_code, 403)

        # 5. Admin bypass: admin user with id=1 can access even without explicit consent
        with self.client.session_transaction() as sess:
            sess['user_id'] = 1  # seeded admin user
        res_admin = self.client.get('/api/privacy/guarded-check')
        self.assertEqual(res_admin.status_code, 200)

    # ==================== 10. REST API: SHARING PREFERENCES & SHARED INTAKE ====================

    def test_api_sharing_preferences_and_shared_intake_flow(self):
        """Verify POST/GET /api/privacy/sharing-preferences and GET /api/privacy/shared-intake/<token>."""
        # Pre-grant prerequisite partner consent
        record_consent(self.patient_id, 'C3_PARTNER', True)

        with self.client.session_transaction() as sess:
            sess['user_id'] = self.patient_id

        # 1. Create sharing preference
        create_payload = {
            'recipient_type': 'PARTNER',
            'allowed_domains': ['HISTORY', 'METABOLIC'],
            'redacted_fields': ['prior_terminations', 'stis_history'],
            'recipient_name': 'Tariq Al-Hashimi',
            'expires_in_days': 14
        }
        res_create = self.client.post('/api/privacy/sharing-preferences', json=create_payload)
        self.assertEqual(res_create.status_code, 201)
        data_create = res_create.get_json()
        self.assertEqual(data_create['status'], 'success')
        share_token = data_create['acl']['share_token']
        acl_id = data_create['acl']['id']

        # 2. List sharing preferences
        res_list = self.client.get('/api/privacy/sharing-preferences')
        self.assertEqual(res_list.status_code, 200)
        data_list = res_list.get_json()
        self.assertEqual(len(data_list['sharing_acls']), 1)
        self.assertEqual(data_list['sharing_acls'][0]['share_token'], share_token)

        # 3. Access shared intake as bearer recipient (logout patient session)
        self.client.get('/api/logout')

        res_shared = self.client.get(f'/api/privacy/shared-intake/{share_token}')
        self.assertEqual(res_shared.status_code, 200)
        data_shared = res_shared.get_json()
        self.assertEqual(data_shared['status'], 'success')
        self.assertEqual(data_shared['recipient_type'], 'PARTNER')
        shared_body = data_shared['shared_data']
        self.assertIn('history', shared_body)
        self.assertIn('metabolic', shared_body)
        # Verify redaction of sensitive field
        self.assertEqual(shared_body['history']['prior_terminations'], '[REDACTED]')

        # 4. Revoke sharing preference
        with self.client.session_transaction() as sess:
            sess['user_id'] = self.patient_id

        res_revoke = self.client.post('/api/privacy/sharing-preferences/revoke', json={'acl_id': acl_id})
        self.assertEqual(res_revoke.status_code, 200)

        # 5. Access shared intake after revocation -> 403 TOKEN_REVOKED
        self.client.get('/api/logout')
        res_shared_rev = self.client.get(f'/api/privacy/shared-intake/{share_token}')
        self.assertEqual(res_shared_rev.status_code, 403)
        self.assertEqual(res_shared_rev.get_json()['error_code'], 'TOKEN_REVOKED')

        # 6. Nonexistent token -> 404
        res_not_found = self.client.get('/api/privacy/shared-intake/nonexistent_token_0000000000')
        self.assertEqual(res_not_found.status_code, 404)

    # ==================== 11. ZERO RAW STORAGE AUDIT ====================

    def test_zero_raw_file_persistence_audit(self):
        """Verify zero occurrences of filesystem raw file writes in production codebase."""
        # Confirm that no active file.save() exists in production Python source files
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
        save_calls = []
        for root, _, files in os.walk(project_root):
            if '.venv' in root or 'venv' in root or '.git' in root or '__pycache__' in root or '.agents' in root or 'tests' in root:
                continue
            for f in files:
                if f.endswith('.py'):
                    path = os.path.join(root, f)
                    with open(path, 'r', encoding='utf-8', errors='ignore') as fp:
                        for line_no, line in enumerate(fp, start=1):
                            stripped = line.strip()
                            if '.save(' in stripped and not stripped.startswith('#'):
                                save_calls.append(f"{path}:{line_no}: {stripped}")

        self.assertEqual(len(save_calls), 0, f"Found active .save() raw file writes to disk: {save_calls}")

    # ==================== 12. REMEDIATION & BOUNDARY TESTS (ITERATION 2) ====================

    def test_superseded_consent_audit_validity(self):
        """Verify 100% of historical consent records pass HMAC verification after superseding."""
        user_id = self.patient_id
        # Execute multiple consecutive grants and revocations
        record_consent(user_id, 'C1_SCREENING', True)
        record_consent(user_id, 'C1_SCREENING', True)
        record_consent(user_id, 'C1_SCREENING', True)
        revoke_consent(user_id, 'C1_SCREENING')
        record_consent(user_id, 'C1_SCREENING', True)

        history = get_user_consent_history(user_id, 'C1_SCREENING')
        self.assertGreaterEqual(len(history), 4)
        for idx, row in enumerate(history):
            self.assertTrue(
                row.get('audit_valid'),
                f"Row {idx} (id={row.get('id')}, granted={row.get('granted')}, revoked_at={row.get('revoked_at')}) failed HMAC verification"
            )

    def test_token_rejection_when_prerequisite_consent_revoked(self):
        """Verify tokens are invalidated and return HTTP 403 CONSENT_REVOKED when prerequisite consent is revoked."""
        # 1. DOCTOR requires C2_TELEHEALTH
        record_consent(self.patient_id, 'C2_TELEHEALTH', True)
        acl_doc = create_sharing_acl(self.patient_id, 'DOCTOR', ['HISTORY'])
        valid, _, _ = validate_share_token_access(acl_doc['share_token'])
        self.assertTrue(valid)

        revoke_consent(self.patient_id, 'C2_TELEHEALTH')
        valid_after, _, msg = validate_share_token_access(acl_doc['share_token'])
        self.assertFalse(valid_after)
        self.assertIn('telehealth', msg.lower())

        res = self.client.get(f"/api/privacy/shared-intake/{acl_doc['share_token']}")
        self.assertEqual(res.status_code, 403)
        self.assertEqual(res.get_json().get('error_code'), 'CONSENT_REVOKED')

        # 2. PARTNER requires C3_PARTNER
        record_consent(self.patient_id, 'C3_PARTNER', True)
        acl_partner = create_sharing_acl(self.patient_id, 'PARTNER', ['LIFESTYLE'])
        valid_p, _, _ = validate_share_token_access(acl_partner['share_token'])
        self.assertTrue(valid_p)

        revoke_consent(self.patient_id, 'C3_PARTNER')
        valid_p_after, _, msg_p = validate_share_token_access(acl_partner['share_token'])
        self.assertFalse(valid_p_after)
        self.assertIn('partner', msg_p.lower())

        res_p = self.client.get(f"/api/privacy/shared-intake/{acl_partner['share_token']}")
        self.assertEqual(res_p.status_code, 403)
        self.assertEqual(res_p.get_json().get('error_code'), 'CONSENT_REVOKED')

        # 3. RESEARCH requires C4_TELEMETRY
        record_consent(self.patient_id, 'C4_TELEMETRY', True)
        acl_res = create_sharing_acl(self.patient_id, 'RESEARCH', ['METABOLIC'])
        valid_r, _, _ = validate_share_token_access(acl_res['share_token'])
        self.assertTrue(valid_r)

        revoke_consent(self.patient_id, 'C4_TELEMETRY')
        valid_r_after, _, msg_r = validate_share_token_access(acl_res['share_token'])
        self.assertFalse(valid_r_after)
        self.assertIn('telemetry', msg_r.lower())

        res_r = self.client.get(f"/api/privacy/shared-intake/{acl_res['share_token']}")
        self.assertEqual(res_r.status_code, 403)
        self.assertEqual(res_r.get_json().get('error_code'), 'CONSENT_REVOKED')

    def test_type_validation_on_sharing_preferences(self):
        """Verify POST /api/privacy/sharing-preferences returns HTTP 400 on type mismatch / bad payload."""
        with self.client.session_transaction() as sess:
            sess['user_id'] = self.patient_id

        # Bad recipient_type types
        for bad_recipient in [123, True, ['DOCTOR'], {'type': 'DOCTOR'}]:
            res = self.client.post('/api/privacy/sharing-preferences', json={
                'recipient_type': bad_recipient,
                'allowed_domains': ['METABOLIC']
            })
            self.assertEqual(res.status_code, 400, f"Expected 400 for bad recipient_type={bad_recipient}, got {res.status_code}")

        # Non-string allowed_domains elements
        res_bad_domain = self.client.post('/api/privacy/sharing-preferences', json={
            'recipient_type': 'DOCTOR',
            'allowed_domains': [123, None]
        })
        self.assertEqual(res_bad_domain.status_code, 400)

        # Non-string redacted_fields elements
        res_bad_fields = self.client.post('/api/privacy/sharing-preferences', json={
            'recipient_type': 'DOCTOR',
            'allowed_domains': ['METABOLIC'],
            'redacted_fields': [456]
        })
        self.assertEqual(res_bad_fields.status_code, 400)

    def test_unauthenticated_invalid_consent_tier_rejection(self):
        """Verify unauthenticated invalid consent tier receives HTTP 400 before 401 gate."""
        # Unauthenticated invalid tier enum -> 400
        res_bad = self.client.post('/api/privacy/consent', json={
            'consent_tier': 'INVALID_TIER_99',
            'granted': True
        })
        self.assertEqual(res_bad.status_code, 400)
        self.assertEqual(res_bad.get_json().get('message'), 'Invalid consent tier')

        # Unauthenticated valid tier enum -> 401
        res_valid = self.client.post('/api/privacy/consent', json={
            'consent_tier': 'C1_SCREENING',
            'granted': True
        })
        self.assertEqual(res_valid.status_code, 401)

    def test_require_consent_admin_role_bypass(self):
        """Verify users with role='admin' bypass consent checks even with non-admin username."""
        from database import get_db_connection
        admin_id = create_user('dr_fatima_lead', 'SecretPass123!', 'dr_fatima@hospital.ae', 'Dr. Fatima')
        conn = get_db_connection()
        conn.execute("UPDATE users SET role = 'admin' WHERE id = ?", (admin_id,))
        conn.commit()
        conn.close()

        with self.client.session_transaction() as sess:
            sess['user_id'] = admin_id

        # Dr. Fatima has NOT granted C1_SCREENING consent, but role='admin' grants bypass
        res = self.client.get('/api/privacy/guarded-check')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json().get('status'), 'success')


if __name__ == '__main__':
    unittest.main()
