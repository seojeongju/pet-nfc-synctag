"use client";

import { useCallback, useEffect, useState } from "react";
import { DASHBOARD_LINKED_TAGS_CHANGED_EVENT } from "@/lib/dashboard-nfc-nav-label";
import type { SubjectKind } from "@/lib/subject-kind";

export function useDashboardLinkedTagCount(
  kind: SubjectKind,
  tenant: string | null,
  enabled: boolean
): number | null {
  const [count, setCount] = useState<number | null>(null);

  const fetchCount = useCallback(async () => {
    if (!enabled) {
      setCount(null);
      return;
    }
    const qs = new URLSearchParams({ kind });
    if (tenant) qs.set("tenant", tenant);
    try {
      const res = await fetch(`/api/dashboard/nfc-nav-meta?${qs.toString()}`, {
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) {
        setCount(null);
        return;
      }
      const data = (await res.json()) as { linkedTagCount?: number };
      const n = Number(data.linkedTagCount ?? 0);
      setCount(Number.isFinite(n) && n >= 0 ? n : 0);
    } catch {
      setCount(null);
    }
  }, [kind, tenant, enabled]);

  useEffect(() => {
    void fetchCount();
  }, [fetchCount]);

  useEffect(() => {
    if (!enabled) return;
    const onChanged = () => void fetchCount();
    window.addEventListener(DASHBOARD_LINKED_TAGS_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(DASHBOARD_LINKED_TAGS_CHANGED_EVENT, onChanged);
  }, [enabled, fetchCount]);

  return count;
}
