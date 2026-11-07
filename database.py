"""
SQLite Database Layer for GuardianAngel
Provides persistent storage for users, clinical profiles, pedigree nodes, and privacy delegations.
Includes Reddit-style pseudonymization ("sudo name") for zero-knowledge patient de-identification.
"""
import sqlite3
import os
import json
import hashlib
import hmac
import base64
import random
from werkzeug.security import generate_password_hash, check_password_hash
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

def generate_pseudonym(prefix: str = "", name_initials: str = "") -> str:
    """Generates a random Reddit-style alias (e.g., Curious-Falcon-4921 or Swift-Falcon-Ka-4921)."""
    adj = random.choice(ADJECTIVES)
    noun = random.choice(NOUNS)
    num = random.randint(1000, 9999)
    if name_initials:
        clean_init = name_initials.strip().replace('-', '').replace(' ', '')[:2].lower()
        return f"{adj}-{noun}-{clean_init}-{num}"
    if prefix:
        return f"{prefix}-{noun}-{num}"
    return f"{adj}-{noun}-{num}"

def get_db_connection():
    db_dir = os.path.dirname(os.path.abspath(Config.DATABASE_PATH))
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)
    conn = sqlite3.connect(Config.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def hash_password(password: str) -> str:
    """Generate a secure cryptographic salted hash using Werkzeug (scrypt/PBKDF2)."""
    return generate_password_hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password or not plain_password:
        return False
    # Check modern hashes (scrypt, pbkdf2)
    if hashed_password.startswith(('scrypt:', 'pbkdf2:')):
        return check_password_hash(hashed_password, plain_password)
    # Constant-time comparison fallback for legacy SHA-256 hashes
    legacy_salt = "guardian_angel_clinical_salt_2026"
    legacy_hash = hashlib.sha256((plain_password + legacy_salt).encode('utf-8')).hexdigest()
    if hmac.compare_digest(legacy_hash, hashed_password):
        return True
    alt_salt = "guardian_angel_salt_2026"
    alt_hash = hashlib.sha256((plain_password + alt_salt).encode('utf-8')).hexdigest()
    return hmac.compare_digest(alt_hash, hashed_password)

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
        height TEXT,
        weight TEXT,
        known_traits TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    """)

    # Ensure added columns exist in existing database tables
    try:
        cursor.execute("ALTER TABLE user_profiles ADD COLUMN height TEXT;")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE user_profiles ADD COLUMN weight TEXT;")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE user_profiles ADD COLUMN known_traits TEXT;")
    except Exception:
        pass

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

    # 6. Families Table (Multi-Pedigree Charts Module)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS families (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        family_id TEXT UNIQUE NOT NULL,
        user_id INTEGER NOT NULL,
        name TEXT,
        trait_or_disorder_name TEXT,
        number_of_generations INTEGER DEFAULT 1,
        family_history_description TEXT,
        share_token TEXT UNIQUE NOT NULL,
        share_enabled INTEGER DEFAULT 0,
        share_permission TEXT DEFAULT 'view',
        share_expires_at TEXT,
        show_names_on_shared_link INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    """)

    # 7. Clinical Conditions Table (3 Categories + India Pinned)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS conditions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        category TEXT NOT NULL,
        gene TEXT,
        inheritance TEXT,
        often_not_inherited INTEGER DEFAULT 0,
        is_common_in_india INTEGER DEFAULT 0,
        description TEXT
    );
    """)

    # 8. Condition Tests Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS condition_tests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        condition_id INTEGER NOT NULL,
        test_name TEXT NOT NULL,
        purpose TEXT NOT NULL,
        FOREIGN KEY (condition_id) REFERENCES conditions(id)
    );
    """)

    # 9. Scraped & Masked Premarital / Genetic Reports (Zero raw file storage)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS scraped_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        file_name TEXT,
        panel_name TEXT NOT NULL,
        masked_data TEXT NOT NULL,
        gene_locus TEXT,
        variant TEXT,
        carrier_status TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    """)

    conn.commit()

    # Additive migration: Ensure file_name column exists in scraped_reports
    try:
        cursor.execute("ALTER TABLE scraped_reports ADD COLUMN file_name TEXT;")
        conn.commit()
    except sqlite3.OperationalError:
        pass

    # Migration: Ensure new pedigree columns exist
    pedigree_columns = [
        ("family_id", "TEXT"),
        ("individual_id", "TEXT"),
        ("genotype", "TEXT"),
        ("genetic_test", "TEXT DEFAULT 'Not tested'"),
        ("father_id", "TEXT"),
        ("mother_id", "TEXT"),
        ("partner_id", "TEXT"),
        ("twin_group_id", "TEXT"),
        ("twin_type", "TEXT"),
        ("adoption_status", "TEXT DEFAULT 'none'"),
        ("living_status", "TEXT DEFAULT 'Alive'"),
        ("affected_status", "TEXT DEFAULT 'Unaffected'"),
        ("cause_of_death", "TEXT"),
        ("custom_x", "REAL"),
        ("custom_y", "REAL"),
        ("conditions", "TEXT"),
        ("location", "TEXT"),
    ]
    for col_name, col_def in pedigree_columns:
        try:
            cursor.execute(f"ALTER TABLE pedigree_nodes ADD COLUMN {col_name} {col_def};")
            conn.commit()
        except sqlite3.OperationalError:
            pass


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

    # Migration: Ensure uaepass_uuid column exists in users
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN uaepass_uuid TEXT;")
        conn.commit()
    except sqlite3.OperationalError:
        pass

    try:
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_uaepass_uuid ON users(uaepass_uuid);")
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

    # Seed Clinical Conditions & Tests (3 Categories + India Pinned)
    cursor.execute("SELECT count(*) as cnt FROM conditions")
    row = cursor.fetchone()
    if not row or row[0] == 0:
        seed_conditions_db(cursor)
        conn.commit()

    # Ensure admin has at least one default family record
    cursor.execute("SELECT id FROM users WHERE username = 'admin'")
    admin_row = cursor.fetchone()
    if admin_row:
        cursor.execute("SELECT id FROM families WHERE user_id = ?", (admin_row[0],))
        if not cursor.fetchone():
            cursor.execute("""
            INSERT INTO families (family_id, user_id, name, trait_or_disorder_name, number_of_generations, family_history_description, share_token, share_enabled, share_permission, show_names_on_shared_link)
            VALUES ('F-000123', ?, 'Al-Mansoor Clinical Pedigree', 'Beta Thalassemia & Hereditary Anemia', 3,
                    'Three-generation consanguineous pedigree with autosomal recessive inheritance and twin branch.',
                    '9f82d1c34e70b92a514d88e61204a9f8b4c2e6d19a3b8c7e4d2f01a6e9b8c7d5', 1, 'view', 0)
            """, (admin_row[0],))
            conn.commit()

    conn.close()


# Database Helper Functions
def get_user_by_username(username: str):
    conn = get_db_connection()
    user = conn.execute("SELECT * FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)", (username, username)).fetchone()
    conn.close()
    return user

def get_user_by_id(user_id: int):
    conn = get_db_connection()
    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    return user

def get_user_by_uaepass_uuid(uaepass_uuid: str):
    """Retrieve user record by UAE PASS unique identifier (UUID)."""
    if not uaepass_uuid:
        return None
    conn = get_db_connection()
    user = conn.execute("SELECT * FROM users WHERE uaepass_uuid = ?", (uaepass_uuid,)).fetchone()
    conn.close()
    return user

def link_uaepass_uuid(user_id: int, uaepass_uuid: str):
    """Link an existing user account with their UAE PASS UUID."""
    if not user_id or not uaepass_uuid:
        return False
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET uaepass_uuid = ? WHERE id = ?", (uaepass_uuid, user_id))
    conn.commit()
    conn.close()
    return True

def create_uaepass_user(uaepass_uuid: str, full_name: str, email: str, idn: str = '', dob: str = '', gender: str = '', location: str = 'United Arab Emirates', role: str = 'patient'):
    """
    Creates a new user authenticated via UAE PASS with automated pseudonymization
    and initializes their clinical profile.
    """
    import secrets
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        pwd_hash = hash_password(secrets.token_urlsafe(32))

        # Generate a unique username from email or full_name
        base_username = (email.split('@')[0] if email else full_name.lower().replace(' ', '_'))[:20]
        base_username = "".join(c for c in base_username if c.isalnum() or c in ('_', '-')) or "uaepass_user"
        username = base_username
        counter = 1
        while True:
            existing = cursor.execute("SELECT id FROM users WHERE LOWER(username) = LOWER(?)", (username,)).fetchone()
            if not existing:
                break
            username = f"{base_username}_{counter}"
            counter += 1

        # Use first 2 initials for pseudonym
        parts = [p for p in full_name.replace('-', ' ').split() if p]
        initials = (parts[0][:2] if parts else 'ua')
        alias_name = generate_pseudonym(name_initials=initials)

        cursor.execute("""
        INSERT INTO users (username, password_hash, email, full_name, role, alias_name, uaepass_uuid)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (username, pwd_hash, email or f"{username}@uaepass.verified", full_name, role, alias_name, uaepass_uuid))
        user_id = cursor.lastrowid

        # Profile for new UAE PASS user
        cursor.execute("""
        INSERT INTO user_profiles (user_id, dob, blood_type, phone, city, country, kinship_degree, phenotypic_notes, emergency_contact)
        VALUES (?, ?, '', '', ?, 'United Arab Emirates', 'Unassessed', 'Authenticated via UAE PASS Digital Identity.', ?)
        """, (user_id, dob or '', location or 'United Arab Emirates', f"Emirates ID: {idn}" if idn else ''))

        # Default proband pedigree node
        birth_year = dob.split('-')[0] if '-' in dob else (dob.split('/')[-1] if '/' in dob else '')
        sex_val = 'female' if gender and gender.lower() in ('female', 'f') else 'male'
        cursor.execute("""
        INSERT INTO pedigree_nodes (user_id, node_key, name, generation, sex, relationship, carrier_status, condition_locus, birth_year, notes, is_proband, alias_name, location)
        VALUES (?, 'proband_node', ?, 'gen3', ?, 'Proband (You)', 'unassessed', 'Unassessed', ?, 'UAE PASS Authenticated Patient Account', 1, ?, ?)
        """, (user_id, full_name, sex_val, birth_year, alias_name, location or 'United Arab Emirates'))

        conn.commit()
        return user_id
    except sqlite3.IntegrityError:
        return None
    finally:
        conn.close()

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
    cursor.execute("INSERT OR IGNORE INTO user_profiles (user_id) VALUES (?)", (user_id,))
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
        emergency_contact = COALESCE(?, emergency_contact),
        height = COALESCE(?, height),
        weight = COALESCE(?, weight),
        known_traits = COALESCE(?, known_traits)
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
        data.get('height'),
        data.get('weight'),
        data.get('known_traits'),
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
    """Adds a family member node and assigns an automatic Reddit-style pseudonym (sudo-name)."""
    conn = get_db_connection()
    cursor = conn.cursor()
    node_key = data.get('node_key') or f"node_{os.urandom(4).hex()}"
    
    # Requirement: All added family members must have auto-generated sudo-name (pseudonym)
    provided_alias = data.get('alias_name') or data.get('pseudonym')
    if provided_alias and provided_alias not in ['Relative', 'Family Member', 'Proband', 'self'] and '-' in provided_alias:
        alias_name = provided_alias
    else:
        alias_name = generate_pseudonym()

    family_id = data.get('family_id')
    name = data.get('full_name') or data.get('name') or alias_name
    rel = data.get('relationship_to_proband') or data.get('relationship') or 'relative'

    conditions = data.get('conditions')
    if isinstance(conditions, list):
        condition_locus = ", ".join(conditions) if len(conditions) > 0 else 'None documented'
    else:
        condition_locus = conditions or 'None documented'

    carrier_status = data.get('carrier_details') or data.get('carrier_status') or ('Carrier' if data.get('is_carrier') else 'clear')
    birth_year = data.get('dob') or data.get('birth_year') or ''
    is_proband = 1 if data.get('is_proband') else 0
    notes = data.get('medical_history') or data.get('notes', '')

    father_id = str(data.get('father_id')) if data.get('father_id') is not None else None
    mother_id = str(data.get('mother_id')) if data.get('mother_id') is not None else None
    partner_id = str(data.get('partner_id') or (data.get('spouse_ids', [None])[0] if data.get('spouse_ids') else None)) if (data.get('partner_id') or data.get('spouse_ids')) else None
    twin_group_id = data.get('twin_group_id')
    twin_type = 'identical' if data.get('is_identical_twin') else data.get('twin_type')
    adoption_status = data.get('adoption_status', 'none')
    living_status = data.get('living_status') or ('Deceased' if data.get('is_deceased') else 'Alive')
    affected_status = 'Affected' if data.get('is_affected') else ('Carrier' if data.get('is_carrier') else 'Unaffected')
    cause_of_death = data.get('cause_of_death')
    custom_x = data.get('custom_x')
    custom_y = data.get('custom_y')
    raw_conditions = json.dumps(conditions) if isinstance(conditions, list) else str(conditions or '')
    location = data.get('location', '')
    
    cursor.execute("""
    INSERT INTO pedigree_nodes (
        user_id, node_key, name, generation, sex, relationship, carrier_status,
        condition_locus, birth_year, notes, is_proband, alias_name, family_id,
        father_id, mother_id, partner_id, twin_group_id, twin_type, adoption_status,
        living_status, affected_status, cause_of_death, custom_x, custom_y, conditions, location
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        user_id, node_key, name, data.get('generation', 'gen2'), data.get('sex', 'male'),
        rel, carrier_status, condition_locus, birth_year, notes, is_proband, alias_name,
        family_id, father_id, mother_id, partner_id, twin_group_id, twin_type,
        adoption_status, living_status, affected_status, cause_of_death, custom_x, custom_y, raw_conditions, location
    ))
    node_id = cursor.lastrowid
    
    if family_id:
        cursor.execute("UPDATE families SET updated_at = CURRENT_TIMESTAMP WHERE family_id = ?", (family_id,))
    
    conn.commit()
    conn.close()
    return node_id

def update_pedigree_node(node_id: int, user_id: int, data: dict):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Conditions format
    conds = data.get('conditions')
    condition_locus = None
    raw_conditions = None
    if conds is not None:
        if isinstance(conds, list):
            condition_locus = ", ".join(conds) if len(conds) > 0 else 'None documented'
            raw_conditions = json.dumps(conds)
        else:
            condition_locus = str(conds)
            raw_conditions = str(conds)

    living_status = data.get('living_status')
    if not living_status and 'is_deceased' in data:
        living_status = 'Deceased' if data['is_deceased'] else 'Alive'

    carrier_status = data.get('carrier_details') or data.get('carrier_status')
    if not carrier_status and 'is_carrier' in data:
        carrier_status = 'Carrier' if data['is_carrier'] else 'clear'

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
        alias_name = COALESCE(?, alias_name),
        father_id = COALESCE(?, father_id),
        mother_id = COALESCE(?, mother_id),
        partner_id = COALESCE(?, partner_id),
        living_status = COALESCE(?, living_status),
        cause_of_death = COALESCE(?, cause_of_death),
        custom_x = COALESCE(?, custom_x),
        custom_y = COALESCE(?, custom_y),
        conditions = COALESCE(?, conditions),
        location = COALESCE(?, location)
    WHERE id = ? AND user_id = ?
    """, (
        data.get('name') or data.get('full_name'),
        data.get('generation'),
        data.get('sex'),
        data.get('relationship') or data.get('relationship_to_proband'),
        carrier_status,
        condition_locus,
        data.get('birth_year') or data.get('dob'),
        data.get('notes') or data.get('medical_history'),
        data.get('alias_name') or data.get('pseudonym'),
        str(data.get('father_id')) if data.get('father_id') is not None else None,
        str(data.get('mother_id')) if data.get('mother_id') is not None else None,
        str(data.get('partner_id')) if data.get('partner_id') is not None else None,
        living_status,
        data.get('cause_of_death'),
        data.get('custom_x'),
        data.get('custom_y'),
        raw_conditions,
        data.get('location'),
        node_id,
        user_id
    ))
    
    # Touch updated_at for family
    row = cursor.execute("SELECT family_id FROM pedigree_nodes WHERE id = ?", (node_id,)).fetchone()
    if row and row['family_id']:
        cursor.execute("UPDATE families SET updated_at = CURRENT_TIMESTAMP WHERE family_id = ?", (row['family_id'],))
        
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

