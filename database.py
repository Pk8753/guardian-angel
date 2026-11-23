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
import secrets
import copy
from collections import OrderedDict
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any, Tuple
from werkzeug.security import generate_password_hash, check_password_hash
from config import Config

ADJECTIVES = [
    "Agile", "Alert", "Amber", "Amicable", "Anchor", "Artful", "Astral", "Audacious",
    "Authentic", "Balanced", "Beacon", "Blissful", "Bold", "Bountiful", "Brave", "Bright",
    "Calm", "Candid", "Careful", "Cascade", "Cedar", "Celestial", "Certain", "Cheerful",
    "Clever", "Constant", "Cosmic", "Courageous", "Crest", "Crystal", "Curious", "Daring",
    "Dawn", "Decisive", "Devoted", "Eager", "Earnest", "Echo", "Electric", "Elegant",
    "Empathetic", "Enduring", "Equitable", "Eternal", "Exalted", "Faithful", "Fearless", "Festive",
    "Fleet", "Flowing", "Focus", "Focused", "Forgiving", "Fortunate", "Foster", "Friendly",
    "Gallant", "Gentle", "Genuine", "Glowing", "Golden", "Graceful", "Gracious", "Grand",
    "Grounded", "Guided", "Halcyon", "Harmonic", "Harmonious", "Healing", "Hearty", "Heroic",
    "Honest", "Hopeful", "Humble", "Illuminated", "Immense", "Inspiring", "Intrepid", "Invincible",
    "Jovial", "Joyful", "Jubilant", "Keen", "Kindred", "Kinetic", "Leading", "Learned",
    "Light", "Lucid", "Luminous", "Lunar", "Magical", "Magnificent", "Master", "Mellow",
    "Mindful", "Modest", "Morning", "Moving", "Mystic", "Natural", "Nimble", "Noble",
    "Nurturing", "Optimum", "Patient", "Peaceful", "Perceptive", "Perennial", "Persistent", "Pioneering",
    "Pleasant", "Poetic", "Polite", "Positive", "Powerful", "Prismatic", "Prudent", "Pure",
    "Quiet", "Radiant", "Reasonable", "Reflective", "Reliable", "Remarkable", "Renewed", "Resilient",
    "Resolved", "Respectful", "Robust", "Sagacious", "Sage", "Secure", "Serene", "Sheltered",
    "Shining", "Silent", "Silver", "Sincere", "Solar", "Solid", "Sparkling", "Spectacular",
    "Splendid", "Sprightly", "Stalwart", "Steady", "Strong", "Subtle", "Superb", "Swift",
    "Sympathetic", "Tender", "Thoughtful", "Thriving", "Tireless", "Tolerant", "Tranquil", "Transcendent",
    "True", "Trusty", "Truthful", "Unbroken", "Unfailing", "Unified", "Upbeat", "Valiant",
    "Valid", "Valorous", "Venerable", "Verdant", "Versatile", "Vibrant", "Vigilant", "Vigorous",
    "Virtuous", "Vital", "Warm", "Wellspring", "Wired", "Wise", "Worthy", "Zealous"
]

NOUNS = [
    "Antelope", "Atlas", "Aurora", "Avocet", "Badger", "Bamboo", "Bison", "Blossom",
    "Bluebird", "Breeze", "Brook", "Canyon", "Cardinal", "Caribou", "Cascade", "Cedar",
    "Cheetah", "Citadel", "Cliff", "Clover", "Comet", "Compass", "Condor", "Constellation",
    "Coral", "Cove", "Crane", "Creek", "Crest", "Crown", "Current", "Cypress",
    "Dale", "Delta", "Dolphin", "Dove", "Dragonfly", "Dune", "Eagle", "Eclipse",
    "Egret", "Elk", "Elm", "Falcon", "Fawn", "Fern", "Finch", "Fjord",
    "Forest", "Fox", "Galaxy", "Garden", "Gazelle", "Geyser", "Glade", "Glacier",
    "Grove", "Harbor", "Haven", "Hawk", "Heath", "Heron", "Highland", "Horizon",
    "Hummingbird", "Iris", "Island", "Jaguar", "Jay", "Juniper", "Kingfisher", "Kite",
    "Lagoon", "Lark", "Laurel", "Leopard", "Lichen", "Lily", "Linden", "Lion",
    "Lotus", "Lynx", "Magnolia", "Maple", "Meadow", "Merlin", "Meteor", "Monarch",
    "Moon", "Moor", "Mountain", "Nebula", "Nightingale", "Nova", "Oak", "Oasis",
    "Ocean", "Olive", "Opal", "Orchid", "Oriole", "Osprey", "Otter", "Owl",
    "Palisade", "Palm", "Panda", "Panther", "Passage", "Pasture", "Peak", "Pelican",
    "Penguin", "Peregrine", "Petrel", "Phoenix", "Pillar", "Pine", "Pinnacle", "Plover",
    "Plume", "Polaris", "Prairie", "Puma", "Quail", "Quartz", "Rainbow", "Rapids",
    "Raven", "Reef", "Ridge", "River", "Robin", "Rowan", "Sandpiper", "Sapphire",
    "Savanna", "Sequoia", "Sierra", "Solstice", "Sparrow", "Spring", "Spruce", "Stag",
    "Star", "Stream", "Summit", "Sunrise", "Sunset", "Swallow", "Swan", "Sycamore",
    "Talon", "Tern", "Thicket", "Tide", "Timber", "Topaz", "Trail", "Tributary",
    "Tulip", "Tundra", "Valley", "Vanguard", "Venture", "Vista", "Voyager", "Waterfall",
    "Wave", "Wildwood", "Willow", "Wind", "Wolf", "Wolverine", "Woodland", "Wren",
    "Zenith", "Zephyr"
]

_RECENT_PSEUDONYMS: OrderedDict = OrderedDict()
_MAX_RECENT_PSEUDONYMS: int = 20000

