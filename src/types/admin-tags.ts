/** 인벤토리 목록 필터: 재고 상태 */
export type TagsInventoryStatusFilter = "all" | "active" | "unsold" | "inactive";

/** pet_id 연결 여부 */
export type TagsInventoryLinkFilter = "all" | "linked" | "unlinked";

export type TagsInventoryPageParams = {
  q?: string;
  status?: TagsInventoryStatusFilter;
  /** 정확히 일치하는 batch_id (빈 문자열이면 전체) */
  batch?: string;
  /** 조직 스코프(선택). 지정 시 해당 조직 데이터만 조회 */
  tenantId?: string;
  page?: number;
  pageSize?: number;
  /**
   * 할당 모드(tags.assigned_subject_kind). 빈 값 = 전체.
   * `"__unset__"` = 모드 컬럼이 비어 있거나 NULL인 태그만.
   */
  kind?: string;
  /** 연결 상태: 전체 / 펫(대상) 연결됨 / 미연결 */
  link?: TagsInventoryLinkFilter;
  /** 등록일(태그 created_at) 시작 YYYY-MM-DD */
  regFrom?: string;
  /** 등록일 종료 YYYY-MM-DD */
  regTo?: string;
};

/** 관리자 태그 재고 화면용 데이터 형태 (태그 조인 결과) */
export type AdminTag = {
  id: string;
  pet_id?: string | null;
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

/** tags.batch_id 기준 집계 행(인벤토리·대시보드 공통) */
export type TagBatchSummaryRow = {
  batch_id: string;
  total_count: number;
  active_count: number;
  unsold_count: number;
  latest_created_at: string;
};

export type TagBatchesPageResult = {
  rows: TagBatchSummaryRow[];
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
  batches: TagBatchSummaryRow[];
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

export type TagLinkLogsPageResult = {
  rows: TagLinkLogRow[];
  total: number;
  page: number;
  pageSize: number;
};

export type AdminAuditLogRow = {
  id: number;
  action: string;
  actor_email?: string | null;
  success: number;
  payload?: string | null;
  created_at: string;
};
