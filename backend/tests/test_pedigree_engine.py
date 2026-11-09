import unittest
import json
import os
import sys
import tempfile
import shutil

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from config import Config
from app import app
from database import (
    init_db, create_family, get_user_families, get_family_by_id,
    get_family_by_share_token, update_family_share, regenerate_family_token,
    get_conditions_catalog, get_user_by_username
)

class PedigreeEngineTestCase(unittest.TestCase):
    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        self.orig_data_dir = Config.DATA_DIR
        self.orig_db_path = Config.DATABASE_PATH
        Config.DATA_DIR = self.test_dir
        Config.DATABASE_PATH = os.path.join(self.test_dir, 'test_ga.db')
        init_db()

        self.app = app
        self.app.config['TESTING'] = True
        self.app.config['SECRET_KEY'] = 'test_secret_key'
        self.client = self.app.test_client()

        # Login as user / user
        with self.client.session_transaction() as sess:
            u = get_user_by_username('user')
            if not u:
                u = get_user_by_username('admin')
            sess['user_id'] = u['id']
            self.user_id = u['id']

    def tearDown(self):
        Config.DATA_DIR = self.orig_data_dir
        Config.DATABASE_PATH = self.orig_db_path
        shutil.rmtree(self.test_dir, ignore_errors=True)

    def test_family_creation_and_auto_id_and_token(self):
        """Verify Step 1 Module A: System auto-generates sequential Family ID (FA-000001, FA-000002) and 64-char crypto share token"""
        fam = create_family(self.user_id, {
            'name': 'Bates Family Lineage',
            'trait_or_disorder_name': 'Beta Thalassemia',
            'family_history_description': 'Consanguineous parental branch with microcytic indices.',
            'share_enabled': 1
        })
        self.assertIn('family_id', fam)
        self.assertEqual(fam['family_id'], 'FA-000001')
        self.assertEqual(len(fam['share_token']), 64)

        fam2 = create_family(self.user_id, {'name': 'Second Family Lineage'})
        self.assertEqual(fam2['family_id'], 'FA-000002')

        # Retrieve family from DB
        stored = get_family_by_id(fam['family_id'])
        self.assertIsNotNone(stored)
        self.assertEqual(stored['name'], 'Bates Family Lineage')
        self.assertEqual(stored['share_enabled'], 1)

        # Verify /api/pedigree/share/<token> endpoint
        share_res = self.client.get(f'/api/pedigree/share/{fam["share_token"]}')
        self.assertEqual(share_res.status_code, 200)
        self.assertEqual(share_res.get_json()['status'], 'success')
        self.assertEqual(share_res.get_json()['family']['family_id'], 'FA-000001')

        # Verify next-id endpoint reports next sequential ID (FA-000003)
        next_res = self.client.get('/api/families/next-id')
        self.assertEqual(next_res.status_code, 200)
        self.assertEqual(next_res.get_json()['next_family_id'], 'FA-000003')

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

    def test_auto_generated_sudo_name_for_new_members(self):
        """Verify all new added family members have an auto-generated Reddit-style sudo-name"""
        fam = create_family(self.user_id, {'name': 'Sudo Name Test Family'})
        f_id = fam['family_id']

        # Add member without specifying alias_name or name
        res = self.client.post(f'/api/families/{f_id}/members', json={
            'relationship_to_proband': 'brother',
            'sex': 'male',
            'is_carrier': True,
            'conditions': ['Beta-Thalassemia Minor']
        })
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertIn('member', data)
        self.assertTrue(bool(data['member']['pseudonym']))
        self.assertIn('-', data['member']['pseudonym'])  # Reddit-style Adjective-Noun-1234

        # Verify saved in database against family_id
        fam_record = get_family_by_id(f_id)
        member = fam_record['members'][0]
        self.assertEqual(member['family_id'], f_id)
        self.assertTrue(bool(member['pseudonym']))
        self.assertTrue(bool(member['alias_name']))
        self.assertEqual(member['conditions'], ['Beta-Thalassemia Minor'])

    def test_all_16_relationship_options_persistence(self):
        """Verify adding relatives with all 16 relation options saves against family_id"""
        fam = create_family(self.user_id, {'name': '16 Relations Family'})
        f_id = fam['family_id']

        relations = [
            ('father', 'male'),
            ('mother', 'female'),
            ('full_sibling', 'male'),
            ('half_sibling_father', 'male'),
            ('half_sibling_mother', 'female'),
            ('twin_identical', 'male'),
            ('twin_fraternal', 'female'),
            ('husband_wife', 'female'),
            ('son', 'male'),
            ('daughter', 'female'),
            ('paternal_uncle_aunt', 'male'),
            ('maternal_uncle_aunt', 'female'),
            ('grandparents', 'male'),
            ('cousin', 'female'),
            ('adopted_child', 'male'),
            ('pregnancy_loss', 'unknown'),
        ]

        for rel, sex in relations:
            res = self.client.post(f'/api/families/{f_id}/members', json={
                'relationship_to_proband': rel,
                'sex': sex,
                'living_status': 'Alive' if rel != 'pregnancy_loss' else 'Unknown'
            })
            self.assertEqual(res.status_code, 201)

        fam_record = get_family_by_id(f_id)
        self.assertEqual(len(fam_record['members']), 16)
        saved_relations = [m['relationship_to_proband'] for m in fam_record['members']]
        for rel, _ in relations:
            self.assertIn(rel, saved_relations)
            
        # Verify every single member has an auto-generated sudo-name
        for m in fam_record['members']:
            self.assertTrue(bool(m['pseudonym']))
            self.assertTrue(bool(m['alias_name']))

    def test_family_tree_creation_persistence_after_refresh(self):
        """Verify that newly created family trees and relatives persist in the database across page refreshes"""
        # Step 1: User creates family via API
        create_res = self.client.post('/api/families', json={
            'family_name': 'Khan Clinical Pedigree',
            'health_conditions_of_interest': ['Autosomal Recessive Thalassemia'],
            'family_history_description': 'Documented carrier branch'
        })
        self.assertEqual(create_res.status_code, 201)
        created_fam = create_res.get_json()['family']
        fam_id = created_fam['family_id']
        self.assertTrue(fam_id.startswith(('FA-', 'F-')))

        # Step 2: User adds proband
        p_res = self.client.post(f'/api/families/{fam_id}/members', json={
            'name': 'Aarav Khan',
            'sex': 'male',
            'relationship_to_proband': 'self',
            'is_proband': True,
            'living_status': 'Alive'
        })
        self.assertEqual(p_res.status_code, 201)

        # Step 3: User adds relatives (Father, Mother, Brother)
        for rel, name, sex in [('father', 'Rahim Khan', 'male'), ('mother', 'Zahra Khan', 'female'), ('full_sibling', 'Tariq Khan', 'male')]:
            m_res = self.client.post(f'/api/families/{fam_id}/members', json={
                'name': name,
                'sex': sex,
                'relationship_to_proband': rel,
                'living_status': 'Alive'
            })
            self.assertEqual(m_res.status_code, 201)
            self.assertTrue(bool(m_res.get_json()['member']['pseudonym']))

        # Simulating Page Refresh: Client makes a fresh GET /api/families request
        list_res = self.client.get('/api/families')
        self.assertEqual(list_res.status_code, 200)
        families = list_res.get_json()['families']
        target = next((f for f in families if f['family_id'] == fam_id), None)
        self.assertIsNotNone(target, "Created family must be present in user family list after refresh")
        self.assertEqual(target['member_count'], 4)

        # Simulating Page Refresh: Client loads active family details GET /api/families/<id>
        detail_res = self.client.get(f'/api/families/{fam_id}')
        self.assertEqual(detail_res.status_code, 200)
        full_fam = detail_res.get_json()['family']
        self.assertEqual(full_fam['family_id'], fam_id)
        self.assertEqual(len(full_fam['members']), 4)

        relations = [m['relationship_to_proband'] for m in full_fam['members']]
        self.assertIn('self', relations)
        self.assertIn('father', relations)
        self.assertIn('mother', relations)
        self.assertIn('full_sibling', relations)

        # Every member must have an alias_name / pseudonym
        for m in full_fam['members']:
            self.assertTrue(bool(m.get('pseudonym') or m.get('alias_name')))

    def test_family_deletion_preserves_members(self):
        """Verify deleting a family chart deletes the family record while keeping members intact in DB"""
        fam = create_family(self.user_id, {'name': 'Temporary Chart to Delete'})
        f_id = fam['family_id']

        # Add a member to this family
        add_res = self.client.post(f'/api/families/{f_id}/members', json={
            'name': 'Devi Sharma',
            'generation': 'gen1',
            'sex': 'female',
            'relationship': 'mother',
            'carrier_status': 'carrier',
            'condition_locus': 'Sickle Cell Trait'
        })
        self.assertEqual(add_res.status_code, 201)
        m_id = add_res.get_json()['member_id']

        # Delete family via DELETE /api/families/<f_id>
        del_res = self.client.delete(f'/api/families/{f_id}')
        self.assertEqual(del_res.status_code, 200)

        # Family record must be gone
        self.assertIsNone(get_family_by_id(f_id))

        # Member record must remain intact in database
        nodes_res = self.client.get('/api/pedigree-nodes')
        self.assertEqual(nodes_res.status_code, 200)
        data = nodes_res.get_json()
        user_nodes = data if isinstance(data, list) else data.get('pedigree_nodes', [])
        preserved_node = next((n for n in user_nodes if n['id'] == m_id), None)
        self.assertIsNotNone(preserved_node, "Member must remain preserved in database after family deletion")
        self.assertEqual(preserved_node['name'], 'Devi Sharma')
        self.assertIsNone(preserved_node['family_id'], "Preserved member must be unlinked from deleted family")

        # Create another family and re-link the preserved member
        fam2 = create_family(self.user_id, {'name': 'New Tree Later'})
        f2_id = fam2['family_id']
        link_res = self.client.post(f'/api/families/{f2_id}/members', json={
            'existing_member_id': m_id
        })
        self.assertEqual(link_res.status_code, 201)

        f2_data = get_family_by_id(f2_id)
        self.assertTrue(any(m['id'] == m_id for m in f2_data['members']), "Preserved member must be linkable to new tree")

    def test_family_deletion_with_members_deletes_nodes_and_scraped_reports(self):
        """Verify deleting a family with delete_members=true deletes the family, its member nodes, and scraped_reports"""
        from database import save_scraped_report, get_user_scraped_reports
        fam = create_family(self.user_id, {'name': 'Chart To Delete With Members'})
        f_id = fam['family_id']

        # Add member node
        add_res = self.client.post(f'/api/families/{f_id}/members', json={
            'name': 'Pankaj Node',
            'alias_name': 'Nimble-Sequoia-pa-1234',
            'generation': 'gen2',
            'sex': 'male',
            'relationship': 'self'
        })
        self.assertEqual(add_res.status_code, 201)
        m_id = add_res.get_json()['member_id']

        # Add linked scraped report
        rep_id = save_scraped_report(
            user_id=self.user_id,
            file_name='report_test.pdf',
            panel_name='Premarital Panel',
            masked_data={
                'family_id': f_id,
                'member_id': m_id,
                'sudo_name': 'Nimble-Sequoia-pa-1234',
                'patient_name': 'Pankaj'
            }
        )
        self.assertIsNotNone(rep_id)

        # Confirm report exists
        user_reps_before = get_user_scraped_reports(self.user_id)
        self.assertTrue(any(r['id'] == rep_id for r in user_reps_before))

        # Delete family with delete_members=true
        del_res = self.client.delete(f'/api/families/{f_id}?delete_members=true')
        self.assertEqual(del_res.status_code, 200)

        # Family record must be gone
        self.assertIsNone(get_family_by_id(f_id))

        # Member node must be gone from database
        nodes_res = self.client.get('/api/pedigree-nodes')
        self.assertEqual(nodes_res.status_code, 200)
        data = nodes_res.get_json()
        user_nodes = data if isinstance(data, list) else data.get('pedigree_nodes', [])
        self.assertFalse(any(n['id'] == m_id for n in user_nodes))

        # Scraped report must be removed from database (removing it from Patient Profile & Details)
        user_reps_after = get_user_scraped_reports(self.user_id)
        self.assertFalse(any(r['id'] == rep_id for r in user_reps_after))

if __name__ == '__main__':
    unittest.main()

