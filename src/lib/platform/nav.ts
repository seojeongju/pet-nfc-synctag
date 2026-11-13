/**
 * 플랫폼 전역 네비게이션 — SEO/AEO/GEO용 라벨·경로 단일 소스.
 * 메뉴 문구는 검색·답변 엔진이 인용하기 쉬운 기능명으로 둔다.
 */
import { PLATFORM_SERVICES, LINKU_HOME_PATH, type PlatformService } from "@/lib/platform/services";

export type PlatformNavLink = {
  href: string;
  /** 화면·스키마에 쓰는 짧은 라벨 */
  label: string;
  /** AEO/접근성용 긴 설명 (title, aria) */
  description: string;
  /** 모바일 1차 바에 노출 */
  mobilePrimary?: boolean;
};

/** 상단 1차 메뉴 (순서 = 정보 구조 우선순위) */
export const PLATFORM_PRIMARY_NAV: readonly PlatformNavLink[] = [
  {
    href: "/studio",
    label: "NFC 태그 제작",
    description: "서비스별 템플릿으로 NFC 태그를 디자인하고 3D로 미리보기",
    mobilePrimary: true,
  },
  {
    href: LINKU_HOME_PATH,
    label: "Link-U 안심",
    description: "반려동물·어르신·아이 등 NFC 보호자 연결·위치 안심 서비스",
    mobilePrimary: true,
  },
  {
    href: "/manual",
    label: "사용 가이드",
    description: "링크유 NFC 태그 등록·연결 방법과 자주 묻는 질문",
  },
  {
    href: "/#faq",
    label: "FAQ",
    description: "링크유 NFC 플랫폼에 대해 자주 묻는 질문",
  },
] as const;

export function platformServiceNavItems(): Array<{
  href: string;
  label: string;
  description: string;
  status: PlatformService["status"];
  tagline: string;
}> {
  return PLATFORM_SERVICES.map((s) => ({
    href: `/services/${s.id}`,
    label: s.name,
    description: s.description,
    status: s.status,
    tagline: s.tagline,
  }));
}

/** JSON-LD SiteNavigationElement용 평탄 목록 (크롤러·생성형 엔진) */
export function listSiteNavigationForJsonLd(): Array<{ name: string; url: string }> {
  return [
    { name: "링크유 홈", url: "/" },
    { name: "NFC 서비스", url: "/#services" },
    ...platformServiceNavItems().map((s) => ({ name: s.label, url: s.href })),
    ...PLATFORM_PRIMARY_NAV.map((n) => ({ name: n.label, url: n.href })),
  ];
}
