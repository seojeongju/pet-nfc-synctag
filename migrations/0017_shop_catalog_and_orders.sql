-- 모드별 상품 카탈로그 및 주문(결제 연동 전 pending 보관).

CREATE TABLE IF NOT EXISTS shop_products (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    price_krw INTEGER NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    -- JSON 배열: ["pet","child",...] — 해당 모드 사용자에게만 노출
    target_modes TEXT NOT NULL,
    image_url TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shop_products_active_sort ON shop_products(active, sort_order, name);

CREATE TABLE IF NOT EXISTS shop_orders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    subject_kind TEXT NOT NULL,
    product_id TEXT NOT NULL REFERENCES shop_products(id),
    amount_krw INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    -- pg | payssam | manual 등
    payment_provider TEXT,
    external_payment_id TEXT,
    idempotency_key TEXT UNIQUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shop_orders_user ON shop_orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shop_orders_status ON shop_orders(status, created_at DESC);

-- 시드(개발·데모용, 운영에서 관리자/마이그레이션으로 대체 가능)
INSERT OR IGNORE INTO shop_products (id, slug, name, description, price_krw, active, target_modes, image_url, sort_order) VALUES
(
  'shop_seed_pet_nfc',
  'pet-nfc-starter',
  '링크유-펫 NFC 스타터 세트',
  '반려동물용 NFC 인식표와 등록 가이드가 함께 제공됩니다. 대시보드에서 태그를 연결한 뒤 바로 사용할 수 있어요.',
  19800,
  1,
  '["pet"]',
  NULL,
  10
),
(
  'shop_seed_child_safety',
  'child-safety-kit',
  '링크유-키즈 안심 키트',
  '아이 모드에 맞춘 안내 카드와 보호자 연결 절차를 담았습니다. 모드 대시보드와 함께 사용하세요.',
  24900,
  1,
  '["child"]',
  NULL,
  20
),
(
  'shop_seed_family_bundle',
  'family-link-bundle',
  '가족 연결 번들 (펫·키즈)',
  '펫과 키즈 모드 모두를 쓰는 가족을 위한 번들 상품입니다. 한 번에 결제하고 각 모드에서 안내를 확인하세요.',
  39000,
  1,
  '["pet","child"]',
  NULL,
  30
),
(
  'shop_seed_elder_care',
  'elder-care-package',
  '링크유-메모리 케어 패키지',
  '어르신 모드 전용 구성입니다. 연락 안내와 태그 연결 흐름을 정리해 두었습니다.',
  22900,
  1,
  '["elder"]',
  NULL,
  40
),
(
  'shop_seed_luggage_tag',
  'luggage-smart-tag',
  '링크유-러기지 스마트 태그',
  '수하물·이동 수단에 맞는 NFC 연결 상품입니다. 분실 시 연락 흐름을 빠르게 이어줍니다.',
  17900,
  1,
  '["luggage"]',
  NULL,
  50
),
(
  'shop_seed_gold',
  'gold-keeper-set',
  '링크유-골드 키퍼 세트',
  '주얼리 모드에 맞춘 연결·안내 구성입니다.',
  15900,
  1,
  '["gold"]',
  NULL,
  60
);
