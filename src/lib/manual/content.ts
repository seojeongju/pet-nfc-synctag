export const MANUAL_PDF_PATH = "/manual/link-u-nfc-manual.pdf";
export const MANUAL_PDF_FILENAME = "링크유 스마트 NFC 태그 사용설명서.pdf";

export const MANUAL_INFOGRAPHIC_IMAGE = {
  src: "/manual/infographic-guardian.png",
  alt: "링크유 사용자(보호자) 사용법 인포그래픽 — 태그 준비부터 등록·연결까지 4단계 안내",
};

export type ManualTocItem = {
  id: string;
  label: string;
};

export type ManualInfographicStep = {
  id: string;
  step: number;
  title: string;
  summary: string;
  checklist?: string[];
  visual: "prep" | "app-home" | "register" | "nfc-connect";
};

export type ManualCategory = {
  id: string;
  label: string;
  emoji: string;
};

export type ManualAppMenu = {
  label: string;
  highlight?: boolean;
};

export type ManualFinderFeature = {
  title: string;
  body: string;
  emoji: string;
};

export type ManualUsageTip = {
  title: string;
  body: string;
  emoji: string;
};

export type ManualNfcCheck = {
  title: string;
  body: string;
  emoji: string;
};

export type ManualFaqItem = {
  question: string;
  answer: string;
};

export const MANUAL_TOC: ManualTocItem[] = [
  { id: "overview", label: "한눈에 보기" },
  { id: "nfc-check", label: "NFC 체크" },
  { id: "steps", label: "4단계 가이드" },
  { id: "finder", label: "발견자" },
  { id: "tips", label: "사용 팁" },
  { id: "faq", label: "FAQ" },
  { id: "support", label: "고객 지원" },
];

export const MANUAL_INTRO = {
  title: "Link-U 사용자(보호자) 사용법",
  lead: "태그 구매 후 관리대상 설정부터 태그 등록까지, 그림으로 쉽게 따라 할 수 있습니다.",
};

export const MANUAL_NFC_CHECKS: ManualNfcCheck[] = [
  {
    emoji: "📶",
    title: "NFC 켜기",
    body: "설정에서 NFC를 '기본 모드' 또는 '카드 모드'로 켜 주세요.",
  },
  {
    emoji: "📱",
    title: "인식 위치",
    body: "아이폰은 상단 카메라 근처, 안드로이드는 뒷면 중앙·상단(기종마다 다름)에 태그를 대 보세요.",
  },
  {
    emoji: "🛡️",
    title: "케이스 확인",
    body: "두꺼운 카드 케이스·금속 케이스는 인식을 방해할 수 있습니다.",
  },
];

export const MANUAL_INFOGRAPHIC_STEPS: ManualInfographicStep[] = [
  {
    id: "step-prep",
    step: 1,
    title: "태그 구매 및 준비",
    summary: "링크유 NFC 태그를 준비하고 스마트폰 NFC 기능을 켜 주세요.",
    checklist: ["NFC 태그 준비", "스마트폰 NFC 켜기"],
    visual: "prep",
  },
  {
    id: "step-app",
    step: 2,
    title: "링크유 앱 접속",
    summary: "링크유에 로그인한 뒤 홈 화면에서 원하는 메뉴를 선택하세요.",
    visual: "app-home",
  },
  {
    id: "step-profile",
    step: 3,
    title: "관리대상 설정",
    summary: "「관리대상」 메뉴에서 반려동물·어르신·아이·수하물 등 대상을 등록합니다.",
    checklist: ["이름·별명 입력", "보호자 연락처 등록", "필요한 안내 문구 입력"],
    visual: "register",
  },
  {
    id: "step-connect",
    step: 4,
    title: "태그 등록 및 연결",
    summary: "「NFC 읽기」를 누른 뒤 태그를 스마트폰에 가까이 대면 관리대상과 연결됩니다.",
    visual: "nfc-connect",
  },
];

