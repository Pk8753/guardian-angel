"""
Automated Test Suite for Localization, RTL Rendering, and UI Routes (Requirements R2, R3, R4):
Covers translation dictionary completeness and Arabic Unicode integrity (231 keys),
UAE clinical genetic terminology accuracy, RTL CSS styling rules and layout utilities,
headless UI view routes status and schema, UI neatness and layout balancing indicators,
and locale store persistence logic with cookie configuration.
"""

import os
import sys
import unittest
import json
import re
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
from database import init_db, create_user


class GuardianAngelLocalizationAndUITestCase(unittest.TestCase):
    """Automated unit test suite verifying bilingual localization, RTL rules, and UI routes."""

    @classmethod
    def setUpClass(cls):
        # Locate project repository root
        cls.repo_root = cls._resolve_repo_root()

    @classmethod
    def _resolve_repo_root(cls):
        current = os.path.abspath(os.path.dirname(__file__))
        for _ in range(4):
            if os.path.exists(os.path.join(current, 'frontend', 'src', 'lib', 'translations.ts')):
                return current
            parent = os.path.dirname(current)
            if parent == current:
                break
            current = parent
        cwd = os.getcwd()
        if os.path.exists(os.path.join(cwd, 'frontend', 'src', 'lib', 'translations.ts')):
            return cwd
        if os.path.exists(os.path.join(cwd, '..', 'frontend', 'src', 'lib', 'translations.ts')):
            return os.path.abspath(os.path.join(cwd, '..'))
        return cwd

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

    def _load_translations(self):
        trans_file = os.path.join(self.repo_root, 'frontend', 'src', 'lib', 'translations.ts')
        self.assertTrue(os.path.exists(trans_file), f"Translations file not found at {trans_file}")
        with open(trans_file, 'r', encoding='utf-8') as f:
            content = f.read()

        # Parse key: { en: '...', ar: '...' }
        pattern = re.compile(
            r"^\s*([a-zA-Z0-9_]+):\s*\{\s*en:\s*(['\"`])(.*?)\2\s*,\s*ar:\s*(['\"`])(.*?)\4\s*\}",
            re.MULTILINE | re.DOTALL
        )
        matches = pattern.findall(content)
        entries = {m[0]: {'en': m[2], 'ar': m[4]} for m in matches}
        return entries

    # =========================================================================
    # 1. TRANSLATION DICTIONARY INTEGRITY (231 KEYS)
    # =========================================================================

    def test_translations_dictionary_integrity_231_keys(self):
        """Verify translations dictionary has at least 231 keys with non-empty EN and valid Arabic Unicode AR."""
        entries = self._load_translations()
        self.assertGreaterEqual(
            len(entries), 231,
            f"Expected at least 231 translation keys, found {len(entries)}"
        )

        arabic_char_pattern = re.compile(r'[\u0600-\u06FF]')
        empty_en = []
        empty_ar = []
        invalid_ar_script = []

        for key, val in entries.items():
            en_val = val['en'].strip()
            ar_val = val['ar'].strip()
            if not en_val:
                empty_en.append(key)
            if not ar_val:
                empty_ar.append(key)
            if not arabic_char_pattern.search(ar_val):
                invalid_ar_script.append(key)

        self.assertEqual(len(empty_en), 0, f"Found empty EN keys: {empty_en}")
        self.assertEqual(len(empty_ar), 0, f"Found empty AR keys: {empty_ar}")
        self.assertEqual(len(invalid_ar_script), 0, f"Found AR keys lacking Arabic Unicode: {invalid_ar_script}")

    # =========================================================================
    # 2. UAE CLINICAL GENETIC TERMINOLOGY ACCURACY
    # =========================================================================

    def test_uae_clinical_genetic_terminology_accuracy(self):
        """Verify accurate translation of key UAE clinical genetic terms in English and Arabic."""
        entries = self._load_translations()

        # 1. Thalassemia & Trait
        self.assertIn('thalassemia', entries)
        self.assertIn('Beta-Thalassemia', entries['thalassemia']['en'])
        self.assertIn('الثلاسيميا بيتا', entries['thalassemia']['ar'])

        self.assertIn('thalassemia_trait', entries)
        self.assertIn('Beta-Thalassemia Minor', entries['thalassemia_trait']['en'])
        self.assertIn('الثلاسيميا بيتا الصغرى', entries['thalassemia_trait']['ar'])

        # 2. Sickle Cell
        self.assertIn('sickle_cell', entries)
        self.assertIn('Sickle Cell', entries['sickle_cell']['en'])
        self.assertIn('المنجلية', entries['sickle_cell']['ar'])

        # 3. G6PD Deficiency (Favism)
        self.assertIn('g6pd_deficiency', entries)
        self.assertIn('G6PD Deficiency', entries['g6pd_deficiency']['en'])
        self.assertTrue(
            'سداسي فوسفات الجلوكوز' in entries['g6pd_deficiency']['ar'] or
            'الفول' in entries['g6pd_deficiency']['ar']
        )

        # 4. Autosomal Recessive
        self.assertIn('autosomal_recessive', entries)
        self.assertIn('Autosomal Recessive', entries['autosomal_recessive']['en'])
        self.assertIn('متنحية', entries['autosomal_recessive']['ar'])

        # 5. Consanguinity
        self.assertIn('consanguinity', entries)
        self.assertIn('Consanguinity', entries['consanguinity']['en'])
        self.assertIn('الأقارب', entries['consanguinity']['ar'])

        # 6. Wright's Inbreeding Coefficient
        self.assertIn('inbreeding_coefficient', entries)
        self.assertIn('Wright', entries['inbreeding_coefficient']['en'])
        self.assertIn('(F)', entries['inbreeding_coefficient']['en'])
        self.assertIn('رايت', entries['inbreeding_coefficient']['ar'])

        # 7. PGT-M with IVF Counseling
        self.assertIn('pgtm_counseling', entries)
        self.assertIn('PGT-M', entries['pgtm_counseling']['en'])
        self.assertIn('IVF', entries['pgtm_counseling']['en'])
        self.assertIn('PGT-M', entries['pgtm_counseling']['ar'])
        self.assertIn('أطفال الأنابيب', entries['pgtm_counseling']['ar'])

    # =========================================================================
    # 3. PRIMARY SCREENS TRANSLATION COVERAGE
    # =========================================================================

    def test_primary_screens_bilingual_translation_coverage(self):
        """Verify translation keys cover all primary screens and UI modules."""
        entries = self._load_translations()

        required_keys = [
            # Navigation & Brand
            'brand_title', 'brand_subtitle', 'nav_dashboard', 'nav_pedigree',
            'nav_risk', 'nav_couple', 'nav_privacy', 'nav_profile',

            # Dashboard
            'good_morning', 'hero_desc_prefix', 'stat_pedigree_size',
            'stat_ai_surveillance', 'stat_spousal_harmony',

            # Ask Care AI
            'care_ai_title', 'care_ai_subtitle', 'care_ai_placeholder', 'btn_send',

            # Pedigree Studio & Dossier
            'pedigree_studio_subtitle', 'pedigree_empty_selection_title',
            'pedigree_dossier_active_chart', 'pedigree_dossier_total_members',
            'pedigree_dossier_generations', 'pedigree_dossier_consanguinity_status',
            'pedigree_dossier_carriers_count',

            # Risk Analysis
            'risk_analysis_title', 'risk_consanguinity_guidance_title',
            'risk_carrier_guidance_body',

            # Couple Assessment
            'couple_inbreeding_coeff', 'couple_counselor_welcome',

            # Privacy & Security
            'privacy_compliance_title',

            # Profile
            'profile_title'
        ]

        for k in required_keys:
            self.assertIn(k, entries, f"Required translation key '{k}' missing from dictionary")
            self.assertTrue(len(entries[k]['en']) > 0, f"Key '{k}' has empty EN value")
            self.assertTrue(len(entries[k]['ar']) > 0, f"Key '{k}' has empty AR value")

    # =========================================================================
    # 4. RTL CSS RULES AND UTILITIES
    # =========================================================================

    def test_rtl_css_styling_rules_in_globals_css(self):
        """Verify [dir='rtl'] rules and utilities are defined in globals.css."""
        css_file = os.path.join(self.repo_root, 'frontend', 'src', 'app', 'globals.css')
        self.assertTrue(os.path.exists(css_file), f"globals.css not found at {css_file}")
        with open(css_file, 'r', encoding='utf-8') as f:
            css = f.read()

        # Check [dir="rtl"] selector and font fallback
        self.assertIn('[dir="rtl"]', css)
        self.assertIn('Plus Jakarta Sans', css)

        # Check RTL icon flip utility
        self.assertIn('.rtl-flip', css)
        self.assertIn('scaleX(-1)', css)

        # Check RTL rotation utility
        self.assertIn('.rtl\\:rotate-180', css)

        # Check directional border overrides
        self.assertIn('.rtl\\:border-l', css)
        self.assertIn('.rtl\\:border-r-0', css)

    def test_sidebar_and_navbar_rtl_layout_classes(self):
        """Verify Sidebar and Navbar components implement RTL logical classes and language toggle."""
        # 1. Sidebar logical border
        sidebar_file = os.path.join(self.repo_root, 'frontend', 'src', 'components', 'layout', 'Sidebar.tsx')
        self.assertTrue(os.path.exists(sidebar_file))
        with open(sidebar_file, 'r', encoding='utf-8') as f:
            sb = f.read()
        self.assertIn('border-r', sb)
        self.assertIn('rtl:border-r-0', sb)
        self.assertIn('rtl:border-l', sb)

        # 2. Navbar bilingual toggle & directional alignments
        navbar_file = os.path.join(self.repo_root, 'frontend', 'src', 'components', 'layout', 'Navbar.tsx')
        self.assertTrue(os.path.exists(navbar_file))
        with open(navbar_file, 'r', encoding='utf-8') as f:
            nb = f.read()
        self.assertIn('العربية', nb)
        self.assertIn('EN', nb)
        self.assertIn('rtl:pl-4 rtl:pr-9', nb)
        self.assertIn('rtl:left-auto rtl:right-3', nb)
        self.assertIn('rtl:right-auto rtl:left-0', nb)

    # =========================================================================
    # 5. LOCALE STORE PERSISTENCE & COOKIE SYNC
    # =========================================================================

    def test_locale_store_persistence_logic_and_cookie_configuration(self):
        """Verify useUIStore implements localStorage persistence, cookie sync, and DOM direction switching."""
        store_file = os.path.join(self.repo_root, 'frontend', 'src', 'stores', 'useUIStore.ts')
        self.assertTrue(os.path.exists(store_file))
        with open(store_file, 'r', encoding='utf-8') as f:
            store = f.read()

        # Check localStorage key
        self.assertIn('guardian_locale', store)
        self.assertIn("localStorage.getItem('guardian_locale')", store)
        self.assertIn("localStorage.setItem('guardian_locale', locale)", store)

        # Check cookie synchronization
        self.assertIn('ga_locale=', store)
        self.assertIn('path=/', store)
        self.assertIn('max-age=31536000', store)
        self.assertIn('SameSite=Lax', store)

        # Check DOM synchronization
        self.assertIn("document.documentElement.lang = locale", store)
        self.assertIn("document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'", store)

        # Check rehydration function
        self.assertIn('rehydrateLocale', store)

    # =========================================================================
    # 6. UI NEATNESS AND LAYOUT BALANCING INDICATORS
    # =========================================================================

    def test_ui_neatness_and_layout_balancing_indicators(self):
        """Verify layout balancing components in Pedigree, Risk Analysis, and Privacy screens."""
        # 1. Family Pedigree Overview Dossier (fills 400px empty void)
        pedigree_file = os.path.join(self.repo_root, 'frontend', 'src', 'app', 'pedigree', 'page.tsx')
        self.assertTrue(os.path.exists(pedigree_file))
        with open(pedigree_file, 'r', encoding='utf-8') as f:
            ped = f.read()
        self.assertIn('pedigree_dossier_active_chart', ped)
        self.assertIn('pedigree_dossier_total_members', ped)
        self.assertIn('pedigree_dossier_generations', ped)
        self.assertIn('pedigree_dossier_consanguinity_status', ped)

        # 2. Risk Analysis 2-column balancing card
        risk_file = os.path.join(self.repo_root, 'frontend', 'src', 'app', 'risk-analysis', 'page.tsx')
        self.assertTrue(os.path.exists(risk_file))
        with open(risk_file, 'r', encoding='utf-8') as f:
            risk = f.read()
        self.assertIn('assessment.detected_conditions.length === 1', risk)

        # 3. Privacy & Security Compliance Ledger (fills empty bottom void)
        privacy_file = os.path.join(self.repo_root, 'frontend', 'src', 'app', 'privacy-security', 'page.tsx')
        self.assertTrue(os.path.exists(privacy_file))
        with open(privacy_file, 'r', encoding='utf-8') as f:
            priv = f.read()
        self.assertIn('complianceItems', priv)
        self.assertIn('HIPAA', priv)
        self.assertIn('DPDP', priv)
        self.assertIn('AES-GCM', priv)
        self.assertIn('privacy_compliance_title', priv)

    # =========================================================================
    # 7. HEADLESS UI VIEW ROUTES STATUS AND JSON SCHEMA
    # =========================================================================

    def test_headless_ui_routes_status_and_schema(self):
        """Verify primary headless UI endpoints return HTTP 200 and success JSON schema."""
        routes = [
            ('/', '/dashboard'),
            ('/dashboard', '/dashboard'),
            ('/pedigree', '/pedigree'),
            ('/risk-analysis', '/risk-analysis'),
            ('/couple-assessment', '/couple-assessment'),
            ('/privacy-security', '/privacy-security'),
            ('/login', '/login')
        ]

        for route, expected_frontend_path in routes:
            res = self.client.get(route)
            self.assertEqual(res.status_code, 200, f"Route {route} failed with {res.status_code}")
            data = res.get_json()
            self.assertIsNotNone(data, f"Route {route} did not return JSON")
            self.assertEqual(data.get('status'), 'success')
            self.assertIn(expected_frontend_path, data.get('frontend', ''))

    def test_profile_route_auth_and_persistence(self):
        """Verify /profile route requires authentication and persists profile updates."""
        # 1. Unauthenticated GET /profile redirects to /login
        res_unauth = self.client.get('/profile')
        self.assertEqual(res_unauth.status_code, 302)
        self.assertIn('/login', res_unauth.headers.get('Location', ''))

        # 2. Unauthenticated GET /api/profile returns 401
        res_api_unauth = self.client.get('/api/profile')
        self.assertEqual(res_api_unauth.status_code, 401)
        self.assertEqual(res_api_unauth.get_json().get('status'), 'error')

        # 3. Authenticated GET /profile returns profile JSON
        u_id = create_user('patient_profile', 'pass123', 'profile@test.ae', 'Profile Patient', location='Abu Dhabi')
        with self.client.session_transaction() as sess:
            sess['user_id'] = u_id
            sess['username'] = 'patient_profile'

        res_auth = self.client.get('/profile')
        self.assertEqual(res_auth.status_code, 200)
        data_auth = res_auth.get_json()
        self.assertEqual(data_auth.get('status'), 'success')
        self.assertIn('profile', data_auth)

        # 4. Authenticated POST /profile updates profile data
        update_payload = {
            'full_name': 'Profile Patient Updated',
            'location': 'Dubai',
            'city': 'Dubai',
            'phone': '+971501234567'
        }
        res_post = self.client.post('/profile', json=update_payload)
        self.assertEqual(res_post.status_code, 200)
        self.assertEqual(res_post.get_json().get('status'), 'success')

        # Verify update persisted
        res_verify = self.client.get('/profile')
        data_verify = res_verify.get_json()
        self.assertEqual(data_verify['profile'].get('full_name'), 'Profile Patient Updated')


if __name__ == '__main__':
    unittest.main()
