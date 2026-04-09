"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Bell } from "lucide-react";

export function DashboardAnnouncementBell() {
  const searchParams = useSearchParams();
  const kind = searchParams.get("kind") ?? "pet";
  const tenant = searchParams.get("tenant")?.trim() ?? "";
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const q = new URLSearchParams({ kind });
    if (tenant) q.set("tenant", tenant);
    let cancelled = false;
    fetch(`/api/dashboard/announcements?${q.toString()}`)
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d: unknown) => {
        const items =
          d && typeof d === "object" && "items" in d && Array.isArray((d as { items: unknown[] }).items)
            ? (d as { items: unknown[] }).items
            : [];
        if (!cancelled) setCount(items.length);
      })
      .catch(() => {
        if (!cancelled) setCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [kind, tenant]);

  const hrefParams = new URLSearchParams({ kind });
  if (tenant) hrefParams.set("tenant", tenant);
  const href = `/dashboard?${hrefParams.toString()}#mode-announcements`;

  return (
    <Link
      href={href}
      className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
      title="운영 공지 · 모드 알림"
      aria-label="운영 공지 보기"
    >
      <Bell className="h-4 w-4" />
      {count !== null && count > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white shadow-sm">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}
