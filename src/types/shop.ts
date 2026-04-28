import type { SubjectKind } from "@/lib/subject-kind";

export type ShopOrderStatus = "pending" | "paid" | "failed" | "cancelled";

export type ShopProductPublic = {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceKrw: number;
  imageUrl: string | null;
  /** 노출 검증에 쓴 모드 (UI 표시용) */
  subjectKind: SubjectKind;
};

export type ShopOrderPublic = {
  id: string;
  subjectKind: SubjectKind;
  status: ShopOrderStatus;
  amountKrw: number;
  product: { id: string; name: string; slug: string };
  createdAt: string;
  updatedAt: string;
};
