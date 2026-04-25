-- Personal album storage quota and paid addon foundation.
-- Policy:
-- - Every user has a base quota (default 512MB).
-- - Users can purchase one or more active addon subscriptions for extra quota.
-- - Effective quota = base_quota_mb + SUM(active addon extra_quota_mb).

CREATE TABLE IF NOT EXISTS user_storage_profiles (
    user_id TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE,
    base_quota_mb INTEGER NOT NULL DEFAULT 512,
    used_quota_mb INTEGER NOT NULL DEFAULT 0,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS storage_addon_products (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    extra_quota_mb INTEGER NOT NULL,
    monthly_price_krw INTEGER NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_storage_addon_subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES storage_addon_products(id),
    status TEXT NOT NULL DEFAULT 'active', -- active | past_due | cancelled | trialing
    current_period_end DATETIME,
    external_provider TEXT,
    external_id TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_storage_addons_user ON user_storage_addon_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_storage_addons_status ON user_storage_addon_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_storage_addon_products_active ON storage_addon_products(is_active, sort_order);

INSERT OR IGNORE INTO storage_addon_products
    (id, code, name, extra_quota_mb, monthly_price_krw, sort_order, is_active)
VALUES
    ('addon_storage_1gb', 'storage_1gb', '스토리지 +1GB', 1024, 1900, 0, 1),
    ('addon_storage_3gb', 'storage_3gb', '스토리지 +3GB', 3072, 4900, 1, 1),
    ('addon_storage_10gb', 'storage_10gb', '스토리지 +10GB', 10240, 12900, 2, 1);
