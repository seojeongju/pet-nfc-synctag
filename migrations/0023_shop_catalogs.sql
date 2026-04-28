-- 상품 카달로그 테이블 추가
CREATE TABLE IF NOT EXISTS shop_catalogs (
    id TEXT PRIMARY KEY,
    tenant_id TEXT, -- 테넌트별 (nullable)
    user_id TEXT,   -- 사용자별 (nullable)
    mode TEXT NOT NULL, -- 모드별 (pet, child, gold, all 등)
    title TEXT NOT NULL,
    description TEXT,
    products_json TEXT NOT NULL, -- 포함된 상품 ID 배열 (JSON)
    config_json TEXT,           -- 카달로그 디자인/설정 (JSON)
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shop_catalogs_tenant ON shop_catalogs(tenant_id, mode);
CREATE INDEX IF NOT EXISTS idx_shop_catalogs_user ON shop_catalogs(user_id, mode);
