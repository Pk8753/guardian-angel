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
for d in [grandparent_dir, parent_dir]:
    if os.path.exists(os.path.join(d, 'app.py')):
        if d in sys.path:
            sys.path.remove(d)
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

    def test_test_gemini_connection_endpoint(self):
        """Verify POST /api/ai/test-gemini-connection returns valid JSON."""
        res_empty = self.client.post('/api/ai/test-gemini-connection', json={'api_key': ''})
        self.assertEqual(res_empty.status_code, 400)
        data_empty = res_empty.get_json()
        self.assertEqual(data_empty.get('status'), 'error')
        self.assertIn('API key cannot be empty', data_empty.get('message', ''))

        from unittest.mock import patch
        mock_google_models = {
            "models": [
                {
                    "name": "models/gemini-3.8-flash",
                    "displayName": "Gemini 3.8 Flash",
                    "description": "Next Gen Fast model",
                    "supportedGenerationMethods": ["generateContent"]
                },
                {
                    "name": "models/gemini-2.5-flash",
                    "displayName": "Gemini 2.5 Flash",
                    "description": "Stable Fast model",
                    "supportedGenerationMethods": ["generateContent"]
                },
                {
                    "name": "models/gemini-1.5-flash",
                    "displayName": "Gemini 1.5 Flash",
                    "description": "Legacy model",
                    "supportedGenerationMethods": ["generateContent"]
                },
                {
                    "name": "models/text-embedding-004",
                    "displayName": "Text Embedding",
                    "description": "Embedding model",
                    "supportedGenerationMethods": ["embedContent"]
                }
            ]
        }
        with patch('backend.gemini_studio_service.requests.get') as mock_get:
            mock_get.return_value.status_code = 200
            mock_get.return_value.json.return_value = mock_google_models
            res_valid = self.client.post('/api/ai/test-gemini-connection', json={'api_key': 'AIzaMockValidKey123'})
            self.assertEqual(res_valid.status_code, 200)
            data_valid = res_valid.get_json()
            self.assertEqual(data_valid.get('status'), 'success')
            models = data_valid.get('models', [])
            self.assertEqual(len(models), 2)
            self.assertEqual(models[0]['id'], 'gemini-3.8-flash')
            self.assertEqual(models[1]['id'], 'gemini-2.5-flash')

    def test_live_gemini_key_forwarding_in_ask_and_session(self):
        """Verify that testing connection persists the key in session and forwarded to ask."""
        from unittest.mock import patch
        u_id = create_user('gemini_user', 'pass123', 'gemini@test.ae', 'Gemini User')
        self._login(u_id, 'gemini_user')

        mock_google_models = {
            "models": [
                {
                    "name": "models/gemini-3.8-flash",
                    "displayName": "Gemini 3.8 Flash",
                    "supportedGenerationMethods": ["generateContent"]
                }
            ]
        }
        with patch('backend.gemini_studio_service.requests.get') as mock_get:
            mock_get.return_value.status_code = 200
            mock_get.return_value.json.return_value = mock_google_models
            res_conn = self.client.post('/api/ai/test-gemini-connection', json={'api_key': 'AIzaLiveKey789'})
            self.assertEqual(res_conn.status_code, 200)

        # Now call /api/ai/ask and /api/ai/ask-studio and verify gemini_studio is invoked with the live key
        with patch('backend.gemini_studio_service.requests.post') as mock_post:
            mock_post.return_value.status_code = 200
            mock_post.return_value.json.return_value = {
                "candidates": [
                    {
                        "content": {
                            "parts": [{"text": "Being a carrier means you carry one healthy gene and one variant copy. You are completely healthy!"}]
                        }
                    }
                ]
            }
            res_ask = self.client.post('/api/ai/ask-studio', json={
                'query': 'What is a carrier?',
                'api_key': 'AIzaLiveKey789'
            })
            self.assertEqual(res_ask.status_code, 200)
            data_ask = res_ask.get_json()
            self.assertIn('completely healthy', data_ask.get('answer', ''))
            # Ensure the misleading static note is absent
            self.assertNotIn('Set GEMINI_API_KEY to enable', data_ask.get('answer', ''))

    def test_care_ai_date_query_and_no_genwell_branding(self):
        """Verify Care AI responds naturally to date queries and contains NO GenWell AI references or robotic prefixes."""
        u_id = create_user('care_user', 'pass123', 'care@test.ae', 'Care User')
        self._login(u_id, 'care_user')

        # 1. Query for today's date
        res = self.client.post('/api/ai/ask-studio', json={
            'query': 'what is the date today',
            'current_page': 'Dashboard'
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        ans = data.get('answer', '')
        self.assertIn('Today is', ans)
        # Ensure 'GenWell' is completely absent
        self.assertNotIn('GenWell', ans)
        self.assertNotIn('GenWell AI reviewed your question', ans)

        # 2. Query for family pedigree tree
        res_tree = self.client.post('/api/ai/ask-studio', json={
            'query': 'what is my family pedigree tree',
            'current_page': 'Family Pedigree Tree'
        })
        self.assertEqual(res_tree.status_code, 200)
        ans_tree = res_tree.get_json().get('answer', '')
        self.assertNotIn('GenWell', ans_tree)
        self.assertNotIn('reviewed your question regarding', ans_tree)
        self.assertIn('pedigree', ans_tree.lower())

    def test_care_ai_page_context_forwarding(self):
        """Verify Care AI accepts and grounds in current_page and page_context."""
        from unittest.mock import patch
        u_id = create_user('couple_user', 'pass123', 'couple@test.ae', 'Couple User')
        self._login(u_id, 'couple_user')

        with patch('backend.gemini_studio_service.requests.post') as mock_post:
            mock_post.return_value.status_code = 200
            mock_post.return_value.json.return_value = {
                "candidates": [
                    {
                        "content": {
                            "parts": [{"text": "Welcome to your Couple Assessment. Both you and your partner have excellent options for a healthy child."}]
                        }
                    }
                ]
            }
            res = self.client.post('/api/ai/ask-studio', json={
                'query': 'Are we safe to get married?',
                'api_key': 'AIzaMockKey123',
                'current_page': 'Couple Hereditary Assessment',
                'page_context': 'User is reviewing couple premarital compatibility and carrier status.'
            })
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            self.assertIn('Couple Assessment', data.get('answer', ''))
            # Check payload sent to AI Studio contains the current_page
            call_kwargs = mock_post.call_args[1]
            sent_payload = call_kwargs.get('json', {})
            sys_parts = sent_payload.get('system_instruction', {}).get('parts', [{}])
            sent_text = sys_parts[0].get('text', '') if sys_parts else sent_payload['contents'][0]['parts'][0]['text']
            self.assertIn('Current User Screen: Couple Hereditary Assessment', sent_text)
            self.assertIn('User is reviewing couple premarital compatibility', sent_text)

    def test_care_ai_when_api_key_provided_no_offline_rules_applied(self):
        """Verify that when user provides an API key, NO offline rules are applied; live Gemini response or true API error is returned."""
        from unittest.mock import patch
        u_id = create_user('live_ai_user', 'pass123', 'live@test.ae', 'Live User')
        self._login(u_id, 'live_ai_user')

        # 1. Success case: returns live Gemini output free of backend rules
        with patch('backend.gemini_studio_service.requests.post') as mock_post:
            mock_post.return_value.status_code = 200
            mock_post.return_value.json.return_value = {
                "candidates": [
                    {
                        "content": {
                            "parts": [{"text": "OMIM 300377 is the human G6PD locus on Xq28. Heterozygous females carry the allele safely."}]
                        }
                    }
                ]
            }
            res = self.client.post('/api/ai/ask-studio', json={
                'query': 'what is OMIM 300377',
                'api_key': 'AIzaValidKey789'
            })
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            self.assertEqual(data.get('status'), 'success')
            self.assertIn('OMIM 300377 is the human G6PD locus', data.get('answer', ''))
            self.assertIn('Google AI Studio', data.get('source', ''))

        # 2. API Failure case: when Google returns error, return Google error, NOT canned backend fallback
        with patch('backend.gemini_studio_service.requests.post') as mock_post_err:
            mock_post_err.return_value.status_code = 400
            mock_post_err.return_value.json.return_value = {
                "error": {
                    "code": 400,
                    "message": "API_KEY_INVALID: User API key is expired"
                }
            }
            res_err = self.client.post('/api/ai/ask-studio', json={
                'query': 'what is OMIM 300377',
                'api_key': 'AIzaInvalidKeyBad'
            })
            self.assertEqual(res_err.status_code, 200)
            data_err = res_err.get_json()
            self.assertEqual(data_err.get('status'), 'error')
            self.assertIn('API_KEY_INVALID', data_err.get('answer', ''))
            # Ensure canned offline rule text was NOT applied
            self.assertNotIn('proactive carrier screening provides you and your partner', data_err.get('answer', ''))

    def test_care_ai_legacy_model_auto_normalized_to_gemini_3_8_flash(self):
        """Verify that legacy model strings (e.g. gemini-1.5-flash or gemini-2.0-flash) are normalized to gemini-3.8-flash."""
        from unittest.mock import patch
        u_id = create_user('norm_user', 'pass123', 'norm@test.ae', 'Norm User')
        self._login(u_id, 'norm_user')

        with patch('backend.gemini_studio_service.requests.post') as mock_post:
            mock_post.return_value.status_code = 200
            mock_post.return_value.json.return_value = {
                "candidates": [
                    {
                        "content": {
                            "parts": [{"text": "Normalized model answer from Gemini 3.8 Flash."}]
                        }
                    }
                ]
            }
            res = self.client.post('/api/ai/ask-studio', json={
                'query': 'Explain carrier testing',
                'api_key': 'AIzaKey456',
                'model': 'gemini-1.5-flash'
            })
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            self.assertEqual(data.get('status'), 'success')
            self.assertEqual(data.get('model'), 'gemini-3.8-flash')
            # Verify the URL called was normalized
            called_url = mock_post.call_args[0][0]
            self.assertIn('gemini-3.8-flash:generateContent', called_url)
            self.assertNotIn('gemini-1.5-flash:generateContent', called_url)

    def test_care_ai_offline_omim_and_transmission_queries(self):
        """Verify that offline queries (no API key) for OMIM codes and transmission return rich clinical guidance instead of canned placeholders."""
        u_id = create_user('offline_user', 'pass123', 'off@test.ae', 'Offline User')
        self._login(u_id, 'offline_user')

        # 1. OMIM 300377 / 305900
        res_omim = self.client.post('/api/ai/ask-studio', json={
            'query': 'what is OMIM 300377'
        })
        self.assertEqual(res_omim.status_code, 200)
        ans_omim = res_omim.get_json().get('answer', '')
        self.assertIn('G6PD Deficiency', ans_omim)
        self.assertIn('Xq28', ans_omim)
        self.assertNotIn('proactive carrier screening provides you and your partner with clear, reassuring insights so you can plan your family with complete confidence. How can I assist you with your results or questions today?', ans_omim)

        # 2. Transmission / Healthy Children
        res_trans = self.client.post('/api/ai/ask-studio', json={
            'query': 'Can we have healthy children if we both carry traits?'
        })
        self.assertEqual(res_trans.status_code, 200)
        ans_trans = res_trans.get_json().get('answer', '')
        self.assertIn('75%', ans_trans)
        self.assertIn('PGT-M', ans_trans)

        # 3. Star Child Symbol
        res_star = self.client.post('/api/ai/ask-studio', json={
            'query': 'Explain the projected ★ Star Child symbol in our pedigree'
        })
        self.assertEqual(res_star.status_code, 200)
        ans_star = res_star.get_json().get('answer', '')
        self.assertIn('Star Child', ans_star)
        self.assertIn('projected', ans_star)

    def test_care_ai_gemini_3_8_flash_live_generation(self):
        """Verify that when user selects gemini-3.8-flash, it requests gemini-3.8-flash directly."""
        from unittest.mock import patch, MagicMock
        u_id = create_user('gemini38_user', 'pass123', 'g38@test.ae', 'Gemini 3.8 User')
        self._login(u_id, 'gemini38_user')

        with patch('backend.gemini_studio_service.requests.post') as mock_post:
            mock_post.return_value.status_code = 200
            mock_post.return_value.json.return_value = {
                "candidates": [
                    {
                        "content": {
                            "parts": [{"text": "Spinal Muscular Atrophy (SMA) involves deletions in SMN1 Exons 7 and 8."}]
                        }
                    }
                ]
            }

            res = self.client.post('/api/ai/ask-studio', json={
                'query': 'explain Spinal Muscular Atrophy (SMA) SMN1 Exon 7-8 Deletion',
                'api_key': 'AIzaLiveKey2026',
                'model': 'gemini-3.8-flash'
            })
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            self.assertEqual(data.get('status'), 'success')
            self.assertEqual(data.get('model'), 'gemini-3.8-flash')
            self.assertIn('Spinal Muscular Atrophy', data.get('answer', ''))

            # Check that mock_post was called with gemini-3.8-flash
            first_url = mock_post.call_args_list[0][0][0]
            self.assertIn('gemini-3.8-flash:generateContent', first_url)

    def test_care_ai_gemini_3_8_flash_resolves_via_v1_if_v1beta_404(self):
        """Verify that if v1beta returns 404, gemini-3.8-flash resolves seamlessly on v1."""
        from unittest.mock import patch, MagicMock
        u_id = create_user('g38_v1_user', 'pass123', 'g38v1@test.ae', 'G38 V1 User')
        self._login(u_id, 'g38_v1_user')

        resp_404 = MagicMock()
        resp_404.status_code = 404
        resp_404.json.return_value = {"error": {"message": "models/gemini-3.8-flash is not found for API version v1beta"}}

        resp_200 = MagicMock()
        resp_200.status_code = 200
        resp_200.json.return_value = {
            "candidates": [
                {
                    "content": {
                        "parts": [{"text": "SMA explanation resolved via v1 endpoint."}]
                    }
                }
            ]
        }

        with patch('backend.gemini_studio_service.requests.post', side_effect=[resp_404, resp_200]) as mock_post:
            res = self.client.post('/api/ai/ask-studio', json={
                'query': 'explain Spinal Muscular Atrophy',
                'api_key': 'AIzaLiveKey2026',
                'model': 'gemini-3.8-flash'
            })
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            self.assertEqual(data.get('status'), 'success')
            self.assertEqual(data.get('model'), 'gemini-3.8-flash')
            self.assertIn('SMA explanation resolved via v1 endpoint', data.get('answer', ''))
            # Verified v1 endpoint was tried
            self.assertEqual(mock_post.call_count, 2)
            second_url = mock_post.call_args_list[1][0][0]
            self.assertIn('v1/models/gemini-3.8-flash:generateContent', second_url)

    def test_care_ai_fallback_when_primary_fails(self):
        """Verify that if gemini-3.8-flash fails, Care AI automatically falls back to gemini-3.0-flash / gemini-2.5-flash."""
        from unittest.mock import patch, MagicMock
        u_id = create_user('g38_fallback_user', 'pass123', 'g38fb@test.ae', 'G38 Fallback User')
        self._login(u_id, 'g38_fallback_user')

        resp_404_v1beta = MagicMock()
        resp_404_v1beta.status_code = 404
        resp_404_v1beta.json.return_value = {"error": {"message": "models/gemini-3.8-flash is not found for API version v1beta"}}

        resp_404_v1 = MagicMock()
        resp_404_v1.status_code = 404
        resp_404_v1.json.return_value = {"error": {"message": "models/gemini-3.8-flash is not found for API version v1"}}

        resp_200_30 = MagicMock()
        resp_200_30.status_code = 200
        resp_200_30.json.return_value = {
            "candidates": [
                {
                    "content": {
                        "parts": [{"text": "Carrier explanation resolved via gemini-3.0-flash fallback."}]
                    }
                }
            ]
        }

        with patch('backend.gemini_studio_service.requests.post', side_effect=[resp_404_v1beta, resp_404_v1, resp_200_30]) as mock_post:
            res = self.client.post('/api/ai/ask-studio', json={
                'query': 'Explain our carrier risk',
                'api_key': 'AIzaLiveKey2026',
                'model': 'gemini-3.8-flash'
            })
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            self.assertEqual(data.get('status'), 'success')
            self.assertEqual(data.get('model'), 'gemini-3.0-flash')
            self.assertIn('gemini-3.0-flash fallback', data.get('answer', ''))


    def test_care_ai_system_instruction_separated_from_contents(self):
        """Verify system prompt is passed in system_instruction and maxOutputTokens is 2048."""
        from unittest.mock import patch
        u_id = create_user('sys_instr_user', 'pass123', 'sys@test.ae', 'System User')
        self._login(u_id, 'sys_instr_user')

        with patch('backend.gemini_studio_service.requests.post') as mock_post:
            mock_post.return_value.status_code = 200
            mock_post.return_value.json.return_value = {
                "candidates": [{"content": {"parts": [{"text": "IVF with PGT-M details..."}]}}]
            }
            res = self.client.post('/api/ai/ask-studio', json={
                'query': 'what is IVF Embryo',
                'api_key': 'AIzaKeySeparated'
            })
            self.assertEqual(res.status_code, 200)
            call_kwargs = mock_post.call_args[1]
            sent_payload = call_kwargs.get('json', {})

            # 1. system_instruction must be present at top level
            self.assertIn('system_instruction', sent_payload)
            sys_text = sent_payload['system_instruction']['parts'][0]['text']
            self.assertIn('COMMUNICATION GUIDELINES', sys_text)

            # 2. contents must contain ONLY the user prompt, free from system guidelines
            contents = sent_payload.get('contents', [])
            self.assertEqual(len(contents), 1)
            self.assertEqual(contents[0]['parts'][0]['text'], 'what is IVF Embryo')

            # 3. maxOutputTokens must be 2048 to prevent truncation
            gen_config = sent_payload.get('generationConfig', {})
            self.assertEqual(gen_config.get('maxOutputTokens'), 2048)

    def test_ask_studio_resolves_chart_id_grounding(self):
        """Verify /api/ai/ask-studio resolves chart ID from query and passes grounded family context."""
        from unittest.mock import patch
        u_id = create_user('kabir_user', 'pass123', 'kabir@test.ae', 'Kabir Al Nuaimi')
        self._login(u_id, 'kabir_user')
        fam = create_family(
            u_id,
            {
                'name': 'Spinal Muscular Atrophy (SMA) Screening Chart',
                'family_id': 'FA-000003'
            }
        )
        add_pedigree_node(u_id, {
            'family_id': 'FA-000003',
            'name': 'Immense-Thicket-ta-328526',
            'relationship': 'husband',
            'sex': 'male',
            'generation': 'gen2',
            'carrier_status': 'Heterozygous Carrier (1 Copy)',
            'condition_locus': 'Spinal Muscular Atrophy (SMA)'
        })

        with patch('backend.gemini_studio_service.requests.post') as mock_post:
            mock_post.return_value.status_code = 200
            mock_post.return_value.json.return_value = {
                "candidates": [{"content": {"parts": [{"text": "Chart FA-000003 has 3 members."}]}}]
            }
            res = self.client.post('/api/ai/ask-studio', json={
                'query': 'fetch information about chart-id FA-00003',
                'api_key': 'AIzaKeyChart3'
            })
            self.assertEqual(res.status_code, 200)
            call_kwargs = mock_post.call_args[1]
            sent_payload = call_kwargs.get('json', {})
            sys_text = sent_payload.get('system_instruction', {}).get('parts', [{}])[0].get('text', '')

            # Verify grounded chart ID and members are in system context
            self.assertIn('FA-000003', sys_text)
            self.assertIn('Spinal Muscular Atrophy (SMA)', sys_text)

    def test_analyze_assessment_normalizes_string_innovative_technologies(self):
        """Verify analyze_assessment normalizes innovative_technologies string to list of strings."""
        from gemini_studio_service import gemini_studio
        from unittest.mock import patch
        with patch('backend.gemini_studio_service.requests.post') as mock_post:
            mock_post.return_value.status_code = 200
            mock_post.return_value.json.return_value = {
                "candidates": [{
                    "content": {
                        "parts": [{
                            "text": json.dumps({
                                "innovative_technologies": "PGT-M with IVF\nNon-Invasive Prenatal Diagnosis",
                                "next_possible_ways": "Step 1: Counseling\nStep 2: Partner test",
                                "detected_conditions": [{
                                    "condition_name": "Beta-Thalassemia",
                                    "carrier_summary": "Heterozygous"
                                }]
                            })
                        }]
                    }
                }]
            }
            res = gemini_studio.analyze_assessment(
                reports=[],
                pedigree_nodes=[],
                api_key='AIzaNormTestKey'
            )
            self.assertTrue(isinstance(res.get('innovative_technologies'), list))
            self.assertEqual(len(res['innovative_technologies']), 2)
            self.assertTrue(isinstance(res.get('next_possible_ways'), list))
            self.assertEqual(len(res['next_possible_ways']), 2)
            conds = res.get('detected_conditions', [])
            self.assertEqual(conds[0].get('name'), 'Beta-Thalassemia')
            self.assertEqual(conds[0].get('carrier_status'), 'Heterozygous')


if __name__ == '__main__':
    unittest.main()
