-- 골드바 상품 전용 필드 및 금 시세 테이블 추가
ALTER TABLE shop_products ADD COLUMN weight_grams REAL;
ALTER TABLE shop_products ADD COLUMN labor_fee_krw INTEGER DEFAULT 0;
ALTER TABLE shop_products ADD COLUMN is_gold_linked INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS gold_prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    price_per_gram REAL NOT NULL,
    source TEXT NOT NULL, -- 'AUTO' 또는 'MANUAL'
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gold_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    use_auto_fetch INTEGER NOT NULL DEFAULT 1, -- 1: 자동, 0: 수동
    manual_override_price REAL,
    last_fetched_at DATETIME,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 초기 설정 삽입
INSERT OR IGNORE INTO gold_settings (id, use_auto_fetch) VALUES (1, 1);
