-- NFC 통합 플랫폼 P2: 커스텀 태그 디자인 (docs/NFC_PLATFORM_DEV_PLAN.md §7)
-- 서비스·폼팩터는 P2 동안 코드 상수(src/lib/platform/*)를 쓰고 id 문자열만 저장한다.

CREATE TABLE IF NOT EXISTS tag_designs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    service_id TEXT NOT NULL,
    form_factor_id TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    -- 문구·색상·재질 등 (src/lib/platform/tag-design.ts TagDesignSpec)
    design_json TEXT NOT NULL,
    -- 서비스별 NFC 내용(명함 정보, Wi-Fi SSID 등) — P5
    service_config_json TEXT,
    preview_key TEXT,
    glb_key TEXT,
    print_model_key TEXT,
    -- draft | ready | requested | locked
    status TEXT NOT NULL DEFAULT 'draft',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tag_designs_user ON tag_designs(user_id, updated_at DESC);
