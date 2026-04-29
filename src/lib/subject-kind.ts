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
    dashboardBgImage: string;
    /** 대시보드 · 관리 대상 목록이 비었을 때 */
    emptyPetsTitle: string;
    emptyPetsBody: string;
    emptyPetsCta: string;
    /** 스캔 이력이 비었을 때 */
    emptyScansTitle: string;
    emptyScansBody: string;
    /** BLE 블록 보조 문구 */
    emptyBleHint: string;
    /** 안심 구역: 관리 대상 없음 / 구역만 없음 */
    emptyGeofencesNoPets: string;
    emptyGeofencesNoZones: string;
  }
> = {
  pet: {
    label: "링크유-펫",
    description: "반려동물 보호자 연결 · NFC 빠른 연락 안내",
    listHeading: "함께하는 아이들",
    registerTitle: "새로운 아이 등록",
    registerSubtitle: "우리 아이의 안전을 위한 첫 걸음입니다.",
    nfcHelper: "대시보드에서 바로 태그를 연결하세요.",
    emptyRegisterHint: "먼저 반려동물을 등록해야 NFC 태그를 연결할 수 있어요.",
    dashboardBgImage: "/images/dashboard/pet-bg.png",
    emptyPetsTitle: "아직 등록된 반려동물이 없어요",
    emptyPetsBody: "프로필을 만든 뒤 NFC 태그를 연결하면 스캔 알림과 위치 단서를 받을 수 있어요.",
    emptyPetsCta: "첫 반려동물 등록하기",
    emptyScansTitle: "아직 스캔 알림이 없어요",
    emptyScansBody:
      "누군가 태그를 스캔하면 시간·위치 힌트가 여기에 쌓여요. 태그를 연결한 뒤 테스트 스캔을 해 보세요.",
    emptyBleHint: "동행 앱·기기에서 보낸 BLE 신호는 아래 목록에 표시됩니다.",
    emptyGeofencesNoPets: "이 모드에서 관리 대상을 먼저 등록하면 안심 구역을 만들 수 있어요.",
    emptyGeofencesNoZones: "아래에서 집·산책 코스 등 중심과 반경을 저장해 두면 가족이 안심할 수 있어요.",
  },
  elder: {
    label: "링크유-메모리",
    description: "어르신 안심 위치추적·케어 · 가족 긴급 연결",
    listHeading: "함께하는 가족",
    registerTitle: "가족 프로필 등록",
    registerSubtitle: "연락처를 남겨 두면, 필요할 때 가족에게 바로 연결돼요.",
    nfcHelper: "인식표를 등록해 두면 스캔 한 번으로 연락처를 확인할 수 있어요.",
    emptyRegisterHint: "먼저 가족 프로필을 등록해야 태그를 연결할 수 있어요.",
    dashboardBgImage: "/images/dashboard/elder-bg.png",
    emptyPetsTitle: "등록된 가족 프로필이 없어요",
    emptyPetsBody: "연락처를 남겨 두면 인식표 스캔 시 가족에게 바로 연결돼요.",
    emptyPetsCta: "가족 프로필 등록하기",
    emptyScansTitle: "스캔 알림이 아직 없어요",
    emptyScansBody: "인식표를 스캔한 분의 단서가 여기에 표시돼요. 태그 연결 후 테스트해 보세요.",
    emptyBleHint: "BLE로 전해진 근접·위치 단서가 아래에 쌓입니다.",
    emptyGeofencesNoPets: "가족 프로필을 먼저 등록하면 안심 구역을 설정할 수 있어요.",
    emptyGeofencesNoZones: "집·병원 등 중심과 반경을 저장해 두면 동행 안심에 도움이 돼요.",
  },
  child: {
    label: "링크유-키즈",
    description: "아이 안전 보호자 연결 · 안심 구역과 알림",
    listHeading: "우리 아이 프로필",
    registerTitle: "아이 프로필 등록",
    registerSubtitle: "이름과 비상 연락처를 입력해 주세요.",
    nfcHelper: "태그를 연결해 두면 필요할 때 신원 확인이 쉬워져요.",
    emptyRegisterHint: "먼저 아이 프로필을 등록해야 태그를 연결할 수 있어요.",
    dashboardBgImage: "/images/dashboard/child-bg.png",
    emptyPetsTitle: "등록된 아이 프로필이 없어요",
    emptyPetsBody: "비상 연락처와 태그를 연결해 두면 학교·놀이터에서도 빠르게 연결돼요.",
    emptyPetsCta: "아이 프로필 등록하기",
    emptyScansTitle: "스캔 알림이 아직 없어요",
    emptyScansBody: "태그가 스캔되면 시간·위치 힌트가 여기에 쌓여요. 연결 후 테스트해 보세요.",
    emptyBleHint: "앱·기기에서 보낸 BLE 알림은 아래에서 확인할 수 있어요.",
    emptyGeofencesNoPets: "아이 프로필을 먼저 등록하면 학교·집 주변 안심 구역을 만들 수 있어요.",
    emptyGeofencesNoZones: "등하원·놀이 구역을 반경으로 지정해 두면 보호자에게 단서가 됩니다.",
  },
  luggage: {
    label: "링크유-러기지",
    description: "수하물 분실 대응 · 소유자 빠른 연결",
    listHeading: "등록한 소지품",
    registerTitle: "소지품 등록",
    registerSubtitle: "가방·캐리어 등 구분하기 쉬운 이름을 입력하세요.",
    nfcHelper: "여행용 태그를 연결해 분실 시 단서를 남길 수 있어요.",
    emptyRegisterHint: "먼저 소지품을 등록해야 태그를 연결할 수 있어요.",
    dashboardBgImage: "/images/dashboard/luggage-bg.png",
    emptyPetsTitle: "등록된 소지품이 없어요",
    emptyPetsBody: "캐리어·가방 이름을 등록하고 태그를 연결하면 분실 시 발견 단서를 받을 수 있어요.",
    emptyPetsCta: "소지품 등록하기",
    emptyScansTitle: "스캔·분실 단서가 아직 없어요",
    emptyScansBody: "누군가 태그를 스캔하면 여기에 기록돼요. 태그 ID를 연결한 뒤 테스트해 보세요.",
    emptyBleHint: "BLE로 남긴 근접 기록은 아래 목록에서 확인하세요.",
    emptyGeofencesNoPets: "소지품을 먼저 등록하면 집·공항 등 안심 구역을 지정할 수 있어요.",
    emptyGeofencesNoZones: "숙소·집 주변을 반경으로 저장해 두면 분실 시 힌트가 됩니다.",
  },
  gold: {
    label: "링크유-골드",
    description:
      "주얼리 · 고귀한 가치(인증서)와 안전한 보호(분실 방지)를 함께 — NFC로 가치 증명과 주인 연결",
    listHeading: "등록한 골드·주얼리",
    registerTitle: "제품·소유 등록",
    registerSubtitle: "제품명과 연락처를 남겨 인증 가치와 분실 시 복구에 활용하세요.",
    nfcHelper: "NFC 태그를 연결하면 인증 안내와 안심 찾기 정보를 한 번에 전달할 수 있어요.",
    emptyRegisterHint: "먼저 제품을 등록해야 태그를 연결할 수 있어요.",
    dashboardBgImage: "/images/dashboard/gold-bg.png",
    emptyPetsTitle: "등록된 제품이 없어요",
    emptyPetsBody: "제품 정보와 태그를 연결하면 인증 안내와 분실 시 연락이 한 번에 전달돼요.",
    emptyPetsCta: "제품·소유 등록하기",
    emptyScansTitle: "스캔 기록이 아직 없어요",
    emptyScansBody: "태그가 스캔되면 시간·단서가 여기에 쌓여요. 태그 연결 후 확인해 보세요.",
    emptyBleHint: "BLE·근접 이벤트는 아래에서 함께 확인할 수 있어요.",
    emptyGeofencesNoPets: "제품을 먼저 등록하면 보관 장소·안전 구역을 설정할 수 있어요.",
    emptyGeofencesNoZones: "보관함·전시 구역 등을 반경으로 지정해 두면 안심 모니터링에 도움이 됩니다.",
  },
};

