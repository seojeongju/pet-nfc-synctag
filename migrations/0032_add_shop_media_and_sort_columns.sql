-- Migration: add_shop_media_and_sort_columns
-- Description: Adds additional_images, video_url, and sort_order columns to shop_products table

ALTER TABLE shop_products ADD COLUMN additional_images TEXT;
ALTER TABLE shop_products ADD COLUMN video_url TEXT;
ALTER TABLE shop_products ADD COLUMN sort_order INTEGER DEFAULT 0;
