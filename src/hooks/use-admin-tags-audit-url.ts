"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const AUDIT_PAGE_SIZE = 10;

export type AuditSuccessFilter = "all" | "success" | "failed";
export type AuditDaysFilter = 7 | 30 | 90;
export type AuditSortBy = "created_at" | "action" | "success";
export type AuditSortOrder = "asc" | "desc";
export type AuditPlatformFilter = "all" | "android" | "ios" | "unknown";
export type AuditModeFilter = "all" | "linku" | "tools" | "unknown";

export function useAdminTagsAuditUrl() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [auditSuccessFilter, setAuditSuccessFilter] = useState<AuditSuccessFilter>("all");
  const [auditDaysFilter, setAuditDaysFilter] = useState<AuditDaysFilter>(30);
  const [auditActorFilter, setAuditActorFilter] = useState("");
  const [auditActionFilter, setAuditActionFilter] = useState("");
  const [auditPlatformFilter, setAuditPlatformFilter] = useState<AuditPlatformFilter>("all");
  const [auditModeFilter, setAuditModeFilter] = useState<AuditModeFilter>("all");
  const [auditAppVersionFilter, setAuditAppVersionFilter] = useState("");
  const [auditSortBy, setAuditSortBy] = useState<AuditSortBy>("created_at");
  const [auditSortOrder, setAuditSortOrder] = useState<AuditSortOrder>("desc");
  const [auditPage, setAuditPage] = useState(1);

  const linkPageFromUrl = searchParams.get("lpage");
  const linkPageSizeFromUrl = searchParams.get("lps");

  useEffect(() => {
    const success = (searchParams.get("success") as AuditSuccessFilter) || "all";
    const days = Number(searchParams.get("days") || 30) as AuditDaysFilter;
    const actor = searchParams.get("actor") || "";
    const action = searchParams.get("action") || "";
    const platform = (searchParams.get("platform") as AuditPlatformFilter) || "all";
    const mode = (searchParams.get("mode") as AuditModeFilter) || "all";
    const appVersion = searchParams.get("appVersion") || "";
    const sortBy = (searchParams.get("sortBy") as AuditSortBy) || "created_at";
    const sortOrder = (searchParams.get("sortOrder") as AuditSortOrder) || "desc";
    const page = Number(searchParams.get("page") || 1);
    setAuditSuccessFilter(success);
    setAuditDaysFilter([7, 30, 90].includes(days) ? days : 30);
    setAuditActorFilter(actor);
    setAuditActionFilter(action);
    setAuditPlatformFilter(["all", "android", "ios", "unknown"].includes(platform) ? platform : "all");
    setAuditModeFilter(["all", "linku", "tools", "unknown"].includes(mode) ? mode : "all");
    setAuditAppVersionFilter(appVersion);
    setAuditSortBy(sortBy);
    setAuditSortOrder(sortOrder);
    setAuditPage(Number.isFinite(page) && page > 0 ? page : 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- URL은 마운트 시 1회 동기화
  }, []);

  useEffect(() => {
    setAuditPage(1);
  }, [auditSuccessFilter, auditDaysFilter, auditActorFilter, auditActionFilter, auditPlatformFilter, auditModeFilter, auditAppVersionFilter, auditSortBy, auditSortOrder]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("success", auditSuccessFilter);
    params.set("days", String(auditDaysFilter));
    if (auditActorFilter.trim()) params.set("actor", auditActorFilter.trim());
    if (auditActionFilter) params.set("action", auditActionFilter);
    if (auditPlatformFilter !== "all") params.set("platform", auditPlatformFilter);
    if (auditModeFilter !== "all") params.set("mode", auditModeFilter);
    if (auditAppVersionFilter.trim()) params.set("appVersion", auditAppVersionFilter.trim());
    params.set("sortBy", auditSortBy);
    params.set("sortOrder", auditSortOrder);
    params.set("page", String(auditPage));
    /** 상단「태그 연결·해제」목록 — 감사 `page`와 독립 (lpage / lps) */
    if (linkPageFromUrl && Math.max(1, Number(linkPageFromUrl) || 1) > 1) {
      params.set("lpage", linkPageFromUrl);
    }
    if (linkPageSizeFromUrl) {
      const n = Math.min(100, Math.max(5, Math.floor(Number(linkPageSizeFromUrl) || 20)));
      if (n !== 20) params.set("lps", String(n));
    }
    router.replace(`/admin/nfc-tags/history?${params.toString()}`);
  }, [
    auditSuccessFilter,
    auditDaysFilter,
    auditActorFilter,
    auditActionFilter,
    auditPlatformFilter,
    auditModeFilter,
    auditAppVersionFilter,
    auditSortBy,
    auditSortOrder,
    auditPage,
    linkPageFromUrl,
    linkPageSizeFromUrl,
    router,
  ]);

  const auditTotalPages = useCallback((auditTotalCount: number) => {
    return Math.max(1, Math.ceil(auditTotalCount / AUDIT_PAGE_SIZE));
  }, []);

  return {
    auditSuccessFilter,
    setAuditSuccessFilter,
    auditDaysFilter,
    setAuditDaysFilter,
    auditActorFilter,
    setAuditActorFilter,
    auditActionFilter,
    setAuditActionFilter,
    auditPlatformFilter,
    setAuditPlatformFilter,
    auditModeFilter,
    setAuditModeFilter,
    auditAppVersionFilter,
    setAuditAppVersionFilter,
    auditSortBy,
    setAuditSortBy,
    auditSortOrder,
    setAuditSortOrder,
    auditPage,
    setAuditPage,
    auditPageSize: AUDIT_PAGE_SIZE,
    auditTotalPages,
  };
}
