"""
Milestone 1 Iteration 3 Comprehensive Boundary & Type Fuzzing Suite
Empirical verification of HTTP 500 vulnerabilities across M1 privacy endpoints
when subjected to unexpected types, malformed non-dict JSON payloads,
boundary conditions, extreme numbers, unicode/RTL injection, and invalid encodings.

Endpoints Fuzzed:
1.  GET  /api/privacy/charter
2.  POST /api/privacy/consent
3.  GET  /api/privacy/consent
4.  GET  /api/privacy/consent/history
5.  POST /api/privacy/sharing-preferences
6.  GET  /api/privacy/sharing-preferences
7.  POST /api/privacy/sharing-preferences/revoke
8.  GET  /api/privacy/shared-intake/<share_token>
9.  GET  /api/privacy/guarded-check
10. GET  /api/privacy/consent/check
11. POST /api/privacy/sharing-acl
12. POST /api/privacy/sharing-token
13. POST /api/privacy/sharing-token/revoke
14. GET  /api/privacy/shared-view
15. GET  /api/privacy/shared-view/<share_token>
16. POST /api/privacy/sharing-acl/pedigree-mask
17. POST /api/privacy/retention-purge
18. GET  /api/privacy/check-encryption
19. POST /api/privacy/erasure
20. POST /api/reports/parse-discrete
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
    record_consent, create_sharing_acl
)


class Milestone1BoundaryFuzzingComprehensiveTest(unittest.TestCase):
    """
    Empirical Fuzzing Test Case detecting HTTP 500 crashes across M1 privacy endpoints
    under adversarial and unexpected-type inputs.
    """

    def setUp(self):
        self.test_dir = tempfile.mkdtemp(prefix="ga_m1_it3_fuzz_")
        self.orig_data_dir = Config.DATA_DIR
        self.orig_db_path = Config.DATABASE_PATH
        Config.DATA_DIR = self.test_dir
        Config.DATABASE_PATH = os.path.join(self.test_dir, 'm1_fuzz.db')
        init_db()

        app.testing = False
        app.config['WTF_CSRF_ENABLED'] = False
        app.config['PROPAGATE_EXCEPTIONS'] = False
        app.config['SECRET_KEY'] = 'm1-it3-fuzzing-test-key-2026'

        self.client = app.test_client()
        # Seed test patient and admin
        self.patient_id = create_user("fuzz_patient", "Password123!", "fuzz_patient@example.com", "Fuzz Patient", role="patient")
        self.admin_id = create_user("fuzz_admin", "AdminPass123!", "fuzz_admin@example.com", "Fuzz Admin", role="admin")
        
        # Grant baseline C1 consent and create an active sharing ACL for patient
        record_consent(self.patient_id, 'C1_SCREENING', granted=True)
        self.valid_acl = create_sharing_acl(
            user_id=self.patient_id,
            recipient_type='DOCTOR',
            allowed_domains=["METABOLIC", "LIFESTYLE"],
            redacted_fields=["prior_terminations"],
            recipient_name="Dr. Fuzz"
        )
        self.valid_token = self.valid_acl['share_token']
        self.valid_acl_id = self.valid_acl['id']

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

    # Generic unexpected type corpus
    UNEXPECTED_PRIMITIVES = [
        None,
        12345,
        -999999999999,
        0,
        3.14159,
        -0.0,
        float('inf') if False else 1e308,
        True,
        False,
        [],
        [1, 2, "nested"],
        {},
        {"key": "value", "sub": [1, 2]},
        "",
        "   ",
        "\x00\x01\x02\x03",
        "مفتاح_المشاركة_١٢٣",
        "🔥🚀🧬🔬",
        "' OR 1=1 --",
        "'; DROP TABLE users; --",
        "<script>alert(1)</script>",
        "A" * 10000,
    ]

    # -------------------------------------------------------------------------
    # 1. GET /api/privacy/charter Fuzzing
    # -------------------------------------------------------------------------
    def test_01_fuzz_charter_query_params(self):
        """GET /api/privacy/charter with malformed query params must never return 500."""
        for param in ["", "123", "en", "ar", "all", "fr", "null", "None", "%00", "A"*1000, "' OR 1=1 --", "🔥"]:
            res = self.client.get(f'/api/privacy/charter?lang={param}')
            self.assertNotEqual(res.status_code, 500, f"500 error on /api/privacy/charter?lang={param}")
            self.assertIn(res.status_code, [200, 400])

    # -------------------------------------------------------------------------
    # 2. POST /api/privacy/consent Fuzzing
    # -------------------------------------------------------------------------
    def test_02_fuzz_consent_non_dict_and_corrupt_json(self):
        """POST /api/privacy/consent with non-dict JSON or raw corrupted JSON must not return 500."""
        self._login(self.patient_id)
        # Non-dict bodies
        for body in [123, "string", [1, 2], True, False]:
            res = self.client.post('/api/privacy/consent', json=body)
            self.assertNotEqual(res.status_code, 500, f"500 on body={body}")
            self.assertEqual(res.status_code, 400)

        # Raw corrupt data
        for raw in [b"{bad:json}", b"", b"\x00\xff", b"not-a-json"]:
            res = self.client.post('/api/privacy/consent', data=raw, content_type='application/json')
            self.assertNotEqual(res.status_code, 500, f"500 on raw={raw}")
            self.assertEqual(res.status_code, 400)

    def test_03_fuzz_consent_unexpected_types_in_fields(self):
        """POST /api/privacy/consent with unexpected field types must return 400, never 500."""
        self._login(self.patient_id)
        # Fuzz consent_tier
        for bad_tier in self.UNEXPECTED_PRIMITIVES:
            res = self.client.post('/api/privacy/consent', json={'consent_tier': bad_tier, 'granted': True})
            self.assertNotEqual(res.status_code, 500, f"500 on consent_tier={bad_tier}")
            # If valid string like 'C1_SCREENING', it returns 200, else 400
            self.assertIn(res.status_code, [200, 400])

        # Fuzz granted
        for bad_granted in [123, "true", "yes", [True], {"grant": True}, 3.14, None]:
            res = self.client.post('/api/privacy/consent', json={'consent_tier': 'C1_SCREENING', 'granted': bad_granted})
            self.assertNotEqual(res.status_code, 500, f"500 on granted={bad_granted}")
            self.assertEqual(res.status_code, 400)

        # Fuzz user_id & consent_version
        for bad_ver in [123, [], {}, True, "2.0"]:
            res = self.client.post('/api/privacy/consent', json={'consent_tier': 'C2_TELEHEALTH', 'granted': True, 'consent_version': bad_ver})
            self.assertNotEqual(res.status_code, 500, f"500 on consent_version={bad_ver}")

    # -------------------------------------------------------------------------
    # 3. GET /api/privacy/consent Fuzzing
    # -------------------------------------------------------------------------
    def test_04_fuzz_get_consent(self):
        """GET /api/privacy/consent with unexpected tier query params must never return 500."""
        self._login(self.patient_id)
        for bad_tier in ["", "C99_INVALID", "123", "null", "' OR 1=1 --", "%00", "A"*500, "C1_SCREENING"]:
            res = self.client.get(f'/api/privacy/consent?tier={bad_tier}')
            self.assertNotEqual(res.status_code, 500, f"500 on GET /api/privacy/consent?tier={bad_tier}")
            self.assertIn(res.status_code, [200, 400])

    # -------------------------------------------------------------------------
    # 4. GET /api/privacy/consent/history Fuzzing
    # -------------------------------------------------------------------------
    def test_05_fuzz_get_consent_history(self):
        """GET /api/privacy/consent/history with unexpected query params must never return 500."""
        self._login(self.patient_id)
        for bad_tier in ["", "INVALID", "12345", "%00", "' OR 1=1 --", "C1_SCREENING"]:
            res = self.client.get(f'/api/privacy/consent/history?tier={bad_tier}')
            self.assertNotEqual(res.status_code, 500, f"500 on consent history tier={bad_tier}")
            self.assertIn(res.status_code, [200, 400])

    # -------------------------------------------------------------------------
    # 5. POST /api/privacy/sharing-preferences Fuzzing
    # -------------------------------------------------------------------------
    def test_06_fuzz_sharing_preferences_creation(self):
        """POST /api/privacy/sharing-preferences with unexpected types in all fields."""
        self._login(self.patient_id)
        # Non-dict bodies
        for body in [123, "string", [1, 2], True, False]:
            res = self.client.post('/api/privacy/sharing-preferences', json=body)
            self.assertNotEqual(res.status_code, 500, f"500 on body={body}")
            self.assertEqual(res.status_code, 400)

        # Unexpected recipient_type
        for bad_rcp in [None, 123, True, [], {}, "INVALID_ROLE", "", " "]:
            res = self.client.post('/api/privacy/sharing-preferences', json={
                'recipient_type': bad_rcp,
                'allowed_domains': ['METABOLIC']
            })
            self.assertNotEqual(res.status_code, 500, f"500 on recipient_type={bad_rcp}")
            self.assertEqual(res.status_code, 400)

        # Unexpected allowed_domains
        for bad_dom in [None, 123, "METABOLIC", [], [1, 2], ["METABOLIC", None], {"METABOLIC": True}]:
            res = self.client.post('/api/privacy/sharing-preferences', json={
                'recipient_type': 'DOCTOR',
                'allowed_domains': bad_dom
            })
            self.assertNotEqual(res.status_code, 500, f"500 on allowed_domains={bad_dom}")
            self.assertEqual(res.status_code, 400)

        # Unexpected redacted_fields
        for bad_redact in [123, "prior_terminations", [123], [{}], None]:
            res = self.client.post('/api/privacy/sharing-preferences', json={
                'recipient_type': 'DOCTOR',
                'allowed_domains': ['METABOLIC'],
                'redacted_fields': bad_redact
            })
            self.assertNotEqual(res.status_code, 500, f"500 on redacted_fields={bad_redact}")
            self.assertIn(res.status_code, [201, 400])

        # Unexpected expires_in_days (must clamp safely without 500)
        for bad_exp in [-1, -99999, 0, 999999, "thirty", [], {}, 30.5]:
            res = self.client.post('/api/privacy/sharing-preferences', json={
                'recipient_type': 'DOCTOR',
                'allowed_domains': ['METABOLIC'],
                'expires_in_days': bad_exp
            })
            self.assertNotEqual(res.status_code, 500, f"500 on expires_in_days={bad_exp}")
            self.assertEqual(res.status_code, 201)

    # -------------------------------------------------------------------------
    # 6. POST /api/privacy/sharing-preferences/revoke Fuzzing
    # -------------------------------------------------------------------------
    def test_07_fuzz_sharing_preferences_revoke(self):
        """POST /api/privacy/sharing-preferences/revoke with unexpected types."""
        self._login(self.patient_id)
        # Non-dict bodies
        for body in [123, "token", [1, 2], True, False]:
            res = self.client.post('/api/privacy/sharing-preferences/revoke', json=body)
            self.assertNotEqual(res.status_code, 500, f"500 on body={body}")
            self.assertEqual(res.status_code, 400)

        # Empty body
        res = self.client.post('/api/privacy/sharing-preferences/revoke', json={})
        self.assertNotEqual(res.status_code, 500)
        self.assertEqual(res.status_code, 400)

        # Unexpected types in acl_id
        for bad_id in [None, "invalid_str", [1], {"id": 1}, 3.14, -1, 0, 99999999]:
            res = self.client.post('/api/privacy/sharing-preferences/revoke', json={'acl_id': bad_id})
            self.assertNotEqual(res.status_code, 500, f"500 on acl_id={bad_id}")
            self.assertIn(res.status_code, [200, 400, 404])

        # Unexpected types in share_token
        for bad_tok in [None, 123, True, False, [], {}, "", "   ", "' OR 1=1 --", "\x00"]:
            res = self.client.post('/api/privacy/sharing-preferences/revoke', json={'share_token': bad_tok})
            self.assertNotEqual(res.status_code, 500, f"500 on share_token={bad_tok}")
            self.assertIn(res.status_code, [400, 404])

    # -------------------------------------------------------------------------
    # 7. POST /api/privacy/sharing-token/revoke Fuzzing
    # -------------------------------------------------------------------------
    def test_08_fuzz_sharing_token_revoke(self):
        """POST /api/privacy/sharing-token/revoke with unexpected types."""
        self._login(self.patient_id)
        # Non-dict bodies
        for body in [123, "token", [1, 2], True, False]:
            res = self.client.post('/api/privacy/sharing-token/revoke', json=body)
            self.assertNotEqual(res.status_code, 500, f"500 on body={body}")
            self.assertEqual(res.status_code, 400)

        # Missing token
        res = self.client.post('/api/privacy/sharing-token/revoke', json={})
        self.assertNotEqual(res.status_code, 500)
        self.assertEqual(res.status_code, 400)

        # Unexpected types in token_id / token / share_token
        for bad_tok in [None, 123, True, False, [1, 2], {"token": "x"}, 3.14, "", "   ", "' OR 1=1 --", "\x00", "A"*5000]:
            res = self.client.post('/api/privacy/sharing-token/revoke', json={'token_id': bad_tok})
            self.assertNotEqual(res.status_code, 500, f"500 on token_id={bad_tok}")
            self.assertIn(res.status_code, [400, 404])

    # -------------------------------------------------------------------------
    # 8. GET /api/privacy/shared-intake/<share_token> & /api/privacy/shared-view Fuzzing
    # -------------------------------------------------------------------------
    def test_09_fuzz_shared_view_endpoints(self):
        """GET /api/privacy/shared-view and /shared-intake/<token> with malformed tokens."""
        # Unauthenticated calls (bearer-token authorized)
        self._logout()
        # GET /api/privacy/shared-view without token
        res = self.client.get('/api/privacy/shared-view')
        self.assertNotEqual(res.status_code, 500)
        self.assertEqual(res.status_code, 400)

        # Fuzz query param ?token=
        for bad_tok in ["", "nonexistent", "123", "' OR 1=1 --", "%00", "مفتاح", "A"*1000, "expired_share_token_99", "revoked_token_111"]:
            res = self.client.get(f'/api/privacy/shared-view?token={bad_tok}')
            self.assertNotEqual(res.status_code, 500, f"500 on shared-view?token={bad_tok}")
            self.assertIn(res.status_code, [200, 400, 403, 404, 410])

        # Fuzz path param /api/privacy/shared-view/<share_token>
        for bad_path in ["nonexistent", "12345", "expired_share_token_99", "revoked_token_111", "test%20token"]:
            res = self.client.get(f'/api/privacy/shared-view/{bad_path}')
            self.assertNotEqual(res.status_code, 500, f"500 on /shared-view/{bad_path}")
            self.assertIn(res.status_code, [200, 403, 404, 410])

        # Fuzz path param /api/privacy/shared-intake/<share_token>
        for bad_path in ["nonexistent", "12345", "expired_share_token_99", "revoked_token_111"]:
            res = self.client.get(f'/api/privacy/shared-intake/{bad_path}')
            self.assertNotEqual(res.status_code, 500, f"500 on /shared-intake/{bad_path}")
            self.assertIn(res.status_code, [200, 403, 404, 410])

    # -------------------------------------------------------------------------
    # 9. GET /api/privacy/consent/check Fuzzing
    # -------------------------------------------------------------------------
    def test_10_fuzz_consent_check(self):
        """GET /api/privacy/consent/check with unexpected user_id and scope params."""
        for bad_uid in ["", "abc", "-1", "999999", "3.14", "' OR 1=1 --"]:
            for bad_scope in ["", "invalid_scope", "123", "screening", "telehealth"]:
                res = self.client.get(f'/api/privacy/consent/check?user_id={bad_uid}&scope={bad_scope}')
                self.assertNotEqual(res.status_code, 500, f"500 on check user_id={bad_uid}, scope={bad_scope}")
                self.assertIn(res.status_code, [200, 403])

    # -------------------------------------------------------------------------
    # 10. POST /api/privacy/sharing-acl Fuzzing
    # -------------------------------------------------------------------------
    def test_11_fuzz_sharing_acl_alias(self):
        """POST /api/privacy/sharing-acl with unexpected types."""
        self._login(self.patient_id)
        # Non-dict bodies (assert no 500)
        for body in [123, "body", [1], True, False]:
            res = self.client.post('/api/privacy/sharing-acl', json=body)
            self.assertNotEqual(res.status_code, 500, f"500 on body={body}")

        # Unexpected types in recipient_type
        for bad_rcp in [123, [], {}, True]:
            res = self.client.post('/api/privacy/sharing-acl', json={'recipient_type': bad_rcp})
            self.assertNotEqual(res.status_code, 500, f"500 on recipient_type={bad_rcp}")
            self.assertEqual(res.status_code, 400)

        # Unexpected types in allowed_domains & redacted_fields
        for bad_val in [123, "METABOLIC", True]:
            res = self.client.post('/api/privacy/sharing-acl', json={'allowed_domains': bad_val})
            self.assertNotEqual(res.status_code, 500, f"500 on allowed_domains={bad_val}")
            self.assertEqual(res.status_code, 400)

            res = self.client.post('/api/privacy/sharing-acl', json={'redacted_fields': bad_val})
            self.assertNotEqual(res.status_code, 500, f"500 on redacted_fields={bad_val}")
            self.assertEqual(res.status_code, 400)

    # -------------------------------------------------------------------------
    # 11. POST /api/privacy/sharing-token Fuzzing
    # -------------------------------------------------------------------------
    def test_12_fuzz_sharing_token_alias(self):
        """POST /api/privacy/sharing-token with unexpected non-dict bodies and duration_hours."""
        self._login(self.patient_id)
        # Non-dict bodies (assert no 500)
        for body in [123, "body", [1], True, False]:
            res = self.client.post('/api/privacy/sharing-token', json=body)
            self.assertNotEqual(res.status_code, 500, f"500 on body={body}")

        for bad_dur in [-1, -999, 0, 3.14, "twenty_four", [], {}, 999999]:
            res = self.client.post('/api/privacy/sharing-token', json={'duration_hours': bad_dur})
            self.assertNotEqual(res.status_code, 500, f"500 on duration_hours={bad_dur}")
            self.assertEqual(res.status_code, 201)

    # -------------------------------------------------------------------------
    # 12. POST /api/privacy/sharing-acl/pedigree-mask Fuzzing
    # -------------------------------------------------------------------------
    def test_13_fuzz_pedigree_mask(self):
        """POST /api/privacy/sharing-acl/pedigree-mask with unexpected bodies and node_id types."""
        self._login(self.patient_id)
        # Non-dict bodies (assert no 500)
        for body in [123, "body", [1], True, False]:
            res = self.client.post('/api/privacy/sharing-acl/pedigree-mask', json=body)
            self.assertNotEqual(res.status_code, 500, f"500 on body={body}")

        for bad_node in [None, 123, "NODE-01", [], {}, True, -1, 3.14, "' OR 1=1 --"]:
            res = self.client.post('/api/privacy/sharing-acl/pedigree-mask', json={'node_id': bad_node})
            self.assertNotEqual(res.status_code, 500, f"500 on node_id={bad_node}")
            self.assertEqual(res.status_code, 200)

    # -------------------------------------------------------------------------
    # 13. POST /api/privacy/retention-purge Fuzzing
    # -------------------------------------------------------------------------
    def test_14_fuzz_retention_purge(self):
        """POST /api/privacy/retention-purge with various payloads."""
        for payload in [{}, {"purge": True}, [1, 2], "purge", 123, None]:
            res = self.client.post('/api/privacy/retention-purge', json=payload)
            self.assertNotEqual(res.status_code, 500, f"500 on retention-purge payload={payload}")
            self.assertEqual(res.status_code, 200)

    # -------------------------------------------------------------------------
    # 14. GET /api/privacy/check-encryption Fuzzing
    # -------------------------------------------------------------------------
    def test_15_fuzz_check_encryption(self):
        """GET /api/privacy/check-encryption sanity and query param resilience."""
        for query in ["", "?test=1", "?canary=malicious&inject=' OR 1=1 --"]:
            res = self.client.get(f'/api/privacy/check-encryption{query}')
            self.assertNotEqual(res.status_code, 500)
            self.assertEqual(res.status_code, 200)

    # -------------------------------------------------------------------------
    # 15. POST /api/privacy/erasure Fuzzing
    # -------------------------------------------------------------------------
    def test_16_fuzz_erasure_endpoint(self):
        """POST /api/privacy/erasure with missing flags, unexpected types, and non-dict inputs."""
        self._login(self.patient_id)
        # Non-dict bodies (assert no 500)
        for body in [123, "purge", [1, 2], True, False]:
            res = self.client.post('/api/privacy/erasure', json=body)
            self.assertNotEqual(res.status_code, 500, f"500 on body={body}")

        # Missing confirm_purge flag
        res = self.client.post('/api/privacy/erasure', json={'user_id': self.patient_id})
        self.assertNotEqual(res.status_code, 500)
        self.assertEqual(res.status_code, 400)

        # Missing user_id when unauthenticated
        self._logout()
        res = self.client.post('/api/privacy/erasure', json={'confirm_purge': True})
        self.assertNotEqual(res.status_code, 500)
        self.assertEqual(res.status_code, 400)

        # Unexpected user_id types with confirm_purge=True
        for bad_uid in [-99999, 999999, "not_an_id", [1], {"id": 1}]:
            res = self.client.post('/api/privacy/erasure', json={'user_id': bad_uid, 'confirm_purge': True})
            self.assertNotEqual(res.status_code, 500, f"500 on bad user_id={bad_uid}")
            self.assertIn(res.status_code, [200, 400])

    # -------------------------------------------------------------------------
    # 16. POST /api/reports/parse-discrete Fuzzing
    # -------------------------------------------------------------------------
    def test_17_fuzz_parse_discrete_endpoint(self):
        """POST /api/reports/parse-discrete with unexpected non-dict bodies and file_name types."""
        # Non-dict bodies (assert no 500)
        for body in [123, "parse", [1], True, False]:
            res = self.client.post('/api/reports/parse-discrete', json=body)
            self.assertNotEqual(res.status_code, 500, f"500 on body={body}")

        for bad_name in [None, 123, [1, 2], {}, True, "", "A"*5000, "\x00.pdf", "../../../etc/passwd"]:
            res = self.client.post('/api/reports/parse-discrete', json={'file_name': bad_name})
            self.assertNotEqual(res.status_code, 500, f"500 on file_name={bad_name}")
            self.assertEqual(res.status_code, 200)


if __name__ == '__main__':
    unittest.main()
