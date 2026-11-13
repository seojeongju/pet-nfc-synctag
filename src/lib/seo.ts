import type { Metadata } from "next";
import type { SubjectKind } from "@/lib/subject-kind";
import { subjectKindMeta } from "@/lib/subject-kind";
import { PLATFORM_SERVICES, getPlatformService, type PlatformServiceId } from "@/lib/platform/services";
import { listSiteNavigationForJsonLd } from "@/lib/platform/nav";
import {
  BRAND_ENTITY,
  PLATFORM_FAQS,
  STUDIO_FAQS,
  STUDIO_HOWTO_STEPS,
  serviceFaqs,
  type SeoFaqItem,
} from "@/lib/seo-content";

const FALLBACK_SITE_URL = "https://wow-linku.co.kr";

export const SITE_NAME = "링크유 Link-U";
export const SITE_NAME_EN = "Link-U";
export const SITE_TITLE_DEFAULT = `${SITE_NAME} | NFC 태그 서비스·맞춤 제작 플랫폼`;
export const SITE_DESCRIPTION =
  "NFC 태그의 연결·관리·맞춤 제작을 한곳에서. Link-U 안심, 디지털 명함, Wi-Fi, 매장·자산 관리와 3D 태그 스튜디오를 제공하는 링크유(Link-U) 플랫폼입니다.";
export const DEFAULT_OG_IMAGE_PATH = "/images/hero-bg.png";
export const DEFAULT_OG_IMAGE_WIDTH = 1200;
export const DEFAULT_OG_IMAGE_HEIGHT = 630;

