-- Mode announcements (admin -> guardians by mode and optional batch)
CREATE TABLE IF NOT EXISTS mode_announcements (
    id TEXT PRIMARY KEY,
    subject_kind TEXT NOT NULL,
    target_batch_id TEXT,
    title TEXT NOT NULL,
    body TEXT,
    link_url TEXT,
    attachment_r2_key TEXT,
    attachment_mime TEXT,
    attachment_kind TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    priority INTEGER NOT NULL DEFAULT 0,
    published_at DATETIME,
    expires_at DATETIME,
    created_by_email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_mode_announcements_kind_status ON mode_announcements(subject_kind, status);
CREATE INDEX IF NOT EXISTS idx_mode_announcements_published ON mode_announcements(status, published_at);
