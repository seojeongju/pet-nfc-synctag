-- 링크유-동행: 시설·NFC 스팟 메타데이터 (공개 안내용 slug, 보호자/조직 스코프)
CREATE TABLE IF NOT EXISTS wayfinder_spots (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    tenant_id TEXT REFERENCES tenants(id) ON DELETE SET NULL,
    subject_kind TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    summary TEXT,
    guide_text TEXT,
    latitude REAL,
    longitude REAL,
    floor_label TEXT,
    is_published INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wayfinder_spots_owner_kind
  ON wayfinder_spots(owner_id, subject_kind, tenant_id);
CREATE INDEX IF NOT EXISTS idx_wayfinder_spots_published_slug
  ON wayfinder_spots(is_published, slug);