# ==================== MULTI-FAMILY & ADVANCED PEDIGREE CHART MODULE ====================

def seed_conditions_db(cursor):
    """Seed the 3 Clinical Categories + India Pinned Conditions."""
    conditions_data = [
        # Category 1: Fertility-related
        ("Fragile X-associated primary ovarian insufficiency (FMR1 premutation)", "Fertility-associated", "FMR1", "X-linked", 0, 0, "Premutation (55-200 CGG repeats) associated with elevated FSH and early ovarian cessation.", [("FMR1 Repeat Analysis", "Quantify CGG triplet repeats for carrier premutation status")]),
        ("Kallmann syndrome (ANOS1 and others)", "Fertility-associated", "ANOS1", "X-linked / AD / AR", 0, 0, "Hypogonadotropic hypogonadism with anosmia or hyposmia.", [("Targeted Gene Panel", "Sequence ANOS1, FGFR1, PROKR2")]),
        ("CFTR-related infertility / CBAVD", "Fertility-associated", "CFTR", "Autosomal recessive", 0, 1, "Congenital bilateral absence of vas deferens presenting with azoospermia.", [("CFTR Full Gene Sequencing", "Detect 5T allele and pathogenic variants")]),
        ("Y-chromosome microdeletions (AZF)", "Fertility-associated", "AZF (Yq11)", "Y-linked", 1, 0, "Deletions in AZFa, AZFb, or AZFc regions leading to non-obstructive azoospermia or severe oligospermia.", [("Y-Chromosome Microdeletion PCR", "Evaluate AZFa, AZFb, AZFc STS markers")]),
        ("Androgen insensitivity syndrome (AR)", "Fertility-associated", "AR", "X-linked recessive", 0, 0, "End-organ unresponsiveness to androgens in 46,XY individuals.", [("AR Gene Sequencing", "Detect androgen receptor coding mutations")]),
        ("Congenital adrenal hyperplasia (CYP21A2)", "Fertility-associated", "CYP21A2", "Autosomal recessive", 0, 1, "21-hydroxylase deficiency affecting steroidogenesis, fertility, and virilization.", [("CYP21A2 MLPA & Sequencing", "Detect gene conversions and deletions")]),
        ("Turner syndrome", "Fertility-associated", "Monosomy X (45,X)", "Chromosomal / Non-inherited", 1, 0, "45,X or mosaicism leading to ovarian dysgenesis and primary amenorrhea.", [("High-Resolution Karyotype", "Rule out 45,X/46,XX mosaicism")]),
        ("Klinefelter syndrome (47,XXY)", "Fertility-associated", "47,XXY", "Chromosomal / Non-inherited", 1, 0, "Supernumerary X chromosome in males causing hypergonadotropic hypogonadism.", [("Peripheral Blood Karyotyping", "Confirm 47,XXY constitution")]),

        # Category 2: Inherited disorders affecting offspring (India Pinned at Top)
        ("Beta thalassemia (HBB)", "Inherited disorders affecting offspring", "HBB", "Autosomal recessive", 0, 1, "Severe microcytic hemolytic anemia requiring chronic transfusions in homozygous state.", [("Hemoglobin HPLC & HBB Sequencing", "Quantify HbA2 (>3.5%) and detect beta-globin mutations")]),
        ("Alpha thalassemia (HBA1, HBA2)", "Inherited disorders affecting offspring", "HBA1, HBA2", "Autosomal recessive", 0, 1, "Deletional and non-deletional mutations causing HbH disease or Hydrops Fetalis.", [("Alpha-Globin StripAssay / MLPA", "Detect common 3.7kb and 4.2kb deletions")]),
        ("Sickle cell disease (HBB)", "Inherited disorders affecting offspring", "HBB (HbS)", "Autosomal recessive", 0, 1, "Glu6Val mutation causing sickle-shaped erythrocyte vaso-occlusive crises.", [("Sickle Solubility & HPLC", "Identify HbS fraction and compound heterozygosity")]),
        ("Cystic fibrosis (CFTR)", "Inherited disorders affecting offspring", "CFTR", "Autosomal recessive", 0, 1, "Multisystem exocrine dysfunction impacting pulmonary, pancreatic, and reproductive tracts.", [("CFTR Comprehensive NGS", "Screen deltaF508 and population-specific CFTR alleles")]),
        ("Spinal muscular atrophy (SMN1)", "Inherited disorders affecting offspring", "SMN1", "Autosomal recessive", 0, 1, "Anterior horn cell degeneration leading to progressive proximal muscular atrophy.", [("SMN1/SMN2 Copy Number MLPA", "Assess homozygous deletion of SMN1 exon 7")]),
        ("Tay-Sachs disease (HEXA)", "Inherited disorders affecting offspring", "HEXA", "Autosomal recessive", 0, 0, "Lysosomal storage disease causing neurodegeneration with cherry-red macular spot.", [("Hexosaminidase A Assay & HEXA NGS", "Quantify enzyme activity and pathogenic variants")]),
        ("Phenylketonuria (PAH)", "Inherited disorders affecting offspring", "PAH", "Autosomal recessive", 0, 0, "Phenylalanine hydroxylase deficiency causing hyperphenylalaninemia and cognitive impairment.", [("Plasma Amino Acid Profile & PAH Sequencing", "Determine Phe/Tyr ratio and identify mutations")]),
        ("Duchenne muscular dystrophy (DMD)", "Inherited disorders affecting offspring", "DMD", "X-linked recessive", 0, 1, "Severe progressive muscular dystrophy presenting in early childhood.", [("DMD MLPA & Exon Sequencing", "Detect large deletions/duplications in DMD gene")]),
        ("Hemophilia A / B (F8, F9)", "Inherited disorders affecting offspring", "F8, F9", "X-linked recessive", 0, 1, "Coagulation factor VIII/IX deficiency with bleeding diathesis into joints and tissues.", [("Factor VIII/IX Activity & Inversion PCR", "Detect Intron 22 and Intron 1 inversions")]),
        ("Huntington disease (HTT)", "Inherited disorders affecting offspring", "HTT", "Autosomal dominant", 0, 0, "Trinucleotide CAG repeat expansion causing chorea and progressive cognitive decline.", [("HTT Triplet Repeat PCR", "Quantify CAG repeat size")]),
        ("Hereditary breast and ovarian cancer (BRCA1, BRCA2)", "Inherited disorders affecting offspring", "BRCA1, BRCA2", "Autosomal dominant", 0, 1, "High penetrance predisposition for mammary, ovarian, and prostate carcinomas.", [("BRCA1/2 NGS Comprehensive Panel", "Identify truncating and missense variants")]),
        ("Lynch syndrome (MLH1, MSH2, MSH6, PMS2)", "Inherited disorders affecting offspring", "MLH1, MSH2, MSH6, PMS2", "Autosomal dominant", 0, 0, "DNA mismatch repair deficiency predisposing to colorectal and endometrial cancers.", [("MSI Analysis & MMR NGS Panel", "Detect microsatellite instability and germline MMR mutations")]),

        # Category 3: Pregnancy loss & chromosome conditions
        ("Robertsonian translocation (der(13;14), der(14;21))", "Pregnancy loss & chromosome conditions", "Whole arm acrocentric", "Chromosomal / Parental", 0, 0, "Centric fusion of acrocentric chromosomes predisposing to unbalanced gametes and miscarriage.", [("Parental High-Resolution Karyotyping", "Identify balanced carrier state in couples")]),
        ("Reciprocal balanced chromosomal translocation", "Pregnancy loss & chromosome conditions", "Reciprocal segments", "Chromosomal / Parental", 0, 0, "Exchange of material between non-homologous chromosomes with 50%+ risk of unbalanced gametes.", [("Couple Karyotyping & Chromosomal Microarray (CMA)", "Delineate breakpoints and segmental imbalances")]),
        ("Chromosomal inversion (e.g., inv(9))", "Pregnancy loss & chromosome conditions", "Pericentric / Paracentric", "Chromosomal", 0, 0, "Segmental chromosomal rotation, sometimes polymorphic or associated with recombinant gametes.", [("Cytogenetic Karyotype Analysis", "Distinguish benign heteromorphism from pathogenic inversion")]),
        ("Recurrent aneuploidy risk", "Pregnancy loss & chromosome conditions", "Maternal age / Meiotic", "Non-inherited", 1, 0, "Meiotic nondisjunction risks correlated with maternal age or parental gonadal mosaicism.", [("PGT-A / Miscarriage Product Microarray (POC)", "Analyze karyotype of pregnancy loss tissue")]),
        ("Antiphospholipid-associated recurrent loss", "Pregnancy loss & chromosome conditions", "Multifactorial / Autoimmune", "Complex", 1, 0, "Thrombotic microangiopathy in placental vasculature causing repeated fetal demise.", [("Lupus Anticoagulant & Anti-Cardiolipin Panel", "Test anticardiolipin antibodies and anti-beta2-GPI")]),
        ("Not sure / Other", "Pregnancy loss & chromosome conditions", "Unspecified / Multifactorial", "Unknown", 0, 0, "Hereditary or idiopathic factors not covered in standard panels.", [("Clinical Genetics Consultation", "Comprehensive clinical exome evaluation")])
    ]

    for name, cat, gene, inh, often_not, is_india, desc, tests in conditions_data:
        cursor.execute("""
        INSERT OR IGNORE INTO conditions (name, category, gene, inheritance, often_not_inherited, is_common_in_india, description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (name, cat, gene, inh, often_not, is_india, desc))
        cond_id = cursor.lastrowid
        if not cond_id:
            row = cursor.execute("SELECT id FROM conditions WHERE name = ?", (name,)).fetchone()
            if row:
                cond_id = row[0]
        if cond_id:
            for t_name, t_purp in tests:
                cursor.execute("""
                INSERT OR IGNORE INTO condition_tests (condition_id, test_name, purpose)
                VALUES (?, ?, ?)
                """, (cond_id, t_name, t_purp))

def get_next_family_id():
    """Generates sequential unique Family Pedigree Chart ID as FA-000001, FA-000002 without collision."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT family_id FROM families")
    rows = cursor.fetchall()
    highest_num = 0
    for r in rows:
        fid = str(r[0]) if r[0] else ''
        if fid.startswith('FA-'):
            try:
                num = int(fid[3:])
                if num > highest_num:
                    highest_num = num
            except (ValueError, TypeError):
                continue
    conn.close()
    return f"FA-{highest_num + 1:06d}"