export const MANUAL_CATEGORIES: ManualCategory[] = [
  { id: "pet", label: "반려동물", emoji: "🐾" },
  { id: "elder", label: "어르신", emoji: "👴" },
  { id: "child", label: "어린이", emoji: "🎒" },
  { id: "luggage", label: "수하물", emoji: "🧳" },
];

export const MANUAL_APP_MENUS: ManualAppMenu[] = [
  { label: "관리대상", highlight: true },
  { label: "NFC 읽기", highlight: true },
  { label: "스캔기록" },
  { label: "전자앨범" },
  { label: "안심구역" },
  { label: "스토어" },
];

export const MANUAL_FINDER_FEATURES: ManualFinderFeature[] = [
  {
    emoji: "📞",
    title: "보호자에게 즉시 전화",
    body: "번호 노출 없이 버튼 한 번으로 통화 연결이 가능합니다.",
  },
  {
    emoji: "💬",
    title: "보호자에게 메시지",
    body: "발견자가 현재 상황을 텍스트로 남길 수 있습니다.",
  },
  {
    emoji: "📍",
    title: "위치 공유",
    body: "발견자가 동의하면 스캔된 위치가 보호자에게 전송됩니다.",
  },
];

export const MANUAL_USAGE_TIPS: ManualUsageTip[] = [
  {
    emoji: "🏷️",
    title: "어디에나 부착",
    body: "목걸이·가방·캐리어 등에 쉽게 부착해 사용할 수 있습니다.",
  },
  {
    emoji: "📲",
    title: "스캔 즉시 연결",
    body: "태그를 스캔하면 보호자 연락 화면으로 바로 이어집니다.",
  },
  {
    emoji: "🔒",
    title: "필요한 정보만",
    body: "개인정보는 꼭 필요한 범위 안에서만 입력해 주세요.",
  },
];

export const MANUAL_PRODUCT_LINES = [
  "링크유-펫",
  "링크유-메모리",
  "링크유-키즈",
  "링크유-러기지",
  "링크유-골드",
];

export const MANUAL_FAQ: ManualFaqItem[] = [
  {
    question: "태그가 인식이 안 돼요!",
    answer:
      "스마트폰의 NFC 설정이 켜져 있는지 확인하세요. 아이폰은 화면이 켜진 상태에서만 인식됩니다. 안드로이드는 화면 잠금을 해제한 후 태그해 보세요.",
  },
  {
    question: "배터리는 얼마나 가나요?",
    answer:
      "링크유 NFC 태그는 배터리가 필요 없는 방식입니다. 충전이나 교체 걱정 없이 사용하실 수 있습니다.",
  },
  {
    question: "비가 와도 괜찮나요?",
    answer: "강력한 방수 기능을 갖추고 있습니다. 목욕이나 비 오는 날 산책 후에도 사용할 수 있습니다.",
  },
  {
    question: "정보를 수정할 때 태그가 꼭 있어야 하나요?",
    answer:
      "아니요. 스마트폰 웹에 로그인만 하시면 태그가 곁에 없어도 전 세계 어디서나 정보를 수정할 수 있습니다.",
  },
];

export const MANUAL_SUPPORT = {
  title: "고객 지원 안내",
  body: "제품 사용 중 궁금한 점이나 불편한 사항이 있으시면 언제든 연락해 주세요.",
  items: [
    { label: "대표 홈페이지", value: "www.link-u.co.kr", href: "https://www.link-u.co.kr" },
    { label: "고객센터", value: "02-3144-3137 / 054-464-3144", href: "tel:0231443137" },
    { label: "상담 가능 시간", value: "평일 10:00 ~ 18:00 (주말·공휴일 제외)" },
    { label: "이메일", value: "wow3d16@naver.com", href: "mailto:wow3d16@naver.com" },
    { label: "카카오톡 채널", value: "'링크유' 검색 후 친구 추가" },
  ],
};