export const BRAND_KEYWORDS = [
  "링크유",
  "Link-U",
  "NFC",
  "NFC 태그",
  "NFC 통합 플랫폼",
  "NFC 태그 제작",
  "맞춤 NFC 태그",
  "태그 스튜디오",
  "디지털 명함 NFC",
  "스마트 인식표",
  "보호자 연결",
  "반려동물 인식표",
  "어르신 위치 알림",
  "아이 안전 태그",
  "수하물 분실 방지",
  "주얼리 보증",
  "3D 프린팅 NFC",
  "WOW3D",
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

const SERVICE_SEO_EXTRA: Partial<
  Record<PlatformServiceId, { title: string; keywords: string[] }>
> = {
  linku: {
    title: "Link-U 안심 | NFC 보호자 연결·위치 안심 서비스",
    keywords: ["NFC 안심", "보호자 연결", "실종 예방 태그", "Link-U"],
  },
  card: {
    title: "디지털 명함 NFC | 맞춤 명함 태그 제작",
    keywords: ["디지털 명함", "NFC 명함", "명함 태그", "vCard NFC"],
  },
  wifi: {
    title: "Wi-Fi NFC 태그 | 비밀번호 없이 바로 접속",
    keywords: ["Wi-Fi NFC", "와이파이 태그", "손님 Wi-Fi"],
  },
  store: {
    title: "매장·리뷰 NFC | 메뉴·SNS·예약 연결",
    keywords: ["매장 NFC", "리뷰 스탠드", "테이블 NFC"],
  },
  asset: {
    title: "장비·자산 NFC 관리 | 현장 이력·매뉴얼",
    keywords: ["자산 관리 NFC", "설비 점검 태그", "B2B NFC"],
  },
  custom: {
    title: "자유 링크 NFC 태그 | 원하는 URL을 태그에",
    keywords: ["커스텀 NFC", "URL 태그", "이벤트 NFC"],
  },
};

type PublicMetadataInput = {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  type?: "website" | "article";
  noIndex?: boolean;
  ogImagePath?: string;
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
  ogImagePath = DEFAULT_OG_IMAGE_PATH,
}: PublicMetadataInput): Metadata {
  const url = path ? absoluteUrl(path) : undefined;
  const imageUrl = absoluteUrl(ogImagePath);
  const mergedKeywords = [...new Set([...BRAND_KEYWORDS, ...keywords])];

  return {
    title,
    description,
    keywords: mergedKeywords,
    ...(url
      ? {
          alternates: {
            canonical: url,
            languages: {
              "ko-KR": url,
              "x-default": url,
            },
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
          width: DEFAULT_OG_IMAGE_WIDTH,
          height: DEFAULT_OG_IMAGE_HEIGHT,
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

export function buildPlatformServiceMetadata(serviceId: string): Metadata | null {
  const service = getPlatformService(serviceId);
  if (!service) return null;
  const extra = SERVICE_SEO_EXTRA[service.id];
  return buildPublicMetadata({
    title: extra?.title ?? `${service.name} | ${SITE_NAME}`,
    description: service.description,
    path: `/services/${service.id}`,
    keywords: [...(extra?.keywords ?? []), ...service.examples, service.tagline],
  });
}

export function buildStudioMetadata(): Metadata {
  return buildPublicMetadata({
    title: "태그 스튜디오 | NFC 태그 디자인·3D 미리보기·맞춤 제작",
    description:
      "서비스별 템플릿으로 NFC 태그를 디자인하세요. 문구·이미지·색·재질을 편집하고 3D로 확인한 뒤 제작으로 이어집니다.",
    path: "/studio",
    keywords: ["NFC 태그 스튜디오", "NFC 태그 디자인", "맞춤 NFC", "3D 태그 미리보기", "디지털 명함 제작"],
  });
}

export type JsonLdNode = Record<string, unknown>;

export function buildOrganizationJsonLd(): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": absoluteUrl("/#organization"),
    name: SITE_NAME,
    alternateName: [SITE_NAME_EN, BRAND_ENTITY.legalName],
    legalName: BRAND_ENTITY.legalName,
    url: getSiteUrl(),
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/icons/icon-512x512.png"),
    },
    image: absoluteUrl(DEFAULT_OG_IMAGE_PATH),
    description: SITE_DESCRIPTION,
    email: BRAND_ENTITY.contactEmail,
    telephone: BRAND_ENTITY.telephone[0],
    areaServed: {
      "@type": "Country",
      name: BRAND_ENTITY.areaServed,
    },
    brand: {
      "@type": "Brand",
      name: BRAND_ENTITY.brand,
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: BRAND_ENTITY.telephone[0],
        contactType: "customer service",
        areaServed: "KR",
        availableLanguage: ["ko"],
      },
    ],
  };
}

export function buildWebSiteJsonLd(): JsonLdNode {
  const nav = listSiteNavigationForJsonLd();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    url: getSiteUrl(),
    name: SITE_NAME,
    alternateName: SITE_NAME_EN,
    inLanguage: "ko-KR",
    description: SITE_DESCRIPTION,
    publisher: {
      "@id": absoluteUrl("/#organization"),
    },
    hasPart: nav.map((item, index) => ({
      "@type": "SiteNavigationElement",
      "@id": absoluteUrl(`/#nav-${index + 1}`),
      position: index + 1,
      name: item.name,
      url: item.url.startsWith("http") ? item.url : absoluteUrl(item.url),
    })),
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: absoluteUrl("/studio?service={search_term_string}"),
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildBreadcrumbJsonLd(
  items: Array<{ name: string; path: string }>
): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildFaqJsonLd(faqs: readonly SeoFaqItem[], pagePath: string): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${absoluteUrl(pagePath)}#faq`,
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };
}

export function buildHowToJsonLd(input: {
  name: string;
  description: string;
  path: string;
  steps: readonly { name: string; text: string }[];
}): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "@id": `${absoluteUrl(input.path)}#howto`,
    name: input.name,
    description: input.description,
    inLanguage: "ko-KR",
    step: input.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
      url: `${absoluteUrl(input.path)}#step-${i + 1}`,
    })),
  };
}

export function buildSoftwareApplicationJsonLd(): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": absoluteUrl("/#app"),
    name: SITE_NAME,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, Android",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "KRW",
      description: "웹 서비스 이용·태그 스튜디오 디자인 시작은 무료. 태그 제작은 별도 견적.",
    },
    description: SITE_DESCRIPTION,
    url: getSiteUrl(),
    publisher: { "@id": absoluteUrl("/#organization") },
    inLanguage: "ko-KR",
  };
}

