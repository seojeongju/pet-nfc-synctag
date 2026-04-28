-- 링크유 골드 주얼리 보증서(전자·인쇄) 발급 및 공개 검증용

CREATE TABLE IF NOT EXISTS jewelry_warranty_certificates (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  owner_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  order_id TEXT REFERENCES shop_orders(id) ON DELETE SET NULL,
  certificate_no TEXT NOT NULL UNIQUE,
  public_verify_id TEXT NOT NULL UNIQUE,
  issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  valid_until DATETIME,
  product_snapshot_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- active | revoked
  revoked_at DATETIME,
  revoke_reason TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_jwc_pet_status ON jewelry_warranty_certificates(pet_id, status);
CREATE INDEX IF NOT EXISTS idx_jwc_owner_issued ON jewelry_warranty_certificates(owner_id, issued_at DESC);
CREATE INDEX IF NOT EXISTS idx_jwc_public ON jewelry_warranty_certificates(public_verify_id);
