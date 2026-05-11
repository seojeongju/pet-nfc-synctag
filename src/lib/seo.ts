import type { Metadata } from "next";
import type { SubjectKind } from "@/lib/subject-kind";
import { subjectKindMeta } from "@/lib/subject-kind";

const FALLBACK_SITE_URL = "https://wow-linku.co.kr";

export const SITE_NAME = "링크유 Link-U";
export const SITE_NAME_EN = "Link-U";
export const SITE_TITLE_DEFAULT = `${SITE_NAME} | NFC로 연결하는 안심 플랫폼`;
export const SITE_DESCRIPTION =
  "반려동물, 어르신, 아이, 수하물, 주얼리까지 NFC 태그로 보호자와 빠르게 연결하는 링크유(Link-U) 안심 플랫폼입니다.";
export const DEFAULT_OG_IMAGE_PATH = "/images/hero-bg.png";

export const BRAND_KEYWORDS = [
  "링크유",
  "Link-U",
  "Pet-ID Connect",
  "NFC",
  "NFC 태그",
  "스마트 인식표",
  "보호자 연결",
  "반려동물 인식표",
  "어르신 위치 알림",
  "아이 안전 태그",
  "수하물 분실 방지",
  "주얼리 보증",
] as const;

const MODE_SEO: Record<
  SubjectKind,
  { path: string; title: string; description: string; keywords: string[]; audience: string }
> = {
  pet: {
    path: "/pet",
    title: "링크유-펫 | 반려동물 NFC 인식표·보호자 연결 서비스",
    description:
      "반려동물 NFC 인식표와 보호자 연결 페이지를 제공해 스캔 즉시 연락 안내와 안전한 복귀 흐름을 돕는 링크유-펫 서비스입니다.",
    keywords: ["반려동물 NFC", "반려동물 인식표", "강아지 인식표", "고양이 인식표", "반려동물 보호자 연락"],
    audience: "반려동물 보호자",
  },
  elder: {
    path: "/elder",
    title: "링크유-메모리 | 어르신 안심 태그·가족 연결 서비스",
    description:
      "어르신 안심 태그와 가족 연결 흐름을 제공해 연락처 확인, 위치 단서 전달, 빠른 보호자 연락을 돕는 링크유-메모리 서비스입니다.",
    keywords: ["어르신 위치추적", "어르신 안심 태그", "배회감지", "가족 연락 태그", "치매 안전 서비스"],
    audience: "어르신 가족 및 보호자",
  },
  child: {
    path: "/child",
    title: "링크유-키즈 | 아이 안전 NFC 태그·보호자 연결",
    description:
      "아이 안전 태그와 보호자 연결 안내를 통해 등하원, 외출, 긴급 상황에서 빠르게 연락할 수 있도록 돕는 링크유-키즈 서비스입니다.",
    keywords: ["아이 안전 태그", "어린이 NFC", "보호자 연락 태그", "등하원 안전", "실종 예방 태그"],
    audience: "아이 보호자",
  },
  luggage: {
    path: "/luggage",
    title: "링크유-러기지 | 수하물 분실 방지 NFC 태그",
    description:
      "여행용 수하물과 캐리어에 NFC 태그를 연결해 분실 시 소유자 연락과 복구 가능성을 높여 주는 링크유-러기지 서비스입니다.",
    keywords: ["수하물 태그", "캐리어 NFC", "분실 방지 태그", "여행 태그", "소유자 연락 태그"],
    audience: "여행객 및 소지품 소유자",
  },
  gold: {
    path: "/gold",
    title: "링크유-골드 | 주얼리 NFC 인증·소유자 연결 서비스",
    description:
      "주얼리 인증 정보와 소유자 연결 정보를 NFC 한 번에 전달해 가치 증명과 분실 대응을 함께 지원하는 링크유-골드 서비스입니다.",
    keywords: ["주얼리 NFC", "보증서 진위 확인", "주얼리 인증 태그", "골드 태그", "분실 방지 주얼리"],
    audience: "주얼리 소유자 및 구매자",
  },
};

type PublicMetadataInput = {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  type?: "website" | "article";
  noIndex?: boolean;
};

function normalizeSiteUrl(raw?: string | null): string {
  const value = raw?.trim();
  if (!value) return FALLBACK_SITE_URL;
  return value.replace(/\/+$/, "");
}

export function getSiteUrl(): string {
  return normalizeSiteUrl(process.env.NEXT_PUBLIC_APP_URL || FALLBACK_SITE_URL);
}

export function absoluteUrl(path = "/"): string {
  return new URL(path, `${getSiteUrl()}/`).toString();
}

