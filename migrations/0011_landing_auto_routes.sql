CREATE TABLE IF NOT EXISTS landing_auto_route_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  resolved_kind TEXT NOT NULL,
  authenticated INTEGER NOT NULL DEFAULT 0,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_landing_auto_route_created
  ON landing_auto_route_events(created_at);