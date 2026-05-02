-- 원격 DB에 스키마는 이미 반영되어 있는데 wrangler 기록만 비어 있을 때 한 번 실행합니다.
-- 반드시 아래 마이그레이션 내용이 실제 DB와 일치하는지 확인한 뒤 사용하세요.
--
-- 적용: npx wrangler d1 execute pet-id-db --remote --file=scripts/sql/d1-baseline-0012-through-0029.sql
-- 이후: npx wrangler d1 migrations apply pet-id-db --remote  → 0030만 실행됩니다.

INSERT OR IGNORE INTO d1_migrations (name) VALUES
('0012_tenants_allowed_subject_kinds.sql'),
('0013_user_storage_quota_and_addons.sql'),
('0014_albums_core.sql'),
('0015_album_share_links.sql'),
('0016_storage_addon_checkout_intents.sql'),
('0017_shop_catalog_and_orders.sql'),
('0018_add_shop_product_extended_fields.sql'),
('0019_add_shop_options.sql'),
('0020_add_shop_stock.sql'),
('0021_add_shipping_to_orders.sql'),
('0022_gold_pricing.sql'),
('0023_jewelry_warranty_certificates.sql'),
('0023_shop_catalogs.sql'),
('0024_gold_order_resale_policies.sql'),
('0025_user_force_password_change.sql'),
('0026_pets_subject_kind_backfill.sql'),
('0027_tags_release_orphan_pet_links.sql'),
('0028_user_subscription_status.sql'),
('0029_gold_resale_visible_until.sql');
