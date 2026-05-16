-- 링크유-동행: 역별 교통약자 편의시설 (공공데이터 동기화 · D1 캐시)
CREATE TABLE IF NOT EXISTS wayfinder_station_facilities (
    id TEXT PRIMARY KEY,
    station_id TEXT NOT NULL,
    facility_type TEXT NOT NULL,
    label TEXT NOT NULL,
    description TEXT,
    line_name TEXT,
    floor_text TEXT,
    entrance_no TEXT,
    operation_status TEXT,
    latitude REAL,
    longitude REAL,
    external_source TEXT NOT NULL DEFAULT 'seoul_metro_wksn',
    external_ref TEXT,
    synced_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wayfinder_station_facilities_station
  ON wayfinder_station_facilities(station_id);

CREATE INDEX IF NOT EXISTS idx_wayfinder_station_facilities_type
  ON wayfinder_station_facilities(station_id, facility_type);