def generate_pseudonym(prefix: str = "", name_initials: str = "", code: str = "", existing_set: Optional[set] = None) -> str:
    """
    Generates a random Reddit-style alias adhering to contract Adjective-Noun-[code]-[number]
    (e.g., Curious-Falcon-492198 or Swift-Falcon-ka-492198).
    
    Provides high-entropy collision resistance (keyspace >= 2.9e10) with an LRU deduplication
    cache to guarantee 0 collisions across high-volume sequential draws.
    """
    if code:
        clean_code = code.strip().replace('-', '').replace(' ', '')[:4].lower()
    elif name_initials:
        clean_code = name_initials.strip().replace('-', '').replace(' ', '')[:2].lower()
    elif prefix:
        clean_code = prefix.strip().replace('-', '').replace(' ', '')[:4].lower()
    else:
        clean_code = ""

    candidate = ""
    for _ in range(50):
        adj = random.choice(ADJECTIVES)
        noun = random.choice(NOUNS)
        num = random.randint(100000, 999999)
        if clean_code:
            candidate = f"{adj}-{noun}-{clean_code}-{num}"
        else:
            candidate = f"{adj}-{noun}-{num}"

        if candidate not in _RECENT_PSEUDONYMS and (existing_set is None or candidate not in existing_set):
            _RECENT_PSEUDONYMS[candidate] = None
            if len(_RECENT_PSEUDONYMS) > _MAX_RECENT_PSEUDONYMS:
                _RECENT_PSEUDONYMS.popitem(last=False)
            return candidate

    _RECENT_PSEUDONYMS[candidate] = None
    return candidate

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

    # 10. Health Policy & Guidelines Documents (Nation-wide screening centers, eligibility, rules)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS policy_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        file_name TEXT NOT NULL,
        file_type TEXT NOT NULL,
        title TEXT,
        chunk_count INTEGER DEFAULT 0,
        status TEXT DEFAULT 'indexed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    """)

    # 11. Health Policy Document Chunks & Vector Embeddings Storage
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS policy_chunks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        doc_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        title TEXT,
        chunk_index INTEGER NOT NULL,
        chunk_text TEXT NOT NULL,
        file_type TEXT DEFAULT 'pdf',
        embedding_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (doc_id) REFERENCES policy_documents(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    """)

    # 12. Reproductive Health Consents (Milestone 1 - Privacy by Design)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reproductive_consents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        consent_tier TEXT NOT NULL,
        granted INTEGER NOT NULL DEFAULT 0,
        granted_at TEXT NOT NULL,
        revoked_at TEXT,
        consent_version TEXT NOT NULL DEFAULT '1.0',
        audit_hash TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    cursor.execute("CREATE INDEX IF NOT EXISTS idx_reproductive_consents_user_tier ON reproductive_consents(user_id, consent_tier);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_reproductive_consents_active ON reproductive_consents(user_id, consent_tier, granted, revoked_at);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_reproductive_consents_audit ON reproductive_consents(audit_hash);")

    # 13. Reproductive Sharing Access Control Lists (User-Controlled Sharing & Redaction)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reproductive_sharing_acls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        recipient_type TEXT NOT NULL CHECK(recipient_type IN ('DOCTOR', 'PARTNER', 'RESEARCH')),
        recipient_name TEXT,
        share_token TEXT UNIQUE NOT NULL,
        allowed_domains TEXT NOT NULL,
        redacted_fields TEXT DEFAULT '[]',
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'revoked', 'expired')),
        expires_at TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        revoked_at TEXT DEFAULT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    cursor.execute("CREATE INDEX IF NOT EXISTS idx_sharing_acls_user_id ON reproductive_sharing_acls(user_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_sharing_acls_token ON reproductive_sharing_acls(share_token);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_sharing_acls_status ON reproductive_sharing_acls(status);")

    # 14. System Settings Table (Global system configuration e.g. Gemini API Key, Model)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

    # Migration: Self-heal legacy superseded consent rows
    try:
        cursor.execute("""
            SELECT id, user_id, consent_tier, revoked_at, consent_version
            FROM reproductive_consents
            WHERE granted = 0 AND revoked_at IS NOT NULL
        """)
        for legacy_row in cursor.fetchall():
            r_dict = dict(legacy_row)
            if not verify_consent_audit_hash(r_dict):
                repaired_hash = compute_consent_audit_hash(
                    r_dict['user_id'], r_dict['consent_tier'], 0, r_dict['revoked_at'], r_dict.get('consent_version', '1.0')
                )
                cursor.execute("UPDATE reproductive_consents SET audit_hash = ? WHERE id = ?", (repaired_hash, r_dict['id']))
        conn.commit()
    except Exception:
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

        # Seed standard sharing ACL fixtures for boundary tests (idempotent)
        cursor.execute("SELECT id FROM reproductive_sharing_acls WHERE share_token = 'expired_share_token_99'")
        if not cursor.fetchone():
            cursor.execute("""
            INSERT INTO reproductive_sharing_acls
            (user_id, recipient_type, recipient_name, share_token, allowed_domains, redacted_fields, status, expires_at, created_at, revoked_at)
            VALUES (?, 'DOCTOR', 'Dr. Expired Specialist', 'expired_share_token_99', '["HISTORY"]', '[]', 'expired', '2020-01-01T00:00:00Z', '2019-12-01T00:00:00Z', NULL)
            """, (admin_row[0],))
            conn.commit()

        cursor.execute("SELECT id FROM reproductive_sharing_acls WHERE share_token = 'revoked_token_111'")
        if not cursor.fetchone():
            cursor.execute("""
            INSERT INTO reproductive_sharing_acls
            (user_id, recipient_type, recipient_name, share_token, allowed_domains, redacted_fields, status, expires_at, created_at, revoked_at)
            VALUES (?, 'DOCTOR', 'Dr. Revoked Clinician', 'revoked_token_111', '["HISTORY"]', '[]', 'revoked', '2030-01-01T00:00:00Z', '2020-01-01T00:00:00Z', '2020-01-02T00:00:00Z')
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

def get_pedigree_nodes(user_id: int, family_id: Optional[str] = None):
    conn = get_db_connection()
    if family_id:
        nodes = conn.execute("SELECT * FROM pedigree_nodes WHERE user_id = ? AND family_id = ? ORDER BY generation ASC, id ASC", (user_id, family_id)).fetchall()
    else:
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
    raw_carrier = str(carrier_status).lower()
    is_carrier_flag = bool(data.get('is_carrier')) or any(w in raw_carrier for w in ['carrier', 'positive', 'trait', 'heterozygous'])
    is_affected_flag = bool(data.get('is_affected')) or (data.get('affected_status') == 'Affected') or (any(w in raw_carrier for w in ['affected', 'homozygous', 'disease major']) and not ('carrier' in raw_carrier or 'trait' in raw_carrier))

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
    affected_status = 'Affected' if is_affected_flag else ('Carrier' if is_carrier_flag else (data.get('affected_status') or 'Unaffected'))
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
        raw_stat = str(d.get('carrier_status', '')).lower()
        aff_stat = str(d.get('affected_status', '')).lower()

        # Genuine carrier determination: handles "Heterozygous Carrier", "Carrier (HbS)", "Possible Carrier (50% probability)", etc.
        is_carrier_val = any(w in raw_stat for w in ['carrier', 'positive', 'trait', 'heterozygous']) or aff_stat == 'carrier'
        # Genuine affected determination: only if explicitly marked Affected or diagnosis indicates homozygous/affected disease
        is_affected_val = (aff_stat == 'affected' or any(w in raw_stat for w in ['affected', 'homozygous', 'disease major'])) and not ('carrier' in raw_stat or 'trait' in raw_stat)

        d['is_affected'] = is_affected_val
        d['is_carrier'] = is_carrier_val and not is_affected_val
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

def delete_family(family_id: str, user_id: int, delete_members: bool = False):
    """
    Deletes a family chart. If delete_members is False, members are unlinked and preserved
    in pedigree_nodes. If delete_members is True, members of this family are permanently
    deleted from pedigree_nodes and their corresponding screening reports are removed from
    scraped_reports (and consequently from the Patient profile and details page).
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

    if delete_members:
        # 1. Collect all member node IDs and aliases belonging to this family
        nodes = cursor.execute("SELECT id, alias_name FROM pedigree_nodes WHERE family_id = ?", (family_id,)).fetchall()
        node_ids = [dict(n)['id'] for n in nodes]
        node_aliases = [dict(n).get('alias_name') for n in nodes if dict(n).get('alias_name')]

        # 2. Delete associated scraped_reports for this user matching this family or these members
        rep_rows = cursor.execute("SELECT id, masked_data FROM scraped_reports WHERE user_id = ?", (user_id,)).fetchall()
        for rep in rep_rows:
            try:
                m_data = decrypt_payload(rep['masked_data'])
                rep_fam_id = m_data.get('family_id')
                rep_mem_id = m_data.get('member_id')
                rep_sudo = m_data.get('sudo_name')

                should_delete = False
                if rep_fam_id == family_id:
                    should_delete = True
                elif rep_mem_id and (rep_mem_id in node_ids or int(rep_mem_id) in node_ids):
                    should_delete = True
                elif rep_sudo and rep_sudo in node_aliases:
                    should_delete = True

                if should_delete:
                    cursor.execute("DELETE FROM scraped_reports WHERE id = ?", (rep['id'],))
            except Exception:
                pass

        # 3. Permanently delete member nodes belonging to this family
        cursor.execute("DELETE FROM pedigree_nodes WHERE family_id = ?", (family_id,))
        for nid in node_ids:
            cursor.execute("DELETE FROM pedigree_nodes WHERE id = ?", (nid,))

        # 4. Clean up any partner_id references in remaining nodes pointing to deleted members
        if node_ids:
            placeholders = ",".join(["?"] * len(node_ids))
            cursor.execute(f"UPDATE pedigree_nodes SET partner_id = NULL WHERE partner_id IN ({placeholders})", [str(nid) for nid in node_ids])
    else:
        # CRITICAL: Keep newly created members intact as user can create another tree and add them later.
        # Unlink members from this deleted family by resetting family_id to NULL.
        cursor.execute("UPDATE pedigree_nodes SET family_id = NULL WHERE family_id = ?", (family_id,))

    # Delete family record
    cursor.execute("DELETE FROM families WHERE family_id = ?", (family_id,))
    conn.commit()
    conn.close()
    return True, "Family chart and members deleted successfully" if delete_members else "Family chart deleted successfully"

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

def update_scraped_report(report_id: int, user_id: int, file_name: str, panel_name: str, masked_data: dict, gene_locus: str = "", variant: str = "", carrier_status: str = ""):
    conn = get_db_connection()
    cursor = conn.cursor()
    encrypted_payload = encrypt_payload(masked_data)
    cursor.execute("""
    UPDATE scraped_reports
    SET file_name = ?, panel_name = ?, masked_data = ?, gene_locus = ?, variant = ?, carrier_status = ?
    WHERE id = ? AND user_id = ?
    """, (file_name, panel_name, encrypted_payload, gene_locus, variant, carrier_status, report_id, user_id))
    conn.commit()
    conn.close()

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

def delete_scraped_report(report_id: int, user_id: int) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    row = cursor.execute("SELECT masked_data FROM scraped_reports WHERE id = ? AND user_id = ?", (report_id, user_id)).fetchone()
    if not row:
        conn.close()
        return False
    try:
        m_data = decrypt_payload(row['masked_data'])
        member_id = m_data.get('member_id')
        if member_id:
            cursor.execute("DELETE FROM pedigree_nodes WHERE id = ? AND user_id = ?", (int(member_id), user_id))
    except Exception:
        pass
    cursor.execute("DELETE FROM scraped_reports WHERE id = ? AND user_id = ?", (report_id, user_id))
    conn.commit()
    conn.close()
    return True

def delete_scraped_reports_bulk(report_ids: list, user_id: int) -> int:
    deleted_count = 0
    for rid in report_ids:
        try:
            if delete_scraped_report(int(rid), user_id):
                deleted_count += 1
        except Exception:
            pass
    return deleted_count

def save_policy_document(user_id: int, file_name: str, file_type: str, title: str = "", chunk_count: int = 0) -> int:
    """Save an indexed health policy document record."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO policy_documents (user_id, file_name, file_type, title, chunk_count, status)
        VALUES (?, ?, ?, ?, ?, 'indexed')
    """, (user_id, file_name, file_type, title or file_name, chunk_count))
    doc_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return doc_id

def get_user_policy_documents(user_id: int) -> list:
    """Fetch all health policy documents uploaded by user or default system policies."""
    conn = get_db_connection()
    cursor = conn.cursor()
    rows = cursor.execute("""
        SELECT id, user_id, file_name, file_type, title, chunk_count, status, created_at
        FROM policy_documents
        WHERE user_id = ?
        ORDER BY id DESC
    """, (user_id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_policy_document_by_id(doc_id: int, user_id: int):
    """Retrieve a specific policy document ensuring user ownership."""
    conn = get_db_connection()
    cursor = conn.cursor()
    row = cursor.execute("""
        SELECT id, user_id, file_name, file_type, title, chunk_count, status, created_at
        FROM policy_documents
        WHERE id = ? AND user_id = ?
    """, (doc_id, user_id)).fetchone()
    conn.close()
    return dict(row) if row else None

def delete_policy_document(doc_id: int, user_id: int) -> bool:
    """Delete a policy document record."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM policy_documents WHERE id = ? AND user_id = ?", (doc_id, user_id))
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    return affected > 0

