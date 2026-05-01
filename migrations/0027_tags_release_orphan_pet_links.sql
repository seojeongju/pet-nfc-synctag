-- 반려동물 삭제 시 FK가 꺼져 있거나 과거 데이터로 남은 고아 태그 연결을 해제합니다.
-- idempotent · 여러 번 실행해도 안전합니다.

UPDATE tags
SET
    pet_id = NULL,
    tenant_id = NULL,
    is_active = 0,
    updated_at = CURRENT_TIMESTAMP
WHERE pet_id IS NOT NULL
  AND pet_id NOT IN (SELECT id FROM pets);
