import unittest
import json
import uuid
from app import app
from database import (
    get_db_connection,
    get_genetic_conditions,
    get_providers,
    get_patient_profile,
    get_quick_assessment,
    get_couple_assessments,
    get_appointments_for_patient,
    get_documents
)

class PatientJourneyTestCase(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()

    def test_seeded_conditions_and_providers(self):
        """Verify the 6 UAE conditions and 5 counselors are properly seeded."""
        conditions = get_genetic_conditions()
        self.assertGreaterEqual(len(conditions), 6)
        slugs = [c['slug'] for c in conditions]
        self.assertIn('beta-thalassemia', slugs)
        self.assertIn('sickle-cell-disease', slugs)
        self.assertIn('g6pd-deficiency', slugs)
        self.assertIn('cystic-fibrosis', slugs)
        self.assertIn('spinal-muscular-atrophy', slugs)
        self.assertIn('inherited-hearing-loss', slugs)

        providers = get_providers()
        self.assertGreaterEqual(len(providers), 5)
        names = [p['full_name'] for p in providers]
        self.assertTrue(any('Mariam Al Mansoori' in n for n in names))
        self.assertTrue(any('Tariq Al Hashimi' in n for n in names))
        self.assertTrue(any('Nadia Khoury' in n for n in names))
        self.assertTrue(any('Fatima Al Suwaidi' in n for n in names))
        self.assertTrue(any('Omar Al Nuaimi' in n for n in names))

    def test_guest_to_authenticated_handoff_and_hydration(self):
        """
        Verify:
        1. Guest completes Quick Assessment with document
        2. Signs up with quick_assessment payload -> persisted to DB
        3. Dashboard state is fully hydrated with profile, QA, documents, etc.
        """
        unique_suffix = uuid.uuid4().hex[:8]
        email = f"patient_{unique_suffix}@example.ae"
        username = f"pat_{unique_suffix}"
        password = "Password123!"

        guest_qa = {
            "answers": {
                "consanguinity": "First Cousin",
                "known_traits": ["Beta-Thalassemia Trait"],
                "screening_status": "Planning Screening"
            },
            "risk_estimate": {
                "level": "Moderate",
                "healthy_baby_rate": "75%+",
                "plain_message": "Carrying a trait is very common in the UAE. Routine premarital screening gives you clarity."
            },
            "next_steps": [
                {"title": "Premarital Screening", "desc": "Take routine blood test"}
            ],
            "documents": [
                {"file_name": "guest_premarital_report.pdf", "file_url": "/data/documents/guest_premarital_report.pdf"}
            ]
        }

        # 1. Register with pending Quick Assessment
        reg_res = self.client.post('/api/register', json={
            "email": email,
            "username": username,
            "password": password,
            "fullname": "Mariam Al Falasi",
            "dob": "1996-04-15",
            "location": "Abu Dhabi",
            "otp": "9090",
            "role": "patient",
            "quick_assessment": guest_qa
        })
        self.assertEqual(reg_res.status_code, 201)
        reg_data = json.loads(reg_res.data)
        user_id = reg_data['user_id']

        # 2. Verify patient profile was auto-built
        profile = get_patient_profile(user_id)
        self.assertIsNotNone(profile)
        self.assertEqual(profile['has_quick_assessment'], 1)

        # 3. Verify quick assessment saved in DB
        qa = get_quick_assessment(user_id)
        self.assertIsNotNone(qa)
        self.assertIn("First Cousin", qa['answers_json'])

        # 4. Verify document saved and linked
        docs = get_documents(user_id)
        self.assertGreaterEqual(len(docs), 1)
        self.assertEqual(docs[0]['file_name'], "guest_premarital_report.pdf")

        # 5. Sign in to establish session
        login_res = self.client.post('/api/login', json={
            "username": username,
            "password": password
        })
        self.assertEqual(login_res.status_code, 200)

        # 6. Verify Dashboard State Hydration
        dash_res = self.client.get('/api/patient/dashboard-state')
        self.assertEqual(dash_res.status_code, 200)
        dash_data = json.loads(dash_res.data)
        self.assertEqual(dash_data['status'], 'success')
        payload = dash_data['data']
        self.assertEqual(payload['profile']['has_quick_assessment'], 1)
        self.assertIsNotNone(payload['quick_assessment'])
        self.assertGreaterEqual(len(payload['documents']), 1)
        self.assertGreaterEqual(len(payload['conditions']), 6)
        self.assertGreaterEqual(len(payload['providers']), 5)

    def test_direct_signup_without_qa(self):
        """Verify direct signup without QA creates profile with has_quick_assessment=0."""
        unique_suffix = uuid.uuid4().hex[:8]
        email = f"direct_{unique_suffix}@example.ae"
        username = f"dir_{unique_suffix}"
        password = "Password123!"

        reg_res = self.client.post('/api/register', json={
            "email": email,
            "username": username,
            "password": password,
            "fullname": "Sultan Al Shamsi",
            "dob": "1994-11-20",
            "location": "Dubai",
            "otp": "9090",
            "role": "patient"
        })
        self.assertEqual(reg_res.status_code, 201)
        reg_data = json.loads(reg_res.data)
        user_id = reg_data['user_id']

        # Patient profile should have has_quick_assessment=0
        profile = get_patient_profile(user_id)
        self.assertIsNotNone(profile)
        self.assertEqual(profile['has_quick_assessment'], 0)

        # Log in
        self.client.post('/api/login', json={
            "username": username,
            "password": password
        })

        dash_res = self.client.get('/api/patient/dashboard-state')
        self.assertEqual(dash_res.status_code, 200)
        dash_data = json.loads(dash_res.data)
        self.assertEqual(dash_data['status'], 'success')
        payload = dash_data['data']
        self.assertEqual(payload['profile']['has_quick_assessment'], 0)
        self.assertIsNone(payload['quick_assessment'])

    def test_multiple_couple_assessments_crud(self):
        """Verify user can create, view, and manage multiple couple assessment profiles."""
        unique_suffix = uuid.uuid4().hex[:8]
        email = f"couple_user_{unique_suffix}@example.ae"
        username = f"cpl_{unique_suffix}"
        password = "Password123!"

        reg_res = self.client.post('/api/register', json={
            "email": email,
            "username": username,
            "password": password,
            "fullname": "Hamad Al Zaabi",
            "dob": "1992-07-08",
            "location": "Sharjah",
            "otp": "9090",
            "role": "patient"
        })
        self.assertEqual(reg_res.status_code, 201)

        # Sign in
        self.client.post('/api/login', json={
            "username": username,
            "password": password
        })

        # Match 1
        m1_res = self.client.post('/api/couple-assessments', json={
            "partner_label": "Fatima",
            "relationship_type": "First Cousin (Paternal)",
            "answers": {"trait": "Beta-Thalassemia Trait"},
            "risk_estimate": {"recessive_probability": "25%"},
            "plain_summary": "First cousin compatibility evaluation with Fatima.",
            "documents": [{"file_name": "fatima_screening.pdf", "file_url": "/docs/fatima_screening.pdf"}]
        })
        self.assertEqual(m1_res.status_code, 201)
        m1_id = json.loads(m1_res.data)['assessment_id']

        # Match 2
        m2_res = self.client.post('/api/couple-assessments', json={
            "partner_label": "Ayesha",
            "relationship_type": "Second Cousin",
            "answers": {"trait": "None"},
            "risk_estimate": {"recessive_probability": "<2%"},
            "plain_summary": "Second cousin compatibility evaluation with Ayesha."
        })
        self.assertEqual(m2_res.status_code, 201)
        m2_id = json.loads(m2_res.data)['assessment_id']

        # List all couple assessments
        list_res = self.client.get('/api/couple-assessments')
        self.assertEqual(list_res.status_code, 200)
        couples = json.loads(list_res.data)['couple_assessments']
        self.assertEqual(len(couples), 2)
        labels = [c['partner_label'] for c in couples]
        self.assertIn("Fatima", labels)
        self.assertIn("Ayesha", labels)

        # Delete Match 2
        del_res = self.client.delete(f'/api/couple-assessments/{m2_id}')
        self.assertEqual(del_res.status_code, 200)

        # Verify only Match 1 remains
        list_res2 = self.client.get('/api/couple-assessments')
        couples2 = json.loads(list_res2.data)['couple_assessments']
        self.assertEqual(len(couples2), 1)
        self.assertEqual(couples2[0]['partner_label'], "Fatima")

    def test_counselor_appointment_booking_and_cancellation(self):
        """Verify booking counselor appointments for self and couple assessments, and cancelling."""
        unique_suffix = uuid.uuid4().hex[:8]
        email = f"booking_{unique_suffix}@example.ae"
        username = f"bkg_{unique_suffix}"
        password = "Password123!"

        reg_res = self.client.post('/api/register', json={
            "email": email,
            "username": username,
            "password": password,
            "fullname": "Reem Al Kaabi",
            "dob": "1995-02-14",
            "location": "Al Ain",
            "otp": "9090",
            "role": "patient"
        })
        self.assertEqual(reg_res.status_code, 201)
        user_id = json.loads(reg_res.data)['user_id']

        # Log in
        self.client.post('/api/login', json={
            "username": username,
            "password": password
        })

        # Get providers to choose one
        providers = get_providers()
        prov = providers[0]

        # 1. Book appointment for Self Analysis
        apt1_res = self.client.post('/api/appointments', json={
            "provider_id": prov['id'],
            "assessment_type": "self",
            "scheduled_at": "Tomorrow at 10:00 AM",
            "notes": "Discuss individual carrier status"
        })
        self.assertEqual(apt1_res.status_code, 201)
        apt1_id = json.loads(apt1_res.data)['appointment_id']

        # 2. Book appointment for Couple Assessment
        # First create a couple assessment
        c_res = self.client.post('/api/couple-assessments', json={
            "partner_label": "Khalid",
            "relationship_type": "First Cousin"
        })
        c_id = json.loads(c_res.data)['assessment_id']

        apt2_res = self.client.post('/api/appointments', json={
            "provider_id": prov['id'],
            "assessment_type": "couple",
            "couple_assessment_id": c_id,
            "scheduled_at": "Thursday at 2:00 PM",
            "notes": "Discuss couple compatibility with Khalid"
        })
        self.assertEqual(apt2_res.status_code, 201)
        apt2_id = json.loads(apt2_res.data)['appointment_id']

        # 3. Retrieve appointments list
        apts_res = self.client.get('/api/appointments')
        self.assertEqual(apts_res.status_code, 200)
        apts = json.loads(apts_res.data)['appointments']
        self.assertEqual(len(apts), 2)

        # 4. Cancel self appointment
        cancel_res = self.client.post(f'/api/appointments/{apt1_id}/cancel')
        self.assertEqual(cancel_res.status_code, 200)

        # Verify status is cancelled
        apts_after = get_appointments_for_patient(user_id)
        apt1 = next(a for a in apts_after if a['id'] == apt1_id)
        self.assertEqual(apt1['status'], 'cancelled')
        apt2 = next(a for a in apts_after if a['id'] == apt2_id)
        self.assertEqual(apt2['status'], 'scheduled')

if __name__ == '__main__':
    unittest.main()