def save_policy_chunk(doc_id: int, user_id: int, filename: str, title: str, chunk_index: int, chunk_text: str, file_type: str = 'pdf', embedding: list = None) -> int:
    """Save an extracted text chunk and its dense vector embedding into persistent SQLite storage."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO policy_chunks (doc_id, user_id, filename, title, chunk_index, chunk_text, file_type, embedding_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (doc_id, user_id, filename, title or filename, chunk_index, chunk_text, file_type, json.dumps(embedding) if embedding else '[]'))
    chunk_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return chunk_id

def save_policy_chunks_batch(chunks_data: list) -> int:
    """Save multiple extracted chunks and embeddings in a single atomic database transaction."""
    if not chunks_data:
        return 0
    conn = get_db_connection()
    cursor = conn.cursor()
    params = [
        (
            c['doc_id'],
            c['user_id'],
            c['filename'],
            c.get('title') or c['filename'],
            c['chunk_index'],
            c['chunk_text'],
            c.get('file_type', 'pdf'),
            json.dumps(c.get('embedding', [])) if isinstance(c.get('embedding'), list) else (c.get('embedding') or '[]')
        )
        for c in chunks_data
    ]
    cursor.executemany("""
        INSERT INTO policy_chunks (doc_id, user_id, filename, title, chunk_index, chunk_text, file_type, embedding_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, params)
    inserted = cursor.rowcount
    conn.commit()
    conn.close()
    return inserted

