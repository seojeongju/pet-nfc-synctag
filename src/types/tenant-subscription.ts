/** Organization (tenant). */
export type TenantStatus = "active" | "suspended";

/** Membership role within a tenant. */
export type TenantRole = "owner" | "admin" | "member";

/**
 * Subscription billing subject: exactly one of tenant OR user (personal) per row.
 */
export type SubscriptionStatus = "active" | "past_due" | "cancelled" | "trialing";

export type PlanRow = {
  id: string;
  code: string;
  name: string;
  pet_limit: number | null;
  tag_limit: number | null;
  features_json: string | null;
  sort_order: number;
};

export type TenantRow = {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  created_at: string;
  updated_at: string;
};

/** Tenant row plus membership role (list/hub). */
export type TenantWithRole = TenantRow & { role: TenantRole };

export type TenantMemberRow = {
  tenant_id: string;
  user_id: string;
  role: TenantRole;
  created_at: string;
};

export type SubscriptionRow = {
  id: string;
  tenant_id: string | null;
  user_id: string | null;
  plan_id: string;
  status: SubscriptionStatus;
  current_period_end: string | null;
  external_provider: string | null;
  external_id: string | null;
  created_at: string;
  updated_at: string;
};
