import type { SubjectKind } from "@/lib/subject-kind";

export type ShopOrderStatus = "pending" | "paid" | "failed" | "cancelled";

export type ShopProductOptionValue = {
  label: string;
  priceDeltaKrw: number;
};

export type ShopProductOptionGroup = {
  id: string;
  name: string;
  values: ShopProductOptionValue[];
};

export type ShopProductPublic = {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceKrw: number;
  imageUrl: string | null;
  videoUrl?: string | null;
  contentHtml?: string | null;
  additionalImages?: string[] | null;
  options?: ShopProductOptionGroup[] | null;
  stockQuantity: number;
  /** 골드바 관련 */
  weightGrams?: number | null;
  laborFeeKrw?: number | null;
  isGoldLinked?: boolean;
  /** 노출 검증에 쓴 모드 (UI 표시용) */
  subjectKind: SubjectKind;
};

/**
 * 상품 카달로그 정의
 */
export interface ShopCatalog {
  id: string;
  tenantId: string | null;
  userId: string | null;
  mode: string;
  title: string;
  description: string | null;
  productIds: string[];
  config: CatalogConfig;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogConfig {
  themeColor?: string;
  layout?: "grid" | "list" | "featured";
  showPrice?: boolean;
  showDescription?: boolean;
  heroImageUrl?: string | null;
}

export type ShopOrderPublic = {
  id: string;
  subjectKind: SubjectKind;
  status: ShopOrderStatus;
  amountKrw: number;
  purchasePriceKrw: number;
  product: { id: string; name: string; slug: string };
  resaleOfferVisible: boolean;
  resaleOfferPriceKrw?: number | null;
  resaleVisibleFrom?: string | null;
  /** 되팔기 노출 종료(null이면 종료일 없음) */
  resaleVisibleUntil?: string | null;
  selectedOptions?: Record<string, string> | null;
  recipientName?: string | null;
  recipientPhone?: string | null;
  shippingZip?: string | null;
  shippingAddress?: string | null;
  shippingAddressDetail?: string | null;
  shippingMemo?: string | null;
  createdAt: string;
  updatedAt: string;
};