def create_family(user_id: int, data: dict):
    conn = get_db_connection()
    cursor = conn.cursor()
    import secrets
    
    # Requirement: Generate Family Pedigree Chart ID as FA-000001, FA-000002 and no two trees can have similar ID
    requested_id = data.get('family_id')
    if requested_id and requested_id.startswith('FA-'):
        existing = cursor.execute("SELECT id FROM families WHERE family_id = ?", (requested_id,)).fetchone()
        if existing:
            family_id = get_next_family_id()
        else:
            family_id = requested_id
    else:
        family_id = get_next_family_id()

    share_token = secrets.token_hex(32)
    name = data.get('family_name') or data.get('name') or f"Family {family_id}"
    
    trait = data.get('trait_or_disorder_name', '')
    if not trait and data.get('health_conditions_of_interest'):
        h = data.get('health_conditions_of_interest')
        trait = ", ".join(h) if isinstance(h, list) else str(h)

    desc = data.get('family_history_description', '')
    share_enabled = 1 if data.get('share_enabled') else 0

    cursor.execute("""
    INSERT INTO families (family_id, user_id, name, trait_or_disorder_name, number_of_generations, family_history_description, share_token, share_enabled)
    VALUES (?, ?, ?, ?, 1, ?, ?, ?)
    """, (family_id, user_id, name, trait, desc, share_token, share_enabled))
    conn.commit()
    conn.close()
    return {
        "family_id": family_id,
        "name": name,
        "family_name": name,
        "trait_or_disorder_name": trait,
        "share_token": share_token,
        "share_enabled": share_enabled,
        "created_at": "Just now"
    }

