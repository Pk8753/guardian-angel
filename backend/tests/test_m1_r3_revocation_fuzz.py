"""
Empirical Fuzzing, Boundary, and Penetration Testing Suite for Milestone 1 Iteration 3:
Privacy by Design & Token Revocation Endpoints.

Author: Empirical Challenger (m1_r3_challenger_2)
Target: Revocation Endpoints & Input Boundaries in app.py & database.py
  - POST /api/privacy/sharing-token/revoke
  - POST /api/privacy/sharing-preferences/revoke
  - GET  /api/privacy/shared-view/<share_token>

Tests include:
1. SQL injection attacks across token_id, share_token, and acl_id
2. Negative numbers, zero, extreme 64-bit integers, floats, and overflow values
3. Unicode, RTL Arabic, homoglyphs, emojis, zero-width spaces, and null bytes
4. Deeply nested JSON structures and malformed JSON payloads
5. Whitespace-only strings and oversized buffer strings (100k+ chars)
6. Horizontal privilege escalation (Patient B attempting to revoke Patient A's active token)
7. Admin emergency override revocation
8. Revocation idempotency (double-revocation handling)
9. GET /api/privacy/shared-view URL path and query string fuzzing
10. Alias parameter verification ('token_id', 'token', 'share_token')
"""

import os
import sys
import json
import tempfile
import unittest
from datetime import datetime, timezone, timedelta

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from config import Config
from app import app
from database import (
    init_db, get_db_connection, create_user, get_user_by_id, update_user_profile,
    record_consent, create_sharing_acl, get_sharing_acl_by_token, validate_share_token_access
)


