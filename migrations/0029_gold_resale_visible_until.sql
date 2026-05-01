-- 되팔기 노출 종료일시 (NULL이면 종료일 없음·계속 유지)
--
-- 재실행 시 SQLITE_ERROR duplicate column name: resale_visible_until 이면
-- 원격 DB에 컬럼이 이미 있는 상태입니다. 롤백 없이 그대로 두면 되며 추가 조치는 필요 없습니다.
-- (SQLite는 ADD COLUMN IF NOT EXISTS를 지원하지 않음.)
ALTER TABLE gold_order_resale_policies ADD COLUMN resale_visible_until DATETIME;