def get_user_families(user_id: int):
    conn = get_db_connection()
    rows = conn.execute("""
    SELECT f.*,
           (SELECT COUNT(*) FROM pedigree_nodes WHERE family_id = f.family_id) as member_count,
           (SELECT name FROM pedigree_nodes WHERE family_id = f.family_id AND is_proband = 1 LIMIT 1) as proband_name
    FROM families f
    WHERE f.user_id = ?
    ORDER BY f.created_at DESC
    """, (user_id,)).fetchall()
    conn.close()
    families = []
    for r in rows:
        d = dict(r)
        d['family_name'] = d.get('name') or f"Family {d.get('family_id')}"
        if not d.get('proband_name'):
            d['proband_name'] = 'Proband (Unassigned)'
        families.append(d)
    return families

def get_family_by_id(family_id: str):
    conn = get_db_connection()
    f = conn.execute("SELECT * FROM families WHERE family_id = ?", (family_id,)).fetchone()
    if not f:
        conn.close()
        return None
    fam = dict(f)
    fam['family_name'] = fam.get('name') or f"Family {fam.get('family_id')}"
    nodes = conn.execute("SELECT * FROM pedigree_nodes WHERE family_id = ? ORDER BY generation, id ASC", (family_id,)).fetchall()
    members = []
    for n in nodes:
        d = dict(n)
        # Ensure every member has a sudo-name (alias_name)
        if not d.get('alias_name'):
            d['alias_name'] = generate_pseudonym()
            conn.execute("UPDATE pedigree_nodes SET alias_name = ? WHERE id = ?", (d['alias_name'], d['id']))
            conn.commit()

        d['pseudonym'] = d.get('alias_name') or d.get('name') or 'Relative'
        d['full_name'] = d.get('name') or d.get('alias_name') or ''
        d['relationship_to_proband'] = d.get('relationship') or 'relative'

        # Parse conditions
        cond_str = d.get('condition_locus') or ''
        cond_list = []
        if d.get('conditions'):
            try:
                cond_list = json.loads(d['conditions'])
            except Exception:
                cond_list = [c.strip() for c in d['conditions'].split(',') if c.strip()]
        if not cond_list and cond_str:
            cond_list = [c.strip() for c in cond_str.split(',') if c.strip() and c.strip().lower() != 'none documented']

        d['conditions'] = cond_list
        d['is_affected'] = len(cond_list) > 0 or d.get('affected_status') == 'Affected'
        d['is_carrier'] = str(d.get('carrier_status', '')).lower() in ['carrier', 'positive']
        d['is_proband'] = bool(d.get('is_proband'))
        d['is_deceased'] = d.get('living_status') == 'Deceased'
        d['dob'] = d.get('birth_year') or ''
        d['location'] = d.get('location') or ''
        d['father_id'] = d.get('father_id')
        d['mother_id'] = d.get('mother_id')
        d['spouse_ids'] = [d['partner_id']] if d.get('partner_id') else []
        d['twin_group_id'] = d.get('twin_group_id')
        d['is_identical_twin'] = d.get('twin_type') == 'identical'
        members.append(d)
    fam['members'] = members
    conn.close()
    return fam

