-- 주문 테이블에 배송지 정보 필드 추가
ALTER TABLE shop_orders ADD COLUMN recipient_name TEXT;
ALTER TABLE shop_orders ADD COLUMN recipient_phone TEXT;
ALTER TABLE shop_orders ADD COLUMN shipping_zip TEXT;
ALTER TABLE shop_orders ADD COLUMN shipping_address TEXT;
ALTER TABLE shop_orders ADD COLUMN shipping_memo TEXT;
