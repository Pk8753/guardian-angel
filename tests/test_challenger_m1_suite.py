"""
Empirical Challenger Test Suite for Milestone 1:
Stress-testing /api/ai/ask and qwen_brain_service across edge cases,
adversarial queries, multi-family couple compatibility, and error handling.
"""

import unittest
from app import app


class ChallengerM1StressTestSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = app.test_client()

    def _login(self, user_id=1, username="admin"):
        with self.client.session_transaction() as sess:
            sess["user_id"] = user_id
            sess["username"] = username

    # ---------------------------------------------------------
    # 1. CORE CLINICAL QUERY VARIATIONS & ADVERSARIAL FORMATTING
    # ---------------------------------------------------------
    def test_lab_results_variations_robustness(self):
        """Verify variations of 'What are my lab results?' return grounded screening results."""
        self._login(1, "admin")
        queries = [
            "What are my lab results?",
            "WHAT ARE MY LAB RESULTS?!?!",
            "   \t  what are my lab results?  \n ",
            "wHaT aRe mY lAb ReSuLtS???",
            "What did my screening report say?",
            "what did my screening report say????",
            "Could you please explain the findings in my premarital laboratory report?",
            "What are my hematology diagnostic values?",
            "Show me my hemoglobinopathy test outcomes",
            "Explain my results",
            "eXpLaIn mY rEsUlTs ! ! !",
            "What are the findings in my report?",
            "show me my blood test results",
        ]
        for q in queries:
            resp = self.client.post("/api/ai/ask", json={"query": q, "family_id": "F-000123"})
            self.assertEqual(resp.status_code, 200, f"Query failed with HTTP {resp.status_code}: {q}")
            data = resp.get_json()
            ans = data.get("answer", "")
            self.assertTrue(
                "Beta-Thalassemia" in ans or "Thalassemia" in ans or "carrier" in ans.lower() or "trait" in ans.lower(),
                f"Query '{q}' did not return screening report context: {ans[:200]}"
            )
            self.assertNotEqual(data.get("source"), "Medical Abbreviation Dictionary", f"Query '{q}' was hijacked by abbreviation dict")

    def test_reproductive_risk_and_healthy_children_variations(self):
        """Verify variations of reproductive risk and healthy children queries return 75% reassurance."""
        self._login(1, "admin")
        reassurance_queries = [
            "What is our reproductive risk?",
            "WHAT IS OUR REPRODUCTIVE RISK?!",
            "   what is our reproductive risk???   ",
            "wHaT iS oUr RePrOdUcTiVe RiSk??",
            "Can we have healthy children?",
            "CAN WE HAVE HEALTHY CHILDREN???",
            "can we have a healthy baby?",
            "Is there a chance of having a healthy child?",
            "Can we have healthy babies with our carrier traits?",
        ]
        for q in reassurance_queries:
            resp = self.client.post("/api/ai/ask", json={"query": q, "family_id": "F-000123"})
            self.assertEqual(resp.status_code, 200, f"Query failed with HTTP {resp.status_code}: {q}")
            data = resp.get_json()
            ans = data.get("answer", "")
            self.assertTrue(
                "75%" in ans or "unaffected" in ans.lower() or "healthy" in ans.lower(),
                f"Query '{q}' did not return reproductive reassurance: {ans[:200]}"
            )
            self.assertNotIn("Eager-Otter", ans, f"Query '{q}' dumped unrelated member in response: {ans[:200]}")

    def test_star_child_standard_queries(self):
        """Verify star child queries return projected offspring explanation."""
        self._login(1, "admin")
        star_queries = [
            "What does the star child mean?",
            "WHAT DOES THE STAR CHILD MEAN?!",
            "what is the star child?",
            "What does the ★ star child ★ mean?",
            "Tell me about the projected child with a star",
            "what does the star mean in our pedigree?",
        ]
        for q in star_queries:
            resp = self.client.post("/api/ai/ask", json={"query": q, "family_id": "F-000123"})
            self.assertEqual(resp.status_code, 200, f"Query failed with HTTP {resp.status_code}: {q}")
            data = resp.get_json()
            ans = data.get("answer", "")
            self.assertTrue(
                "projected" in ans.lower() or "star" in ans.lower() or "offspring" in ans.lower(),
                f"Query '{q}' failed to explain star child: {ans[:200]}"
            )

    # ---------------------------------------------------------
    # 2. MULTI-FAMILY COUPLE COMPATIBILITY & ACCESS ISOLATION
    # ---------------------------------------------------------
    def test_multi_family_couple_targeting(self):
        """Verify couple compatibility accurately targets proband for User 1 and gen-sorted couple for User 6."""
        # Family 1 (User 1 - Al-Mansoor F-000123)
        self._login(1, "admin")
        resp1 = self.client.post("/api/ai/ask", json={
            "query": "What is our couple compatibility?",
            "family_id": "F-000123"
        })
        self.assertEqual(resp1.status_code, 200)
        ans1 = resp1.get_json().get("answer", "")
        self.assertIn("Silent-Falcon-9214", ans1, "User 1 should target Proband Silent-Falcon-9214")
        self.assertNotIn("Elder-Oak-101", ans1, "User 1 must NOT target Gen 1 grandparent Elder-Oak-101")

        # Family 2 (User 6 - SMA FA-000001)
        self._login(6, "kabir")
        resp2 = self.client.post("/api/ai/ask", json={
            "query": "What is our couple compatibility?",
            "family_id": "FA-000001"
        })
        self.assertEqual(resp2.status_code, 200)
        ans2 = resp2.get_json().get("answer", "")
        self.assertIn("Eager-Otter-ta-2364", ans2, "User 6 should target Eager-Otter-ta-2364")
        self.assertIn("Silver-Raven-fa-9569", ans2, "User 6 should target Silver-Raven-fa-9569")
        self.assertNotIn("Swift-Lynx-ch-9713", ans2, "User 6 must NOT treat child node as couple partner")

    def test_cross_tenant_family_access_isolation(self):
        """Verify User 1 cannot access User 6's private pedigree members by requesting FA-000001."""
        self._login(1, "admin")
        resp = self.client.post("/api/ai/ask", json={
            "query": "What is our couple compatibility?",
            "family_id": "FA-000001"
        })
        self.assertEqual(resp.status_code, 200)
        ans = resp.get_json().get("answer", "")
        self.assertNotIn("Eager-Otter", ans, "Data leak: User 1 accessed User 6 pedigree node Eager-Otter")
        self.assertNotIn("Silver-Raven", ans, "Data leak: User 1 accessed User 6 pedigree node Silver-Raven")

    # ---------------------------------------------------------
    # 3. NATIVE ARABIC CLINICAL QUERIES & UAE CITATIONS
    # ---------------------------------------------------------
    def test_arabic_queries_robustness(self):
        """Verify Arabic queries with diacritics, whitespace, and UAE legal citations."""
        self._login(1, "admin")
        queries = [
            ("ما هي نتيجة الفحص الطبي الخاص بي؟", ["سليم", "فحص", "Beta Thalassemia"]),
            ("مَا هِيَ نَتِيجَةُ الفَحْصِ الطِّبِّيِّ الخَاصِّ بِي؟", ["سليم", "فحص", "Beta Thalassemia"]),
            ("هل أنا حامل للمرض؟", ["حامل"]),
            ("هل يمكننا إنجاب أطفال أصحاء؟", ["75%"]),
            ("من هو المؤهل للفحص في الإمارات؟", ["2005", "ADPHC", "الإمارات"]),
            ("ما هي الأمراض المشمولة بالفحص؟", ["الثلاسيميا", "570"]),
            ("هل زواج الأقارب يزيد الخطر؟", ["الأقارب", "وراثي"]),
        ]
        for q, expected_tokens in queries:
            resp = self.client.post("/api/ai/ask", json={"query": q, "family_id": "F-000123"})
            self.assertEqual(resp.status_code, 200, f"Arabic query failed: {q}")
            data = resp.get_json()
            ans = data.get("answer", "")
            matches = any(t in ans for t in expected_tokens)
            self.assertTrue(matches, f"Arabic query '{q}' missing any of {expected_tokens}: {ans[:150]}")

    # ---------------------------------------------------------
    # 4. BOUNDARY CONDITIONS & CRASH RESILIENCE
    # ---------------------------------------------------------
    def test_boundary_empty_and_whitespace_query(self):
        """Verify empty and whitespace queries return 400 Bad Request."""
        self._login(1, "admin")
        for q in ["", "   ", "\t\n  \t", None]:
            resp = self.client.post("/api/ai/ask", json={"query": q})
            self.assertEqual(resp.status_code, 400)
            self.assertIn("error", resp.get_json())

    def test_query_length_boundary(self):
        """Verify 1,000 char query succeeds while 1,001 char query returns 400."""
        self._login(1, "admin")
        q1000 = "What is Sickle Cell? " + "a" * (1000 - len("What is Sickle Cell? "))
        q1001 = q1000 + "x"
        r1000 = self.client.post("/api/ai/ask", json={"query": q1000})
        self.assertEqual(r1000.status_code, 200)
        r1001 = self.client.post("/api/ai/ask", json={"query": q1001})
        self.assertEqual(r1001.status_code, 400)

    def test_unauthenticated_request_rejected(self):
        """Verify unauthenticated requests return 401."""
        with self.client.session_transaction() as sess:
            sess.clear()
        resp = self.client.post("/api/ai/ask", json={"query": "What are my lab results?"})
        self.assertEqual(resp.status_code, 401)

    # ---------------------------------------------------------
    # 5. REMEDIATED VULNERABILITY & ADVERSARIAL HARDENING TESTS
    # ---------------------------------------------------------
    def test_challenge_non_string_query_crashes_server(self):
        """
        Adversarial Test: Non-string query payloads are safely rejected with HTTP 400 Bad Request.
        """
        self._login(1, "admin")
        for bad_query in [12345, 3.14, True, False, [1, 2], {"a": 1}]:
            resp = self.client.post("/api/ai/ask", json={"query": bad_query})
            self.assertEqual(resp.status_code, 400, f"Query {bad_query} should return 400")
            self.assertIn("error", resp.get_json())

    def test_challenge_malformed_conversation_history_crashes_server(self):
        """
        Adversarial Test: Malformed elements in conversation_history are sanitized gracefully (HTTP 200).
        """
        self._login(1, "admin")
        for bad_history in [[None], [123], ["hello"], [True], [[]], [{"sender": 123, "text": 456}]]:
            resp = self.client.post("/api/ai/ask", json={
                "query": "What are my lab results?",
                "conversation_history": bad_history
            })
            self.assertEqual(resp.status_code, 200, f"Malformed history {bad_history} should not crash server")
            data = resp.get_json()
            self.assertIn("answer", data)

    def test_challenge_tell_me_about_sickle_cell_decoupling_failure(self):
        """
        Adversarial Test: 'Tell me about Sickle Cell' correctly routes to educational condition card
        and does NOT dump personal Beta-Thalassemia screening record.
        """
        self._login(1, "admin")
        resp = self.client.post("/api/ai/ask", json={
            "query": "Tell me about Sickle Cell",
            "family_id": "F-000123"
        })
        self.assertEqual(resp.status_code, 200)
        d = resp.get_json()
        self.assertEqual(d.get("source"), "Clinical Genomic Education: Sickle Cell")
        self.assertIn("Sickle Cell Disease and Sickle Cell Trait", d.get("answer", ""))
        self.assertNotIn("Beta-Thalassemia", d.get("answer", ""))

    def test_challenge_star_symbol_in_pedigree_glossary_hijacking(self):
        """
        Adversarial Test: 'what does the star symbol in pedigree mean?' routes to Star Child explanation
        and is not hijacked by glossary PEDIGREE definition.
        """
        self._login(1, "admin")
        resp = self.client.post("/api/ai/ask", json={
            "query": "what does the star symbol in pedigree mean?",
            "family_id": "F-000123"
        })
        self.assertEqual(resp.status_code, 200)
        d = resp.get_json()
        self.assertEqual(d.get("source"), "Pedigree Standards: Star Child (★) Offspring Projection")
        self.assertIn("projected", d.get("answer", "").lower())
        self.assertIn("star child", d.get("answer", "").lower())

    def test_remediated_arabic_normalization_and_routing(self):
        """
        Adversarial Test: Arabic normalization (alif maqsura, taa marbuta) and reproductive intent reordering.
        """
        self._login(1, "admin")
        test_cases = [
            ("ما معنى الثلاسيميا؟", "دليل التثقيف الجيني واعتلالات الهيموغلوبين"),
            ("هل يمكننا إنجاب طفل معافى؟", "بروتوكول التوافق الوراثي وصحة الأسرة"),
            ("هل هناك خطر على الاطفال؟", "بروتوكول التوافق الوراثي وصحة الأسرة"),
            ("هل يمكن للزوجين إنجاب أطفال أصحاء إذا كان كلاهما حاملاً للمرض؟", "بروتوكول التوافق الوراثي وصحة الأسرة"),
            ("ما هي نسبة إصابة الأطفال بالمرض إذا كان الأب حاملاً والأم حاملة؟", "بروتوكول التوافق الوراثي وصحة الأسرة"),
            ("ما هي الخطوات التالية؟", "البروتوكول الوقائي والاستشارة الوراثية"),
        ]
        for query, expected_source in test_cases:
            resp = self.client.post("/api/ai/ask", json={"query": query, "family_id": "F-000123"})
            self.assertEqual(resp.status_code, 200, f"Query '{query}' failed with status {resp.status_code}")
            data = resp.get_json()
            self.assertEqual(data.get("source"), expected_source, f"Query '{query}' expected source '{expected_source}', got '{data.get('source')}'")

    def test_remediated_uae_stopword_not_hallucinating(self):
        """
        Adversarial Test: 'UAE' is in ABBREVIATION_STOPWORDS and does not hallucinate 'United Arab United'.
        """
        self._login(1, "admin")
        resp = self.client.post("/api/ai/ask", json={
            "query": "What is Federal Law No. 28 of 2005 regarding premarital screening in the UAE?",
            "family_id": "F-000123"
        })
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertNotEqual(data.get("source"), "Clinical Knowledge: United Arab United")
        self.assertNotIn("United Arab United", data.get("answer", ""))


if __name__ == "__main__":
    unittest.main()
