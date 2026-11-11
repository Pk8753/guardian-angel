"""
Guardian Angel - Milestone 1 Iteration 2 Adversarial Stress Testing Suite
Author: Empirical Challenger (m1_r2_challenger_1)
Target: Milestone 1 Privacy by Design & Explicit Consent Architecture

Stress Domains:
1. Rapid grant -> revoke -> re-grant -> re-revoke sequences for all consent tiers (C1, C2, C3, C4)
   - Function-level and API-level rapid cycling
   - Interleaved multi-tier state transitions
   - Idempotent double-grants and double-revocations
2. Audit hash validity verification across 100% of rows returned by get_user_consent_history()
   - Cryptographic non-repudiation verification
   - Independent HMAC recalculation across all row lifecycle states
   - Adversarial tamper detection battery (7 mutation attacks including DB-level tampering)
3. Sharing token prerequisite revocation
   - DOCTOR (C2_TELEHEALTH), PARTNER (C3_PARTNER), RESEARCH (C4_TELEMETRY) lifecycles
   - Immediate 403 CONSENT_REVOKED enforcement upon prerequisite revocation
   - Immediate access restoration upon prerequisite re-grant
   - Cross-tier isolation matrix
   - Unconsented creation blocking & explicit token revocation irreversibility
4. Expiration timestamps and domain restriction enforcement on sharing tokens
   - Past expiration, 1-second dynamic boundary TTL, and indefinite tokens
   - Strict single, multi, and full clinical domain gating
   - Unapproved/malicious domain injection containment
   - Field-level sensitive redaction & RESEARCH recipient PII masking
5. Concurrency / race conditions in token access and consent updating
   - 50 simultaneous barrier-synchronized consent writes
   - High-frequency prerequisite consent toggling during simultaneous token reads
   - Concurrent token generation collision testing
   - Post-concurrency 100% HMAC audit verification across all threads and users
"""

import os
import sys
import json
import time
import secrets
import tempfile
import shutil
import sqlite3
import threading
import concurrent.futures
import unittest
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any

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