/** 플랫폼 홈(/) — CollectionPage + ItemList + FAQ + SoftwareApplication */
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
      isPartOf: { "@id": absoluteUrl("/#website") },
      about: [
        { "@type": "Thing", name: "NFC 통합 플랫폼" },
        { "@type": "Thing", name: "NFC 태그 맞춤 제작" },
        { "@type": "Thing", name: "Link-U 안심 보호자 연결" },
        { "@type": "Thing", name: "디지털 명함 NFC" },
        { "@type": "Thing", name: "태그 스튜디오 3D 미리보기" },
      ],
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: ["h1", "[data-seo-summary]"],
      },
      mainEntity: {
        "@id": absoluteUrl("/#app"),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "@id": absoluteUrl("/#services"),
      name: "링크유 NFC 서비스",
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      numberOfItems: PLATFORM_SERVICES.length,
      itemListElement: PLATFORM_SERVICES.map((s, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: s.name,
        url: absoluteUrl(`/services/${s.id}`),
        description: s.description,
      })),
    },
    buildSoftwareApplicationJsonLd(),
    buildFaqJsonLd(PLATFORM_FAQS, "/"),
  ];
}

/** Link-U 안심 섹션 홈(/linku) — 기존 5모드 중심 */
export function buildLinkuSectionJsonLd(): JsonLdNode[] {
  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": absoluteUrl("/linku#webpage"),
      url: absoluteUrl("/linku"),
      name: "Link-U 안심 | NFC 보호자 연결",
      description:
        "반려동물·어르신·아이·수하물·주얼리 NFC 태그와 동행 안내로 발견자와 보호자를 앱 없이 연결합니다.",
      inLanguage: "ko-KR",
      isPartOf: { "@id": absoluteUrl("/#website") },
      breadcrumb: { "@id": absoluteUrl("/linku#breadcrumb") },
    },
    buildBreadcrumbJsonLd([
      { name: SITE_NAME, path: "/" },
      { name: "Link-U 안심", path: "/linku" },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Link-U 안심 모드",
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
    buildFaqJsonLd(
      PLATFORM_FAQS.filter((f) => /안심|앱|배터리|Link-U 안심/.test(f.question)),
      "/linku"
    ),
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
      isPartOf: { "@id": absoluteUrl("/#website") },
      breadcrumb: { "@id": `${absoluteUrl(mode.path)}#breadcrumb` },
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
      provider: { "@id": absoluteUrl("/#organization") },
      areaServed: { "@type": "Country", name: "KR" },
      url: absoluteUrl(mode.path),
      isRelatedTo: { "@id": absoluteUrl("/services/linku#service") },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "@id": `${absoluteUrl(mode.path)}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: SITE_NAME, item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Link-U 안심", item: absoluteUrl("/linku") },
        {
          "@type": "ListItem",
          position: 3,
          name: subjectKindMeta[kind].label,
          item: absoluteUrl(mode.path),
        },
      ],
    },
  ];
}

export function buildPlatformServiceJsonLd(serviceId: string): JsonLdNode[] | null {
  const service = getPlatformService(serviceId);
  if (!service) return null;
  const path = `/services/${service.id}`;
  const faqs = serviceFaqs(service.id);
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${absoluteUrl(path)}#webpage`,
      url: absoluteUrl(path),
      name: service.name,
      description: service.description,
      inLanguage: "ko-KR",
      isPartOf: { "@id": absoluteUrl("/#website") },
      breadcrumb: { "@id": `${absoluteUrl(path)}#breadcrumb` },
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: ["h1", "[data-seo-summary]"],
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${absoluteUrl(path)}#service`,
      name: service.name,
      serviceType: service.tagline,
      description: service.description,
      provider: { "@id": absoluteUrl("/#organization") },
      areaServed: { "@type": "Country", name: "KR" },
      url: absoluteUrl(path),
      category: "NFC",
      ...(service.customizable
        ? {
            hasOfferCatalog: {
              "@type": "OfferCatalog",
              name: `${service.name} 태그 제작`,
              itemListElement: [
                {
                  "@type": "Offer",
                  itemOffered: {
                    "@type": "Product",
                    name: `${service.name} 맞춤 NFC 태그`,
                    url: absoluteUrl(`/studio?service=${service.id}`),
                  },
                },
              ],
            },
          }
        : {}),
    },
    buildBreadcrumbJsonLd([
      { name: SITE_NAME, path: "/" },
      { name: service.name, path },
    ]),
    ...(faqs.length ? [buildFaqJsonLd(faqs, path)] : []),
  ];
}