class Milestone1RevocationFuzzingTestCase(unittest.TestCase):
    """Hermetic fuzzing and penetration test suite for privacy revocation endpoints."""

    def setUp(self):
        self.test_dir = tempfile.mkdtemp(prefix="ga_m1_fuzz_")
        self.orig_data_dir = Config.DATA_DIR
        self.orig_db_path = Config.DATABASE_PATH
        Config.DATA_DIR = self.test_dir
        Config.DATABASE_PATH = os.path.join(self.test_dir, 'm1_fuzz.db')
        init_db()

        app.testing = False
        app.config['WTF_CSRF_ENABLED'] = False
        app.config['SECRET_KEY'] = 'fuzzing-m1-challenger-secret-key-2026'
        self.client = app.test_client()

        # Seed Patient A, Patient B, and Admin
        self.patient_a = create_user(
            username='patient_a_fuzz',
            password='Password123!',
            email='patient_a@fuzz.ae',
            full_name='Fatima Al-Nuaimi',
            role='patient'
        )
        self.patient_b = create_user(
            username='patient_b_fuzz',
            password='Password123!',
            email='patient_b@fuzz.ae',
            full_name='Mariam Al-Kaabi',
            role='patient'
        )
        self.admin_user = create_user(
            username='admin_fuzz',
            password='Password123!',
            email='admin@fuzz.ae',
            full_name='Executive Admin',
            role='admin'
        )

        update_user_profile(self.patient_a, {
            'phone': '+971-50-9876543',
            'dob': '1995-04-12',
            'city': 'Dubai',
            'country': 'UAE',
            'blood_type': 'A+',
            'bmi': 21.8,
            'smoking': 'Never',
            'alcohol': 'None',
            'prior_terminations': 0,
            'miscarriages': 0
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
    # SUITE 1: SQL Injection Attacks on Revocation Endpoints
    # =========================================================================

    def test_fuzz_01_sharing_token_revoke_sql_injection_payloads(self):
        """SQL injection payloads in token_id must return 404 (not found), NEVER 500 crash or execute SQL."""
        self._login(self.patient_a)
        sqli_payloads = [
            "' OR '1'='1",
            "'; DROP TABLE reproductive_sharing_acls; --",
            "\" OR \"\"=\"",
            "admin'--",
            "1 UNION SELECT 1, 2, 3, 4, 5, 6, 7, 8, 9, 10--",
            "'; VACUUM; --",
            "' UNION ALL SELECT null, null, null, null, null, null, null, null, null, null--",
            "1'; DELETE FROM users; --",
            "1' AND (SELECT count(*) FROM users) > 0 --",
            "' OR 1=1 LIMIT 1; --"
        ]

        for payload in sqli_payloads:
            res = self.client.post('/api/privacy/sharing-token/revoke', json={'token_id': payload})
            self.assertEqual(
                res.status_code, 404,
                f"SQL injection payload '{payload}' produced HTTP {res.status_code} instead of 404"
            )

        # Confirm users table and reproductive_sharing_acls table are intact
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT count(*) FROM users")
            user_count = cursor.fetchone()[0]
            self.assertGreaterEqual(user_count, 3, "Database users table was corrupted by SQL injection!")
            cursor.execute("SELECT count(*) FROM reproductive_sharing_acls")
            acl_count = cursor.fetchone()[0]
            self.assertGreaterEqual(acl_count, 0, "reproductive_sharing_acls was corrupted by SQL injection!")
        finally:
            conn.close()

    def test_fuzz_02_sharing_preferences_revoke_token_sql_injection(self):
        """SQL injection payloads in share_token to sharing-preferences/revoke must return 404, never 500."""
        self._login(self.patient_a)
        sqli_payloads = [
            "' OR '1'='1",
            "'; DROP TABLE users; --",
            "1' UNION SELECT 1, 2, 3--",
            "\" OR 1=1 --"
        ]
        for payload in sqli_payloads:
            res = self.client.post('/api/privacy/sharing-preferences/revoke', json={'share_token': payload})
            self.assertEqual(
                res.status_code, 404,
                f"SQL injection share_token '{payload}' produced HTTP {res.status_code} instead of 404"
            )

    def test_fuzz_03_sharing_preferences_revoke_acl_id_sql_injection(self):
        """SQL injection or invalid string in acl_id must fail type coercion and return 404, never 500."""
        self._login(self.patient_a)
        bad_acl_ids = [
            "' OR '1'='1",
            "1; DROP TABLE reproductive_sharing_acls;",
            "1 UNION SELECT 1",
            "invalid_id",
            "1.5.0"
        ]
        for bad_id in bad_acl_ids:
            res = self.client.post('/api/privacy/sharing-preferences/revoke', json={'acl_id': bad_id})
            self.assertEqual(
                res.status_code, 404,
                f"SQL injection in acl_id '{bad_id}' returned HTTP {res.status_code} instead of 404"
            )

    # =========================================================================
    # SUITE 2: Numeric Boundary & Type Fuzzing
    # =========================================================================

    def test_fuzz_04_negative_and_zero_numbers_acl_id(self):
        """Negative integers, zero, and huge signed integers in acl_id must return 404 safely."""
        self._login(self.patient_a)
        for num in [-1, -999999999999, 0, 9223372036854775807, -9223372036854775808]:
            res = self.client.post('/api/privacy/sharing-preferences/revoke', json={'acl_id': num})
            self.assertEqual(res.status_code, 404, f"Failed for acl_id={num}")

    def test_fuzz_05_floating_point_and_bool_acl_id(self):
        """Floats, booleans, and non-integer types in acl_id must return 404 safely without 500."""
        self._login(self.patient_a)
        for val in [3.14159, -0.0, 1e20, True, False]:
            res = self.client.post('/api/privacy/sharing-preferences/revoke', json={'acl_id': val})
            self.assertEqual(res.status_code, 404, f"Failed for acl_id val={val}")

    def test_fuzz_06_sharing_token_revoke_numeric_payloads(self):
        """Numeric, boolean, and null types passed as token_id must return HTTP 400."""
        self._login(self.patient_a)
        for bad_token in [-1, 0, 42, 3.14, -999999, True, False]:
            res = self.client.post('/api/privacy/sharing-token/revoke', json={'token_id': bad_token})
            self.assertEqual(
                res.status_code, 400,
                f"Expected 400 for non-string token_id {bad_token}, got {res.status_code}"
            )
            self.assertIn("must be a non-empty string", res.get_json().get('message', ''))

    # =========================================================================
    # SUITE 3: Unicode, RTL, Emoji, Null Bytes, and Control Characters
    # =========================================================================

    def test_fuzz_07_unicode_arabic_and_rtl_strings(self):
        """Arabic, Hebrew, and RTL Unicode strings as tokens must return 404 cleanly."""
        self._login(self.patient_a)
        rtl_tokens = [
            "مفتاح_المشاركة_الخاص_بالمريض_١٢٣",
            "الغاء_الوصول_الفوري",
            "رمز_سري_تجريبي",
            "טוקן_שיתוף_פרטיות",
            "العربية"
        ]
        for token in rtl_tokens:
            res = self.client.post('/api/privacy/sharing-token/revoke', json={'token_id': token})
            self.assertEqual(res.status_code, 404, f"RTL token failed: {token}")

    def test_fuzz_08_null_byte_injection_and_control_characters(self):
        """Null bytes and ASCII control characters must not crash the database or server."""
        self._login(self.patient_a)
        control_payloads = [
            "token_abc\x00extra",
            "\x00",
            "token\r\n\t\b\f\v",
            "\x1b[31mRedToken\x1b[0m",
            "token\a\b"
        ]
        for payload in control_payloads:
            res = self.client.post('/api/privacy/sharing-token/revoke', json={'token_id': payload})
            self.assertEqual(res.status_code, 404, f"Control char payload failed: {repr(payload)}")

    def test_fuzz_09_emoji_and_multi_byte_utf8(self):
        """Multi-byte UTF-8 emojis, combining marks, and zero-width spaces return 404 cleanly."""
        self._login(self.patient_a)
        emoji_payloads = [
            "🔒🔑🧬💉🩸👩‍⚕️",
            "token\u200b\u200c\u200dzero_width",
            "token\ufeffBOM",
            "🔥" * 20
        ]
        for payload in emoji_payloads:
            res = self.client.post('/api/privacy/sharing-token/revoke', json={'token_id': payload})
            self.assertEqual(res.status_code, 404, f"Emoji payload failed: {payload}")

    def test_fuzz_10_whitespace_only_tokens(self):
        """Tokens containing only spaces, tabs, or newlines must be rejected with HTTP 400."""
        self._login(self.patient_a)
        whitespace_samples = ["   ", "\t", "\n", "\r\n  \t  \n"]
        for ws in whitespace_samples:
            # Test sharing-token/revoke
            res1 = self.client.post('/api/privacy/sharing-token/revoke', json={'token_id': ws})
            self.assertEqual(res1.status_code, 400, f"Expected 400 for whitespace-only token in sharing-token/revoke: {repr(ws)}")

            # Test sharing-preferences/revoke
            res2 = self.client.post('/api/privacy/sharing-preferences/revoke', json={'share_token': ws})
            self.assertEqual(res2.status_code, 400, f"Expected 400 for whitespace-only token in sharing-preferences/revoke: {repr(ws)}")

    def test_fuzz_11_massive_token_strings_buffer_stress(self):
        """Oversized token strings (100,000 characters) must return 404 without memory blowup or 500."""
        self._login(self.patient_a)
        huge_token = "A" * 100000
        res = self.client.post('/api/privacy/sharing-token/revoke', json={'token_id': huge_token})
        self.assertEqual(res.status_code, 404, "Massive token should safely return 404")

    # =========================================================================
    # SUITE 4: Deeply Nested & Malformed JSON Structures
    # =========================================================================

    def test_fuzz_12_deeply_nested_json_payloads(self):
        """JSON objects nested 30 levels deep inside token_id must return 400, not 500."""
        self._login(self.patient_a)
        nested = {"level": "deep"}
        for _ in range(30):
            nested = {"nested": nested}

        res = self.client.post('/api/privacy/sharing-token/revoke', json={'token_id': nested})
        self.assertEqual(res.status_code, 400, "Deeply nested token_id must return 400")

    def test_fuzz_13_nested_arrays_in_token_id(self):
        """Nested arrays in token_id must return 400, not crash sqlite3 with 500."""
        self._login(self.patient_a)
        res = self.client.post('/api/privacy/sharing-token/revoke', json={'token_id': [[[[["inner_token"]]]]]})
        self.assertEqual(res.status_code, 400)

    def test_fuzz_14_oversized_dict_with_thousands_of_garbage_keys(self):
        """Payloads with 1,000 garbage keys alongside token_id are handled gracefully without 500."""
        self._login(self.patient_a)
        garbage_payload = {f"garbage_key_{i}": i * 2 for i in range(1000)}
        garbage_payload["token_id"] = "nonexistent_token_123"

        res = self.client.post('/api/privacy/sharing-token/revoke', json=garbage_payload)
        self.assertEqual(res.status_code, 404)

    def test_fuzz_15_raw_corrupted_json_content(self):
        """Corrupted JSON strings submitted with application/json header return 400."""
        self._login(self.patient_a)
        corrupted_payloads = [
            '{ "token_id": "missing_quote ',
            '{ "token_id": 123, broken }',
            '<<<XML NOT JSON>>>',
            ''
        ]
        for corrupted in corrupted_payloads:
            res = self.client.post(
                '/api/privacy/sharing-token/revoke',
                data=corrupted,
                content_type='application/json'
            )
            self.assertEqual(res.status_code, 400, f"Corrupted payload failed: {corrupted}")

    # =========================================================================
    # SUITE 5: Horizontal Privilege Escalation Penetration Testing
    # =========================================================================

    def test_fuzz_16_horizontal_privilege_escalation_sharing_token_revoke(self):
        """Patient B cannot revoke Patient A's active token via sharing-token/revoke; token remains active."""
        # Patient A creates active token
        record_consent(self.patient_a, 'C3_PARTNER', True)
        acl = create_sharing_acl(
            user_id=self.patient_a,
            recipient_type='PARTNER',
            allowed_domains=['HISTORY', 'METABOLIC'],
            expires_in_days=14
        )
        token_a = acl['share_token']

        # Patient B logs in and attempts to revoke Patient A's token
        self._login(self.patient_b)
        res_exploit = self.client.post('/api/privacy/sharing-token/revoke', json={'token_id': token_a})
        self.assertEqual(
            res_exploit.status_code, 404,
            f"Cross-user revocation returned HTTP {res_exploit.status_code} instead of 404!"
        )

        # Confirm Patient A's token is STILL ACTIVE and accessible
        self._logout()
        res_view = self.client.get(f'/api/privacy/shared-view/{token_a}')
        self.assertEqual(
            res_view.status_code, 200,
            "CRITICAL FLAW: Patient A's token was revoked or rendered inaccessible by Patient B!"
        )

    def test_fuzz_17_horizontal_privilege_escalation_sharing_preferences_revoke(self):
        """Patient B cannot revoke Patient A's token or acl_id via sharing-preferences/revoke."""
        record_consent(self.patient_a, 'C2_TELEHEALTH', True)
        acl = create_sharing_acl(
            user_id=self.patient_a,
            recipient_type='DOCTOR',
            allowed_domains=['HISTORY', 'LIFESTYLE'],
            expires_in_days=7
        )
        token_a = acl['share_token']
        acl_id_a = acl['id']

        self._login(self.patient_b)

        # Attempt 1: via share_token
        res1 = self.client.post('/api/privacy/sharing-preferences/revoke', json={'share_token': token_a})
        self.assertEqual(res1.status_code, 404, "Cross-user revoke via share_token should return 404")

        # Attempt 2: via acl_id
        res2 = self.client.post('/api/privacy/sharing-preferences/revoke', json={'acl_id': acl_id_a})
        self.assertEqual(res2.status_code, 404, "Cross-user revoke via acl_id should return 404")

        # Confirm token is still valid
        self._logout()
        res_check = self.client.get(f'/api/privacy/shared-view/{token_a}')
        self.assertEqual(res_check.status_code, 200, "Patient A's token was improperly affected by Patient B")

    def test_fuzz_18_admin_emergency_override_token_revocation(self):
        """Admin user possesses emergency override authority to revoke any patient's token."""
        record_consent(self.patient_a, 'C3_PARTNER', True)
        acl = create_sharing_acl(
            user_id=self.patient_a,
            recipient_type='PARTNER',
            allowed_domains=['HISTORY'],
            expires_in_days=3
        )
        token_a = acl['share_token']

        # Admin logs in and revokes Patient A's token
        self._login(self.admin_user)
        res_admin = self.client.post('/api/privacy/sharing-token/revoke', json={'token_id': token_a})
        self.assertEqual(res_admin.status_code, 200, "Admin must be able to revoke patient token")
        self.assertTrue(res_admin.get_json().get('revoked'))

        # Confirm token is now truly revoked
        self._logout()
        res_view = self.client.get(f'/api/privacy/shared-view/{token_a}')
        self.assertEqual(res_view.status_code, 403, "Revoked token must return 403")
        self.assertEqual(res_view.get_json().get('error_code'), 'TOKEN_REVOKED')

    def test_fuzz_19_admin_emergency_override_preferences_revoke(self):
        """Admin user can revoke by acl_id across users via sharing-preferences/revoke."""
        record_consent(self.patient_a, 'C2_TELEHEALTH', True)
        acl = create_sharing_acl(
            user_id=self.patient_a,
            recipient_type='DOCTOR',
            allowed_domains=['LIFESTYLE'],
            expires_in_days=5
        )
        acl_id = acl['id']
        token_a = acl['share_token']

        self._login(self.admin_user)
        res = self.client.post('/api/privacy/sharing-preferences/revoke', json={'acl_id': acl_id})
        self.assertEqual(res.status_code, 200)

        # Confirm token status in DB
        db_acl = get_sharing_acl_by_token(token_a)
        self.assertEqual(db_acl['status'], 'revoked')

    def test_fuzz_20_double_revocation_idempotency(self):
        """Revoking an already revoked token returns HTTP 404 without crashing or duplicating records."""
        record_consent(self.patient_a, 'C3_PARTNER', True)
        acl = create_sharing_acl(
            user_id=self.patient_a,
            recipient_type='PARTNER',
            allowed_domains=['HISTORY'],
            expires_in_days=2
        )
        token = acl['share_token']

        self._login(self.patient_a)

        # First revocation -> 200
        res1 = self.client.post('/api/privacy/sharing-token/revoke', json={'token_id': token})
        self.assertEqual(res1.status_code, 200)

        # Second revocation -> 404 (already revoked)
        res2 = self.client.post('/api/privacy/sharing-token/revoke', json={'token_id': token})
        self.assertEqual(
            res2.status_code, 404,
            f"Second revocation attempt returned HTTP {res2.status_code} instead of 404"
        )

    # =========================================================================
    # SUITE 6: GET /api/privacy/shared-view URL Path and Query Fuzzing
    # =========================================================================

    def test_fuzz_21_shared_view_url_sqli_fuzzing(self):
        """SQL injection strings in URL path of shared-view return 404, never 500."""
        sqli_tokens = [
            "' OR '1'='1",
            "'; DROP TABLE reproductive_sharing_acls; --",
            "1' UNION SELECT 1, 2, 3--",
            "\" OR \"\"=\""
        ]
        for token in sqli_tokens:
            res = self.client.get(f'/api/privacy/shared-view/{token}')
            self.assertEqual(res.status_code, 404, f"SQLi token in URL returned {res.status_code}")

    def test_fuzz_22_shared_view_query_param_sqli_fuzzing(self):
        """SQL injection in ?token= or ?share_token= query parameters returns 404 cleanly."""
        res1 = self.client.get('/api/privacy/shared-view?token=%27%20OR%201=1%20--')
        self.assertEqual(res1.status_code, 404)

        res2 = self.client.get('/api/privacy/shared-view?share_token=%27;%20DROP%20TABLE%20users;%20--')
        self.assertEqual(res2.status_code, 404)

    def test_fuzz_23_shared_view_unicode_and_null_bytes(self):
        """Unicode and null byte sequences in shared-view return 404 cleanly."""
        res_arabic = self.client.get('/api/privacy/shared-view/رمز_المشاركة')
        self.assertEqual(res_arabic.status_code, 404)

        res_emoji = self.client.get('/api/privacy/shared-view/🔑🔥💊')
        self.assertEqual(res_emoji.status_code, 404)

    # =========================================================================
    # SUITE 7: Parameter Alias & Missing Field Gating
    # =========================================================================

    def test_fuzz_24_sharing_preferences_revoke_missing_fields_rejection(self):
        """Payloads missing both acl_id and share_token return HTTP 400."""
        self._login(self.patient_a)
        res_empty = self.client.post('/api/privacy/sharing-preferences/revoke', json={})
        self.assertEqual(res_empty.status_code, 400)

        res_unrelated = self.client.post('/api/privacy/sharing-preferences/revoke', json={'irrelevant_key': 'abc'})
        self.assertEqual(res_unrelated.status_code, 400)

    def test_fuzz_25_sharing_token_revoke_all_alias_keys(self):
        """All three parameter aliases ('token_id', 'token', 'share_token') can successfully revoke tokens."""
        record_consent(self.patient_a, 'C3_PARTNER', True)

        # 1. Test alias 'token_id'
        acl1 = create_sharing_acl(self.patient_a, 'PARTNER', ['HISTORY'], expires_in_days=1)
        self._login(self.patient_a)
        r1 = self.client.post('/api/privacy/sharing-token/revoke', json={'token_id': acl1['share_token']})
        self.assertEqual(r1.status_code, 200)

        # 2. Test alias 'token'
        acl2 = create_sharing_acl(self.patient_a, 'PARTNER', ['HISTORY'], expires_in_days=1)
        r2 = self.client.post('/api/privacy/sharing-token/revoke', json={'token': acl2['share_token']})
        self.assertEqual(r2.status_code, 200)

        # 3. Test alias 'share_token'
        acl3 = create_sharing_acl(self.patient_a, 'PARTNER', ['HISTORY'], expires_in_days=1)
        r3 = self.client.post('/api/privacy/sharing-token/revoke', json={'share_token': acl3['share_token']})
        self.assertEqual(r3.status_code, 200)


if __name__ == '__main__':
    unittest.main()
