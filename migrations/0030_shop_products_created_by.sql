-- 상품 등록자(조직 관리자 스코프용). 기존·시드 행은 NULL → 플랫폼 관리자만 편집.
-- D1 SQLite는 ADD COLUMN IF NOT EXISTS 미지원. 중복 컬럼 오류 시 이미 적용된 것.
ALTER TABLE shop_products ADD COLUMN created_by_user_id TEXT REFERENCES user(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_shop_products_created_by ON shop_products(created_by_user_id);
