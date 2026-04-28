-- 상품 상세페이지 고도화를 위한 필드 추가
ALTER TABLE shop_products ADD COLUMN video_url TEXT;
ALTER TABLE shop_products ADD COLUMN content_html TEXT;
ALTER TABLE shop_products ADD COLUMN additional_images TEXT; -- JSON array of URLs
