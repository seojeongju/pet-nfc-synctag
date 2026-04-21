/** 인벤토리 목록 필터: 재고 상태 */
export type TagsInventoryStatusFilter = "all" | "active" | "unsold" | "inactive";

export type TagsInventoryPageParams = {
  q?: string;
  status?: TagsInventoryStatusFilter;
  /** 정확히 일치하는 batch_id (빈 문자열이면 전체) */
  batch?: string;
  page?: number;
  pageSize?: number;
};

/** 관리자 태그 재고 화면용 데이터 형태 (태그 조인 결과) */
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

export type TagsInventoryPageResult = {
  rows: AdminTag[];
  total: number;
  page: number;
  pageSize: number;
};

export type TagOpsStats = {
  totalCount: number;
  activeCount: number;
  unsoldCount: number;
  activationRate: number;
  recentLinks: number;
  failedRegistrations7d: number;
  webWriteFailures7d: number;
  nativeWriteSuccessFromWebFail7d: number;
  nativeRecoveryRate7d: number;
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
