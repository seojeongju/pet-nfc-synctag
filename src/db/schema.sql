-- User Table (Singular, CamelCase)
CREATE TABLE IF NOT EXISTS user (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    emailVerified BOOLEAN NOT NULL DEFAULT FALSE,
    image TEXT,
    role TEXT DEFAULT 'user', -- user | platform_admin (플랫폼 운영자; 레거시 admin은 마이그레이션으로 치환)
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
-- Optional columns (see migrations): ble_mac, product_name, assigned_subject_kind, status, batch_id

-- Mode announcements (see migrations/0007_mode_announcements.sql)
-- CREATE TABLE mode_announcements (...)

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

CREATE TABLE IF NOT EXISTS landing_auto_route_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    resolved_kind TEXT NOT NULL,
    authenticated INTEGER NOT NULL DEFAULT 0,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_landing_auto_route_created ON landing_auto_route_events(created_at);

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

-- Multi-tenancy & subscriptions (see migrations/0008_tenants_subscriptions.sql)
-- tenants, tenant_members, plans, subscriptions; pets.tenant_id, tags.tenant_id (nullable)

-- Personal album storage quota & paid addons (see migrations/0013_user_storage_quota_and_addons.sql)
CREATE TABLE IF NOT EXISTS user_storage_profiles (
    user_id TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE,
    base_quota_mb INTEGER NOT NULL DEFAULT 512,
    used_quota_mb INTEGER NOT NULL DEFAULT 0,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS storage_addon_products (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    extra_quota_mb INTEGER NOT NULL,
    monthly_price_krw INTEGER NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_storage_addon_subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES storage_addon_products(id),
    status TEXT NOT NULL DEFAULT 'active',
    current_period_end DATETIME,
    external_provider TEXT,
    external_id TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_storage_addons_user ON user_storage_addon_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_storage_addons_status ON user_storage_addon_subscriptions(status);

INSERT OR IGNORE INTO storage_addon_products
    (id, code, name, extra_quota_mb, monthly_price_krw, sort_order, is_active)
VALUES
    ('addon_storage_1gb', 'storage_1gb', '스토리지 +1GB', 1024, 1900, 0, 1),
    ('addon_storage_3gb', 'storage_3gb', '스토리지 +3GB', 3072, 4900, 1, 1),
    ('addon_storage_10gb', 'storage_10gb', '스토리지 +10GB', 10240, 12900, 2, 1);

-- Core albums (guardian-only by default)
CREATE TABLE IF NOT EXISTS albums (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    subject_kind TEXT NOT NULL DEFAULT 'pet',
    tenant_id TEXT REFERENCES tenants(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    cover_asset_id TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_albums_owner_kind ON albums(owner_id, subject_kind, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_albums_tenant ON albums(tenant_id, subject_kind, created_at DESC);

CREATE TABLE IF NOT EXISTS album_assets (
    id TEXT PRIMARY KEY,
    album_id TEXT NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
    r2_key TEXT NOT NULL UNIQUE,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    size_mb INTEGER NOT NULL,
    caption TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_album_assets_album_created ON album_assets(album_id, created_at DESC);

CREATE TABLE IF NOT EXISTS album_share_links (
    id TEXT PRIMARY KEY,
    album_id TEXT NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
    created_by_user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at DATETIME,
    revoked_at DATETIME,
    view_count INTEGER NOT NULL DEFAULT 0,
    last_viewed_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_album_share_links_album ON album_share_links(album_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_album_share_links_active ON album_share_links(album_id, revoked_at, expires_at);

CREATE TABLE IF NOT EXISTS album_share_access_logs (
    id TEXT PRIMARY KEY,
    share_link_id TEXT NOT NULL REFERENCES album_share_links(id) ON DELETE CASCADE,
    ip_address TEXT,
    user_agent TEXT,
    success INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_album_share_access_link_created ON album_share_access_logs(share_link_id, created_at DESC);

CREATE TABLE IF NOT EXISTS storage_addon_checkout_intents (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES storage_addon_products(id),
    status TEXT NOT NULL DEFAULT 'requested',
    note TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_storage_checkout_intents_user ON storage_addon_checkout_intents(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_storage_checkout_intents_status ON storage_addon_checkout_intents(status, created_at DESC);