export function buildStudioPageJsonLd(): JsonLdNode[] {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": absoluteUrl("/studio#webpage"),
      url: absoluteUrl("/studio"),
      name: "태그 스튜디오",
      description:
        "서비스별 템플릿으로 NFC 태그를 디자인하고 3D로 미리 보는 링크유 태그 스튜디오입니다.",
      inLanguage: "ko-KR",
      isPartOf: { "@id": absoluteUrl("/#website") },
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: ["h1", "[data-seo-summary]"],
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "@id": absoluteUrl("/studio#app"),
      name: "링크유 태그 스튜디오",
      applicationCategory: "DesignApplication",
      operatingSystem: "Web",
      url: absoluteUrl("/studio"),
      description: "NFC 태그 템플릿 선택, 문구·이미지 편집, 3D 미리보기",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "KRW",
      },
      provider: { "@id": absoluteUrl("/#organization") },
    },
    buildHowToJsonLd({
      name: "NFC 태그 디자인하는 방법",
      description: "링크유 태그 스튜디오에서 맞춤 NFC 태그를 만드는 단계입니다.",
      path: "/studio",
      steps: STUDIO_HOWTO_STEPS,
    }),
    buildBreadcrumbJsonLd([
      { name: SITE_NAME, path: "/" },
      { name: "태그 스튜디오", path: "/studio" },
    ]),
    buildFaqJsonLd(STUDIO_FAQS, "/studio"),
  ];
}

/** 공개 인덱싱 URL 목록 (sitemap·llms.txt 공유) */
export function listPublicIndexPaths(): Array<{
  path: string;
  changeFrequency: "weekly" | "monthly" | "yearly";
  priority: number;
}> {
  const services = PLATFORM_SERVICES.map((s) => ({
    path: `/services/${s.id}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));
  const modes = (Object.keys(MODE_SEO) as SubjectKind[]).map((k) => ({
    path: MODE_SEO[k].path,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
  return [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/linku", changeFrequency: "weekly", priority: 0.9 },
    { path: "/studio", changeFrequency: "weekly", priority: 0.95 },
    ...services,
    ...modes,
    { path: "/wayfinder", changeFrequency: "weekly", priority: 0.6 },
    { path: "/install", changeFrequency: "monthly", priority: 0.4 },
    { path: "/manual", changeFrequency: "monthly", priority: 0.5 },
    { path: "/legal/privacy", changeFrequency: "yearly", priority: 0.2 },
    { path: "/legal/terms", changeFrequency: "yearly", priority: 0.2 },
  ];
}

export function buildLlmsTxt(): string {
  const services = PLATFORM_SERVICES.map(
    (s) => `- [${s.name}](${absoluteUrl(`/services/${s.id}`)}): ${s.description}`
  ).join("\n");
  const faqs = PLATFORM_FAQS.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n");

  return `# ${SITE_NAME}

> ${BRAND_ENTITY.summary}

사이트: ${getSiteUrl()}
운영: ${BRAND_ENTITY.legalName}
문의: ${BRAND_ENTITY.contactEmail}
전화: ${BRAND_ENTITY.telephone.join(" / ")}

## 핵심 페이지
- [플랫폼 홈](${absoluteUrl("/")})
- [Link-U 안심](${absoluteUrl("/linku")})
- [태그 스튜디오](${absoluteUrl("/studio")})
- [사용 설명서](${absoluteUrl("/manual")})

## NFC 서비스
${services}

## 사실 요약 (인용용)
${faqs}

## 크롤링
- Sitemap: ${absoluteUrl("/sitemap.xml")}
- Robots: ${absoluteUrl("/robots.txt")}
- 비공개: /admin, /dashboard, /hub, /api/, /login, /t/
`;
}
