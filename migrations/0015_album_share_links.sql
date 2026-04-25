-- Album share links (token-based read-only access).
-- Default album visibility remains guardian-only; share links are explicit opt-in.

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
