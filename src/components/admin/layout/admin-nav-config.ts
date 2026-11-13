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
  Accessibility,
  Users,
  ShieldCheck,
  CreditCard,
  ShoppingBag,
  ReceiptText,
  HandCoins,
  Globe2,
  Layers,
  PenTool,
} from "lucide-react";

export type NavLeaf = { href: string; label: string; icon: LucideIcon; color: string };

export type NavSection = { id: string; title: string; items: NavLeaf[] };

/** 조직(테넌트) 관리자 콘솔 접속 시 숨기는 항목 — 해당 라우트는 서버에서 플랫폼 관리자만 허용 */
const PLATFORM_ADMIN_ONLY_HREFS = new Set<string>([
  "/admin",
  "/admin/linku",
  "/admin/platform/services",
  "/admin/platform/studio",
  "/admin/platform/studio/templates",
  "/admin/tenants",
  "/admin/privacy",
  "/admin/wayfinder",
]);

export function getAdminNavSections(isPlatformAdmin: boolean): NavSection[] {
  if (isPlatformAdmin) return ADMIN_NAV_SECTIONS;
  return ADMIN_NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !PLATFORM_ADMIN_ONLY_HREFS.has(item.href)),
  })).filter((section) => section.items.length > 0);
}

/**
 * 통합 관리자 메뉴: 플랫폼 공통 → 서비스(Link-U 안심 · 태그 스튜디오) → NFC 태그 공통 → 커머스 → 조직·계정.
 * 새 서비스가 열리면 서비스별 섹션을 추가한다 (src/lib/platform/services.ts).
 */
export const ADMIN_NAV_SECTIONS: NavSection[] = [
  {
    id: "platform",
    title: "통합 운영",
    items: [
      { href: "/admin", label: "통합 대시보드", icon: Globe2, color: "text-teal-500" },
      { href: "/admin/platform/services", label: "서비스 관리", icon: Layers, color: "text-cyan-600" },
      { href: "/admin/monitoring", label: "NFC/BLE 모니터링", icon: Radio, color: "text-sky-500" },
    ],
  },
  {
    id: "linku",
    title: "Link-U 안심",
    items: [
      { href: "/admin/linku", label: "안심 운영 대시보드", icon: LayoutDashboard, color: "text-teal-600" },
      { href: "/admin/announcements", label: "모드·배치 공지", icon: Megaphone, color: "text-indigo-500" },
      {
        href: "/admin/wayfinder",
        label: "동행 · 시설 동기화",
        icon: Accessibility,
        color: "text-emerald-600",
      },
    ],
  },
  {
    id: "studio",
    title: "태그 스튜디오",
    items: [
      { href: "/admin/platform/studio", label: "디자인·제작 요청", icon: PenTool, color: "text-rose-500" },
      { href: "/admin/platform/studio/templates", label: "템플릿 관리", icon: Layers, color: "text-fuchsia-500" },
    ],
  },
  {
    id: "nfc",
    title: "NFC 태그 공통",
    items: [
      { href: "/admin/nfc-tags", label: "허브", icon: LayoutGrid, color: "text-amber-500" },
      { href: "/admin/nfc-tags/register", label: "등록", icon: ListPlus, color: "text-teal-600" },
      { href: "/admin/nfc-tags/write-url", label: "기록", icon: Smartphone, color: "text-indigo-600" },
      { href: "/admin/nfc-tags/inventory", label: "인벤토리", icon: Database, color: "text-amber-600" },
      { href: "/admin/nfc-tags/history", label: "감사", icon: History, color: "text-slate-600" },
    ],
  },
  {
    id: "commerce",
    title: "커머스",
    items: [
      { href: "/admin/shop", label: "스토어 관리", icon: ShoppingBag, color: "text-cyan-600" },
      { href: "/admin/shop/orders", label: "주문 관리", icon: ReceiptText, color: "text-violet-600" },
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
