-- 상품 옵션 및 주문 선택 옵션 필드 추가
ALTER TABLE shop_products ADD COLUMN options_json TEXT;
ALTER TABLE shop_orders ADD COLUMN options_selected_json TEXT;
