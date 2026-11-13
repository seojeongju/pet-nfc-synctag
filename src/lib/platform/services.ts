/**
 * NFC 통합 플랫폼 서비스 레지스트리.
 * 메인 랜딩·스튜디오·관리자가 같은 목록을 쓴다. P2에서 D1 `platform_services`로 이전 예정
 * (docs/NFC_PLATFORM_DEV_PLAN.md §3, §7).
 */

export type PlatformServiceId = "linku" | "card" | "wifi" | "store" | "asset" | "custom";

/** live: 운영 중 · beta: 시범 · soon: 준비 중(제작 요청만 접수) */
export type PlatformServiceStatus = "live" | "beta" | "soon";

/** 태그에 기록되는 NDEF 페이로드 종류 */
export type NfcPayloadType = "linku_profile" | "vcard_url" | "wifi" | "url";

export type PlatformService = {
  id: PlatformServiceId;
  name: string;
  tagline: string;
  description: string;
  status: PlatformServiceStatus;
  /** 서비스 진입 경로. 없으면 상세 페이지 준비 중 */
  entryPath: string | null;
  payloadType: NfcPayloadType;
  /** 사용 예 (카드 칩 표시) */
  examples: readonly string[];
  /** 커스텀 태그 제작 가능 여부 */
  customizable: boolean;
};

export const PLATFORM_SERVICES: readonly PlatformService[] = [
  {
    id: "linku",
    name: "Link-U 안심",
    tagline: "위치·연락 안심 서비스",
    description:
      "반려동물·어르신·아이·수하물·주얼리에 태그를 달면, 발견자가 앱 없이 보호자에게 연락하고 동의한 위치를 보낼 수 있습니다. 교통약자 동행 안내도 함께 제공합니다.",
    status: "live",
    entryPath: "/linku",
    payloadType: "linku_profile",
    examples: ["펫 인식표", "어르신 안심", "키즈", "수하물", "주얼리 보증", "동행 안내"],
    customizable: true,
  },
  {
    id: "card",
    name: "디지털 명함",
    tagline: "태그 한 번으로 연락처 저장",
    description: "휴대폰을 대면 프로필·연락처·SNS가 열리고, 연락처 저장까지 바로 이어집니다.",
    status: "soon",
    entryPath: null,
    payloadType: "vcard_url",
    examples: ["개인 명함", "영업 담당자", "프리랜서 포트폴리오"],
    customizable: true,
  },
  {
    id: "wifi",
    name: "Wi-Fi 접속",
    tagline: "비밀번호 없이 바로 연결",
    description: "매장·사무실·숙소 손님이 태그에 휴대폰을 대면 Wi-Fi에 바로 접속합니다.",
    status: "soon",
    entryPath: null,
    payloadType: "wifi",
    examples: ["카페", "숙소", "회의실"],
    customizable: true,
  },
  {
    id: "store",
    name: "매장·리뷰 연결",
    tagline: "메뉴·리뷰·SNS로 바로 안내",
    description: "테이블·카운터 스탠드에서 메뉴판, 리뷰 작성, 인스타그램, 예약 페이지로 연결합니다.",
    status: "soon",
    entryPath: null,
    payloadType: "url",
    examples: ["리뷰 스탠드", "테이블 메뉴", "SNS 팔로우"],
    customizable: true,
  },
  {
    id: "asset",
    name: "장비·자산 관리",
    tagline: "B2B 설비 이력 관리",
    description: "장비에 태그를 붙여 점검 이력·매뉴얼·담당자 정보를 현장에서 확인합니다.",
    status: "soon",
    entryPath: null,
    payloadType: "url",
    examples: ["설비 점검", "공구 대여", "시설 안내"],
    customizable: true,
  },
  {
    id: "custom",
    name: "자유 링크",
    tagline: "원하는 주소를 태그에",
    description: "홈페이지·영상·이벤트 페이지 등 원하는 URL을 담은 나만의 태그를 만듭니다.",
    status: "soon",
    entryPath: null,
    payloadType: "url",
    examples: ["청첩장", "포트폴리오", "이벤트"],
    customizable: true,
  },
] as const;

export const platformServiceStatusLabel: Record<PlatformServiceStatus, string> = {
  live: "운영 중",
  beta: "시범 운영",
  soon: "준비 중",
};

export function getPlatformService(id: string): PlatformService | null {
  return PLATFORM_SERVICES.find((s) => s.id === id) ?? null;
}

/** Link-U 서비스 섹션 경로 (기존 5모드 + 동행 홈) */
export const LINKU_HOME_PATH = "/linku";

/** wow3dp.co.kr 자동견적 (Q1 핸드오프 전까지 일반 진입 링크) */
export const WOW3DP_QUOTE_URL = "https://wow3dp.co.kr/quote?entry=file";