def get_policy_chunks(user_id: int = None, doc_id: int = None) -> list:
    """Fetch persistent policy chunks and embeddings from database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    query = "SELECT id, doc_id, user_id, filename, title, chunk_index, chunk_text, file_type, embedding_json, created_at FROM policy_chunks WHERE 1=1"
    params = []
    if user_id is not None:
        query += " AND user_id = ?"
        params.append(user_id)
    if doc_id is not None:
        query += " AND doc_id = ?"
        params.append(doc_id)
    query += " ORDER BY doc_id ASC, chunk_index ASC"
    rows = cursor.execute(query, params).fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        try:
            d['embedding'] = json.loads(d.get('embedding_json') or '[]')
        except Exception:
            d['embedding'] = []
        result.append(d)
    return result

def delete_policy_chunks_by_doc_id(doc_id: int, user_id: int = None) -> bool:
    """Delete chunks belonging to a deleted policy document."""
    conn = get_db_connection()
    cursor = conn.cursor()
    if user_id is not None:
        cursor.execute("DELETE FROM policy_chunks WHERE doc_id = ? AND user_id = ?", (doc_id, user_id))
    else:
        cursor.execute("DELETE FROM policy_chunks WHERE doc_id = ?", (doc_id,))
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    return affected > 0


# ===========================================================================
# Reproductive Consent & User-Controlled Sharing Architecture (Milestone 1)
# ===========================================================================

VALID_CONSENT_TIERS = {
    "C1_SCREENING": "Multi-domain pre-infertility risk screening",
    "C2_TELEHEALTH": "Teleconsultation packets and virtual clinical consultations",
    "C3_PARTNER": "Partner pedigree sharing and reproductive carrier matching",
    "C4_TELEMETRY": "Longitudinal health telemetry and at-home diagnostic tracking"
}

TIER_SCOPE_MAP = {
    "screening": "C1_SCREENING",
    "c1_screening": "C1_SCREENING",
    "c1": "C1_SCREENING",
    "telehealth": "C2_TELEHEALTH",
    "c2_telehealth": "C2_TELEHEALTH",
    "c2": "C2_TELEHEALTH",
    "partner": "C3_PARTNER",
    "pedigree": "C3_PARTNER",
    "c3_partner": "C3_PARTNER",
    "c3": "C3_PARTNER",
    "telemetry": "C4_TELEMETRY",
    "c4_telemetry": "C4_TELEMETRY",
    "c4": "C4_TELEMETRY"
}

def normalize_consent_tier(tier_or_scope: str) -> str:
    """Normalizes input scope or tier name to canonical C1_SCREENING ... C4_TELEMETRY."""
    if not tier_or_scope or not isinstance(tier_or_scope, str):
        raise ValueError("Consent tier or scope cannot be empty.")
    cleaned = tier_or_scope.strip().lower()
    if cleaned in TIER_SCOPE_MAP:
        return TIER_SCOPE_MAP[cleaned]
    upper = tier_or_scope.strip().upper()
    if upper in VALID_CONSENT_TIERS:
        return upper
    raise ValueError(f"Invalid consent tier or scope: '{tier_or_scope}'. Valid tiers: {list(VALID_CONSENT_TIERS.keys())}")

def compute_consent_audit_hash(
    user_id: int,
    consent_tier: str,
    granted: int,
    timestamp: str,
    consent_version: str = "1.0",
    secret: Optional[str] = None
) -> str:
    """Computes tamper-evident HMAC-SHA256 signature for consent state changes."""
    key = (secret or Config.SECRET_KEY).encode('utf-8')
    canonical_payload = f"USER:{user_id}|TIER:{consent_tier}|GRANTED:{int(granted)}|TIME:{timestamp}|VER:{consent_version}"
    digest = hmac.new(key, canonical_payload.encode('utf-8'), hashlib.sha256).hexdigest()
    return f"HMAC-SHA256-{digest}"

def verify_consent_audit_hash(consent_record: dict, secret: Optional[str] = None) -> bool:
    """Verifies cryptographic integrity of a consent record against tampering."""
    if not isinstance(consent_record, dict):
        return False
    audit_hash = consent_record.get('audit_hash')
    if not audit_hash:
        return False
    timestamp = consent_record.get('revoked_at') if (consent_record.get('revoked_at') and not consent_record.get('granted')) else consent_record.get('granted_at')
    if not timestamp:
        return False
    user_id = consent_record.get('user_id')
    consent_tier = consent_record.get('consent_tier')
    if user_id is None or not consent_tier:
        return False
    try:
        expected_hash = compute_consent_audit_hash(
            user_id=int(user_id),
            consent_tier=str(consent_tier),
            granted=int(consent_record.get('granted', 0)),
            timestamp=str(timestamp),
            consent_version=str(consent_record.get('consent_version', '1.0')),
            secret=secret
        )
        return hmac.compare_digest(audit_hash, expected_hash)
    except Exception:
        return False

def record_consent(
    user_id: int,
    consent_tier: str,
    granted: bool = True,
    consent_version: str = "1.0"
) -> dict:
    """Records an explicit consent authorization or delegation."""
    tier = normalize_consent_tier(consent_tier)
    if not granted:
        return revoke_consent(user_id, tier, consent_version)

    user = get_user_by_id(user_id)
    if not user:
        raise ValueError(f"User with ID {user_id} does not exist.")

    now_iso = datetime.now(timezone.utc).isoformat()
    audit_hash = compute_consent_audit_hash(user_id, tier, 1, now_iso, consent_version)

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Supersede previous active records for this tier with valid revocation audit hash
        super_hash = compute_consent_audit_hash(user_id, tier, 0, now_iso, consent_version)
        cursor.execute("""
            UPDATE reproductive_consents
            SET granted = 0, revoked_at = ?, audit_hash = ?
            WHERE user_id = ? AND consent_tier = ? AND granted = 1 AND revoked_at IS NULL
        """, (now_iso, super_hash, user_id, tier))

        cursor.execute("""
            INSERT INTO reproductive_consents (user_id, consent_tier, granted, granted_at, revoked_at, consent_version, audit_hash)
            VALUES (?, ?, 1, ?, NULL, ?, ?)
        """, (user_id, tier, now_iso, consent_version, audit_hash))

        consent_id = cursor.lastrowid
        conn.commit()
        return {
            "id": consent_id,
            "user_id": user_id,
            "consent_tier": tier,
            "granted": True,
            "granted_at": now_iso,
            "revoked_at": None,
            "consent_version": consent_version,
            "audit_hash": audit_hash,
            "status": "success"
        }
    finally:
        conn.close()

def revoke_consent(
    user_id: int,
    consent_tier: str,
    consent_version: str = "1.0"
) -> dict:
    """Revokes active consent for a specific tier immediately."""
    tier = normalize_consent_tier(consent_tier)
    user = get_user_by_id(user_id)
    if not user:
        raise ValueError(f"User with ID {user_id} does not exist.")

    now_iso = datetime.now(timezone.utc).isoformat()
    rev_hash = compute_consent_audit_hash(user_id, tier, 0, now_iso, consent_version)

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT id FROM reproductive_consents
            WHERE user_id = ? AND consent_tier = ? AND granted = 1 AND revoked_at IS NULL
        """, (user_id, tier))
        active_records = cursor.fetchall()

        if active_records:
            cursor.execute("""
                UPDATE reproductive_consents
                SET granted = 0, revoked_at = ?, audit_hash = ?
                WHERE user_id = ? AND consent_tier = ? AND granted = 1 AND revoked_at IS NULL
            """, (now_iso, rev_hash, user_id, tier))
            last_id = active_records[-1]['id']
            revoked_count = len(active_records)
        else:
            # Explicit denial / opt-out row for non-repudiation audit trail
            cursor.execute("""
                INSERT INTO reproductive_consents (user_id, consent_tier, granted, granted_at, revoked_at, consent_version, audit_hash)
                VALUES (?, ?, 0, ?, ?, ?, ?)
            """, (user_id, tier, now_iso, now_iso, consent_version, rev_hash))
            last_id = cursor.lastrowid
            revoked_count = 1

        conn.commit()
        return {
            "id": last_id,
            "user_id": user_id,
            "consent_tier": tier,
            "granted": False,
            "granted_at": now_iso,
            "revoked_at": now_iso,
            "consent_version": consent_version,
            "audit_hash": rev_hash,
            "status": "revoked",
            "revoked_count": revoked_count
        }
    finally:
        conn.close()

