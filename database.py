"""
SQLite Database Layer for GuardianAngel
Provides persistent storage for users, clinical profiles, pedigree nodes, and privacy delegations.
Includes Reddit-style pseudonymization ("sudo name") for zero-knowledge patient de-identification.
"""
import sqlite3
import os
import json
import hashlib
import random
from config import Config

ADJECTIVES = [
    "Curious", "Silent", "Brave", "Swift", "Calm", "Gentle", "Keen", "Noble",
    "Bright", "Resilient", "Serene", "Stalwart", "Candid", "Amber", "Cedar",
    "Silver", "Golden", "Solar", "Lunar", "Cosmic", "Vibrant", "Wired", "Alert",
    "Subtle", "Quiet", "Mystic", "Daring", "Nimble", "Eager", "Patient", "Radiant"
]

NOUNS = [
    "Falcon", "Cheetah", "Otter", "Heron", "Dolphin", "Sequoia", "Osprey", "Badger",
    "Lynx", "Fox", "Hawk", "Gazelle", "Panda", "Eagle", "Raven", "Stag",
    "Wolf", "Orchid", "Cypress", "Pine", "Breeze", "Voyager", "Sparrow", "Robin",
    "Finch", "Plover", "Phoenix", "Willow", "Horizon", "Nebula", "Badger"
]

def generate_pseudonym(prefix: str = "") -> str:
    """Generates a random Reddit-style alias (e.g., Curious-Falcon-4921)."""
    adj = random.choice(ADJECTIVES)
    noun = random.choice(NOUNS)
    num = random.randint(1000, 9999)
    if prefix:
        return f"{prefix}-{noun}-{num}"
    return f"{adj}-{noun}-{num}"

