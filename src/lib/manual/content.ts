export const MANUAL_PDF_PATH = "/manual/link-u-nfc-manual.pdf";
export const MANUAL_PDF_FILENAME = "링크유 스마트 NFC 태그 사용설명서.pdf";

export type ManualTocItem = {
  id: string;
  label: string;
};

export type ManualSection = {
  id: string;
  title: string;
  subtitle?: string;
  paragraphs?: string[];
  bullets?: string[];
  numbered?: string[];
  tips?: { title: string; body: string }[];
};

export type ManualFaqItem = {
  question: string;
  answer: string;
};

export const MANUAL_TOC: ManualTocItem[] = [
  { id: "nfc-check", label: "시작 전 체크" },
  { id: "register", label: "등록 가이드" },
  { id: "finder", label: "발견자 화면" },
  { id: "tips", label: "기능 팁" },
  { id: "faq", label: "FAQ" },
  { id: "support", label: "고객 지원" },
];

export const MANUAL_INTRO = {
  title: "링크유 스마트 NFC 태그 사용 설명서",
  lead: "소중한 가족과 소지품의 안전을 위해 링크유(Link-U)를 선택해 주셔서 감사합니다. 배터리 교체 없이 스마트폰 태그만으로 정보를 확인하고 연결할 수 있는 스마트 보호 시스템입니다.",
};

export const MANUAL_SECTIONS: ManualSection[] = [
  {
    id: "nfc-check",
    title: "시작하기 전에 체크하세요",
    bullets: [
      "스마트폰 설정에서 NFC 기능을 '기본 모드' 또는 '카드 모드'로 켜 주세요.",
      "아이폰: 상단 카메라 근처에서 인식합니다. 화면이 켜진 상태에서만 인식됩니다.",
      "안드로이드: 휴대폰 뒷면 중앙 또는 상단(기종마다 다름)에 태그를 대 보세요.",
      "두꺼운 카드 케이스나 금속 재질 케이스는 인식을 방해할 수 있습니다.",
    ],
  },
  {
    id: "register",
    title: "단계별 등록 가이드",
    subtitle: "보호자(사용자)가 태그를 처음 설정할 때 따라 할 순서입니다.",
    numbered: [
      "태그 스캔하기 — 구매하신 링크유 태그에 스마트폰 뒷면을 가까이 대세요. 알림창을 누르면 등록 페이지로 이동합니다.",
      "모드 선택하기 — 반려동물·어르신·아이·수하물·주얼리 등 사용 용도에 맞는 모드를 고릅니다.",
      "계정 생성 및 로그인 — 카카오·구글 간편 로그인으로 가입합니다. 로그인 후 어디서든 정보를 수정할 수 있습니다.",
      "프로필 정보 입력 — 이름·보호자 연락처(필수)와 사진·건강 상태·특징 등을 입력합니다.",
      "태그 활성화 완료 — '등록 완료' 후 태그와 프로필이 연결되면 스캔 시 입력한 정보가 표시됩니다.",
    ],
    paragraphs: [
      "홈 화면에서 모드를 고른 뒤 대시보드의 「관리대상」에서 프로필을 만들고, 「NFC 읽기」 또는 태그 연결 메뉴에서 태그를 연결하세요.",
      "브라우저를 홈 화면에 추가(PWA)하면 알림을 더 편하게 받을 수 있습니다. 설치 안내는 「설치 안내」 페이지를 참고하세요.",
    ],
  },
  {
    id: "finder",
    title: "발견자가 보는 화면",
    subtitle: "길을 잃은 반려동물이나 소지품을 발견한 분이 태그를 스캔했을 때의 기능입니다.",
    bullets: [
      "보호자에게 즉시 전화 — 번호 노출 없이 앱 내 버튼으로 통화 연결이 가능합니다.",
      "보호자에게 메시지 — 발견자가 현재 상황을 텍스트로 남길 수 있습니다.",
      "위치 공유 — 발견자가 동의하면 보호자에게 스캔된 위치가 전송됩니다.",
    ],
    paragraphs: ["발견자는 별도 앱 설치 없이 태그 스캔 후 열리는 웹 화면만으로 안내를 확인할 수 있습니다."],
  },
  {
    id: "tips",
    title: "유용한 기능 팁",
    tips: [
      {
        title: "실시간 스캔 알림",
        body: "누군가 태그를 스캔하면 보호자 스마트폰으로 알림이 전송되며, 어디서 스캔되었는지 지도로 확인할 수 있습니다.",
      },
      {
        title: "정보 업데이트",
        body: "이사·연락처 변경 시 태그를 새로 살 필요 없이 로그인 후 정보 수정 메뉴에서 즉시 업데이트하세요.",
      },
      {
        title: "멀티 태그 관리",
        body: "하나의 계정으로 여러 개의 태그를 관리할 수 있습니다. 다견 가정이나 여러 가방도 문제없습니다.",
      },
    ],
  },
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
