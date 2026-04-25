-- Core album domain for guardian dashboards.
-- Owner-private by default. Shared-link policies are added in later migration.

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
