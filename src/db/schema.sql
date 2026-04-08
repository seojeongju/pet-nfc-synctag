-- User Table (Singular, CamelCase)
CREATE TABLE IF NOT EXISTS user (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    emailVerified BOOLEAN NOT NULL DEFAULT FALSE,
    image TEXT,
    role TEXT DEFAULT 'user', -- 추가된 권한 필드
    subscriptionStatus TEXT DEFAULT 'free',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Session Table (Singular, CamelCase)
CREATE TABLE IF NOT EXISTS session (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expiresAt DATETIME NOT NULL,
    ipAddress TEXT,
    userAgent TEXT,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Account Table (Singular, CamelCase)
CREATE TABLE IF NOT EXISTS account (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    accountId TEXT NOT NULL,
    providerId TEXT NOT NULL,
    accessToken TEXT,
    refreshToken TEXT,
    accessTokenExpiresAt DATETIME,
    refreshTokenExpiresAt DATETIME,
    scope TEXT,
    idToken TEXT,
    password TEXT,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Verification Table (Singular, CamelCase)
CREATE TABLE IF NOT EXISTS verification (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expiresAt DATETIME NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Pet-ID Specific Tables
CREATE TABLE IF NOT EXISTS pets (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    breed TEXT,
    photo_url TEXT,
    medical_info TEXT,
    emergency_contact TEXT,
    is_lost BOOLEAN DEFAULT 0, -- 실종 상태 플래그
    theme_color TEXT DEFAULT '#14b8a6', -- 프로필 테마 컬러
    subject_kind TEXT DEFAULT 'pet',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY, -- NFC UID (Unique across the system)
    pet_id TEXT REFERENCES pets(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS health_records (
    id TEXT PRIMARY KEY,
    pet_id TEXT NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'vaccine', 'medical', 'grooming', 'note'
    title TEXT NOT NULL,
    description TEXT,
    record_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_health_records_pet_id ON health_records(pet_id);

CREATE TABLE IF NOT EXISTS scan_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    latitude REAL,
    longitude REAL,
    ip_address TEXT,
    user_agent TEXT
);

CREATE TABLE IF NOT EXISTS ble_location_events (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    pet_id TEXT NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    rssi INTEGER,
    raw_payload TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ble_events_pet ON ble_location_events(pet_id);
CREATE INDEX IF NOT EXISTS idx_ble_events_created ON ble_location_events(created_at);

-- Admin monitoring (see migrations/0005_admin_monitoring.sql)
CREATE TABLE IF NOT EXISTS unknown_tag_accesses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tag_uid TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_unknown_tag_created ON unknown_tag_accesses(created_at);
-- tags.ble_mac: added via migration ALTER TABLE tags ADD COLUMN ble_mac TEXT;

CREATE TABLE IF NOT EXISTS geofences (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    pet_id TEXT NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    radius_meters REAL NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_geofences_pet ON geofences(pet_id);
CREATE INDEX IF NOT EXISTS idx_geofences_owner ON geofences(owner_id);