export function buildPublicMetadata({
  title,
  description,
  path,
  keywords = [],
  type = "website",
  noIndex = false,
}: PublicMetadataInput): Metadata {
  const url = path ? absoluteUrl(path) : undefined;
  const imageUrl = absoluteUrl(DEFAULT_OG_IMAGE_PATH);
  const mergedKeywords = [...new Set([...BRAND_KEYWORDS, ...keywords])];

  return {
    title,
    description,
    keywords: mergedKeywords,
    ...(url
      ? {
          alternates: {
            canonical: url,
          },
        }
      : {}),
    openGraph: {
      title,
      description,
      ...(url ? { url } : {}),
      siteName: SITE_NAME,
      locale: "ko_KR",
      type,
      images: [
        {
          url: imageUrl,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          nocache: true,
          googleBot: {
            index: false,
            follow: false,
            noimageindex: true,
            "max-snippet": -1,
            "max-image-preview": "none",
            "max-video-preview": -1,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-snippet": -1,
            "max-image-preview": "large",
            "max-video-preview": -1,
          },
        },
  };
}

export function buildNoIndexMetadata(title: string, description?: string): Metadata {
  return buildPublicMetadata({
    title,
    description: description ?? `${title} 페이지입니다.`,
    noIndex: true,
  });
}

export function buildModeMetadata(kind: SubjectKind): Metadata {
  const mode = MODE_SEO[kind];
  return buildPublicMetadata({
    title: mode.title,
    description: mode.description,
    path: mode.path,
    keywords: mode.keywords,
  });
}

export type JsonLdNode = Record<string, unknown>;

export function buildOrganizationJsonLd(): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": absoluteUrl("/#organization"),
    name: SITE_NAME,
    alternateName: SITE_NAME_EN,
    url: getSiteUrl(),
    logo: absoluteUrl("/icons/icon-512x512.png"),
    description: SITE_DESCRIPTION,
    email: "wow3d16@naver.com",
  };
}

export function buildWebSiteJsonLd(): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    url: getSiteUrl(),
    name: SITE_NAME,
    inLanguage: "ko-KR",
    description: SITE_DESCRIPTION,
    publisher: {
      "@id": absoluteUrl("/#organization"),
    },
  };
}

export function buildHomePageJsonLd(): JsonLdNode[] {
  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": absoluteUrl("/#webpage"),
      url: absoluteUrl("/"),
      name: SITE_TITLE_DEFAULT,
      description: SITE_DESCRIPTION,
      inLanguage: "ko-KR",
      isPartOf: {
        "@id": absoluteUrl("/#website"),
      },
      about: [
        { "@type": "Thing", name: "NFC 태그 보호자 연결" },
        { "@type": "Thing", name: "반려동물 안전" },
        { "@type": "Thing", name: "어르신 안심 케어" },
        { "@type": "Thing", name: "아이 안전 연결" },
        { "@type": "Thing", name: "수하물 분실 방지" },
        { "@type": "Thing", name: "주얼리 인증 및 보증" },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "링크유 서비스 모드",
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      numberOfItems: 5,
      itemListElement: (Object.keys(MODE_SEO) as SubjectKind[]).map((kind, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: subjectKindMeta[kind].label,
        url: absoluteUrl(MODE_SEO[kind].path),
        description: MODE_SEO[kind].description,
      })),
    },
  ];
}

export function buildModePageJsonLd(kind: SubjectKind): JsonLdNode[] {
  const mode = MODE_SEO[kind];
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${absoluteUrl(mode.path)}#webpage`,
      url: absoluteUrl(mode.path),
      name: mode.title,
      description: mode.description,
      inLanguage: "ko-KR",
      isPartOf: {
        "@id": absoluteUrl("/#website"),
      },
      breadcrumb: {
        "@id": `${absoluteUrl(mode.path)}#breadcrumb`,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${absoluteUrl(mode.path)}#service`,
      name: subjectKindMeta[kind].label,
      serviceType: subjectKindMeta[kind].description,
      description: mode.description,
      audience: {
        "@type": "Audience",
        audienceType: mode.audience,
      },
      provider: {
        "@id": absoluteUrl("/#organization"),
      },
      areaServed: {
        "@type": "Country",
        name: "KR",
      },
      url: absoluteUrl(mode.path),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "@id": `${absoluteUrl(mode.path)}#breadcrumb`,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: SITE_NAME,
          item: absoluteUrl("/"),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: subjectKindMeta[kind].label,
          item: absoluteUrl(mode.path),
        },
      ],
    },
  ];
}