def get_db_connection():
    os.makedirs(Config.DATA_DIR, exist_ok=True)
    conn = sqlite3.connect(Config.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def hash_password(password: str) -> str:
    """Secure SHA-256 password hash with salt."""
    salt = "guardian_angel_clinical_salt_2026"
    return hashlib.sha256((password + salt).encode('utf-8')).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT DEFAULT 'patient',
        alias_name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. User Profiles Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        dob TEXT,
        blood_type TEXT,
        phone TEXT,
        city TEXT,
        country TEXT,
        kinship_degree TEXT,
        phenotypic_notes TEXT,
        emergency_contact TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    """)

    # 3. Pedigree Nodes Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS pedigree_nodes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        node_key TEXT NOT NULL,
        name TEXT NOT NULL,
        generation TEXT NOT NULL,
        sex TEXT NOT NULL,
        relationship TEXT NOT NULL,
        carrier_status TEXT NOT NULL,
        condition_locus TEXT,
        birth_year TEXT,
        notes TEXT,
        is_proband INTEGER DEFAULT 0,
        alias_name TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    """)

    # 4. Privacy Delegations & Tokens
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS privacy_delegations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        delegatee_name TEXT NOT NULL,
        delegatee_role TEXT NOT NULL,
        scope TEXT NOT NULL,
        token_hash TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    """)

    # 5. Bookings / Clinical Appointments
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        counselor_name TEXT NOT NULL,
        date_time TEXT NOT NULL,
        duration TEXT NOT NULL,
        status TEXT DEFAULT 'Confirmed',
        notes TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    """)

    conn.commit()

    # Migration: Ensure alias_name exists in users & pedigree_nodes
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN alias_name TEXT;")
        conn.commit()
    except sqlite3.OperationalError:
        pass

    try:
        cursor.execute("ALTER TABLE pedigree_nodes ADD COLUMN alias_name TEXT;")
        conn.commit()
    except sqlite3.OperationalError:
        pass

    # Seed Default Admin Account: admin / admin
    admin_hash = hash_password(Config.ADMIN_PASSWORD)
    cursor.execute("SELECT id, alias_name FROM users WHERE username = ?", (Config.ADMIN_USERNAME,))
    admin = cursor.fetchone()
    if not admin:
        admin_alias = "Silent-Falcon-9214"
        cursor.execute("""
        INSERT INTO users (username, password_hash, email, full_name, role, alias_name)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (Config.ADMIN_USERNAME, admin_hash, Config.ADMIN_EMAIL, "Tariq Al-Mansoor (Admin)", "admin", admin_alias))
        admin_id = cursor.lastrowid

        # Seed profile
        cursor.execute("""
        INSERT OR REPLACE INTO user_profiles (user_id, dob, blood_type, phone, city, country, kinship_degree, phenotypic_notes, emergency_contact)
        VALUES (?, '1995-04-12', 'O+', '+966 50 123 4567', 'Jeddah', 'Saudi Arabia', '3rd Degree Consanguinity (F=0.0625)',
                'Heterozygous carrier for Beta-Thalassemia (11p15.4) and G6PD Mediterranean (Xq28).',
                'Fatima Al-Zahra (+966 50 987 6543)')
        """, (admin_id,))

        # Seed Standard 3-Generation Clinical Pedigree Nodes for Tariq
        seed_nodes = [
            # Gen I (Grandparents)
            (admin_id, 'grandpa_p', 'Hamad Al-Mansoor', 'gen1', 'male', 'Paternal Grandfather', 'carrier', 'Carrier (HBB 11p15.4)', '1938', 'Documented mild anemia carrier', 0, 'Elder-Oak-101'),
            (admin_id, 'grandma_p', 'Noura Al-Mansoor', 'gen1', 'female', 'Paternal Grandmother', 'clear', 'Clear / Non-carrier', '1942', 'Tested normal complete blood count', 0, 'Silver-Willow-102'),
            (admin_id, 'farooq', 'Farooq Al-Mansoor', 'gen1', 'male', 'Maternal Grandfather', 'clear', 'Clear / Lineage Origin', '1940', 'Clan elder, verified genealogical records', 0, 'Clan-Hawk-103'),
            (admin_id, 'grandma_m', 'Aisha Al-Mansoor', 'gen1', 'female', 'Maternal Grandmother', 'carrier', 'Carrier (G6PD Xq28)', '1945', 'Asymptomatic carrier of Mediterranean variant', 0, 'Gentle-Orchid-104'),
            
            # Gen II (Parents & Siblings)
            (admin_id, 'walid', 'Walid Al-Mansoor', 'gen2', 'male', 'Father', 'carrier', 'β-Thalassemia Trait', '1963', 'Confirmed Beta-Globin minor carrier', 0, 'Stalwart-Pine-201'),
            (admin_id, 'samira', 'Samira Bint-Omar', 'gen2', 'female', 'Mother', 'carrier', 'G6PD Carrier Verified', '1968', 'First-cousin marriage to Walid', 0, 'Serene-Breeze-202'),
            (admin_id, 'kareem', 'Kareem Al-Mansoor', 'gen2', 'male', 'Maternal Uncle', 'affected', 'G6PD Mediterranean (Class II)', '1966', 'Favism, documented oxidative hemolysis', 0, 'Brave-Cheetah-203'),
            (admin_id, 'fatima_aunt', 'Fatima Al-Mansoor (Aunt)', 'gen2', 'female', 'Maternal Aunt', 'carrier', 'Carrier (G6PD)', '1972', 'Healthy carrier status confirmed', 0, 'Amber-Gazelle-204'),
            
            # Gen III (Proband & Siblings)
            (admin_id, 'tariq', 'Tariq Al-Mansoor', 'gen3', 'male', 'Proband (You)', 'carrier', 'Carrier (HBB & G6PD Heterozygous)', '1995', 'Index patient consulting for pre-marital assessment', 1, admin_alias),
            (admin_id, 'laila', 'Laila Al-Mansoor', 'gen3', 'female', 'Sister', 'unassessed', 'Pending Exome NGS Sync', '1997', 'Awaiting laboratory appointment', 0, 'Swift-Otter-301'),
            (admin_id, 'zayd', 'Zayd Al-Mansoor', 'gen3', 'male', 'Brother', 'unassessed', 'Pre-screen Scheduled', '2001', 'Scheduled for clinical review', 0, 'Alert-Dolphin-302')
        ]

        cursor.executemany("""
        INSERT INTO pedigree_nodes (user_id, node_key, name, generation, sex, relationship, carrier_status, condition_locus, birth_year, notes, is_proband, alias_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, seed_nodes)

        # Seed initial privacy delegation
        cursor.execute("""
        INSERT INTO privacy_delegations (user_id, delegatee_name, delegatee_role, scope, token_hash, status)
        VALUES (?, 'Fatima Al-Zahra', 'Partner Candidate', 'Gen III Pedigree node & Hemoglobinopathy Carrier Status (HbS/HbC)', 'SHA-256-a9f82d1c', 'active'),
               (?, 'Dr. Alisha Patel', 'Genetic Counselor', 'Full 3-Generation Pedigree & Raw VCF Coordinates', 'SHA-256-4c90e38b', 'active')
        """, (admin_id, admin_id))

        cursor.execute("""
        INSERT INTO appointments (user_id, counselor_name, date_time, duration, status, notes)
        VALUES (?, 'Dr. Alisha Patel (FACMG)', 'Thursday • 14:00 (GST)', '45 Mins', 'Confirmed', 'Pre-marital autosomal recessive counseling')
        """, (admin_id,))

        conn.commit()
    else:
        # Ensure existing admin has alias_name
        if not admin['alias_name']:
            cursor.execute("UPDATE users SET alias_name = 'Silent-Falcon-9214' WHERE id = ?", (admin['id'],))
            conn.commit()

    # Seed Default User Account: user / user
    user_hash = hash_password("user")
    cursor.execute("SELECT id, alias_name FROM users WHERE username = 'user'")
    standard_user = cursor.fetchone()
    if not standard_user:
        cursor.execute("""
        INSERT INTO users (username, password_hash, email, full_name, role, alias_name)
        VALUES ('user', ?, 'user@guardianangel.bio', 'Tariq Al-Mansoor', 'patient', 'Silent-Falcon-9214')
        """, (user_hash,))
        u_id = cursor.lastrowid

        cursor.execute("SELECT id FROM users WHERE username = 'admin'")
        adm_row = cursor.fetchone()
        if adm_row:
            cursor.execute("SELECT * FROM user_profiles WHERE user_id = ?", (adm_row['id'],))
            ap = cursor.fetchone()
            if ap:
                cursor.execute("""
                INSERT OR REPLACE INTO user_profiles (user_id, dob, blood_type, phone, city, country, kinship_degree, phenotypic_notes, emergency_contact)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (u_id, ap['dob'], ap['blood_type'], ap['phone'], ap['city'], ap['country'], ap['kinship_degree'], ap['phenotypic_notes'], ap['emergency_contact']))
            
            cursor.execute("SELECT * FROM pedigree_nodes WHERE user_id = ?", (adm_row['id'],))
            for node in cursor.fetchall():
                cursor.execute("""
                INSERT INTO pedigree_nodes (user_id, node_key, name, generation, sex, relationship, carrier_status, condition_locus, birth_year, notes, is_proband, alias_name)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (u_id, node['node_key'], node['name'], node['generation'], node['sex'], node['relationship'], node['carrier_status'], node['condition_locus'], node['birth_year'], node['notes'], node['is_proband'], node['alias_name']))
        conn.commit()

    # Backfill any null alias_name in pedigree_nodes
    cursor.execute("SELECT id FROM pedigree_nodes WHERE alias_name IS NULL OR alias_name = ''")
    for row in cursor.fetchall():
        cursor.execute("UPDATE pedigree_nodes SET alias_name = ? WHERE id = ?", (generate_pseudonym(), row['id']))
    conn.commit()
    
    conn.close()

# Database Helper Functions
def get_user_by_username(username: str):
    conn = get_db_connection()
    user = conn.execute("SELECT * FROM users WHERE username = ? OR email = ?", (username, username)).fetchone()
    conn.close()
    return user

def get_user_by_id(user_id: int):
    conn = get_db_connection()
    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    return user

def create_user(username: str, password: str, email: str, full_name: str, dob: str = '', location: str = '', role: str = 'patient'):
    """
    Creates a new user with profile (including dob & location) and Reddit-style pseudonym.
    New users do not inherit any pre-seeded relatives.
    """
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        pwd_hash = hash_password(password)
        alias_name = generate_pseudonym()
        
        cursor.execute("""
        INSERT INTO users (username, password_hash, email, full_name, role, alias_name)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (username, pwd_hash, email, full_name, role, alias_name))
        user_id = cursor.lastrowid
        
        # Profile for new user with optional dob and location
        cursor.execute("""
        INSERT INTO user_profiles (user_id, dob, blood_type, phone, city, country, kinship_degree, phenotypic_notes, emergency_contact)
        VALUES (?, ?, '', '', ?, '', 'Unassessed', 'No phenotypes or variants recorded yet.', '')
        """, (user_id, dob or '', location or ''))
        
        # Default proband node only (the user themselves)
        birth_year = dob.split('-')[0] if '-' in dob else (dob.split('/')[-1] if '/' in dob else '')
        cursor.execute("""
        INSERT INTO pedigree_nodes (user_id, node_key, name, generation, sex, relationship, carrier_status, condition_locus, birth_year, notes, is_proband, alias_name)
        VALUES (?, 'proband_node', ?, 'gen3', 'male', 'Proband (You)', 'unassessed', 'Unassessed', ?, 'Index patient account', 1, ?)
        """, (user_id, full_name, birth_year, alias_name))
        
        conn.commit()
        return user_id
    except sqlite3.IntegrityError:
        return None
    finally:
        conn.close()

def get_user_profile(user_id: int):
    conn = get_db_connection()
    profile = conn.execute("SELECT u.username, u.email, u.full_name, u.role, u.alias_name, p.* FROM users u LEFT JOIN user_profiles p ON u.id = p.user_id WHERE u.id = ?", (user_id,)).fetchone()
    conn.close()
    return profile

def update_user_profile(user_id: int, data: dict):
    conn = get_db_connection()
    cursor = conn.cursor()
    if 'full_name' in data and data['full_name']:
        cursor.execute("UPDATE users SET full_name = ? WHERE id = ?", (data['full_name'], user_id))
    if 'alias_name' in data and data['alias_name']:
        cursor.execute("UPDATE users SET alias_name = ? WHERE id = ?", (data['alias_name'], user_id))
    
    cursor.execute("""
    UPDATE user_profiles
    SET dob = COALESCE(?, dob),
        blood_type = COALESCE(?, blood_type),
        phone = COALESCE(?, phone),
        city = COALESCE(?, city),
        country = COALESCE(?, country),
        kinship_degree = COALESCE(?, kinship_degree),
        phenotypic_notes = COALESCE(?, phenotypic_notes),
        emergency_contact = COALESCE(?, emergency_contact)
    WHERE user_id = ?
    """, (
        data.get('dob'),
        data.get('blood_type'),
        data.get('phone'),
        data.get('city'),
        data.get('country'),
        data.get('kinship_degree'),
        data.get('phenotypic_notes'),
        data.get('emergency_contact'),
        user_id
    ))
    conn.commit()
    conn.close()

def get_pedigree_nodes(user_id: int):
    conn = get_db_connection()
    nodes = conn.execute("SELECT * FROM pedigree_nodes WHERE user_id = ? ORDER BY generation ASC, id ASC", (user_id,)).fetchall()
    conn.close()
    return [dict(n) for n in nodes]

def add_pedigree_node(user_id: int, data: dict):
    """Adds a family member node and assigns an automatic Reddit-style pseudonym."""
    conn = get_db_connection()
    cursor = conn.cursor()
    node_key = data.get('node_key') or f"node_{os.urandom(4).hex()}"
    alias_name = data.get('alias_name') or generate_pseudonym()
    
    cursor.execute("""
    INSERT INTO pedigree_nodes (user_id, node_key, name, generation, sex, relationship, carrier_status, condition_locus, birth_year, notes, is_proband, alias_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        user_id,
        node_key,
        data.get('name', 'Family Member'),
        data.get('generation', 'gen2'),
        data.get('sex', 'male'),
        data.get('relationship', 'Relative'),
        data.get('carrier_status', 'clear'),
        data.get('condition_locus', 'None documented'),
        data.get('birth_year', ''),
        data.get('notes', ''),
        1 if data.get('is_proband') else 0,
        alias_name
    ))
    node_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return node_id

def update_pedigree_node(node_id: int, user_id: int, data: dict):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE pedigree_nodes
    SET name = COALESCE(?, name),
        generation = COALESCE(?, generation),
        sex = COALESCE(?, sex),
        relationship = COALESCE(?, relationship),
        carrier_status = COALESCE(?, carrier_status),
        condition_locus = COALESCE(?, condition_locus),
        birth_year = COALESCE(?, birth_year),
        notes = COALESCE(?, notes),
        alias_name = COALESCE(?, alias_name)
    WHERE id = ? AND user_id = ?
    """, (
        data.get('name'),
        data.get('generation'),
        data.get('sex'),
        data.get('relationship'),
        data.get('carrier_status'),
        data.get('condition_locus'),
        data.get('birth_year'),
        data.get('notes'),
        data.get('alias_name'),
        node_id,
        user_id
    ))
    conn.commit()
    conn.close()

def delete_pedigree_node(node_id: int, user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM pedigree_nodes WHERE id = ? AND user_id = ? AND is_proband = 0", (node_id, user_id))
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    return affected > 0

def get_privacy_delegations(user_id: int):
    conn = get_db_connection()
    delegations = conn.execute("SELECT * FROM privacy_delegations WHERE user_id = ?", (user_id,)).fetchall()
    conn.close()
    return [dict(d) for d in delegations]

def add_privacy_delegation(user_id: int, data: dict):
    conn = get_db_connection()
    cursor = conn.cursor()
    token_hash = f"SHA-256-{os.urandom(4).hex()}"
    cursor.execute("""
    INSERT INTO privacy_delegations (user_id, delegatee_name, delegatee_role, scope, token_hash, status)
    VALUES (?, ?, ?, ?, ?, 'active')
    """, (
        user_id,
        data.get('delegatee_name'),
        data.get('delegatee_role', 'Clinical Specialist'),
        data.get('scope', 'Standard Pedigree & Carrier Loci'),
        token_hash
    ))
    del_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return del_id
