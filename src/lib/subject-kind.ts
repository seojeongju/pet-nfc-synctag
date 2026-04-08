export const SUBJECT_KINDS = ["pet", "elder", "child", "luggage"] as const;
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
    label: "반려동물",
    description: "NFC 인식표로 분실 시 빠른 연락",
    listHeading: "함께하는 아이들",
    registerTitle: "새로운 아이 등록",
    registerSubtitle: "우리 아이의 안전을 위한 첫 걸음입니다.",
    nfcHelper: "대시보드에서 바로 태그를 연결하세요.",
    emptyRegisterHint: "먼저 반려동물을 등록해야 NFC 태그를 연결할 수 있어요.",
  },
  elder: {
    label: "노인 · 치매 케어",
    description: "배회·이탈 알림과 긴급 연락 (BLE 확장 예정)",
    listHeading: "케어 대상",
    registerTitle: "케어 대상 등록",
    registerSubtitle: "연락처와 메모를 남겨 두면 발견 시 도움이 됩니다.",
    nfcHelper: "인식표를 등록해 두면 스캔 한 번으로 연락처를 확인할 수 있어요.",
    emptyRegisterHint: "먼저 케어 대상을 등록해야 태그를 연결할 수 있어요.",
  },
  child: {
    label: "어린이",
    description: "가상 울타리·알림 (BLE·지오펜스 확장 예정)",
    listHeading: "자녀 프로필",
    registerTitle: "자녀 프로필 등록",
    registerSubtitle: "이름과 비상 연락처를 입력해 주세요.",
    nfcHelper: "태그를 연결해 두면 필요 시 신원 확인이 쉬워집니다.",
    emptyRegisterHint: "먼저 자녀 프로필을 등록해야 태그를 연결할 수 있어요.",
  },
  luggage: {
    label: "수화물 · 가방",
    description: "분실 시 마지막 스캔·단서 기록",
    listHeading: "등록한 소지품",
    registerTitle: "소지품 등록",
    registerSubtitle: "가방·캐리어 등 구분하기 쉬운 이름을 입력하세요.",
    nfcHelper: "여행용 태그를 연결해 분실 시 단서를 남길 수 있어요.",
    emptyRegisterHint: "먼저 소지품을 등록해야 태그를 연결할 수 있어요.",
  },
};

/** NFC/QR (S3) */
export const subjectKindNfcPublic: Record<
  SubjectKind,
  { roleLine: string; callCta: string; hideMedicalBlock: boolean; idCardLabel: string; scanHintLabel: string; scanHintBody: string }
> = {
  pet: { roleLine: "NFC 공개 프로필 · 반려동물", callCta: "보호자에게 연락하기", hideMedicalBlock: true, idCardLabel: "식별 메모", scanHintLabel: "스캔 기록", scanHintBody: "위치 공유로 보호자에게 도움을 줄 수 있어요." },
  elder: { roleLine: "NFC 공개 프로필 · 케어", callCta: "보호자·가족에게 연락하기", hideMedicalBlock: true, idCardLabel: "참고 메모", scanHintLabel: "안내", scanHintBody: "필요 시 보호자에게 연락해 주세요." },
  child: { roleLine: "NFC 공개 프로필 · 보호 대상", callCta: "보호자에게 연락하기", hideMedicalBlock: true, idCardLabel: "식별", scanHintLabel: "안내", scanHintBody: "보호자 연락을 우선해 주세요." },
  luggage: { roleLine: "NFC 공개 프로필 · 분실물", callCta: "등록자에게 연락하기", hideMedicalBlock: true, idCardLabel: "소지품", scanHintLabel: "분실 안내", scanHintBody: "주인에게 연락해 주시면 감사하겠습니다." },
};