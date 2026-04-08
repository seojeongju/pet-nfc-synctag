-- NFC unknown UID access log
CREATE TABLE IF NOT EXISTS unknown_tag_accesses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tag_uid TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_unknown_tag_created ON unknown_tag_accesses(created_at);

ALTER TABLE tags ADD COLUMN ble_mac TEXT;

CREATE INDEX IF NOT EXISTS idx_scan_logs_scanned_at ON scan_logs(scanned_at);