def get_family_by_share_token(token: str):
    conn = get_db_connection()
    f = conn.execute("SELECT * FROM families WHERE share_token = ?", (token,)).fetchone()
    if not f:
        conn.close()
        return None
    fam = dict(f)
    if not fam.get('share_enabled'):
        conn.close()
        return None
    conn.close()
    return get_family_by_id(fam['family_id'])

def delete_family(family_id: str, user_id: int):
    """
    Deletes a family chart while keeping newly created members intact in pedigree_nodes
    so that the user can create another tree and add them later.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    fam = cursor.execute("SELECT * FROM families WHERE family_id = ?", (family_id,)).fetchone()
    if not fam:
        conn.close()
        return False, "Family chart not found"

    fam_dict = dict(fam)
    user = cursor.execute("SELECT username FROM users WHERE id = ?", (user_id,)).fetchone()
    is_admin = user and dict(user).get('username', '').lower() == 'admin'
    if fam_dict.get('user_id') and fam_dict['user_id'] != user_id and not is_admin:
        conn.close()
        return False, "Access denied"

    # CRITICAL: Keep newly created members intact as user can create another tree and add them later.
    # Unlink members from this deleted family by resetting family_id to NULL.
    cursor.execute("UPDATE pedigree_nodes SET family_id = NULL WHERE family_id = ?", (family_id,))

    # Delete family record
    cursor.execute("DELETE FROM families WHERE family_id = ?", (family_id,))
    conn.commit()
    conn.close()
    return True, "Family chart deleted successfully"

def update_family_share(family_id: str, enabled: bool):
    conn = get_db_connection()
    conn.execute("UPDATE families SET share_enabled = ? WHERE family_id = ?", (1 if enabled else 0, family_id))
    conn.commit()
    conn.close()

def regenerate_family_token(family_id: str):
    import secrets
    new_token = secrets.token_hex(32)
    conn = get_db_connection()
    conn.execute("UPDATE families SET share_token = ? WHERE family_id = ?", (new_token, family_id))
    conn.commit()
    conn.close()
    return new_token

def update_node_position(node_id: int, custom_x: float, custom_y: float):
    conn = get_db_connection()
    conn.execute("UPDATE pedigree_nodes SET custom_x = ?, custom_y = ? WHERE id = ?", (custom_x, custom_y, node_id))
    conn.commit()
    conn.close()

def get_conditions_catalog():
    conn = get_db_connection()
    conn.execute("UPDATE conditions SET category = 'Fertility-associated' WHERE category = 'fertility'")
    conn.execute("UPDATE conditions SET category = 'Inherited disorders affecting offspring' WHERE category = 'inherited'")
    conn.execute("UPDATE conditions SET category = 'Pregnancy loss & chromosome conditions' WHERE category = 'chromosomal'")
    conn.commit()
    rows = conn.execute("SELECT * FROM conditions ORDER BY category, is_common_in_india DESC, name ASC").fetchall()
    conditions = []
    for r in rows:
        c = dict(r)
        tests = conn.execute("SELECT test_name, purpose FROM condition_tests WHERE condition_id = ?", (c['id'],)).fetchall()
        c['suggested_tests'] = [dict(t) for t in tests]
        conditions.append(c)
    conn.close()
    return conditions

def encrypt_payload(data: dict, secret: str = None) -> str:
    """Encrypts payload dictionary before storing in database for AI analysis."""
    if not secret:
        secret = Config.SECRET_KEY or "guardian_angel_vault_master_key_2026"
    try:
        from cryptography.fernet import Fernet
        k = base64.urlsafe_b64encode(hashlib.sha256(secret.encode()).digest())
        return 'fernet:' + Fernet(k).encrypt(json.dumps(data).encode()).decode()
    except ImportError:
        raw = json.dumps(data).encode('utf-8')
        salt = os.urandom(16)
        key = hashlib.pbkdf2_hmac('sha256', secret.encode(), salt, 100000, 32)
        keystream = bytearray()
        block_num = 0
        while len(keystream) < len(raw):
            keystream.extend(hmac.new(key, block_num.to_bytes(4, 'big'), hashlib.sha256).digest())
            block_num += 1
        ciphertext = bytes(a ^ b for a, b in zip(raw, keystream[:len(raw)]))
        tag = hmac.new(key, ciphertext, hashlib.sha256).digest()
        payload = salt + tag + ciphertext
        return 'std:' + base64.b64encode(payload).decode('ascii')

def decrypt_payload(enc_str: str, secret: str = None) -> dict:
    """Decrypts payload dictionary stored in database."""
    if not secret:
        secret = Config.SECRET_KEY or "guardian_angel_vault_master_key_2026"
    try:
        if enc_str.startswith('fernet:'):
            from cryptography.fernet import Fernet
            k = base64.urlsafe_b64encode(hashlib.sha256(secret.encode()).digest())
            return json.loads(Fernet(k).decrypt(enc_str[7:].encode()).decode())
        elif enc_str.startswith('std:'):
            raw_b = base64.b64decode(enc_str[4:].encode('ascii'))
            salt, tag, ciphertext = raw_b[:16], raw_b[16:48], raw_b[48:]
            key = hashlib.pbkdf2_hmac('sha256', secret.encode(), salt, 100000, 32)
            expected_tag = hmac.new(key, ciphertext, hashlib.sha256).digest()
            if not hmac.compare_digest(tag, expected_tag):
                raise ValueError('Invalid MAC')
            keystream = bytearray()
            block_num = 0
            while len(keystream) < len(ciphertext):
                keystream.extend(hmac.new(key, block_num.to_bytes(4, 'big'), hashlib.sha256).digest())
                block_num += 1
            plaintext = bytes(a ^ b for a, b in zip(ciphertext, keystream[:len(ciphertext)]))
            return json.loads(plaintext.decode('utf-8'))
        return json.loads(enc_str)
    except Exception:
        try:
            return json.loads(enc_str)
        except Exception:
            return {}

def save_scraped_report(user_id: int, file_name: str, panel_name: str, masked_data: dict, gene_locus: str = "", variant: str = "", carrier_status: str = ""):
    conn = get_db_connection()
    cursor = conn.cursor()
    # Encrypt the masked data payload before saving to database for secure AI analysis
    encrypted_payload = encrypt_payload(masked_data)
    cursor.execute("""
    INSERT INTO scraped_reports (user_id, file_name, panel_name, masked_data, gene_locus, variant, carrier_status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (user_id, file_name, panel_name, encrypted_payload, gene_locus, variant, carrier_status))
    report_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return report_id

def get_user_scraped_reports(user_id: int):
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM scraped_reports WHERE user_id = ? ORDER BY created_at DESC, id DESC", (user_id,)).fetchall()
    reports = []
    for r in rows:
        d = dict(r)
        d['masked_data'] = decrypt_payload(d['masked_data'])
        reports.append(d)
    conn.close()
    return reports


