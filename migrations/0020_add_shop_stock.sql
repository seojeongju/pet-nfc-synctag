-- 상품 재고 수량 필드 추가
ALTER TABLE shop_products ADD COLUMN stock_quantity INTEGER DEFAULT 999;
