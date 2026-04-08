/** 관리자 태그 재고 화면용 데이터 형태 (getAllTags 조인 결과) */
export type AdminTag = {
  id: string;
  pet_name?: string | null;
  owner_email?: string | null;
  batch_id?: string | null;
  status: string;
  created_at: string;
  product_name?: string | null;
  assigned_subject_kind?: string | null;
  ble_mac?: string | null;
};

export type TagOpsStats = {
  totalCount: number;
  activeCount: number;
  unsoldCount: number;
  activationRate: number;
  recentLinks: number;
  failedRegistrations7d: number;
  batches: Array<{
    batch_id: string;
    total_count: number;
    active_count: number;
    unsold_count: number;
    latest_created_at: string;
  }>;
};

export type TagLinkLogRow = {
  id: number;
  tag_id: string;
  pet_id: string;
  action: "link" | "unlink";
  created_at: string;
  pet_name?: string | null;
  owner_email?: string | null;
};

export type AdminAuditLogRow = {
  id: number;
  action: string;
  actor_email?: string | null;
  success: number;
  payload?: string | null;
  created_at: string;
};
