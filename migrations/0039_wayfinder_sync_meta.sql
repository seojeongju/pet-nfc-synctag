-- Cron·배치 동기화 오프셋 등 운영 메타 (키-값)
CREATE TABLE IF NOT EXISTS wayfinder_sync_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
