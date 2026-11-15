#!/usr/bin/env python3
"""
Adversarial Empirical Stress Harness - Milestone 1 Iteration 3
Author: m1_r3_challenger_1 (Empirical Challenger)

Tasks:
1. Stress test pseudonym generation collision resistance:
   - Generate 10,000 sequential pseudonyms under `name_initials="ta"` and assert len(set) == 10000 (0 collisions).
   - Verify format compliance with `^[A-Z][a-z]+-[A-Z][a-z]+-[a-z0-9-]+$`.
   - Entropy & keyspace verification.
2. Stress test authentic fixture tokens and sharing view routes:
   - Test GET /api/privacy/shared-view?token=expired_share_token_99 -> assert HTTP 410 (TOKEN_EXPIRED)
   - Test GET /api/privacy/shared-view?token=revoked_token_111 -> assert HTTP 403 (TOKEN_REVOKED)
   - Test GET /api/privacy/shared-view?token=nonexistent_token_xyz -> assert HTTP 404 (TOKEN_NOT_FOUND)
   - Test adversarial non-existent tokens with keywords:
     * token=expired_fake_not_in_db -> assert HTTP 404 (TOKEN_NOT_FOUND), NOT 410!
     * token=revoked_fake_not_in_db -> assert HTTP 404 (TOKEN_NOT_FOUND), NOT 403!
   - Test authentic newly created token:
     * active + C2 consent -> 200
     * revoked via API/DB -> 403 (TOKEN_REVOKED)
     * expired via TTL/DB -> 410 (TOKEN_EXPIRED)
     * C2 consent revoked -> 403 (CONSENT_REVOKED)
"""

import sys
import os
import re
import unittest
import json
from datetime import datetime, timezone, timedelta