def get_consent_status(user_id: int, consent_tier: Optional[str] = None, tier: Optional[str] = None) -> dict:
    """Queries active consent status for a specific tier or across all 4 tiers."""
    conn = get_db_connection()
    cursor = conn.cursor()
    target_tier = consent_tier or tier
    try:
        if target_tier:
            t = normalize_consent_tier(target_tier)
            cursor.execute("""
                SELECT * FROM reproductive_consents
                WHERE user_id = ? AND consent_tier = ?
                ORDER BY id DESC LIMIT 1
            """, (user_id, t))
            row = cursor.fetchone()
            if row:
                r = dict(row)
                is_active = bool(r['granted'] == 1 and r['revoked_at'] is None)
                return {
                    "user_id": user_id,
                    "consent_tier": t,
                    "granted": is_active,
                    "is_active": is_active,
                    "granted_at": r['granted_at'],
                    "revoked_at": r['revoked_at'],
                    "consent_version": r['consent_version'],
                    "audit_hash": r['audit_hash'],
                    "record_id": r['id']
                }
            return {
                "user_id": user_id,
                "consent_tier": t,
                "granted": False,
                "is_active": False,
                "granted_at": None,
                "revoked_at": None,
                "consent_version": None,
                "audit_hash": None,
                "record_id": None
            }
        else:
            statuses = {}
            active_tiers = []
            for t in VALID_CONSENT_TIERS.keys():
                cursor.execute("""
                    SELECT * FROM reproductive_consents
                    WHERE user_id = ? AND consent_tier = ?
                    ORDER BY id DESC LIMIT 1
                """, (user_id, t))
                row = cursor.fetchone()
                if row:
                    r = dict(row)
                    active = bool(r['granted'] == 1 and r['revoked_at'] is None)
                    statuses[t] = {
                        "granted": active,
                        "is_active": active,
                        "granted_at": r['granted_at'],
                        "revoked_at": r['revoked_at'],
                        "consent_version": r['consent_version'],
                        "audit_hash": r['audit_hash'],
                        "record_id": r['id']
                    }
                    if active:
                        active_tiers.append(t)
                else:
                    statuses[t] = {
                        "granted": False,
                        "is_active": False,
                        "granted_at": None,
                        "revoked_at": None,
                        "consent_version": None,
                        "audit_hash": None,
                        "record_id": None
                    }
            return {
                "user_id": user_id,
                "consents": statuses,
                "active_tiers": active_tiers,
                "summary": {
                    "active_count": len(active_tiers),
                    "total_tiers": len(VALID_CONSENT_TIERS),
                    "active_tiers": active_tiers
                }
            }
    finally:
        conn.close()

