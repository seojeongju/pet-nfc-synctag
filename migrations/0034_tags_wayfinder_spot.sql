-- 인벤토리 태그(UID) ↔ 링크유-동행 공개 스팟 연결 (관리자 UID 등록·URL 기록 흐름과 동일)
ALTER TABLE tags ADD COLUMN wayfinder_spot_id TEXT REFERENCES wayfinder_spots(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tags_wayfinder_spot_id ON tags(wayfinder_spot_id);
