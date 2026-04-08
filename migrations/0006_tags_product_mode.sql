-- Product label and admin-assigned mode (skip hub mode picker when set)
ALTER TABLE tags ADD COLUMN product_name TEXT;
ALTER TABLE tags ADD COLUMN assigned_subject_kind TEXT;