/** NFC/QR (S3) */
export const subjectKindNfcPublic: Record<
  SubjectKind,
  { roleLine: string; callCta: string; hideMedicalBlock: boolean; idCardLabel: string; scanHintLabel: string; scanHintBody: string }
> = {
  pet: { roleLine: "가족이 남긴 연락 화면 · 링크유-펫", callCta: "전화로 알리기", hideMedicalBlock: true, idCardLabel: "참고", scanHintLabel: "도움말", scanHintBody: "가능하면 위치도 보내 주시면 가족에게 큰 도움이 돼요." },
  elder: { roleLine: "가족이 남긴 연락 화면 · 링크유-메모리", callCta: "전화로 알리기", hideMedicalBlock: true, idCardLabel: "참고", scanHintLabel: "도움말", scanHintBody: "필요할 때 위 전화(문자)로 가족에게 연락해 주세요." },
  child: { roleLine: "가족이 남긴 연락 화면 · 링크유-키즈", callCta: "전화로 알리기", hideMedicalBlock: true, idCardLabel: "참고", scanHintLabel: "도움말", scanHintBody: "가족에게 먼저 연락해 주세요." },
  luggage: { roleLine: "가족이 남긴 연락 화면 · 링크유-러기지", callCta: "전화로 알리기", hideMedicalBlock: true, idCardLabel: "물품", scanHintLabel: "도움말", scanHintBody: "주인에게 연락해 주시면 감사합니다." },
  gold: {
    roleLine: "가족이 남긴 연락 화면 · 링크유-골드",
    callCta: "전화로 알리기",
    hideMedicalBlock: true,
    idCardLabel: "제품",
    scanHintLabel: "도움말",
    scanHintBody: "주인에게 먼저 연락해 주시고, 필요하면 위치도 보내 주세요.",
  },
};