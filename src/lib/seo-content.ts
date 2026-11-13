/**
 * AEO/GEO용 사실 기반 콘텐츠 (FAQ·HowTo·엔티티).
 * 검색·답변 엔진이 인용하기 쉬운 짧은 문장으로 유지한다.
 */
import { PLATFORM_SERVICES, type PlatformServiceId } from "@/lib/platform/services";

export type SeoFaqItem = { question: string; answer: string };

/** 플랫폼 홈 FAQ — 답변 엔진·생성형 검색용 */
export const PLATFORM_FAQS: readonly SeoFaqItem[] = [
  {
    question: "링크유(Link-U)는 어떤 서비스인가요?",
    answer:
      "링크유는 NFC 태그의 연결·관리·맞춤 제작을 한곳에서 제공하는 플랫폼입니다. Link-U 안심(보호자 연결), 디지털 명함, Wi-Fi, 매장 연결, 자산 관리 등 서비스와 태그 스튜디오를 함께 제공합니다.",
  },
  {
    question: "NFC 태그를 스캔할 때 앱이 필요한가요?",
    answer:
      "발견자·사용자는 별도 앱 설치 없이 스마트폰 NFC로 태그를 대면 웹 페이지가 열립니다. 보호자·관리자는 웹 로그인으로 정보를 수정합니다.",
  },
  {
    question: "태그 디자인은 어떻게 하나요?",
    answer:
      "태그 스튜디오(/studio)에서 서비스를 고르고 템플릿을 선택한 뒤, 문구·이미지·색·재질을 편집하며 3D로 미리 볼 수 있습니다. 이후 견적·제작 요청으로 이어집니다.",
  },
  {
    question: "Link-U 안심은 어떤 용도로 쓰이나요?",
    answer:
      "반려동물·어르신·아이·수하물·주얼리에 NFC 태그를 달면, 발견자가 앱 없이 보호자에게 연락하고 동의한 위치를 전달할 수 있습니다. 교통약자 동행 안내도 포함됩니다.",
  },
  {
    question: "디지털 명함 NFC는 무엇인가요?",
    answer:
      "디지털 명함은 휴대폰을 태그에 대면 프로필·연락처·SNS가 열리고 연락처 저장으로 이어지는 NFC 서비스입니다. 스튜디오에서 명함형 템플릿으로 맞춤 제작할 수 있습니다.",
  },
  {
    question: "태그에 배터리가 필요한가요?",
    answer:
      "링크유 NFC 태그는 배터리가 필요 없습니다. 스마트폰의 NFC 전파로 동작하므로 충전·교체가 없습니다.",
  },
] as const;

export const STUDIO_FAQS: readonly SeoFaqItem[] = [
  {
    question: "태그 스튜디오에서 무엇을 할 수 있나요?",
    answer:
      "서비스별 템플릿을 고르고 텍스트·이미지·색상·재질을 편집한 뒤 3D로 미리 보고 디자인을 저장할 수 있습니다. 제작 견적 연동은 단계적으로 열립니다.",
  },
  {
    question: "템플릿은 누가 추가하나요?",
    answer:
      "서비스별 기본 템플릿이 제공되며, 플랫폼 관리자는 관리자 화면에서 추가 템플릿을 등록·비활성화할 수 있습니다.",
  },
  {
    question: "디자인을 저장하려면 로그인이 필요한가요?",
    answer: "네. 디자인을 저장하고 이어 편집하려면 로그인이 필요합니다. 템플릿을 고르면 로그인 후 이어서 진행됩니다.",
  },
] as const;

export const STUDIO_HOWTO_STEPS: readonly { name: string; text: string }[] = [
  { name: "서비스 선택", text: "Link-U 안심, 디지털 명함, Wi-Fi 등 용도에 맞는 서비스를 고릅니다." },
  { name: "템플릿 선택", text: "서비스에 맞는 기본·추가 템플릿 중 하나를 고릅니다." },
  { name: "디자인 편집", text: "문구·이미지·색·재질을 바꾸고 3D 미리보기로 확인합니다." },
  { name: "저장·제작", text: "디자인을 완료한 뒤 견적·제작 요청으로 이어갑니다." },
] as const;

export function serviceFaqs(serviceId: PlatformServiceId): SeoFaqItem[] {
  const s = PLATFORM_SERVICES.find((x) => x.id === serviceId);
  if (!s) return [];
  const common: SeoFaqItem[] = [
    {
      question: `${s.name}은(는) 무엇인가요?`,
      answer: `${s.description} ${s.tagline}.`,
    },
    {
      question: `${s.name}용 NFC 태그는 어떻게 만드나요?`,
      answer: s.customizable
        ? `태그 스튜디오에서 ${s.name}을(를) 선택한 뒤 템플릿을 고르고 디자인한 다음 제작을 요청하면 됩니다.`
        : `${s.name} 서비스 화면에서 안내에 따라 태그를 연결합니다.`,
    },
  ];
  if (serviceId === "linku") {
    common.push({
      question: "Link-U 안심은 어떤 모드가 있나요?",
      answer: "펫, 메모리(어르신), 키즈, 러기지(수하물), 골드(주얼리)와 동행(교통약자 안내)을 제공합니다.",
    });
  }
  if (serviceId === "card") {
    common.push({
      question: "디지털 명함 디자인을 바꿀 수 있나요?",
      answer: "네. 스튜디오의 명함형 템플릿에서 이름·직함·이미지를 바꿔 3D로 확인한 뒤 제작할 수 있습니다.",
    });
  }
  return common;
}

/** GEO: 브랜드·제품에 대한 짧은 정의 (llms.txt·스키마 about) */
export const BRAND_ENTITY = {
  name: "링크유 Link-U",
  legalName: "주식회사 와우쓰리디",
  brand: "Link-U",
  type: "NFC 통합 서비스 플랫폼",
  summary:
    "NFC 태그 연결·관리·맞춤 제작 플랫폼. 안심(보호자 연결), 디지털 명함, Wi-Fi, 매장·자산 관리 서비스와 3D 태그 스튜디오를 제공합니다.",
  contactEmail: "wow3d16@naver.com",
  telephone: ["+82-2-3144-3137", "+82-54-464-3144"],
  areaServed: "KR",
} as const;
