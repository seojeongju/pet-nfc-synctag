export const TENANT_AUDIT_ACTIONS = [
  "tenant_create_by_admin",
  "tenant_rename_by_admin",
  "tenant_member_upsert_by_admin",
  "tenant_member_role_change_by_admin",
  "tenant_member_remove_by_admin",
  "tenant_status_change_by_admin",
  "tenant_invite_create_by_admin",
  "tenant_allowed_modes_by_admin",
] as const;

export type TenantOrgAuditFilter = {
  action?: string;
  actorContains?: string;
  /** YYYY-MM-DD, created_at date (inclusive) */
  dateFrom?: string;
  /** YYYY-MM-DD, created_at date (inclusive) */
  dateTo?: string;
  limit?: number;
};
