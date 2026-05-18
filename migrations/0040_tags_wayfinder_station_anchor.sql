-- NFC 태그 → 역·시설 앵커 (3단계: 역 앵커)
ALTER TABLE tags ADD COLUMN wayfinder_station_id TEXT REFERENCES wayfinder_stations(id) ON DELETE SET NULL;
ALTER TABLE tags ADD COLUMN wayfinder_facility_id TEXT;
