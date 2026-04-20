import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Megaphone,
  Radio,
  Building2,
  LayoutGrid,
  ListPlus,
  Smartphone,
  Database,
  History,
} from "lucide-react";

export type NavLeaf = { href: string; label: string; icon: LucideIcon; color: string };

export type NavSection = { id: string; title: string; items: NavLeaf[] };

export const ADMIN_NAV_SECTIONS: NavSection[] = [
  {
    id: "ops",
    title: "운영·현황",
    items: [
      { href: "/admin", label: "운영 대시보드", icon: LayoutDashboard, color: "text-teal-500" },
      { href: "/admin/announcements", label: "모드·배치 공지", icon: Megaphone, color: "text-indigo-500" },
      { href: "/admin/monitoring", label: "NFC/BLE 모니터링", icon: Radio, color: "text-sky-500" },
    ],
  },
  {
    id: "nfc",
    title: "Pet-ID NFC",
    items: [
      { href: "/admin/nfc-tags", label: "허브·워크플로", icon: LayoutGrid, color: "text-amber-500" },
      { href: "/admin/nfc-tags/register", label: "① UID 등록", icon: ListPlus, color: "text-teal-600" },
      { href: "/admin/nfc-tags/write-url", label: "② URL 기록", icon: Smartphone, color: "text-indigo-600" },
      { href: "/admin/nfc-tags/inventory", label: "③ 인벤토리", icon: Database, color: "text-amber-600" },
      { href: "/admin/nfc-tags/history", label: "④ 연결·감사", icon: History, color: "text-slate-600" },
    ],
  },
  {
    id: "org",
    title: "조직",
    items: [{ href: "/admin/tenants", label: "조직·멤버 관리", icon: Building2, color: "text-emerald-500" }],
  },
];

export function normalizeAdminPath(pathname: string) {
  const p = pathname.replace(/\/$/, "") || "/";
  return p;
}

export function isAdminNavActive(pathname: string, href: string) {
  const p = normalizeAdminPath(pathname);
  const h = normalizeAdminPath(href);
  if (h === "/admin") return p === "/admin";
  if (h === "/admin/nfc-tags") return p === "/admin/nfc-tags";
  return p === h || p.startsWith(`${h}/`);
}
