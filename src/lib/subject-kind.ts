export const SUBJECT_KINDS = ["pet", "elder", "child", "luggage", "gold"] as const;
export type SubjectKind = (typeof SUBJECT_KINDS)[number];

export function parseSubjectKind(value: string | undefined | null): SubjectKind {
  if (value && (SUBJECT_KINDS as readonly string[]).includes(value)) {
    return value as SubjectKind;
  }
  return "pet";
}

export const subjectKindMeta: Record<
  SubjectKind,
  {
    label: string;
    description: string;
    listHeading: string;
    registerTitle: string;
    registerSubtitle: string;
    nfcHelper: string;
    emptyRegisterHint: string;
  }
> = {
  pet: {
    label: "링크유 - 펫 (반려동물)",
    description: "반려동물 · NFC로 빠른 연결 · 가족에게 닿는 도움말",
    listHeading: "함께하는 아이들",
    registerTitle: "새로운 아이 등록",
    registerSubtitle: "우리 아이의 안전을 위한 첫 걸음입니다.",
    nfcHelper: "대시보드에서 바로 태그를 연결하세요.",
    emptyRegisterHint: "먼저 반려동물을 등록해야 NFC 태그를 연결할 수 있어요.",
  },
  elder: {
    label: "링크유 - 메모리 (기억 동행)",
    description: "기억 동행 · 안심 알림과 가족 연결 · 긴급 연락 (BLE 연동 예정)",
    listHeading: "함께하는 가족",
    registerTitle: "가족 프로필 등록",
    registerSubtitle: "연락처를 남겨 두면, 필요할 때 가족에게 바로 연결돼요.",
    nfcHelper: "인식표를 등록해 두면 스캔 한 번으로 연락처를 확인할 수 있어요.",
    emptyRegisterHint: "먼저 가족 프로필을 등록해야 태그를 연결할 수 있어요.",
  },
  child: {
    label: "링크유 - 키즈 (우리 아이 안심)",
    description: "우리 아이 안심 · 안심 울타리와 알림으로 연결 (BLE·안심 구역 연동 예정)",
    listHeading: "우리 아이 프로필",
    registerTitle: "아이 프로필 등록",
    registerSubtitle: "이름과 비상 연락처를 입력해 주세요.",
    nfcHelper: "태그를 연결해 두면 필요할 때 신원 확인이 쉬워져요.",
    emptyRegisterHint: "먼저 아이 프로필을 등록해야 태그를 연결할 수 있어요.",
  },
  luggage: {
    label: "링크유 - 태그 (수화물·가방)",
    description: "수화물·가방 · 수하물·캐리어 NFC로 주인 연결 · 분실 시 단서 기록",
    listHeading: "등록한 소지품",
    registerTitle: "소지품 등록",
    registerSubtitle: "가방·캐리어 등 구분하기 쉬운 이름을 입력하세요.",
    nfcHelper: "여행용 태그를 연결해 분실 시 단서를 남길 수 있어요.",
    emptyRegisterHint: "먼저 소지품을 등록해야 태그를 연결할 수 있어요.",
  },
  gold: {
    label: "링크유 - 골드 (고귀한 가치·인증서)",
    description:
      "주얼리 · 고귀한 가치(인증서)와 안전한 보호(분실 방지)를 함께 — NFC로 가치 증명과 주인 연결",
    listHeading: "등록한 골드·주얼리",
    registerTitle: "제품·소유 등록",
    registerSubtitle: "제품명과 연락처를 남겨 인증 가치와 분실 시 복구에 활용하세요.",
    nfcHelper: "NFC 태그를 연결하면 인증 안내와 안심 찾기 정보를 한 번에 전달할 수 있어요.",
    emptyRegisterHint: "먼저 제품을 등록해야 태그를 연결할 수 있어요.",
  },
};

/** NFC/QR (S3) */
export const subjectKindNfcPublic: Record<
  SubjectKind,
  { roleLine: string; callCta: string; hideMedicalBlock: boolean; idCardLabel: string; scanHintLabel: string; scanHintBody: string }
> = {
  pet: { roleLine: "NFC 공개 프로필 · 링크유 - 펫 (반려동물)", callCta: "보호자에게 연락하기", hideMedicalBlock: true, idCardLabel: "식별 메모", scanHintLabel: "스캔 기록", scanHintBody: "위치 공유로 보호자에게 도움을 줄 수 있어요." },
  elder: { roleLine: "NFC 공개 프로필 · 링크유 - 메모리 (기억 동행)", callCta: "보호자·가족에게 연락하기", hideMedicalBlock: true, idCardLabel: "참고 메모", scanHintLabel: "안내", scanHintBody: "필요할 때 가족에게 연락해 주세요." },
  child: { roleLine: "NFC 공개 프로필 · 링크유 - 키즈 (우리 아이 안심)", callCta: "보호자에게 연락하기", hideMedicalBlock: true, idCardLabel: "식별", scanHintLabel: "안내", scanHintBody: "보호자 연락을 우선해 주세요." },
  luggage: { roleLine: "NFC 공개 프로필 · 링크유 - 태그 (수화물·가방)", callCta: "등록자에게 연락하기", hideMedicalBlock: true, idCardLabel: "소지품", scanHintLabel: "분실 안내", scanHintBody: "주인에게 연락해 주시면 감사하겠습니다." },
  gold: {
    roleLine: "NFC 공개 프로필 · 링크유 - 골드 (고귀한 가치·인증서)",
    callCta: "소유자에게 연락하기",
    hideMedicalBlock: true,
    idCardLabel: "인증·제품",
    scanHintLabel: "안내",
    scanHintBody: "고귀한 가치(인증)와 안전한 보호(분실 방지) 안내를 함께 제공합니다.",
  },
};