class Milestone1AdversarialChallengeSuite(unittest.TestCase):
    """Hermetic adversarial test harness for Milestone 1 remediations."""

    def setUp(self):
        self.test_dir = tempfile.mkdtemp(prefix="ga_m1_adv_")
        self.orig_data_dir = Config.DATA_DIR
        self.orig_db_path = Config.DATABASE_PATH
        Config.DATA_DIR = self.test_dir
        Config.DATABASE_PATH = os.path.join(self.test_dir, 'm1_adversarial.db')
        init_db()

        app.config['TESTING'] = True
        app.config['WTF_CSRF_ENABLED'] = False
        app.config['SECRET_KEY'] = 'adversarial-m1-challenger-secret-2026'
        self.client = app.test_client()

        # Seed primary test patient and partner
        self.patient_id = create_user(
            username='fatima_m1_test',
            full_name='Fatima Al-Nuaimi',
            email='fatima.alnuaimi@emirateshealth.ae',
            password='SecurePassword2026!'
        )
        self.partner_id = create_user(
            username='khalid_m1_test',
            full_name='Khalid Al-Nuaimi',
            email='khalid.alnuaimi@emirateshealth.ae',
            password='SecurePassword2026!'
        )
        self.admin_id = create_user(
            username='dr_salem_admin',
            full_name='Dr. Salem Al-Dhaheri',
            email='dr.salem@emirateshealth.ae',
            password='SecureAdminPassword2026!',
            role='admin'
        )

        # Seed comprehensive patient clinical profile
        update_user_profile(self.patient_id, {
            'dob': '1991-08-22',
            'phone': '+971-50-9876543',
            'blood_type': 'B+',
            'city': 'Dubai',
            'country': 'United Arab Emirates',
            'kinship_degree': 'second_degree',
            'phenotypic_notes': 'Elevated HbA1c; carrier screening requested',
            'prior_terminations': 1,
            'miscarriages': 2,
            'smoking': 'Former smoker',
            'alcohol': 'None',
            'exercise': 'Moderate',
            'bmi': 26.4,
            'stis_history': ['HPV cleared 2021'],
            'anatomical_anomalies': ['Arcuate uterus variant'],
            'recent_tests': ['HbA1c: 6.1%', 'AMH: 2.4 ng/mL']
        })

    def tearDown(self):
        Config.DATA_DIR = self.orig_data_dir
        Config.DATABASE_PATH = self.orig_db_path
        shutil.rmtree(self.test_dir, ignore_errors=True)

    def _login(self, user_id=None, username='fatima_m1_test'):
        uid = user_id or self.patient_id
        with self.client.session_transaction() as sess:
            sess['user_id'] = uid
            sess['username'] = username

    # =========================================================================
    # SUITE 1: RAPID GRANT -> REVOKE -> RE-GRANT -> RE-REVOKE SEQUENCES
    # =========================================================================

    def test_1_1_rapid_consent_cycling_all_tiers_function_level(self):
        """Stress 10 rapid grant -> revoke -> re-grant -> re-revoke cycles per tier (C1-C4)."""
        tiers = ['C1_SCREENING', 'C2_TELEHEALTH', 'C3_PARTNER', 'C4_TELEMETRY']
        for tier in tiers:
            for cycle in range(10):
                # 1. Grant
                rec_grant1 = record_consent(self.patient_id, tier, granted=True)
                self.assertTrue(rec_grant1['granted'], f"Cycle {cycle}: Grant 1 failed for {tier}")
                self.assertTrue(has_valid_consent(self.patient_id, tier), f"Cycle {cycle}: has_valid_consent false after grant 1 for {tier}")
                st = get_consent_status(self.patient_id, tier)
                self.assertTrue(st['granted'] and st['is_active'], f"Cycle {cycle}: get_consent_status false after grant 1 for {tier}")

                # 2. Revoke
                rec_rev1 = revoke_consent(self.patient_id, tier)
                self.assertFalse(rec_rev1['granted'], f"Cycle {cycle}: Revoke 1 failed for {tier}")
                self.assertFalse(has_valid_consent(self.patient_id, tier), f"Cycle {cycle}: has_valid_consent true after revoke 1 for {tier}")
                st = get_consent_status(self.patient_id, tier)
                self.assertFalse(st['granted'] or st['is_active'], f"Cycle {cycle}: get_consent_status true after revoke 1 for {tier}")

                # 3. Re-grant
                rec_grant2 = record_consent(self.patient_id, tier, granted=True)
                self.assertTrue(rec_grant2['granted'], f"Cycle {cycle}: Re-grant failed for {tier}")
                self.assertTrue(has_valid_consent(self.patient_id, tier), f"Cycle {cycle}: has_valid_consent false after re-grant for {tier}")

                # 4. Re-revoke
                rec_rev2 = revoke_consent(self.patient_id, tier)
                self.assertFalse(rec_rev2['granted'], f"Cycle {cycle}: Re-revoke failed for {tier}")
                self.assertFalse(has_valid_consent(self.patient_id, tier), f"Cycle {cycle}: has_valid_consent true after re-revoke for {tier}")

        # Total rows generated: each cycle has 2 grants (each adds 1 row, while revoke updates in place)
        # 4 tiers * 10 cycles * 2 grant inserts = 80 rows in history
        history = get_user_consent_history(self.patient_id)
        self.assertEqual(len(history), 80, f"Expected exactly 80 audit history records, got {len(history)}")
        for r in history:
            self.assertTrue(r['audit_valid'])

    def test_1_2_interleaved_multi_tier_state_transitions(self):
        """Stress complex interleaved transitions across C1, C2, C3, and C4 without state leakage."""
        for loop in range(5):
            # Grant all 4
            record_consent(self.patient_id, 'C1_SCREENING', True)
            record_consent(self.patient_id, 'C2_TELEHEALTH', True)
            record_consent(self.patient_id, 'C3_PARTNER', True)
            record_consent(self.patient_id, 'C4_TELEMETRY', True)

            st_all = get_consent_status(self.patient_id)
            self.assertEqual(st_all['summary']['active_count'], 4)
            self.assertEqual(set(st_all['active_tiers']), {'C1_SCREENING', 'C2_TELEHEALTH', 'C3_PARTNER', 'C4_TELEMETRY'})

            # Revoke C1 and C3
            revoke_consent(self.patient_id, 'C1_SCREENING')
            revoke_consent(self.patient_id, 'C3_PARTNER')

            self.assertFalse(has_valid_consent(self.patient_id, 'C1_SCREENING'))
            self.assertTrue(has_valid_consent(self.patient_id, 'C2_TELEHEALTH'))
            self.assertFalse(has_valid_consent(self.patient_id, 'C3_PARTNER'))
            self.assertTrue(has_valid_consent(self.patient_id, 'C4_TELEMETRY'))

            # Re-grant C1
            record_consent(self.patient_id, 'C1_SCREENING', True)
            self.assertTrue(has_valid_consent(self.patient_id, 'C1_SCREENING'))
            self.assertTrue(has_valid_consent(self.patient_id, 'C2_TELEHEALTH'))
            self.assertFalse(has_valid_consent(self.patient_id, 'C3_PARTNER'))
            self.assertTrue(has_valid_consent(self.patient_id, 'C4_TELEMETRY'))

            # Revoke C2 and C4
            revoke_consent(self.patient_id, 'C2_TELEHEALTH')
            revoke_consent(self.patient_id, 'C4_TELEMETRY')
            self.assertTrue(has_valid_consent(self.patient_id, 'C1_SCREENING'))
            self.assertFalse(has_valid_consent(self.patient_id, 'C2_TELEHEALTH'))
            self.assertFalse(has_valid_consent(self.patient_id, 'C3_PARTNER'))
            self.assertFalse(has_valid_consent(self.patient_id, 'C4_TELEMETRY'))

            # Revoke C1
            revoke_consent(self.patient_id, 'C1_SCREENING')
            st_end = get_consent_status(self.patient_id)
            self.assertEqual(st_end['summary']['active_count'], 0)

    def test_1_3_rapid_consent_cycling_via_rest_api(self):
        """Stress rapid grant/revoke/re-grant/re-revoke over HTTP POST /api/privacy/consent."""
        self._login()
        tiers = ['C1_SCREENING', 'C2_TELEHEALTH', 'C3_PARTNER', 'C4_TELEMETRY']
        for tier in tiers:
            for cycle in range(5):
                # Grant
                resp_g1 = self.client.post('/api/privacy/consent', json={'consent_tier': tier, 'granted': True})
                self.assertEqual(resp_g1.status_code, 200)
                data_g1 = resp_g1.get_json()
                self.assertTrue(data_g1['granted'])
                self.assertTrue(data_g1['audit_hash'].startswith('HMAC-SHA256-'))

                # Revoke
                resp_r1 = self.client.post('/api/privacy/consent', json={'consent_tier': tier, 'granted': False})
                self.assertEqual(resp_r1.status_code, 200)
                data_r1 = resp_r1.get_json()
                self.assertFalse(data_r1['granted'])
                self.assertTrue(data_r1['audit_hash'].startswith('HMAC-SHA256-'))

                # Re-grant
                resp_g2 = self.client.post('/api/privacy/consent', json={'consent_tier': tier, 'granted': True})
                self.assertEqual(resp_g2.status_code, 200)

                # Re-revoke
                resp_r2 = self.client.post('/api/privacy/consent', json={'consent_tier': tier, 'granted': False})
                self.assertEqual(resp_r2.status_code, 200)

            # Query GET /api/privacy/consent to verify final state
            st_resp = self.client.get(f'/api/privacy/consent?tier={tier}')
            self.assertEqual(st_resp.status_code, 200)
            consent_obj = st_resp.get_json().get('consent', {})
            self.assertFalse(consent_obj.get('granted'))
            self.assertFalse(consent_obj.get('is_active'))

    def test_1_4_idempotent_double_grant_and_double_revoke(self):
        """Verify double-grant and double-revoke idempotence and audit logging."""
        # Double grant
        g1 = record_consent(self.patient_id, 'C1_SCREENING', True)
        self.assertTrue(g1['granted'])
        g2 = record_consent(self.patient_id, 'C1_SCREENING', True)
        self.assertTrue(g2['granted'])
        self.assertNotEqual(g1['id'], g2['id'])
        self.assertTrue(has_valid_consent(self.patient_id, 'C1_SCREENING'))

        # Double revoke
        r1 = revoke_consent(self.patient_id, 'C1_SCREENING')
        self.assertFalse(r1['granted'])
        self.assertFalse(has_valid_consent(self.patient_id, 'C1_SCREENING'))

        r2 = revoke_consent(self.patient_id, 'C1_SCREENING')
        self.assertFalse(r2['granted'])
        self.assertFalse(has_valid_consent(self.patient_id, 'C1_SCREENING'))

        # Verification:
        # Row 1: First grant (superseded by second grant -> granted=0, revoked_at set, valid: True)
        # Row 2: Second grant (revoked by first revoke -> granted=0, revoked_at set, valid: True)
        # Row 3: Second revoke (explicit denial inserted -> granted=0, revoked_at set, valid: True)
        hist = get_user_consent_history(self.patient_id, 'C1_SCREENING')
        self.assertEqual(len(hist), 3)
        for h in hist:
            self.assertTrue(h['audit_valid'])

    # =========================================================================
    # SUITE 2: AUDIT HASH VALIDITY ACROSS 100% OF ROWS & TAMPER BATTERY
    # =========================================================================

    def test_2_1_audit_hash_validity_across_100_percent_of_history_rows(self):
        """Generate high-density state transitions and assert 100% audit hash validity."""
        for tier in ['C1_SCREENING', 'C2_TELEHEALTH', 'C3_PARTNER', 'C4_TELEMETRY']:
            for i in range(8):
                record_consent(self.patient_id, tier, granted=True)
                revoke_consent(self.patient_id, tier)

        history = get_user_consent_history(self.patient_id)
        # 4 tiers * 8 iterations = 32 rows
        self.assertEqual(len(history), 32)

        invalid_rows = []
        for idx, row in enumerate(history):
            is_valid = verify_consent_audit_hash(row)
            if not is_valid or not row.get('audit_valid'):
                invalid_rows.append((idx, row))

        self.assertEqual(
            len(invalid_rows), 0,
            f"Failed audit hash integrity: {len(invalid_rows)}/{len(history)} rows invalid: {invalid_rows[:3]}"
        )

    def test_2_2_independent_hmac_canonical_payload_reverification(self):
        """Re-compute HMAC canonical payloads independently across all lifecycle states."""
        # Step 1: Active Grant
        rec1 = record_consent(self.patient_id, 'C2_TELEHEALTH', True, consent_version='1.0')
        hist1 = get_user_consent_history(self.patient_id, 'C2_TELEHEALTH')
        self.assertEqual(len(hist1), 1)
        row_active = hist1[0]
        self.assertEqual(row_active['granted'], 1)
        self.assertIsNone(row_active['revoked_at'])
        calc_active = compute_consent_audit_hash(
            user_id=self.patient_id,
            consent_tier='C2_TELEHEALTH',
            granted=1,
            timestamp=row_active['granted_at'],
            consent_version='1.0'
        )
        self.assertEqual(row_active['audit_hash'], calc_active)
        self.assertTrue(verify_consent_audit_hash(row_active))

        # Step 2: Superseded Grant (re-grant creates new row and supersedes row 1)
        rec2 = record_consent(self.patient_id, 'C2_TELEHEALTH', True, consent_version='1.0')
        hist2 = get_user_consent_history(self.patient_id, 'C2_TELEHEALTH')
        self.assertEqual(len(hist2), 2)
        row_superseded = hist2[0]
        self.assertEqual(row_superseded['granted'], 0)
        self.assertIsNotNone(row_superseded['revoked_at'])
        calc_super = compute_consent_audit_hash(
            user_id=self.patient_id,
            consent_tier='C2_TELEHEALTH',
            granted=0,
            timestamp=row_superseded['revoked_at'],
            consent_version='1.0'
        )
        self.assertEqual(row_superseded['audit_hash'], calc_super)
        self.assertTrue(verify_consent_audit_hash(row_superseded))

        # Step 3: Revoke active grant (row 2 updated in place to granted=0)
        rec3 = revoke_consent(self.patient_id, 'C2_TELEHEALTH', consent_version='1.0')
        hist3 = get_user_consent_history(self.patient_id, 'C2_TELEHEALTH')
        self.assertEqual(len(hist3), 2)
        row_revoked = hist3[1]
        self.assertEqual(row_revoked['granted'], 0)
        calc_rev = compute_consent_audit_hash(
            user_id=self.patient_id,
            consent_tier='C2_TELEHEALTH',
            granted=0,
            timestamp=row_revoked['revoked_at'],
            consent_version='1.0'
        )
        self.assertEqual(row_revoked['audit_hash'], calc_rev)
        self.assertTrue(verify_consent_audit_hash(row_revoked))

        # Step 4: Explicit denial row (revoke when no active record exists)
        rec4 = revoke_consent(self.patient_id, 'C2_TELEHEALTH', consent_version='1.0')
        hist4 = get_user_consent_history(self.patient_id, 'C2_TELEHEALTH')
        self.assertEqual(len(hist4), 3)
        row_denial = hist4[2]
        self.assertEqual(row_denial['granted'], 0)
        calc_denial = compute_consent_audit_hash(
            user_id=self.patient_id,
            consent_tier='C2_TELEHEALTH',
            granted=0,
            timestamp=row_denial['revoked_at'],
            consent_version='1.0'
        )
        self.assertEqual(row_denial['audit_hash'], calc_denial)
        self.assertTrue(verify_consent_audit_hash(row_denial))

    def test_2_3_adversarial_tamper_detection_battery(self):
        """Stress 7 distinct cryptographic tampering attacks against verify_consent_audit_hash."""
        rec = record_consent(self.patient_id, 'C1_SCREENING', True)
        valid_row = get_user_consent_history(self.patient_id, 'C1_SCREENING')[-1]
        self.assertTrue(verify_consent_audit_hash(valid_row))

        # Attack 1: Falsify granted bit
        tampered_granted = dict(valid_row, granted=0)
        self.assertFalse(verify_consent_audit_hash(tampered_granted))

        # Attack 2: Falsify user_id
        tampered_user = dict(valid_row, user_id=self.partner_id)
        self.assertFalse(verify_consent_audit_hash(tampered_user))

        # Attack 3: Falsify consent_tier
        tampered_tier = dict(valid_row, consent_tier='C2_TELEHEALTH')
        self.assertFalse(verify_consent_audit_hash(tampered_tier))

        # Attack 4: Timestamp drift
        tampered_time = dict(valid_row, granted_at='2025-01-01T00:00:00+00:00')
        self.assertFalse(verify_consent_audit_hash(tampered_time))

        # Attack 5: Version falsification
        tampered_ver = dict(valid_row, consent_version='2.0')
        self.assertFalse(verify_consent_audit_hash(tampered_ver))

        # Attack 6: HMAC bit-flip
        bad_hash = valid_row['audit_hash'][:-1] + ('a' if valid_row['audit_hash'][-1] != 'a' else 'b')
        tampered_hash = dict(valid_row, audit_hash=bad_hash)
        self.assertFalse(verify_consent_audit_hash(tampered_hash))

        # Attack 7: Raw Database SQL Tampering
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("UPDATE reproductive_consents SET user_id = 99999 WHERE id = ?", (valid_row['id'],))
        conn.commit()
        conn.close()

        cur_tampered = get_user_consent_history(99999)
        self.assertEqual(len(cur_tampered), 1)
        self.assertFalse(cur_tampered[0]['audit_valid'])

    def test_2_4_api_consent_history_verification(self):
        """Verify GET /api/privacy/consent/history returns 200 with 100% audit_valid."""
        self._login()
        record_consent(self.patient_id, 'C1_SCREENING', True)
        record_consent(self.patient_id, 'C2_TELEHEALTH', True)
        record_consent(self.patient_id, 'C3_PARTNER', True)
        revoke_consent(self.patient_id, 'C1_SCREENING')

        resp = self.client.get('/api/privacy/consent/history')
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertEqual(data['status'], 'success')
        self.assertGreaterEqual(len(data['history']), 3)
        for entry in data['history']:
            self.assertTrue(entry['audit_valid'])

    # =========================================================================
    # SUITE 3: SHARING TOKEN PREREQUISITE REVOCATION & GATING
    # =========================================================================

    def test_3_1_doctor_token_prerequisite_lifecycle(self):
        """Stress DOCTOR token lifecycle: create -> access (200) -> revoke C2 -> blocked (403) -> re-grant C2 -> access (200)."""
        # Step 1: Grant prerequisite C2_TELEHEALTH
        record_consent(self.patient_id, 'C2_TELEHEALTH', True)

        # Step 2: Create sharing ACL for DOCTOR
        acl = create_sharing_acl(
            user_id=self.patient_id,
            recipient_type='DOCTOR',
            allowed_domains=['HISTORY', 'METABOLIC'],
            recipient_name='Dr. Smith'
        )
        token = acl['share_token']

        # Step 3: Access should succeed
        valid, _, msg = validate_share_token_access(token)
        self.assertTrue(valid)
        self.assertEqual(msg, "Authorized")

        resp1 = self.client.get(f'/api/privacy/shared-intake/{token}')
        self.assertEqual(resp1.status_code, 200)
        self.assertEqual(resp1.get_json()['recipient_type'], 'DOCTOR')

        resp_alias = self.client.get(f'/api/privacy/shared-view/{token}')
        self.assertEqual(resp_alias.status_code, 200)

        # Step 4: Revoke prerequisite C2_TELEHEALTH
        revoke_consent(self.patient_id, 'C2_TELEHEALTH')

        # Step 5: Access must be blocked immediately with 403 / CONSENT_REVOKED
        valid, _, msg = validate_share_token_access(token)
        self.assertFalse(valid)
        self.assertIn("telehealth consent revoked", msg)

        resp_blocked = self.client.get(f'/api/privacy/shared-intake/{token}')
        self.assertEqual(resp_blocked.status_code, 403)
        self.assertEqual(resp_blocked.get_json().get('error_code'), 'CONSENT_REVOKED')

        resp_blocked_alias = self.client.get(f'/api/privacy/shared-view?token={token}')
        self.assertEqual(resp_blocked_alias.status_code, 403)
        self.assertEqual(resp_blocked_alias.get_json().get('error_code'), 'CONSENT_REVOKED')

        # Step 6: Re-grant prerequisite C2_TELEHEALTH
        record_consent(self.patient_id, 'C2_TELEHEALTH', True)

        # Step 7: Access must be immediately restored without creating a new token
        valid, _, msg = validate_share_token_access(token)
        self.assertTrue(valid)
        self.assertEqual(msg, "Authorized")

        resp_restored = self.client.get(f'/api/privacy/shared-intake/{token}')
        self.assertEqual(resp_restored.status_code, 200)

        # Step 8: Re-revoke -> access blocked again
        revoke_consent(self.patient_id, 'C2_TELEHEALTH')
        resp_reblocked = self.client.get(f'/api/privacy/shared-intake/{token}')
        self.assertEqual(resp_reblocked.status_code, 403)
        self.assertEqual(resp_reblocked.get_json().get('error_code'), 'CONSENT_REVOKED')

    def test_3_2_partner_token_prerequisite_lifecycle(self):
        """Stress PARTNER token lifecycle: create -> access (200) -> revoke C3 -> blocked (403) -> re-grant C3 -> access (200)."""
        record_consent(self.patient_id, 'C3_PARTNER', True)
        acl = create_sharing_acl(self.patient_id, 'PARTNER', ['HISTORY', 'LIFESTYLE'], recipient_name='Khalid')
        token = acl['share_token']

        # Access succeeds
        resp = self.client.get(f'/api/privacy/shared-intake/{token}')
        self.assertEqual(resp.status_code, 200)

        # Revoke C3_PARTNER
        revoke_consent(self.patient_id, 'C3_PARTNER')
        resp_blocked = self.client.get(f'/api/privacy/shared-intake/{token}')
        self.assertEqual(resp_blocked.status_code, 403)
        self.assertEqual(resp_blocked.get_json().get('error_code'), 'CONSENT_REVOKED')

        # Re-grant C3_PARTNER
        record_consent(self.patient_id, 'C3_PARTNER', True)
        resp_restored = self.client.get(f'/api/privacy/shared-intake/{token}')
        self.assertEqual(resp_restored.status_code, 200)

    def test_3_3_research_token_prerequisite_lifecycle(self):
        """Stress RESEARCH token lifecycle: create -> access (200) -> revoke C4 -> blocked (403) -> re-grant C4 -> access (200)."""
        record_consent(self.patient_id, 'C4_TELEMETRY', True)
        acl = create_sharing_acl(self.patient_id, 'RESEARCH', ['METABOLIC', 'LABORATORY'])
        token = acl['share_token']

        # Access succeeds with PII masked
        resp = self.client.get(f'/api/privacy/shared-intake/{token}')
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()['shared_data']
        self.assertNotEqual(data['patient_name'], 'Fatima Al-Nuaimi')
        self.assertEqual(data['email'], '[REDACTED]')

        # Revoke C4_TELEMETRY
        revoke_consent(self.patient_id, 'C4_TELEMETRY')
        resp_blocked = self.client.get(f'/api/privacy/shared-intake/{token}')
        self.assertEqual(resp_blocked.status_code, 403)
        self.assertEqual(resp_blocked.get_json().get('error_code'), 'CONSENT_REVOKED')

        # Re-grant C4_TELEMETRY
        record_consent(self.patient_id, 'C4_TELEMETRY', True)
        resp_restored = self.client.get(f'/api/privacy/shared-intake/{token}')
        self.assertEqual(resp_restored.status_code, 200)

    def test_3_4_cross_tier_prerequisite_isolation_matrix(self):
        """Verify revoking one consent tier affects ONLY matching token recipient types."""
        # Grant all 4 tiers
        for tier in ['C1_SCREENING', 'C2_TELEHEALTH', 'C3_PARTNER', 'C4_TELEMETRY']:
            record_consent(self.patient_id, tier, True)

        doc_acl = create_sharing_acl(self.patient_id, 'DOCTOR', ['HISTORY'])
        part_acl = create_sharing_acl(self.patient_id, 'PARTNER', ['HISTORY'])
        res_acl = create_sharing_acl(self.patient_id, 'RESEARCH', ['HISTORY'])

        tok_doc = doc_acl['share_token']
        tok_part = part_acl['share_token']
        tok_res = res_acl['share_token']

        # Revoke C1: All 3 sharing tokens MUST remain active (C1 is intake screening, not token prerequisite)
        revoke_consent(self.patient_id, 'C1_SCREENING')
        self.assertEqual(self.client.get(f'/api/privacy/shared-intake/{tok_doc}').status_code, 200)
        self.assertEqual(self.client.get(f'/api/privacy/shared-intake/{tok_part}').status_code, 200)
        self.assertEqual(self.client.get(f'/api/privacy/shared-intake/{tok_res}').status_code, 200)

        # Revoke C2: ONLY DOCTOR blocked, PARTNER and RESEARCH remain active
        revoke_consent(self.patient_id, 'C2_TELEHEALTH')
        self.assertEqual(self.client.get(f'/api/privacy/shared-intake/{tok_doc}').status_code, 403)
        self.assertEqual(self.client.get(f'/api/privacy/shared-intake/{tok_part}').status_code, 200)
        self.assertEqual(self.client.get(f'/api/privacy/shared-intake/{tok_res}').status_code, 200)

        # Revoke C3: DOCTOR and PARTNER blocked, RESEARCH remains active
        revoke_consent(self.patient_id, 'C3_PARTNER')
        self.assertEqual(self.client.get(f'/api/privacy/shared-intake/{tok_doc}').status_code, 403)
        self.assertEqual(self.client.get(f'/api/privacy/shared-intake/{tok_part}').status_code, 403)
        self.assertEqual(self.client.get(f'/api/privacy/shared-intake/{tok_res}').status_code, 200)

        # Revoke C4: All 3 blocked
        revoke_consent(self.patient_id, 'C4_TELEMETRY')
        self.assertEqual(self.client.get(f'/api/privacy/shared-intake/{tok_doc}').status_code, 403)
        self.assertEqual(self.client.get(f'/api/privacy/shared-intake/{tok_part}').status_code, 403)
        self.assertEqual(self.client.get(f'/api/privacy/shared-intake/{tok_res}').status_code, 403)

    def test_3_5_unconsented_token_creation_and_blocking(self):
        """Token created when prerequisite consent was NEVER granted is blocked immediately."""
        unconsented_uid = create_user('unconsented_user', 'No Consent', 'noconsent@test.ae', 'Pass123!')
        acl = create_sharing_acl(unconsented_uid, 'DOCTOR', ['HISTORY'])
        token = acl['share_token']

        valid, _, msg = validate_share_token_access(token)
        self.assertFalse(valid)
        self.assertIn("telehealth consent revoked", msg)

        resp = self.client.get(f'/api/privacy/shared-intake/{token}')
        self.assertEqual(resp.status_code, 403)
        self.assertEqual(resp.get_json().get('error_code'), 'CONSENT_REVOKED')

    def test_3_6_explicit_token_revocation_irreversibility(self):
        """Explicit token revocation yields 403 TOKEN_REVOKED and cannot be bypassed by consent re-grant."""
        record_consent(self.patient_id, 'C2_TELEHEALTH', True)
        acl = create_sharing_acl(self.patient_id, 'DOCTOR', ['HISTORY'])
        token = acl['share_token']

        # Explicitly revoke token
        revoked = revoke_sharing_acl_by_token(self.patient_id, token)
        self.assertTrue(revoked)

        # Must return TOKEN_REVOKED (not CONSENT_REVOKED)
        resp = self.client.get(f'/api/privacy/shared-intake/{token}')
        self.assertEqual(resp.status_code, 403)
        self.assertEqual(resp.get_json().get('error_code'), 'TOKEN_REVOKED')

        # Re-granting C2_TELEHEALTH does NOT restore an explicitly revoked token
        record_consent(self.patient_id, 'C2_TELEHEALTH', True)
        resp2 = self.client.get(f'/api/privacy/shared-intake/{token}')
        self.assertEqual(resp2.status_code, 403)
        self.assertEqual(resp2.get_json().get('error_code'), 'TOKEN_REVOKED')

    # =========================================================================
    # SUITE 4: EXPIRATION TIMESTAMPS & DOMAIN RESTRICTION ENFORCEMENT
    # =========================================================================

    def test_4_1_expired_token_enforcement(self):
        """Accessing expired token returns HTTP 410 and transitions DB status to 'expired'."""
        record_consent(self.patient_id, 'C2_TELEHEALTH', True)
        acl = create_sharing_acl(self.patient_id, 'DOCTOR', ['HISTORY'], expires_in_days=-1)
        token = acl['share_token']

        # Validate access returns False with expired message
        valid, acl_res, msg = validate_share_token_access(token)
        self.assertFalse(valid)
        self.assertIn("expired", msg.lower())

        # API returns 410 TOKEN_EXPIRED
        resp = self.client.get(f'/api/privacy/shared-intake/{token}')
        self.assertEqual(resp.status_code, 410)
        self.assertEqual(resp.get_json().get('error_code'), 'TOKEN_EXPIRED')

        # DB status dynamically updated to 'expired'
        acls = get_user_sharing_acls(self.patient_id)
        matching = [a for a in acls if a['share_token'] == token]
        self.assertEqual(len(matching), 1)
        self.assertEqual(matching[0]['status'], 'expired')

    def test_4_2_boundary_ttl_expiration(self):
        """Token with short TTL is valid initially and expires past TTL boundary."""
        record_consent(self.patient_id, 'C2_TELEHEALTH', True)
        # Create token expiring in 1 second
        acl = create_sharing_acl(self.patient_id, 'DOCTOR', ['HISTORY'], expires_in_days=30)
        token = acl['share_token']

        # Manually set expires_at to 1 second from now
        expires_short = (datetime.now(timezone.utc) + timedelta(seconds=1)).isoformat()
        conn = get_db_connection()
        conn.cursor().execute("UPDATE reproductive_sharing_acls SET expires_at = ? WHERE share_token = ?", (expires_short, token))
        conn.commit()
        conn.close()

        # Immediate query at t=0 returns 200
        resp_now = self.client.get(f'/api/privacy/shared-intake/{token}')
        self.assertEqual(resp_now.status_code, 200)

        # Wait 1.15 seconds
        time.sleep(1.15)

        # Query past boundary returns 410
        resp_exp = self.client.get(f'/api/privacy/shared-intake/{token}')
        self.assertEqual(resp_exp.status_code, 410)
        self.assertEqual(resp_exp.get_json().get('error_code'), 'TOKEN_EXPIRED')

    def test_4_3_indefinite_token_lifespan(self):
        """Token with expires_in_days=None has expires_at=None and never expires."""
        record_consent(self.patient_id, 'C2_TELEHEALTH', True)
        acl = create_sharing_acl(self.patient_id, 'DOCTOR', ['HISTORY'], expires_in_days=None)
        self.assertIsNone(acl['expires_at'])

        resp = self.client.get(f"/api/privacy/shared-intake/{acl['share_token']}")
        self.assertEqual(resp.status_code, 200)

    def test_4_4_clinical_domain_restriction_strictness(self):
        """Verify strict domain gating: unallowed clinical domains are completely purged."""
        record_consent(self.patient_id, 'C2_TELEHEALTH', True)

        # Test single domain: METABOLIC only
        acl_met = create_sharing_acl(self.patient_id, 'DOCTOR', ['METABOLIC'])
        resp_met = self.client.get(f"/api/privacy/shared-intake/{acl_met['share_token']}")
        self.assertEqual(resp_met.status_code, 200)
        data_met = resp_met.get_json()['shared_data']

        self.assertIn('metabolic', data_met)
        self.assertNotIn('history', data_met)
        self.assertNotIn('lifestyle', data_met)
        self.assertNotIn('infectious', data_met)
        self.assertNotIn('anatomical', data_met)
        self.assertNotIn('laboratory', data_met)

        # Test multi domain: HISTORY + LABORATORY
        acl_dual = create_sharing_acl(self.patient_id, 'DOCTOR', ['HISTORY', 'LABORATORY'])
        resp_dual = self.client.get(f"/api/privacy/shared-intake/{acl_dual['share_token']}")
        self.assertEqual(resp_dual.status_code, 200)
        data_dual = resp_dual.get_json()['shared_data']

        self.assertIn('history', data_dual)
        self.assertIn('laboratory', data_dual)
        self.assertNotIn('metabolic', data_dual)
        self.assertNotIn('lifestyle', data_dual)
        self.assertNotIn('infectious', data_dual)
        self.assertNotIn('anatomical', data_dual)

        # Test malicious injection domain strings
        acl_inj = create_sharing_acl(self.patient_id, 'DOCTOR', ['<script>alert(1)</script>', 'DROP_TABLE'])
        resp_inj = self.client.get(f"/api/privacy/shared-intake/{acl_inj['share_token']}")
        self.assertEqual(resp_inj.status_code, 200)
        data_inj = resp_inj.get_json()['shared_data']
        for clinical_dom in ['history', 'lifestyle', 'metabolic', 'infectious', 'anatomical', 'laboratory']:
            self.assertNotIn(clinical_dom, data_inj, f"Clinical domain {clinical_dom} leaked under malicious domain ACL")

    def test_4_5_field_level_redactions_inside_allowed_domains(self):
        """Verify individual sensitive fields are masked with [REDACTED] within permitted domains."""
        record_consent(self.patient_id, 'C2_TELEHEALTH', True)
        acl = create_sharing_acl(
            self.patient_id,
            'DOCTOR',
            allowed_domains=['HISTORY', 'LIFESTYLE'],
            redacted_fields=['prior_terminations', 'miscarriages', 'smoking']
        )
        resp = self.client.get(f"/api/privacy/shared-intake/{acl['share_token']}")
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()['shared_data']

        # Redacted fields are masked
        self.assertEqual(data['history']['prior_terminations'], '[REDACTED]')
        self.assertEqual(data['history']['miscarriages'], '[REDACTED]')
        self.assertEqual(data['lifestyle']['smoking'], '[REDACTED]')

        # Non-redacted fields retained
        self.assertEqual(data['history']['kinship_degree'], 'second_degree')
        self.assertEqual(data['lifestyle']['exercise'], 'Moderate')

    # =========================================================================
    # SUITE 5: CONCURRENCY & SQLite RACE CONDITIONS STRESS
    # =========================================================================

    def test_5_1_concurrent_barrier_synchronized_consent_writes(self):
        """Stress 50 simultaneous barrier-synchronized consent writes across multiple tiers."""
        num_threads = 50
        barrier = threading.Barrier(num_threads)
        results = []
        errors = []

        def worker(thread_idx):
            tier = ['C1_SCREENING', 'C2_TELEHEALTH', 'C3_PARTNER', 'C4_TELEMETRY'][thread_idx % 4]
            granted = bool(thread_idx % 2 == 0)
            barrier.wait()
            try:
                rec = record_consent(self.patient_id, tier, granted=granted)
                results.append((thread_idx, tier, granted, rec['audit_hash']))
            except Exception as e:
                errors.append((thread_idx, str(e)))

        threads = [threading.Thread(target=worker, args=(i,)) for i in range(num_threads)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        self.assertEqual(len(errors), 0, f"Concurrent consent write lock collisions/errors: {errors}")
        self.assertEqual(len(results), num_threads, f"Expected {num_threads} successful writes")

        # Verify HMAC validity across all created rows
        hist = get_user_consent_history(self.patient_id)
        self.assertGreater(len(hist), 0)
        for h in hist:
            self.assertTrue(h['audit_valid'])

    def test_5_2_concurrent_prerequisite_toggling_vs_token_reads(self):
        """Simultaneously toggle prerequisite consent while 10 threads continuously read token access."""
        record_consent(self.patient_id, 'C2_TELEHEALTH', True)
        acl = create_sharing_acl(self.patient_id, 'DOCTOR', ['HISTORY'])
        token = acl['share_token']

        num_readers = 10
        read_iterations = 20
        write_iterations = 20
        total_participants = num_readers + 1
        barrier = threading.Barrier(total_participants)

        reader_responses = []
        reader_errors = []
        writer_errors = []

        def writer_task():
            barrier.wait()
            try:
                for i in range(write_iterations):
                    # Toggle between grant and revoke
                    record_consent(self.patient_id, 'C2_TELEHEALTH', granted=bool(i % 2 == 0))
                    time.sleep(0.005)
            except Exception as e:
                writer_errors.append(str(e))

        def reader_task(rid):
            barrier.wait()
            try:
                for _ in range(read_iterations):
                    valid, acl_out, msg = validate_share_token_access(token)
                    reader_responses.append((valid, msg))
                    time.sleep(0.005)
            except Exception as e:
                reader_errors.append(str(e))

        writer_thread = threading.Thread(target=writer_task)
        reader_threads = [threading.Thread(target=reader_task, args=(r,)) for r in range(num_readers)]

        writer_thread.start()
        for rt in reader_threads:
            rt.start()

        writer_thread.join()
        for rt in reader_threads:
            rt.join()

        self.assertEqual(len(writer_errors), 0, f"Writer thread errors: {writer_errors}")
        self.assertEqual(len(reader_errors), 0, f"Reader thread errors: {reader_errors}")
        self.assertEqual(len(reader_responses), num_readers * read_iterations)

        # Every reader response must be cleanly either Authorized or Prerequisite revoked
        for valid, msg in reader_responses:
            if valid:
                self.assertEqual(msg, "Authorized")
            else:
                self.assertIn("telehealth consent revoked", msg)

    def test_5_3_concurrent_token_generation_entropy_and_uniqueness(self):
        """Stress 30 simultaneous token creations for collision resistance and DB stability."""
        num_tokens = 30
        barrier = threading.Barrier(num_tokens)
        created_tokens = []
        gen_errors = []

        def token_generator(idx):
            barrier.wait()
            try:
                acl = create_sharing_acl(
                    user_id=self.patient_id,
                    recipient_type='DOCTOR',
                    allowed_domains=['HISTORY'],
                    recipient_name=f'Doctor_{idx}'
                )
                created_tokens.append(acl['share_token'])
            except Exception as e:
                gen_errors.append((idx, str(e)))

        threads = [threading.Thread(target=token_generator, args=(i,)) for i in range(num_tokens)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        self.assertEqual(len(gen_errors), 0, f"Token generation errors: {gen_errors}")
        self.assertEqual(len(created_tokens), num_tokens)
        self.assertEqual(len(set(created_tokens)), num_tokens, "Entropy failure: Duplicate share tokens detected!")

    def test_5_4_post_concurrency_hmac_audit_trail_integrity(self):
        """Verify 100% of rows created during heavy concurrent operations have valid HMAC signatures."""
        # Execute concurrent write barrage across multiple users
        num_workers = 40
        barrier = threading.Barrier(num_workers)
        write_errors = []

        def worker_op(idx):
            tier = ['C1_SCREENING', 'C2_TELEHEALTH', 'C3_PARTNER', 'C4_TELEMETRY'][idx % 4]
            # Half on patient, half on partner
            uid = self.patient_id if idx % 2 == 0 else self.partner_id
            barrier.wait()
            try:
                record_consent(uid, tier, granted=True)
                revoke_consent(uid, tier)
                record_consent(uid, tier, granted=True)
            except Exception as e:
                write_errors.append((idx, str(e)))

        threads = [threading.Thread(target=worker_op, args=(i,)) for i in range(num_workers)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        self.assertEqual(len(write_errors), 0, f"Concurrent execution errors: {write_errors}")

        for uid in [self.patient_id, self.partner_id]:
            history = get_user_consent_history(uid)
            self.assertGreater(len(history), 0)

            invalid_hashes = []
            for idx, row in enumerate(history):
                if not verify_consent_audit_hash(row):
                    invalid_hashes.append((idx, row))

            self.assertEqual(
                len(invalid_hashes), 0,
                f"Corrupted HMAC signatures detected post-concurrency for user {uid}: {len(invalid_hashes)} invalid records"
            )


def run_standalone_adversarial_suite():
    """Runs suite directly and generates structured scorecard."""
    print("=" * 80)
    print("RUNNING ADVERSARIAL STRESS TEST SUITE (MILESTONE 1 ITERATION 2)")
    print("=" * 80)

    loader = unittest.TestLoader()
    suite = loader.loadTestsFromTestCase(Milestone1AdversarialChallengeSuite)
    runner = unittest.TextTestRunner(verbosity=2)
    start_time = time.time()
    result = runner.run(suite)
    elapsed = time.time() - start_time

    print("\n" + "=" * 80)
    print("ADVERSARIAL CHALLENGE EXECUTION SUMMARY")
    print(f"Total Tests Run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Skipped: {len(result.skipped)}")
    print(f"Elapsed Time: {elapsed:.3f}s")
    print(f"VERDICT: {'APPROVE' if result.wasSuccessful() else 'FAILS'}")
    print("=" * 80)

    return result.wasSuccessful()


if __name__ == '__main__':
    success = run_standalone_adversarial_suite()
    sys.exit(0 if success else 1)
