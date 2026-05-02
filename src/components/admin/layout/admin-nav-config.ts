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
  Users,
  ShieldCheck,
  CreditCard,
  ShoppingBag,
  ReceiptText,
  HandCoins,
} from "lucide-react";

export type NavLeaf = { href: string; label: string; icon: LucideIcon; color: string };

export type NavSection = { id: string; title: string; items: NavLeaf[] };

/** 조직(테넌트) 관리자 콘솔 접속 시 숨기는 항목 — 해당 라우트는 서버에서 플랫폼 관리자만 허용 */
const PLATFORM_ADMIN_ONLY_HREFS = new Set<string>(["/admin/tenants", "/admin/privacy"]);

export function getAdminNavSections(isPlatformAdmin: boolean): NavSection[] {
  if (isPlatformAdmin) return ADMIN_NAV_SECTIONS;
  return ADMIN_NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !PLATFORM_ADMIN_ONLY_HREFS.has(item.href)),
  }));
}

export const ADMIN_NAV_SECTIONS: NavSection[] = [
  {
    id: "ops",
    title: "운영·현황",
    items: [
      { href: "/admin", label: "운영 대시보드", icon: LayoutDashboard, color: "text-teal-500" },
      { href: "/admin/shop", label: "스토어 관리", icon: ShoppingBag, color: "text-cyan-600" },
      { href: "/admin/shop/orders", label: "주문 관리", icon: ReceiptText, color: "text-violet-600" },
      { href: "/admin/shop/resale", label: "소비자 되팔기", icon: HandCoins, color: "text-amber-600" },
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
    title: "조직·계정",
    items: [
      { href: "/admin/users", label: "사용자 관리", icon: Users, color: "text-sky-600" },
      { href: "/admin/tenants", label: "조직·멤버 관리", icon: Building2, color: "text-emerald-500" },
      { href: "/admin/privacy", label: "개인정보 동의 이력", icon: ShieldCheck, color: "text-rose-500" },
      { href: "/admin/storage-billing", label: "스토리지 결제 요청", icon: CreditCard, color: "text-violet-600" },
    ],
  },
];

export function normalizeAdminPath(pathname: string) {
  const p = pathname.replace(/\/$/, "") || "/";
  return p;
}

/** 현재 경로가 메뉴 href와 일치하는지(운영 대시보드 `/admin`은 정확히 일치할 때만) */
export function navHrefMatchesPath(pathname: string, href: string): boolean {
  const p = normalizeAdminPath(pathname);
  const h = normalizeAdminPath(href);
  if (h === "/admin") return p === "/admin";
  return p === h || p.startsWith(`${h}/`);
}

/**
 * 여러 메뉴가 동시에 경로와 맞을 때(예: /admin/shop 과 /admin/shop/orders) 가장 구체적인 항목만 활성.
 * 그렇지 않으면 부모·자식이 동시에 강조되어 호버와 구분이 안 됨.
 */
export function isAdminNavActive(
  pathname: string,
  href: string,
  allNavHrefs: readonly string[]
): boolean {
  const matching = allNavHrefs.filter((candidate) => navHrefMatchesPath(pathname, candidate));
  if (matching.length === 0) return false;
  const best = matching.reduce((a, b) =>
    normalizeAdminPath(a).length >= normalizeAdminPath(b).length ? a : b
  );
  return normalizeAdminPath(href) === normalizeAdminPath(best);
}
