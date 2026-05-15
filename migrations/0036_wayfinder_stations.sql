-- 링크유-동행: 지하철역( GPS 근처 역 찾기 · 파일럿 → 추후 공공데이터 )
CREATE TABLE IF NOT EXISTS wayfinder_stations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    lines TEXT,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    external_ref TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wayfinder_stations_active
  ON wayfinder_stations(is_active);
