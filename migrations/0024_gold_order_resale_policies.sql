-- 골드 주문별 되팔기(판매가) 노출 정책

CREATE TABLE IF NOT EXISTS gold_order_resale_policies (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE REFERENCES shop_orders(id) ON DELETE CASCADE,
  purchase_price_krw INTEGER NOT NULL,
  resale_offer_price_krw INTEGER,
  resale_visible_from DATETIME,
  visibility_scope TEXT NOT NULL DEFAULT 'order_buyer', -- order_buyer | selected_buyers
  enabled INTEGER NOT NULL DEFAULT 0,
  created_by_user_id TEXT REFERENCES user(id) ON DELETE SET NULL,
  updated_by_user_id TEXT REFERENCES user(id) ON DELETE SET NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gold_resale_order ON gold_order_resale_policies(order_id);
CREATE INDEX IF NOT EXISTS idx_gold_resale_visible ON gold_order_resale_policies(enabled, resale_visible_from);

CREATE TABLE IF NOT EXISTS gold_order_resale_targets (
  id TEXT PRIMARY KEY,
  policy_id TEXT NOT NULL REFERENCES gold_order_resale_policies(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(policy_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_gold_resale_targets_user ON gold_order_resale_targets(user_id, policy_id);
