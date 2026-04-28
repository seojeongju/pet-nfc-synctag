/** `jewelry_warranty_certificates.product_snapshot_json` */
export type JewelryWarrantyProductSnapshot = {
  issuerName: string;
  productLine: string;
  petName: string;
  breed: string | null;
  /** 선택: 스토어 주문·품목과 연동 시 */
  orderId: string | null;
  /** 보증 범위 요약(고정 문구 + 필요 시 보완) */
  warrantyScopeSummary: string;
};

export type JewelryWarrantyRow = {
  id: string;
  pet_id: string;
  owner_id: string;
  order_id: string | null;
  certificate_no: string;
  public_verify_id: string;
  issued_at: string;
  valid_until: string | null;
  product_snapshot_json: string;
  status: string;
  revoked_at: string | null;
  revoke_reason: string | null;
  created_at: string;
  updated_at: string;
};
