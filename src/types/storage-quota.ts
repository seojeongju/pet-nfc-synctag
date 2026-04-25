export type StorageAddonSubscriptionStatus = "active" | "past_due" | "cancelled" | "trialing";

export type StorageAddonProductRow = {
  id: string;
  code: string;
  name: string;
  extra_quota_mb: number;
  monthly_price_krw: number;
  sort_order: number;
  is_active: number;
  created_at: string;
};

export type StorageAddonProductSummary = {
  id: string;
  code: string;
  name: string;
  extraQuotaMb: number;
  monthlyPriceKrw: number;
  sortOrder: number;
};

export type UserStorageProfileRow = {
  user_id: string;
  base_quota_mb: number;
  used_quota_mb: number;
  updated_at: string;
};

export type UserStorageAddonSubscriptionRow = {
  id: string;
  user_id: string;
  product_id: string;
  status: StorageAddonSubscriptionStatus;
  current_period_end: string | null;
  external_provider: string | null;
  external_id: string | null;
  created_at: string;
  updated_at: string;
};

export type UserStorageQuotaSummary = {
  baseQuotaMb: number;
  usedQuotaMb: number;
  extraQuotaMb: number;
  effectiveQuotaMb: number;
  freeQuotaMb: number;
  usagePercent: number;
};

export type UserStorageAddonSubscriptionSummary = {
  id: string;
  productId: string;
  productName: string;
  extraQuotaMb: number;
  monthlyPriceKrw: number;
  status: StorageAddonSubscriptionStatus;
  currentPeriodEnd: string | null;
  createdAt: string;
};