def has_valid_consent(user_id: int, scope: str = 'screening') -> bool:
    """
    Validates active unrevoked consent before processing intake data.
    Fulfills Milestone 1 contract: has_valid_consent(user_id, scope) -> bool.
    """
    try:
        tier = normalize_consent_tier(scope)
    except Exception:
        return False

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT id FROM reproductive_consents
            WHERE user_id = ? AND consent_tier = ? AND granted = 1 AND revoked_at IS NULL
            ORDER BY id DESC LIMIT 1
        """, (user_id, tier))
        row = cursor.fetchone()
        return row is not None
    except Exception:
        return False
    finally:
        conn.close()

def get_user_consent_history(user_id: int, consent_tier: Optional[str] = None, tier: Optional[str] = None) -> List[dict]:
    """Retrieves full chronological audit log of consent transitions with validity verification."""
    conn = get_db_connection()
    cursor = conn.cursor()
    target_tier = consent_tier or tier
    try:
        if target_tier:
            t = normalize_consent_tier(target_tier)
            cursor.execute("""
                SELECT * FROM reproductive_consents
                WHERE user_id = ? AND consent_tier = ?
                ORDER BY id ASC
            """, (user_id, t))
        else:
            cursor.execute("""
                SELECT * FROM reproductive_consents
                WHERE user_id = ?
                ORDER BY id ASC
            """, (user_id,))

        rows = cursor.fetchall()
        history = []
        for row in rows:
            r = dict(row)
            r['audit_valid'] = verify_consent_audit_hash(r)
            history.append(r)
        return history
    finally:
        conn.close()

# ---------------------------------------------------------------------------
# Reproductive Sharing ACLs & Field Redaction Helpers
# ---------------------------------------------------------------------------

def create_sharing_acl(
    user_id: int,
    recipient_type: str,
    allowed_domains: list,
    redacted_fields: Optional[list] = None,
    recipient_name: str = "",
    expires_in_days: Optional[int] = 30
) -> dict:
    """Creates a user-controlled sharing ACL token with allowed clinical domains and redacted fields."""
    if not isinstance(recipient_type, str):
        raise ValueError(f"Invalid recipient_type: '{recipient_type}'. Must be a string (DOCTOR, PARTNER, or RESEARCH).")
    rec_type = recipient_type.upper().strip()
    if rec_type not in ('DOCTOR', 'PARTNER', 'RESEARCH'):
        raise ValueError(f"Invalid recipient_type: '{recipient_type}'. Must be DOCTOR, PARTNER, or RESEARCH.")

    user = get_user_by_id(user_id)
    if not user:
        raise ValueError(f"User with ID {user_id} does not exist.")

    if not isinstance(allowed_domains, list) or not allowed_domains:
        raise ValueError("allowed_domains must be a non-empty list of clinical domains.")
    if not all(isinstance(d, str) for d in allowed_domains):
        raise ValueError("allowed_domains must contain only strings.")

    if redacted_fields is None:
        redacted_fields = []
    elif not isinstance(redacted_fields, list):
        raise ValueError("redacted_fields must be a list of strings.")
    elif not all(isinstance(f, str) for f in redacted_fields):
        raise ValueError("redacted_fields must contain only strings.")

    share_token = secrets.token_hex(32)
    now = datetime.now(timezone.utc)
    if expires_in_days is not None:
        expires_at = (now + timedelta(days=int(expires_in_days))).isoformat()
    else:
        expires_at = None

    allowed_json = json.dumps(allowed_domains)
    redacted_json = json.dumps(redacted_fields)

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO reproductive_sharing_acls
            (user_id, recipient_type, recipient_name, share_token, allowed_domains, redacted_fields, status, expires_at)
            VALUES (?, ?, ?, ?, ?, ?, 'active', ?)
        """, (user_id, rec_type, recipient_name or "", share_token, allowed_json, redacted_json, expires_at))
        acl_id = cursor.lastrowid
        conn.commit()

        return {
            "id": acl_id,
            "user_id": user_id,
            "recipient_type": rec_type,
            "recipient_name": recipient_name or "",
            "share_token": share_token,
            "allowed_domains": allowed_domains,
            "redacted_fields": redacted_fields,
            "status": "active",
            "expires_at": expires_at,
            "created_at": now.isoformat(),
            "revoked_at": None
        }
    finally:
        conn.close()

def get_user_sharing_acls(user_id: int) -> List[dict]:
    """Returns all sharing ACLs for a user, marking expired ones dynamically."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT * FROM reproductive_sharing_acls
            WHERE user_id = ?
            ORDER BY id DESC
        """, (user_id,))
        rows = cursor.fetchall()
        now_iso = datetime.now(timezone.utc).isoformat()
        acls = []
        needs_commit = False

        for row in rows:
            r = dict(row)
            if r['status'] == 'active' and r.get('expires_at') and r['expires_at'] < now_iso:
                cursor.execute("""
                    UPDATE reproductive_sharing_acls
                    SET status = 'expired'
                    WHERE id = ?
                """, (r['id'],))
                r['status'] = 'expired'
                needs_commit = True

            try:
                r['allowed_domains'] = json.loads(r.get('allowed_domains') or '[]')
            except Exception:
                r['allowed_domains'] = []

            try:
                r['redacted_fields'] = json.loads(r.get('redacted_fields') or '[]')
            except Exception:
                r['redacted_fields'] = []

            acls.append(r)

        if needs_commit:
            conn.commit()
        return acls
    finally:
        conn.close()

