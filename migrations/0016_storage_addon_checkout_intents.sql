-- Checkout intent queue for storage addon purchases.
-- PG 연동 전에는 "구매 요청 접수" 상태를 기록하고 운영자가 후속 처리할 수 있게 합니다.

CREATE TABLE IF NOT EXISTS storage_addon_checkout_intents (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES storage_addon_products(id),
    status TEXT NOT NULL DEFAULT 'requested', -- requested | processing | completed | failed | cancelled
    note TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_storage_checkout_intents_user ON storage_addon_checkout_intents(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_storage_checkout_intents_status ON storage_addon_checkout_intents(status, created_at DESC);
