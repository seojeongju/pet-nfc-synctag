-- 태그 스튜디오: 서비스별 디자인 템플릿 (관리자 추가분)
-- 기본(builtin) 템플릿은 코드 시드(src/lib/platform/tag-templates.ts)를 쓰고,
-- 이 테이블에는 관리자가 추가·수정한 템플릿만 저장한다.

CREATE TABLE IF NOT EXISTS tag_design_templates (
    id TEXT PRIMARY KEY,
    service_id TEXT NOT NULL,
    form_factor_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    preview_hint TEXT NOT NULL DEFAULT '',
    -- TagDesignSpec 일부/전체 (정규화는 서버에서 수행)
    default_spec_json TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 100,
    active INTEGER NOT NULL DEFAULT 1,
    created_by TEXT REFERENCES user(id) ON DELETE SET NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tag_design_templates_service
  ON tag_design_templates(service_id, active, sort_order);
