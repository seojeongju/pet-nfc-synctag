-- 되팔기 노출 종료일시 (NULL이면 종료일 없음·계속 유지)
ALTER TABLE gold_order_resale_policies ADD COLUMN resale_visible_until DATETIME;
