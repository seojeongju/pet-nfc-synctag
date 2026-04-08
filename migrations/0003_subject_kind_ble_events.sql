-- 관리 대상 유형 (반려동물 노인 어린이 수화물)
ALTER TABLE pets ADD COLUMN subject_kind TEXT DEFAULT 'pet';

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