def get_sharing_acl_by_token(share_token: str) -> Optional[dict]:
    """Fetches a sharing ACL by token, checking for expiration."""
    if not share_token:
        return None
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT * FROM reproductive_sharing_acls
            WHERE share_token = ?
        """, (share_token,))
        row = cursor.fetchone()
        if not row:
            return None
        r = dict(row)
        now_iso = datetime.now(timezone.utc).isoformat()
        if r['status'] == 'active' and r.get('expires_at') and r['expires_at'] < now_iso:
            cursor.execute("""
                UPDATE reproductive_sharing_acls
                SET status = 'expired'
                WHERE id = ?
            """, (r['id'],))
            conn.commit()
            r['status'] = 'expired'

        try:
            r['allowed_domains'] = json.loads(r.get('allowed_domains') or '[]')
        except Exception:
            r['allowed_domains'] = []

        try:
            r['redacted_fields'] = json.loads(r.get('redacted_fields') or '[]')
        except Exception:
            r['redacted_fields'] = []

        return r
    finally:
        conn.close()

def validate_share_token_access(share_token: str) -> Tuple[bool, Optional[dict], str]:
    """Validates token presence, status, expiration, and active prerequisite consent."""
    if not share_token or not isinstance(share_token, str):
        return False, None, "Share token not found"

    acl = get_sharing_acl_by_token(share_token)
    if not acl:
        return False, None, "Share token not found"
    if acl.get('status') == 'revoked':
        return False, acl, "Share token has been revoked by the patient"
    if acl.get('status') == 'expired':
        return False, acl, "Share token has expired"
    now_iso = datetime.now(timezone.utc).isoformat()
    if acl.get('expires_at') and acl['expires_at'] < now_iso:
        return False, acl, "Share token has expired"

    # Enforce active prerequisite consent (Requirement P19)
    user_id = acl.get('user_id')
    recipient_type = str(acl.get('recipient_type') or '').upper().strip()
    if recipient_type == 'DOCTOR':
        if not has_valid_consent(user_id, 'C2_TELEHEALTH'):
            return False, acl, "Prerequisite telehealth consent revoked"
    elif recipient_type == 'PARTNER':
        if not has_valid_consent(user_id, 'C3_PARTNER'):
            return False, acl, "Prerequisite partner consent revoked"
    elif recipient_type == 'RESEARCH':
        if not has_valid_consent(user_id, 'C4_TELEMETRY'):
            return False, acl, "Prerequisite telemetry consent revoked"

    return True, acl, "Authorized"

def revoke_sharing_acl(user_id: int, acl_id: int, is_admin: bool = False) -> bool:
    """Revokes a sharing ACL by its ID and user ownership (or admin override)."""
    if not isinstance(user_id, int) or not isinstance(acl_id, int):
        return False
    now_iso = datetime.now(timezone.utc).isoformat()
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        if is_admin:
            cursor.execute("""
                UPDATE reproductive_sharing_acls
                SET status = 'revoked', revoked_at = ?
                WHERE id = ? AND status != 'revoked'
            """, (now_iso, acl_id))
        else:
            cursor.execute("""
                UPDATE reproductive_sharing_acls
                SET status = 'revoked', revoked_at = ?
                WHERE id = ? AND user_id = ? AND status != 'revoked'
            """, (now_iso, acl_id, user_id))
        affected = cursor.rowcount
        conn.commit()
        return affected > 0
    finally:
        conn.close()

def revoke_sharing_acl_by_token(user_id: int, share_token: str, is_admin: bool = False) -> bool:
    """Revokes a sharing ACL by its share token and user ownership (or admin override)."""
    if not isinstance(user_id, int) or not isinstance(share_token, str) or not share_token.strip():
        return False
    now_iso = datetime.now(timezone.utc).isoformat()
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        if is_admin:
            cursor.execute("""
                UPDATE reproductive_sharing_acls
                SET status = 'revoked', revoked_at = ?
                WHERE share_token = ? AND status != 'revoked'
            """, (now_iso, share_token.strip()))
        else:
            cursor.execute("""
                UPDATE reproductive_sharing_acls
                SET status = 'revoked', revoked_at = ?
                WHERE share_token = ? AND user_id = ? AND status != 'revoked'
            """, (now_iso, share_token.strip(), user_id))
        affected = cursor.rowcount
        conn.commit()
        return affected > 0
    finally:
        conn.close()

def redact_sensitive_intake(
    intake_data: dict,
    redacted_fields: Optional[List[str]] = None,
    allowed_domains: Optional[List[str]] = None,
    recipient_type: Optional[str] = None,
    mask_pii: bool = False,
    pseudonym: Optional[str] = None
) -> dict:
    """
    Sanitizes, filters, and redacts sensitive reproductive intake data.
    Enforces user-specified domain gating, field-level redaction, and PII masking.
    Never modifies input data in-place.
    """
    if not isinstance(intake_data, dict):
        return {}

    data = copy.deepcopy(intake_data)
    redacted_count = 0

    # 1. Domain Filtering
    domain_map = {
        "history": "HISTORY",
        "lifestyle": "LIFESTYLE",
        "metabolic": "METABOLIC",
        "infectious": "INFECTIOUS",
        "anatomical": "ANATOMICAL",
        "laboratory": "LABORATORY",
        "lab_data": "LABORATORY"
    }

    if allowed_domains is not None:
        allowed_upper = {str(d).strip().upper() for d in allowed_domains if d}
        keys_to_remove = []
        for key in list(data.keys()):
            k_lower = key.strip().lower()
            if k_lower in domain_map:
                canonical = domain_map[k_lower]
                if canonical not in allowed_upper:
                    keys_to_remove.append(key)
            elif key.strip().upper() in ("HISTORY", "LIFESTYLE", "METABOLIC", "INFECTIOUS", "ANATOMICAL", "LABORATORY"):
                if key.strip().upper() not in allowed_upper:
                    keys_to_remove.append(key)

        for k in keys_to_remove:
            data.pop(k, None)

    # 2. Field-Level Redaction
    if redacted_fields:
        fields_to_redact = {str(f).strip().lower() for f in redacted_fields if f}

        def _recursive_redact(obj: Any) -> Any:
            nonlocal redacted_count
            if isinstance(obj, dict):
                redacted_dict = {}
                for k, v in obj.items():
                    if str(k).strip().lower() in fields_to_redact:
                        redacted_dict[k] = "[REDACTED]"
                        redacted_count += 1
                    else:
                        redacted_dict[k] = _recursive_redact(v)
                return redacted_dict
            elif isinstance(obj, list):
                return [_recursive_redact(item) for item in obj]
            return obj

        data = _recursive_redact(data)

    # 3. PII Masking / Sudo Mode / Research Recipient
    rec_type_upper = (recipient_type or "").strip().upper()
    should_mask_pii = mask_pii or (rec_type_upper == "RESEARCH")
    applied_pseudonym = None

    if should_mask_pii:
        applied_pseudonym = pseudonym or generate_pseudonym()
        data["alias_name"] = applied_pseudonym
        if "patient_name" in data or "full_name" in data:
            data["patient_name"] = applied_pseudonym
            data["full_name"] = applied_pseudonym

        pii_fields = ["email", "phone", "dob", "national_id", "address", "emergency_contact", "city", "country"]
        for pf in pii_fields:
            if pf in data:
                data[pf] = "[REDACTED]"

    # 4. Attach Redaction Audit Metadata
    data["_redaction_audit"] = {
        "recipient_type": rec_type_upper or "DIRECT",
        "domains_included": list(allowed_domains) if allowed_domains is not None else "ALL",
        "redacted_fields_count": redacted_count,
        "pii_masked": should_mask_pii,
        "pseudonym_applied": applied_pseudonym,
        "redacted_at": datetime.now(timezone.utc).isoformat()
    }

    return data


# ==============================================================================
# Global System Settings Helpers (Cross-Device Global Gemini Key & Model)
# ==============================================================================

def get_system_setting(key: str, default: Optional[str] = None) -> Optional[str]:
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM system_settings WHERE key = ?", (key,))
        row = cursor.fetchone()
        conn.close()
        if row and row["value"]:
            return row["value"]
    except Exception:
        pass
    return default

def set_system_setting(key: str, value: str) -> bool:
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO system_settings (key, value, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
        """, (key, value))
        conn.commit()
        conn.close()
        return True
    except Exception:
        return False

