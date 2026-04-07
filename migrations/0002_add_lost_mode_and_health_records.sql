-- Migration number: 0001 	 2026-04-07T07:19:19.984Z

-- 1. Add column is_lost to pets table
ALTER TABLE pets ADD COLUMN is_lost BOOLEAN DEFAULT 0;

-- 2. Add column theme_color to pets table (Default is Teal-500)
ALTER TABLE pets ADD COLUMN theme_color TEXT DEFAULT '#14b8a6';

-- 3. Create health_records table
CREATE TABLE IF NOT EXISTS health_records (
    id TEXT PRIMARY KEY,
    pet_id TEXT NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'vaccine', 'medical', 'grooming', 'note'
    title TEXT NOT NULL,
    description TEXT,
    record_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_health_records_pet_id ON health_records(pet_id);
