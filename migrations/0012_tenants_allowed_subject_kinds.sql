-- B2B 조직별 사용 가능한 Link-U 모드(제품 라인). NULL 또는 빈 값 = 제한 없음(기존과 동일).
-- JSON 배열 텍스트 예: '["pet"]' , '["pet","child"]'

ALTER TABLE tenants ADD COLUMN allowed_subject_kinds TEXT;