# Path setup
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(current_dir, '..'))
backend_dir = os.path.join(root_dir, 'backend')
for p in [root_dir, backend_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

from config import Config
from app import app
from database import (
    init_db,
    generate_pseudonym,
    ADJECTIVES,
    NOUNS,
    get_db_connection,
    record_consent,
    create_sharing_acl,
    revoke_sharing_acl_by_token,
    validate_share_token_access
)


class M1R3EmpiricalStressTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        app.config['TESTING'] = True
        app.config['WTF_CSRF_ENABLED'] = False
        cls.client = app.test_client()

    def test_task1_pseudonym_10000_sequential_draws_collision_resistance(self):
        """
        Task 1: Generate 10,000 sequential pseudonyms under name_initials="ta"
        and assert len(set) == 10000 (0 collisions).
        Verify format compliance with ^[A-Z][a-z]+-[A-Z][a-z]+-[a-z0-9-]+$.
        """
        pattern = re.compile(r'^[A-Z][a-z]+-[A-Z][a-z]+-[a-z0-9-]+$')
        samples = []
        unique_set = set()

        num_draws = 10000
        for i in range(num_draws):
            pseudo = generate_pseudonym(name_initials="ta")
            samples.append(pseudo)
            unique_set.add(pseudo)

            # Assert format immediately
            self.assertTrue(
                pattern.match(pseudo),
                f"Pseudonym '{pseudo}' does not match regex contract '^[A-Z][a-z]+-[A-Z][a-z]+-[a-z0-9-]+$'"
            )
            # Verify clean code 'ta' is embedded
            self.assertIn("-ta-", pseudo, f"Clean code '-ta-' not found in '{pseudo}'")

        # Assert 0 collisions
        self.assertEqual(
            len(unique_set),
            num_draws,
            f"Collisions detected in {num_draws} draws: {num_draws - len(unique_set)} duplicates found!"
        )

    def test_task1_keyspace_and_entropy_bounds(self):
        """
        Assert keyspace theoretical size is strictly >= 10^8 (actually ~2.95e10).
        """
        num_adj = len(set(ADJECTIVES))
        num_nouns = len(set(NOUNS))
        num_digits = 900000  # 100000 to 999999

        total_keyspace = num_adj * num_nouns * num_digits
        self.assertGreaterEqual(num_adj, 150)
        self.assertGreaterEqual(num_nouns, 150)
        self.assertGreaterEqual(total_keyspace, 10**8)
        self.assertGreater(total_keyspace, 2.5 * 10**10)

        # Check adjectives and nouns conform to Capitalized word format
        word_pattern = re.compile(r'^[A-Z][a-z]+$')
        for adj in ADJECTIVES:
            self.assertTrue(word_pattern.match(adj), f"Adjective '{adj}' is not Capitalized word")
        for noun in NOUNS:
            self.assertTrue(word_pattern.match(noun), f"Noun '{noun}' is not Capitalized word")

    def test_task1_multithreaded_concurrent_pseudonym_generation(self):
        """
        Adversarial Concurrency:
        10 threads simultaneously drawing 1,000 pseudonyms each (total 10,000).
        Verify zero collisions under concurrent execution.
        """
        import concurrent.futures

        num_threads = 10
        draws_per_thread = 1000
        pattern = re.compile(r'^[A-Z][a-z]+-[A-Z][a-z]+-[a-z0-9-]+$')

        def worker():
            local_list = []
            for _ in range(draws_per_thread):
                p = generate_pseudonym(name_initials="ta")
                local_list.append(p)
            return local_list

        with concurrent.futures.ThreadPoolExecutor(max_workers=num_threads) as executor:
            futures = [executor.submit(worker) for _ in range(num_threads)]
            all_generated = []
            for f in concurrent.futures.as_completed(futures):
                all_generated.extend(f.result())

        self.assertEqual(len(all_generated), num_threads * draws_per_thread)
        self.assertEqual(len(set(all_generated)), len(all_generated), "Collisions found during concurrent generation!")
        for p in all_generated[:100]:  # Spot check formatting
            self.assertTrue(pattern.match(p))

    def test_task2_authentic_fixture_expired_token(self):
        """
        Test GET /api/privacy/shared-view?token=expired_share_token_99
        -> assert HTTP 410 (TOKEN_EXPIRED) without string heuristics.
        """
        resp = self.client.get('/api/privacy/shared-view?token=expired_share_token_99')
        self.assertEqual(resp.status_code, 410)
        data = resp.get_json()
        self.assertEqual(data.get('status'), 'error')
        self.assertEqual(data.get('error_code'), 'TOKEN_EXPIRED')

        # Also via path parameter
        resp_path = self.client.get('/api/privacy/shared-view/expired_share_token_99')
        self.assertEqual(resp_path.status_code, 410)
        self.assertEqual(resp_path.get_json().get('error_code'), 'TOKEN_EXPIRED')

    def test_task2_authentic_fixture_revoked_token(self):
        """
        Test GET /api/privacy/shared-view?token=revoked_token_111
        -> assert HTTP 403 (TOKEN_REVOKED) without string heuristics.
        """
        resp = self.client.get('/api/privacy/shared-view?token=revoked_token_111')
        self.assertEqual(resp.status_code, 403)
        data = resp.get_json()
        self.assertEqual(data.get('status'), 'error')
        self.assertEqual(data.get('error_code'), 'TOKEN_REVOKED')

        # Also via path parameter
        resp_path = self.client.get('/api/privacy/shared-view/revoked_token_111')
        self.assertEqual(resp_path.status_code, 403)
        self.assertEqual(resp_path.get_json().get('error_code'), 'TOKEN_REVOKED')

    def test_task2_nonexistent_token(self):
        """
        Test GET /api/privacy/shared-view?token=nonexistent_token_xyz
        -> assert HTTP 404 (TOKEN_NOT_FOUND).
        """
        resp = self.client.get('/api/privacy/shared-view?token=nonexistent_token_xyz')
        self.assertEqual(resp.status_code, 404)
        data = resp.get_json()
        self.assertEqual(data.get('status'), 'error')
        self.assertEqual(data.get('error_code'), 'TOKEN_NOT_FOUND')

    def test_task2_adversarial_heuristic_bypass_attempts(self):
        """
        Adversarial check:
        If a token contains substring 'expired' or 'revoked', BUT is NOT in the database,
        it MUST return HTTP 404 (TOKEN_NOT_FOUND), NOT 410 or 403!
        This proves the string substring shortcut is truly gone.
        """
        tricky_tokens = [
            "expired_fake_token_not_in_db_12345",
            "this_is_an_expired_credential",
            "revoked_fake_token_not_in_db_67890",
            "doctor_revoked_session_fake",
            "expired",
            "revoked"
        ]

        for token in tricky_tokens:
            resp = self.client.get(f'/api/privacy/shared-view?token={token}')
            self.assertEqual(
                resp.status_code, 404,
                f"Token '{token}' returned {resp.status_code} instead of 404! String heuristic might still be present!"
            )
            data = resp.get_json()
            self.assertEqual(data.get('error_code'), 'TOKEN_NOT_FOUND')

    def test_task2_dynamic_token_lifecycle_without_keyword_names(self):
        """
        Adversarial test:
        Create a genuine sharing ACL with token name containing NO magic words (e.g. 'alpha_beta_gamma_123').
        Verify state changes are driven strictly by SQLite database state:
        - Active + C2 consent -> 200
        - Revoked -> 403 (TOKEN_REVOKED)
        - Expired -> 410 (TOKEN_EXPIRED)
        """
        # Ensure user 1 exists and has C2 consent
        conn = get_db_connection()
        user = conn.execute("SELECT id FROM users WHERE id = 1").fetchone()
        conn.close()
        user_id = user['id'] if user else 1

        record_consent(user_id, 'C2_TELEHEALTH', True)

        acl = create_sharing_acl(
            user_id=user_id,
            recipient_type='DOCTOR',
            allowed_domains=['HISTORY', 'PEDIGREE'],
            recipient_name='Dr. Adversarial Auditor',
            expires_in_days=30
        )
        token_name = acl['share_token']

        # 1. Active access
        resp = self.client.get(f'/api/privacy/shared-view?token={token_name}')
        self.assertEqual(resp.status_code, 200, f"Expected 200 for active token, got {resp.status_code}: {resp.data}")

        # 2. Revoke the token via API
        with self.client.session_transaction() as sess:
            sess['user_id'] = user_id
        revoke_resp = self.client.post('/api/privacy/sharing-token/revoke', json={'token_id': token_name})
        self.assertEqual(revoke_resp.status_code, 200)

        # 3. Access after revocation -> MUST be 403 TOKEN_REVOKED
        resp_after_revocation = self.client.get(f'/api/privacy/shared-view?token={token_name}')
        self.assertEqual(resp_after_revocation.status_code, 403)
        self.assertEqual(resp_after_revocation.get_json().get('error_code'), 'TOKEN_REVOKED')

        # 4. Now create another custom token and expire it in DB
        acl_expiring = create_sharing_acl(
            user_id=user_id,
            recipient_type='DOCTOR',
            allowed_domains=['HISTORY'],
            recipient_name='Dr. Expiring Auditor',
            expires_in_days=10
        )
        token_expired_name = acl_expiring['share_token']

        # Manually backdate expiration in DB to the past
        past_iso = (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()
        conn = get_db_connection()
        conn.execute("UPDATE reproductive_sharing_acls SET expires_at = ? WHERE share_token = ?", (past_iso, token_expired_name))
        conn.commit()
        conn.close()

        # 5. Access expired token -> MUST be 410 TOKEN_EXPIRED
        resp_after_expiration = self.client.get(f'/api/privacy/shared-view?token={token_expired_name}')
        self.assertEqual(resp_after_expiration.status_code, 410)
        self.assertEqual(resp_after_expiration.get_json().get('error_code'), 'TOKEN_EXPIRED')

    def test_task2_adversarial_revocation_boundary_inputs(self):
        """
        Adversarial fuzzing and authorization gate testing against revocation endpoints:
        - Non-dict JSON payloads -> 400
        - Unauthenticated requests -> 401
        - Invalid token types (dict, list, int, empty string) -> 400
        - Nonexistent tokens -> 404
        - Cross-user authorization isolation (User A cannot revoke User B's token unless admin)
        """
        # 1. Unauthenticated request must yield 401
        resp = self.client.post('/api/privacy/sharing-token/revoke', json={'token_id': 'any_token'})
        self.assertEqual(resp.status_code, 401)

        # 2. Authenticated as non-admin User 2
        with self.client.session_transaction() as sess:
            sess['user_id'] = 999
            sess['username'] = 'adversary_attacker'

        # Fuzz non-dict payloads
        for bad_payload in [12345, "string_payload", [1, 2, 3], True]:
            resp = self.client.post('/api/privacy/sharing-token/revoke', data=json.dumps(bad_payload), content_type='application/json')
            self.assertEqual(resp.status_code, 400, f"Expected 400 for payload {bad_payload}, got {resp.status_code}")

        # Missing token or invalid token types
        for bad_token in [None, "", "   ", 12345, ["token"], {"key": "val"}]:
            resp = self.client.post('/api/privacy/sharing-token/revoke', json={'token_id': bad_token})
            self.assertEqual(resp.status_code, 400, f"Expected 400 for bad token {bad_token}, got {resp.status_code}")

        # Nonexistent token
        resp = self.client.post('/api/privacy/sharing-token/revoke', json={'token_id': 'totally_nonexistent_token_777'})
        self.assertEqual(resp.status_code, 404)

        # Cross-user isolation: User 1 creates a token, User 999 tries to revoke it -> 404
        conn = get_db_connection()
        user1 = conn.execute("SELECT id FROM users WHERE id = 1").fetchone()
        conn.close()
        user1_id = user1['id'] if user1 else 1

        acl = create_sharing_acl(
            user_id=user1_id,
            recipient_type='DOCTOR',
            allowed_domains=['HISTORY'],
            recipient_name='Dr. Isolated'
        )
        isolated_token = acl['share_token']

        # User 999 attempts to revoke User 1's token
        resp_unauth = self.client.post('/api/privacy/sharing-token/revoke', json={'token_id': isolated_token})
        self.assertEqual(resp_unauth.status_code, 404, "User 999 was able to revoke User 1's token!")

        # Verify token is STILL active for User 1
        record_consent(user1_id, 'C2_TELEHEALTH', True)
        resp_check = self.client.get(f'/api/privacy/shared-view?token={isolated_token}')
        self.assertEqual(resp_check.status_code, 200, "Token was incorrectly invalidated by unprivileged user!")


if __name__ == '__main__':
    unittest.main()
