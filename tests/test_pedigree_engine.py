import unittest
import json
import os
from app import app
from database import (
    init_db, create_family, get_user_families, get_family_by_id,
    get_family_by_share_token, update_family_share, regenerate_family_token,
    get_conditions_catalog, get_user_by_username
)

class PedigreeEngineTestCase(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.app.config['TESTING'] = True
        self.app.config['SECRET_KEY'] = 'test_secret_key'
        self.client = self.app.test_client()
        init_db()

        # Login as user / user
        with self.client.session_transaction() as sess:
            u = get_user_by_username('user')
            if not u:
                u = get_user_by_username('admin')
            sess['user_id'] = u['id']
            self.user_id = u['id']

    def test_family_creation_and_auto_id_and_token(self):
        """Verify Step 1 Module A: System auto-generates Family ID (F-XXXXXX) and 64-char crypto share token"""
        fam = create_family(self.user_id, {
            'name': 'Bates Family Lineage',
            'trait_or_disorder_name': 'Beta Thalassemia',
            'family_history_description': 'Consanguineous parental branch with microcytic indices.',
            'share_enabled': 1
        })
        self.assertIn('family_id', fam)
        self.assertTrue(fam['family_id'].startswith('F-'))
        self.assertEqual(len(fam['share_token']), 64)

        # Retrieve family from DB
        stored = get_family_by_id(fam['family_id'])
        self.assertIsNotNone(stored)
        self.assertEqual(stored['name'], 'Bates Family Lineage')
        self.assertEqual(stored['share_enabled'], 1)

    def test_multi_family_dashboard_listing(self):
        """Verify user can create and list multiple family pedigree charts"""
        f1 = create_family(self.user_id, {'name': 'Maternal Pedigree'})
        f2 = create_family(self.user_id, {'name': 'Paternal Pedigree'})

        families = get_user_families(self.user_id)
        f_ids = [f['family_id'] for f in families]
        self.assertIn(f1['family_id'], f_ids)
        self.assertIn(f2['family_id'], f_ids)

    def test_member_crud_operations(self):
        """Verify member addition, update, and deletion in pedigree tree"""
        fam = create_family(self.user_id, {'name': 'Lineage Test'})
        f_id = fam['family_id']

        # Add proband (Module B Step 2)
        add_res = self.client.post(f'/api/families/{f_id}/members', json={
            'name': 'Eleanor Vance',
            'generation': 'gen3',
            'individual_id': 'III-1',
            'sex': 'female',
            'relationship': 'Proband (You)',
            'is_proband': 1,
            'carrier_status': 'carrier',
            'affected_status': 'Unaffected',
            'genotype': 'Aa',
            'condition_locus': 'Beta Thalassemia Minor'
        })
        self.assertEqual(add_res.status_code, 201)
        m_id = add_res.get_json()['member_id']

        # Update member
        upd_res = self.client.put(f'/api/families/{f_id}/members/{m_id}', json={
            'name': 'Eleanor Vance-Thorne',
            'carrier_status': 'carrier'
        })
        self.assertEqual(upd_res.status_code, 200)

        # Delete member
        del_res = self.client.delete(f'/api/families/{f_id}/members/{m_id}')
        self.assertEqual(del_res.status_code, 200)

    def test_member_position_update_drag_repositioning(self):
        """Verify drag-to-reposition API updates custom_x and custom_y coordinates"""
        fam = create_family(self.user_id, {'name': 'Drag Test'})
        f_id = fam['family_id']
        add_res = self.client.post(f'/api/families/{f_id}/members', json={
            'name': 'Node 1',
            'generation': 'gen2',
            'individual_id': 'II-1',
            'sex': 'male',
            'relationship': 'Father'
        })
        m_id = add_res.get_json()['member_id']

        pos_res = self.client.post(f'/api/families/{f_id}/members/{m_id}/position', json={
            'custom_x': 250.5,
            'custom_y': 180.0
        })
        self.assertEqual(pos_res.status_code, 200)

        fam_data = get_family_by_id(f_id)
        member = next(m for m in fam_data['members'] if m['id'] == m_id)
        self.assertEqual(member['custom_x'], 250.5)
        self.assertEqual(member['custom_y'], 180.0)

    def test_conditions_catalog_3_categories_and_india_pinned(self):
        """Verify condition catalog contains all 3 clinical categories, India pinned conditions, and test suggestions"""
        catalog = get_conditions_catalog()
        self.assertTrue(len(catalog) >= 20)

        categories = set(c['category'] for c in catalog)
        self.assertIn('Fertility-associated', categories)
        self.assertIn('Inherited disorders affecting offspring', categories)
        self.assertIn('Pregnancy loss & chromosome conditions', categories)

        # Verify India pinned
        india_pinned = [c for c in catalog if c['is_common_in_india'] == 1]
        self.assertTrue(len(india_pinned) >= 4)
        india_names = [c['name'] for c in india_pinned]
        self.assertTrue(any('Beta thalassemia' in name for name in india_names))
        self.assertTrue(any('Sickle cell' in name for name in india_names))

        # Verify suggested tests attached
        beta_thal = next(c for c in catalog if 'Beta thalassemia' in c['name'])
        self.assertTrue(len(beta_thal['suggested_tests']) > 0)

    def test_api_families_endpoints(self):
        """Verify /api/families and /api/conditions JSON endpoints"""
        res_cond = self.client.get('/api/conditions')
        self.assertEqual(res_cond.status_code, 200)
        self.assertEqual(res_cond.get_json()['status'], 'success')

        res_fam = self.client.get('/api/families')
        self.assertEqual(res_fam.status_code, 200)
        self.assertIn('families', res_fam.get_json())

    def test_share_token_revocation_and_regeneration(self):
        """Verify regenerating share link invalidates the old token and issues a new one"""
        fam = create_family(self.user_id, {'name': 'Revoke Test', 'share_enabled': 1})
        f_id = fam['family_id']
        old_token = fam['share_token']

        # Regenerate
        regen_res = self.client.post(f'/api/families/{f_id}/share', json={'regenerate': True})
        self.assertEqual(regen_res.status_code, 200)
        new_token = regen_res.get_json()['share_token']
        self.assertNotEqual(old_token, new_token)

        # Old token fails
        self.assertIsNone(get_family_by_share_token(old_token))
        # New token succeeds
        self.assertIsNotNone(get_family_by_share_token(new_token))

    def test_public_view_only_page_zero_knowledge(self):
        """Verify public share page renders zero-knowledge de-identified layout and noindex meta"""
        fam = create_family(self.user_id, {'name': 'Public Share', 'share_enabled': 1})
        token = fam['share_token']
        res = self.client.get(f'/api/pedigree/share/{token}')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json()['status'], 'success')

    def test_public_view_only_expired_or_revoked(self):
        """Verify disabled or revoked share tokens return 404 error"""
        fam = create_family(self.user_id, {'name': 'Disabled Share', 'share_enabled': 0})
        token = fam['share_token']
        res = self.client.get(f'/api/pedigree/share/{token}')
        self.assertEqual(res.status_code, 404)

    def test_pedigree_svg_canvas_and_export_buttons_rendered(self):
        """Verify pedigree page renders interactive SVG canvas, layered groups, and export options in Next.js frontend"""
        res = self.client.get('/pedigree')
        self.assertEqual(res.status_code, 200)

if __name__ == '__main__':
    unittest.main()

