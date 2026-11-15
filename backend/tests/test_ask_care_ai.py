"""
Automated Test Suite for Ask Care AI (Requirement R1):
Covers patient query answering, clinical RAG retrieval, grounded screening context,
abbreviation guard disambiguation, proband couple compatibility targeting,
decoupled educational inquiries, reproductive reassurance, Star Child projection,
Arabic clinical/legal/compatibility queries, emergency medical triage, input validation,
clinical abbreviations glossary, and cross-tenant isolation.
"""

import os
import sys
import unittest
import json
import tempfile
import shutil

# Ensure project root and backend are in sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, '..'))
grandparent_dir = os.path.abspath(os.path.join(parent_dir, '..'))
for d in [parent_dir, grandparent_dir]:
    if os.path.exists(os.path.join(d, 'app.py')) and d not in sys.path:
        sys.path.insert(0, d)

from config import Config
from app import app
from database import (
    init_db,
    create_user,
    get_user_by_username,
    save_scraped_report,
    create_family,
    add_pedigree_node
)


class GuardianAngelCareAITestCase(unittest.TestCase):
    """Automated unit test suite verifying Ask Care AI RAG and genetic reasoning pipeline."""

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

    def _login(self, user_id, username):
        with self.client.session_transaction() as sess:
            sess['user_id'] = user_id
            sess['username'] = username

    # =========================================================================
    # 1. INPUT VALIDATION & SECURITY GUARDRAILS
    # =========================================================================

    def test_ask_ai_unauthenticated_returns_401(self):
        """Verify unauthenticated requests to /api/ai/ask receive HTTP 401 Unauthorized."""
        res = self.client.post('/api/ai/ask', json={'query': 'What is thalassemia?'})
        self.assertEqual(res.status_code, 401)
        data = res.get_json()
        self.assertEqual(data.get('status'), 'error')
        self.assertIn('Authentication required', data.get('message', ''))

    def test_ask_ai_empty_and_whitespace_query_rejected(self):
        """Verify empty and whitespace-only queries return HTTP 400 Bad Request."""
        u_id = create_user('patient_test', 'pass123', 'p@test.ae', 'Patient Test')
        self._login(u_id, 'patient_test')

        for bad_q in ['', '   ', "\t\n  \r"]:
            res = self.client.post('/api/ai/ask', json={'query': bad_q})
            self.assertEqual(res.status_code, 400, f"Query '{bad_q}' did not return 400")
            self.assertEqual(res.get_json().get('error'), 'Query cannot be empty')

    def test_ask_ai_non_string_query_rejected(self):
        """Verify non-string query payloads return HTTP 400 Bad Request."""
        u_id = create_user('patient_test', 'pass123', 'p@test.ae', 'Patient Test')
        self._login(u_id, 'patient_test')

        non_strings = [12345, True, False, None, {'text': 'query'}, ['nested', 'query']]
        for bad_val in non_strings:
            res = self.client.post('/api/ai/ask', json={'query': bad_val})
            self.assertEqual(res.status_code, 400, f"Payload '{bad_val}' did not return 400")
            self.assertEqual(res.get_json().get('error'), 'Query cannot be empty')

        res_empty_dict = self.client.post('/api/ai/ask', json={})
        self.assertEqual(res_empty_dict.status_code, 400)
        self.assertEqual(res_empty_dict.get_json().get('error'), 'Query cannot be empty')

    def test_ask_ai_query_length_limit(self):
        """Verify queries exceeding 1,000 characters are rejected with HTTP 400."""
        u_id = create_user('patient_test', 'pass123', 'p@test.ae', 'Patient Test')
        self._login(u_id, 'patient_test')

        long_q = 'a' * 1001
        res = self.client.post('/api/ai/ask', json={'query': long_q})
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.get_json().get('error'), 'Query cannot exceed 1,000 characters')

    def test_ask_ai_sanitizes_malformed_conversation_history(self):
        """Verify conversation_history is safely sanitized when containing non-dict or malformed items."""
        u_id = create_user('patient_test', 'pass123', 'p@test.ae', 'Patient Test')
        self._login(u_id, 'patient_test')

        # Test with string history
        res_str = self.client.post('/api/ai/ask', json={
            'query': 'What is thalassemia?',
            'conversation_history': 'not-a-list'
        })
        self.assertEqual(res_str.status_code, 200)

        # Test with mixed malformed list
        res_mixed = self.client.post('/api/ai/ask', json={
            'query': 'What is thalassemia?',
            'conversation_history': [None, 42, 'str', {'role': 'user', 'content': 'Hello'}]
        })
        self.assertEqual(res_mixed.status_code, 200)

    # =========================================================================
    # 2. EMERGENCY MEDICAL TRIAGE PROTOCOL (UAE 998 / 999)
    # =========================================================================

    def test_emergency_medical_triage_english(self):
        """Verify acute symptom queries trigger emergency medical triage (UAE 998/999) with 100% confidence."""
        u_id = create_user('patient_test', 'pass123', 'p@test.ae', 'Patient Test')
        self._login(u_id, 'patient_test')

        emergency_queries = [
            'I have severe chest pain and cannot breathe',
            'I feel like I am having a heart attack',
            'Severe bleeding and loss of consciousness'
        ]
        for eq in emergency_queries:
            res = self.client.post('/api/ai/ask', json={'query': eq})
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            self.assertEqual(data.get('source'), 'Emergency Triage Protocol')
            self.assertEqual(data.get('confidence'), '100%')
            self.assertIn('998', data.get('answer', ''))
            self.assertIn('999', data.get('answer', ''))
            self.assertIn('National Emergency Healthcare Protocol', data.get('references', []))

    def test_emergency_medical_triage_arabic(self):
        """Verify acute Arabic emergency symptom queries trigger UAE 998/999 emergency triage with 100% confidence."""
        u_id = create_user('patient_test', 'pass123', 'p@test.ae', 'Patient Test')
        self._login(u_id, 'patient_test')

        ar_emergency_queries = [
            'ألم في الصدر وصعوبة في التنفس',
            'ألم بالصدر وضيق تنفس',
            'نزيف حاد وفقدان الوعي',
            'اختناق وضيق في التنفس'
        ]
        for eq in ar_emergency_queries:
            res = self.client.post('/api/ai/ask', json={'query': eq})
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            self.assertEqual(data.get('source'), 'بروتوكول طوارئ الرعاية الصحية الوطنية')
            self.assertEqual(data.get('confidence'), '100%')
            ans = data.get('answer', '')
            self.assertIn('998', ans)
            self.assertIn('999', ans)

    # =========================================================================
    # 3. GROUNDED SCREENING REPORT RETRIEVAL & LAB DISAMBIGUATION
    # =========================================================================

    def test_patient_screening_report_retrieval_and_grounded_clinical_context(self):
        """Verify patient's uploaded premarital screening report is retrieved and grounded into response."""
        u_id = create_user('patient_screening', 'pass123', 'screen@test.ae', 'Amina Al-Falasi')
        save_scraped_report(
            user_id=u_id,
            file_name='amina_screening_report.pdf',
            panel_name='Beta-Thalassemia',
            masked_data={
                'condition': 'Beta-Thalassemia Minor',
                'carrier_status': 'Heterozygous Carrier',
                'screening_findings': [
                    {'parameter': 'MCV', 'value': '64.2 fL', 'clinical_meaning': 'Microcytic red blood cells'},
                    {'parameter': 'HbA2', 'value': '5.4%', 'clinical_meaning': 'Diagnostic indicator for beta-thalassemia trait'},
                    {'parameter': 'Ferritin', 'value': '145 ng/mL', 'clinical_meaning': 'Normal iron stores ruling out iron deficiency'}
                ]
            },
            gene_locus='HBB',
            variant='c.92+5G>C',
            carrier_status='Heterozygous Carrier'
        )
        self._login(u_id, 'patient_screening')

        queries = [
            'Based on my premarital screening records, do I have thalassemia?',
            'What did my screening report say?',
            'What is my HbA2 and MCV?'
        ]
        for q in queries:
            res = self.client.post('/api/ai/ask', json={'query': q})
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            self.assertEqual(data.get('source'), 'Pre-marital Screening Report')
            ans = data.get('answer', '')
            self.assertTrue('Beta-Thalassemia' in ans or 'Thalassemia' in ans)
            self.assertTrue('Carrier' in ans or 'carrier' in ans.lower())
            self.assertIn('Pre-marital Screening Report', data.get('references', []))

        # Check explicit biomarkers in the response
        res_labs = self.client.post('/api/ai/ask', json={'query': 'What did my screening report say?'})
        ans_labs = res_labs.get_json().get('answer', '')
        self.assertIn('64.2', ans_labs)
        self.assertIn('5.4%', ans_labs)
        self.assertIn('145', ans_labs)

    def test_lab_results_avoid_acronym_false_positives(self):
        """Verify lab results queries do not trigger acronym false positives ('Addressing ambiguous')."""
        u_id = create_user('patient_lab', 'pass123', 'lab@test.ae', 'Fatima Mansoor')
        save_scraped_report(
            user_id=u_id,
            file_name='fatima_labs.pdf',
            panel_name='Beta-Thalassemia',
            masked_data={
                'condition': 'Beta-Thalassemia Minor',
                'carrier_status': 'Heterozygous Carrier',
                'screening_findings': [
                    {'parameter': 'MCV', 'value': '65.0 fL', 'clinical_meaning': 'Low MCV'},
                    {'parameter': 'HbA2', 'value': '5.2%', 'clinical_meaning': 'Elevated HbA2'}
                ]
            }
        )
        self._login(u_id, 'patient_lab')

        variations = [
            'What are my lab results?',
            'Explain my results',
            'What are the findings in my report?',
            'Show me my blood test results',
            'What did my screening report say?'
        ]
        for q in variations:
            res = self.client.post('/api/ai/ask', json={'query': q})
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            ans = data.get('answer', '')

            # Crucial assertion: Must NOT be hijacked by bogus acronym lookup
            self.assertNotIn('Addressing ambiguous', ans, f"Query '{q}' returned 'Addressing ambiguous'")
            self.assertNotIn('RESULTS stands for', ans, f"Query '{q}' returned 'RESULTS stands for'")
            self.assertNotEqual(data.get('source'), 'Medical Abbreviation Dictionary')
            self.assertNotEqual(data.get('source'), 'Clinical Knowledge: Addressing ambiguous')

            # Must contain grounded patient context
            self.assertTrue(
                'Beta-Thalassemia' in ans or 'Thalassemia' in ans or 'Carrier' in ans or 'carrier' in ans.lower(),
                f"Query '{q}' lacked grounded clinical context: {ans[:200]}"
            )

    # =========================================================================
    # 4. PROBAND COUPLE COMPATIBILITY & TARGETING
    # =========================================================================

    def test_proband_couple_compatibility_targeting_prioritizes_proband_over_grandparents(self):
        """Verify couple compatibility resolves Proband and Spouse rather than elder generations (grandparents)."""
        u_id = create_user('patient_proband', 'pass123', 'proband@test.ae', 'Tariq Al-Hashemi')
        fam_data = create_family(u_id, {'family_name': 'Al-Hashemi Pedigree'})
        fam_id = fam_data['family_id']

        # Generation 1: Grandparents (both carriers)
        add_pedigree_node(u_id, {
            'family_id': fam_id,
            'full_name': 'Grandfather Rashid',
            'alias_name': 'Elder-Falcon-1001',
            'sex': 'male',
            'relationship': 'grandfather',
            'generation': 'gen1',
            'carrier_status': 'Carrier',
            'conditions': 'Beta-Thalassemia'
        })
        add_pedigree_node(u_id, {
            'family_id': fam_id,
            'full_name': 'Grandmother Mariam',
            'alias_name': 'Elder-Gazelle-1002',
            'sex': 'female',
            'relationship': 'grandmother',
            'generation': 'gen1',
            'carrier_status': 'Carrier',
            'conditions': 'Beta-Thalassemia'
        })

        # Generation 2: Proband (Target Male) and Spouse (Target Female)
        add_pedigree_node(u_id, {
            'family_id': fam_id,
            'full_name': 'Tariq',
            'alias_name': 'Proband-Partner-A',
            'sex': 'male',
            'relationship': 'proband',
            'is_proband': 1,
            'generation': 'gen2',
            'carrier_status': 'Heterozygous Carrier',
            'conditions': 'Beta-Thalassemia'
        })
        add_pedigree_node(u_id, {
            'family_id': fam_id,
            'full_name': 'Salama',
            'alias_name': 'Spouse-Partner-B',
            'sex': 'female',
            'relationship': 'spouse',
            'generation': 'gen2',
            'carrier_status': 'Heterozygous Carrier',
            'conditions': 'Beta-Thalassemia'
        })

        self._login(u_id, 'patient_proband')

        compatibility_queries = [
            'Are we compatible as a couple?',
            'What is our couple compatibility?',
            'What is the compatibility match between both partners?'
        ]
        for q in compatibility_queries:
            res = self.client.post('/api/ai/ask', json={'query': q, 'family_id': fam_id})
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            self.assertEqual(data.get('source'), 'Couple Hereditary Compatibility Protocol')
            ans = data.get('answer', '')

            # Must target proband couple rather than grandparents
            self.assertNotIn('Grandfather', ans)
            self.assertNotIn('Grandmother', ans)
            self.assertNotIn('Elder-Falcon', ans)

            # Must contain transmission statistics and counseling
            self.assertIn('75%', ans)
            self.assertTrue('unaffected' in ans.lower() or 'free of the condition' in ans.lower())
            self.assertIn('25%', ans)
            self.assertTrue('PGT-M' in ans or 'IVF' in ans)

    # =========================================================================
    # 5. DECOUPLED EDUCATIONAL CONDITION QUERIES
    # =========================================================================

    def test_decoupled_educational_condition_queries(self):
        """Verify educational inquiries return clinical definitions without leaking personal screening dossier."""
        u_id = create_user('patient_edu', 'pass123', 'edu@test.ae', 'Sultan Al-Nuaimi')
        save_scraped_report(
            user_id=u_id,
            file_name='sultan_private_report.pdf',
            panel_name='Beta-Thalassemia',
            masked_data={
                'condition': 'Beta-Thalassemia Minor',
                'carrier_status': 'Heterozygous Carrier',
                'screening_findings': [{'parameter': 'MCV', 'value': '61.4 fL'}]
            }
        )
        self._login(u_id, 'patient_edu')

        # 1. Sickle Cell Educational Query
        for q in ['What is Sickle Cell?', 'Tell me about Sickle Cell', 'Can you tell me about Sickle Cell?']:
            res = self.client.post('/api/ai/ask', json={'query': q})
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            self.assertEqual(data.get('source'), 'Clinical Genomic Education: Sickle Cell')
            ans = data.get('answer', '')
            self.assertIn('HBB gene', ans)
            self.assertIn('hemoglobin S', ans)
            self.assertIn('Sickle Cell Trait', ans)
            # Must NOT leak user's personal report
            self.assertNotIn('61.4', ans)

        # 2. Thalassemia Educational Query
        for q in ['What is Thalassemia?', 'Tell me about Thalassemia']:
            res = self.client.post('/api/ai/ask', json={'query': q})
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            self.assertEqual(data.get('source'), 'Clinical Genomic Education: Thalassemia')
            ans = data.get('answer', '')
            self.assertIn('Thalassemia Minor', ans)
            self.assertIn('Thalassemia Major', ans)
            self.assertNotIn('61.4', ans)

        # 3. G6PD and SMA
        res_g6pd = self.client.post('/api/ai/ask', json={'query': 'What is G6PD?'})
        self.assertEqual(res_g6pd.status_code, 200)
        self.assertIn('Glucose-6-Phosphate Dehydrogenase', res_g6pd.get_json().get('answer', ''))

        res_sma = self.client.post('/api/ai/ask', json={'query': 'What is SMA?'})
        self.assertEqual(res_sma.status_code, 200)
        self.assertIn('Spinal Muscular Atrophy', res_sma.get_json().get('answer', ''))

    # =========================================================================
    # 6. REPRODUCTIVE REASSURANCE & HEALTHY CHILDREN
    # =========================================================================

    def test_reproductive_reassurance_healthy_children(self):
        """Verify 'Can we have healthy children?' and reproductive queries return 75% reassurance and PGT-M."""
        u_id = create_user('patient_reassurance', 'pass123', 'reassure@test.ae', 'Mariam Al-Kindi')
        self._login(u_id, 'patient_reassurance')

        queries = [
            'Can we have healthy children?',
            'Can we have a healthy baby?',
            'What is our reproductive risk?',
            'Is there a chance of having a healthy child?'
        ]
        for q in queries:
            res = self.client.post('/api/ai/ask', json={'query': q})
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            self.assertEqual(data.get('source'), 'Clinical Reproductive Genetics: Offspring Reassurance')
            ans = data.get('answer', '')
            self.assertIn('75%', ans)
            self.assertIn('25%', ans)
            self.assertIn('50%', ans)
            self.assertIn('PGT-M', ans)
            self.assertIn('IVF', ans)
            self.assertTrue('healthy children' in ans.lower() or 'free of the condition' in ans.lower())

    # =========================================================================
    # 7. STAR CHILD (★) PEDIGREE OFFSPRING PROJECTION
    # =========================================================================

    def test_star_child_pedigree_offspring_projection_explanation(self):
        """Verify queries regarding the Star Child (★) explain offspring projection and reproductive clarity."""
        u_id = create_user('patient_star', 'pass123', 'star@test.ae', 'Zayed Al-Dhaheri')
        fam_data = create_family(u_id, {'family_name': 'Al-Dhaheri Family'})
        fam_id = fam_data['family_id']

        add_pedigree_node(u_id, {
            'family_id': fam_id,
            'full_name': 'Future Offspring',
            'sex': 'star',
            'relationship': 'star_child',
            'carrier_status': 'Projected Carrier Transmission',
            'conditions': 'Beta-Thalassemia'
        })
        self._login(u_id, 'patient_star')

        star_queries = [
            'What does the star child mean?',
            'What is the star child in our pedigree?',
            'What does the ★ star child ★ mean?',
            'Tell me about the star child symbol'
        ]
        for q in star_queries:
            res = self.client.post('/api/ai/ask', json={'query': q, 'family_id': fam_id})
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            self.assertEqual(data.get('source'), 'Pedigree Standards: Star Child (★) Offspring Projection')
            ans = data.get('answer', '')
            self.assertIn('projected future offspring', ans.lower())
            self.assertIn('75%', ans)
            self.assertIn('PGT-M', ans)

    # =========================================================================
    # 8. ARABIC CLINICAL, LEGAL & COMPATIBILITY INTELLIGENCE
    # =========================================================================

    def test_arabic_screening_and_carrier_status_queries(self):
        """Verify Arabic screening queries return authentic Arabic clinical responses and suggestions."""
        u_id = create_user('patient_ar_carrier', 'pass123', 'ar_carrier@test.ae', 'خليفة المنصوري')
        save_scraped_report(
            user_id=u_id,
            file_name='khalifa_report.pdf',
            panel_name='Beta-Thalassemia',
            masked_data={
                'condition': 'Beta-Thalassemia',
                'carrier_status': 'Heterozygous Carrier',
                'screening_findings': [
                    {'parameter': 'MCV', 'value': '63.5 fL'},
                    {'parameter': 'HbA2', 'value': '5.5%'}
                ]
            }
        )
        self._login(u_id, 'patient_ar_carrier')

        # 1. Carrier status inquiry
        res_carrier = self.client.post('/api/ai/ask', json={'query': 'هل أنا حامل للمرض؟'})
        self.assertEqual(res_carrier.status_code, 200)
        data_carrier = res_carrier.get_json()
        self.assertEqual(data_carrier.get('source'), 'دليل التثقيف والاستشارة الوراثية السريرية')
        ans_carrier = data_carrier.get('answer', '')
        self.assertIn('حامل لصفة وراثية متنحية', ans_carrier)
        self.assertIn('ثلاسيميا بيتا', ans_carrier)
        self.assertTrue(len(data_carrier.get('suggested_follow_ups', [])) > 0)

        # 2. Screening findings inquiry
        res_findings = self.client.post('/api/ai/ask', json={'query': 'ما هي نتيجة الفحص الطبي الخاص بي؟'})
        self.assertEqual(res_findings.status_code, 200)
        data_findings = res_findings.get_json()
        self.assertEqual(data_findings.get('source'), 'تقرير فحص ما قبل الزواج الشامل (ADPHC)')
        ans_findings = data_findings.get('answer', '')
        self.assertIn('ثلاسيميا بيتا', ans_findings)
        self.assertIn('63.5', ans_findings)
        self.assertIn('5.5%', ans_findings)

    def test_arabic_couple_compatibility_and_reassurance_queries(self):
        """Verify Arabic couple compatibility queries return 75% reassurance, PGT-M, and Star Child in Arabic."""
        u_id = create_user('patient_ar_couple', 'pass123', 'ar_couple@test.ae', 'راشد ومريم')
        self._login(u_id, 'patient_ar_couple')

        res = self.client.post('/api/ai/ask', json={'query': 'هل يمكننا إنجاب أطفال أصحاء؟'})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data.get('source'), 'بروتوكول التوافق الوراثي وصحة الأسرة')
        ans = data.get('answer', '')
        self.assertIn('نعم، بكل تأكيد! يمكن للزوجين إنجاب أطفال أصحاء', ans)
        self.assertIn('75%', ans)
        self.assertIn('25%', ans)
        self.assertIn('PGT-M', ans)
        self.assertIn('الطفل النجمة', ans)
        self.assertTrue(len(data.get('suggested_follow_ups', [])) > 0)

    def test_arabic_covered_diseases_570_genes(self):
        """Verify Arabic covered diseases query quotes the 570 genes comprehensive screening panel."""
        u_id = create_user('patient_ar_diseases', 'pass123', 'ar_dis@test.ae', 'عائشة الشامسي')
        self._login(u_id, 'patient_ar_diseases')

        res = self.client.post('/api/ai/ask', json={'query': 'ما هي الأمراض المشمولة بالفحص؟'})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data.get('source'), 'البرنامج الوطني للفحص الجيني قبل الزواج (ADPHC)')
        ans = data.get('answer', '')
        self.assertIn('570 جيناً', ans)
        self.assertIn('840 مرضاً', ans)
        self.assertIn('الثلاسيميا', ans)
        self.assertIn('المنجلي', ans)
        self.assertIn('G6PD', ans)
        self.assertIn('SMA', ans)

    def test_arabic_uae_legal_framework_federal_law_28_of_2005(self):
        """Verify UAE premarital eligibility query cites Federal Law No. 28 of 2005 and national guidelines."""
        u_id = create_user('patient_ar_law', 'pass123', 'ar_law@test.ae', 'حمد المزروعي')
        self._login(u_id, 'patient_ar_law')

        res = self.client.post('/api/ai/ask', json={'query': 'من هو المؤهل للفحص في الإمارات؟'})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data.get('source'), 'معايير خدمات الفحص والمشورة قبل الزواج - دائرة الصحة')
        ans = data.get('answer', '')
        self.assertIn('القانون الاتحادي رقم (28) لسنة 2005', ans)
        self.assertIn('27', ans)
        self.assertIn('إلزامياً', ans)
        self.assertIn('الهوية الإماراتية', ans)

    # =========================================================================
    # 9. CLINICAL ABBREVIATION GLOSSARY
    # =========================================================================

    def test_clinical_abbreviation_glossary(self):
        """Verify clinical abbreviation queries (HbA2, MCV, PGT-M) return expansions and counseling insights."""
        u_id = create_user('patient_glossary', 'pass123', 'glos@test.ae', 'Glossary Patient')
        self._login(u_id, 'patient_glossary')

        tests = [
            ('What is HbA2?', 'Hemoglobin A2', 'Clinical Knowledge: Hemoglobin A2'),
            ('What is MCV?', 'Mean Corpuscular Volume', 'Clinical Knowledge: Mean Corpuscular Volume'),
            ('What is PGT-M?', 'Pre-implantation Genetic Testing', 'Clinical Knowledge: Pre-implantation Genetic Testing for Monogenic / Single-Gene Defects')
        ]
        for query, expected_text, expected_source in tests:
            res = self.client.post('/api/ai/ask', json={'query': query})
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            self.assertEqual(data.get('source'), expected_source)
            self.assertIn(expected_text, data.get('answer', ''))
            self.assertIn(data.get('confidence'), ['95%', '98%', '99%', '100%'])

    # =========================================================================
    # 10. CROSS-TENANT ISOLATION & DATA SECURITY
    # =========================================================================

    def test_cross_tenant_isolation(self):
        """Verify patient reports and confidential dossiers belonging to User A cannot be accessed by User B."""
        # Setup User A with confidential Beta-Thalassemia report
        user_a = create_user('user_alpha', 'passA123', 'alpha@hospital.ae', 'Aarav Alpha')
        save_scraped_report(
            user_id=user_a,
            file_name='confidential_alpha_report.pdf',
            panel_name='Beta-Thalassemia',
            masked_data={
                'condition': 'Beta-Thalassemia Minor',
                'carrier_status': 'Heterozygous Carrier',
                'screening_findings': [
                    {'parameter': 'MCV', 'value': '59.8 fL'},
                    {'parameter': 'HbA2', 'value': '5.8%'},
                    {'parameter': 'Ferritin', 'value': '210 ng/mL'}
                ]
            }
        )

        # Setup User B without any screening reports
        user_b = create_user('user_beta', 'passB123', 'beta@hospital.ae', 'Bhavna Beta')

        # Query as User B
        self._login(user_b, 'user_beta')
        res_b = self.client.post('/api/ai/ask', json={'query': 'What did my screening report say?'})
        self.assertEqual(res_b.status_code, 200)
        ans_b = res_b.get_json().get('answer', '')

        # User B must NOT see User A's biomarkers or private findings
        self.assertNotIn('59.8', ans_b)
        self.assertNotIn('5.8%', ans_b)
        self.assertNotIn('210 ng/mL', ans_b)
        self.assertNotIn('confidential_alpha_report', ans_b)

    # =========================================================================
    # 11. MULTI-TURN CONVERSATION HISTORY HANDLING
    # =========================================================================

    def test_multi_turn_history_preservation(self):
        """Verify multi-turn conversations retain clinical context and provide grounded continuation."""
        u_id = create_user('patient_history', 'pass123', 'hist@test.ae', 'History Patient')
        save_scraped_report(
            user_id=u_id,
            file_name='history_report.pdf',
            panel_name='Beta-Thalassemia',
            masked_data={
                'condition': 'Beta-Thalassemia Minor',
                'carrier_status': 'Heterozygous Carrier',
                'screening_findings': [{'parameter': 'HbA2', 'value': '5.4%'}]
            }
        )
        self._login(u_id, 'patient_history')

        history = [
            {'role': 'user', 'content': 'What are my lab results?'},
            {'role': 'assistant', 'content': 'Based on your premarital screening report, you are a carrier for Beta-Thalassemia Minor with HbA2: 5.4%.'}
        ]
        res = self.client.post('/api/ai/ask', json={
            'query': 'Can you explain my results in more detail?',
            'conversation_history': history
        })
        self.assertEqual(res.status_code, 200)
        ans = res.get_json().get('answer', '')
        self.assertTrue('Beta-Thalassemia' in ans or 'Thalassemia' in ans or 'carrier' in ans.lower())


if __name__ == '__main__':
    unittest.main()