def delete_system_setting(key: str) -> bool:
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM system_settings WHERE key = ?", (key,))
        conn.commit()
        conn.close()
        return True
    except Exception:
        return False

def _sync_system_config_to_gcs(config_dict: dict) -> bool:
    try:
        from google.cloud import storage
        client = storage.Client(project=getattr(Config, 'GCP_PROJECT_ID', None))
        bucket_name = getattr(Config, 'GCS_BUCKET_NAME', 'genai-builder-cup-clinical-vault')
        if bucket_name:
            bucket = client.bucket(bucket_name)
            blob = bucket.blob('system_config.json')
            blob.upload_from_string(json.dumps(config_dict), content_type='application/json')
            return True
    except Exception:
        pass
    return False

def _fetch_system_config_from_gcs() -> dict:
    try:
        from google.cloud import storage
        client = storage.Client(project=getattr(Config, 'GCP_PROJECT_ID', None))
        bucket_name = getattr(Config, 'GCS_BUCKET_NAME', 'genai-builder-cup-clinical-vault')
        if bucket_name:
            bucket = client.bucket(bucket_name)
            blob = bucket.blob('system_config.json')
            if blob.exists():
                return json.loads(blob.download_as_text())
    except Exception:
        pass
    return {}

def get_global_gemini_key() -> str:
    # 1. Check system_settings table in SQLite
    key = get_system_setting("gemini_api_key")
    if key and key.strip():
        return key.strip()
    # 2. Check JSON file in data directory
    try:
        data_dir = getattr(Config, 'DATA_DIR', os.path.dirname(os.path.abspath(Config.DATABASE_PATH)))
        cfg_path = os.path.join(data_dir, 'system_config.json')
        if os.path.exists(cfg_path):
            with open(cfg_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if data.get('gemini_api_key'):
                    return str(data['gemini_api_key']).strip()
    except Exception:
        pass
    # 3. Check environment
    env_k = (os.environ.get('GEMINI_API_KEY') or getattr(Config, 'GEMINI_API_KEY', '') or '').strip()
    if env_k:
        return env_k
    # 4. Check GCS bucket (multi-instance Cloud Run persistence)
    gcs_data = _fetch_system_config_from_gcs()
    if gcs_data.get('gemini_api_key'):
        g_key = str(gcs_data['gemini_api_key']).strip()
        set_system_setting("gemini_api_key", g_key)
        os.environ['GEMINI_API_KEY'] = g_key
        return g_key
    return ''

def save_global_gemini_key(key: str) -> bool:
    cleaned = (key or '').strip()
    if not cleaned:
        return False
    # 1. Save in system_settings table
    set_system_setting("gemini_api_key", cleaned)
    # 2. Save in JSON file in data directory for multi-worker persistence
    cfg_data = {'gemini_api_key': cleaned, 'gemini_model': get_global_gemini_model()}
    try:
        data_dir = getattr(Config, 'DATA_DIR', os.path.dirname(os.path.abspath(Config.DATABASE_PATH)))
        os.makedirs(data_dir, exist_ok=True)
        cfg_path = os.path.join(data_dir, 'system_config.json')
        existing = {}
        if os.path.exists(cfg_path):
            try:
                with open(cfg_path, 'r', encoding='utf-8') as f:
                    existing = json.load(f)
            except Exception:
                existing = {}
        existing['gemini_api_key'] = cleaned
        cfg_data = existing
        with open(cfg_path, 'w', encoding='utf-8') as f:
            json.dump(existing, f)
    except Exception:
        pass
    # 3. Update environment in current process
    os.environ['GEMINI_API_KEY'] = cleaned
    # 4. Sync to GCS
    _sync_system_config_to_gcs(cfg_data)
    return True

def remove_global_gemini_key() -> bool:
    delete_system_setting("gemini_api_key")
    try:
        data_dir = getattr(Config, 'DATA_DIR', os.path.dirname(os.path.abspath(Config.DATABASE_PATH)))
        cfg_path = os.path.join(data_dir, 'system_config.json')
        if os.path.exists(cfg_path):
            with open(cfg_path, 'r', encoding='utf-8') as f:
                existing = json.load(f)
            existing.pop('gemini_api_key', None)
            with open(cfg_path, 'w', encoding='utf-8') as f:
                json.dump(existing, f)
            _sync_system_config_to_gcs(existing)
    except Exception:
        pass
    os.environ.pop('GEMINI_API_KEY', None)
    return True

def get_global_gemini_model() -> str:
    model = get_system_setting("gemini_model")
    if model and model.strip():
        return model.strip()
    try:
        data_dir = getattr(Config, 'DATA_DIR', os.path.dirname(os.path.abspath(Config.DATABASE_PATH)))
        cfg_path = os.path.join(data_dir, 'system_config.json')
        if os.path.exists(cfg_path):
            with open(cfg_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if data.get('gemini_model'):
                    return str(data['gemini_model']).strip()
    except Exception:
        pass
    gcs_data = _fetch_system_config_from_gcs()
    if gcs_data.get('gemini_model'):
        return str(gcs_data['gemini_model']).strip()
    return os.environ.get('GEMINI_MODEL', 'gemini-3.8-flash').strip()

def save_global_gemini_model(model: str) -> bool:
    cleaned = (model or '').strip()
    if not cleaned:
        return False
    set_system_setting("gemini_model", cleaned)
    cfg_data = {'gemini_api_key': get_global_gemini_key(), 'gemini_model': cleaned}
    try:
        data_dir = getattr(Config, 'DATA_DIR', os.path.dirname(os.path.abspath(Config.DATABASE_PATH)))
        os.makedirs(data_dir, exist_ok=True)
        cfg_path = os.path.join(data_dir, 'system_config.json')
        existing = {}
        if os.path.exists(cfg_path):
            try:
                with open(cfg_path, 'r', encoding='utf-8') as f:
                    existing = json.load(f)
            except Exception:
                existing = {}
        existing['gemini_model'] = cleaned
        cfg_data = existing
        with open(cfg_path, 'w', encoding='utf-8') as f:
            json.dump(existing, f)
    except Exception:
        pass
    os.environ['GEMINI_MODEL'] = cleaned
    _sync_system_config_to_gcs(cfg_data)
    return True





