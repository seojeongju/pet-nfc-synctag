/**
 * 태그 스튜디오 템플릿.
 * - builtin: 코드 시드 (항상 제공)
 * - custom: D1 `tag_design_templates` (관리자 추가)
 */
import type { FormFactorId } from "@/lib/platform/form-factors";
import type { PlatformServiceId } from "@/lib/platform/services";
import { TEXT_COLOR_DESIGN, type TagDesignSpec } from "@/lib/platform/tag-design";

export type TagDesignTemplateSource = "builtin" | "custom";

export type TagDesignTemplate = {
  id: string;
  serviceId: PlatformServiceId;
  formFactorId: FormFactorId;
  name: string;
  description: string;
  /** 카드에 짧게 보이는 힌트 (예: 틸 · 양각) */
  previewHint: string;
  /** 선택 화면 썸네일·전면 아트 (public 경로) */
  previewImage: string | null;
  /** 정규화 전 기본 스펙 조각 */
  defaultSpec: Partial<TagDesignSpec>;
  source: TagDesignTemplateSource;
  sortOrder: number;
  active: boolean;
};

type BuiltinSeed = Omit<TagDesignTemplate, "source" | "active">;

/** 디지털 명함 전면 아트 (public/images/studio/card, WebP 1200px). 목록 썸네일은 thumb/ 480px */
const CARD_FACE = {
  "01": "/images/studio/card/card-01.webp",
  "02": "/images/studio/card/card-02.webp",
  "03": "/images/studio/card/card-03.webp",
  "04": "/images/studio/card/card-04.webp",
  "05": "/images/studio/card/card-05.webp",
  "06": "/images/studio/card/card-06.webp",
  "07": "/images/studio/card/card-07.webp",
  "08": "/images/studio/card/card-08.webp",
  "09": "/images/studio/card/card-09.webp",
  "10": "/images/studio/card/card-10.webp",
} as const;

/** Wi-Fi 스탠드 전면 아트 (public/images/studio/wifi). 목록 썸네일은 thumb/ */
const WIFI_FACE = {
  "01": "/images/studio/wifi/wifi-01.svg",
  "02": "/images/studio/wifi/wifi-02.svg",
  "03": "/images/studio/wifi/wifi-03.svg",
  "04": "/images/studio/wifi/wifi-04.svg",
  "05": "/images/studio/wifi/wifi-05.svg",
  "06": "/images/studio/wifi/wifi-06.svg",
  "07": "/images/studio/wifi/wifi-07.svg",
  "08": "/images/studio/wifi/wifi-08.svg",
  "09": "/images/studio/wifi/wifi-09.svg",
  "10": "/images/studio/wifi/wifi-10.svg",
} as const;

function cardTemplate(
  num: keyof typeof CARD_FACE,
  name: string,
  description: string,
  hint: string,
  lines: [string, string],
  bodyColor: string,
  sortOrder: number
): BuiltinSeed {
  const face = CARD_FACE[num];
  return {
    id: `tpl_card_face_${num}`,
    serviceId: "card",
    formFactorId: "card_plate",
    name,
    description,
    previewHint: hint,
    previewImage: face.replace("/images/studio/card/", "/images/studio/card/thumb/"),
    defaultSpec: {
      lines,
      bodyColor,
      // 명함 아트마다 이름·부가 문구 색이 달라(예: 06 검정/흰색) 기본은 템플릿 원래 색
      textColor: TEXT_COLOR_DESIGN,
      materialId: "pla_matte",
      textStyle: "raised",
      faceArtSrc: face,
    },
    sortOrder,
  };
}

function wifiTemplate(
  num: keyof typeof WIFI_FACE,
  name: string,
  description: string,
  hint: string,
  lines: [string, string, string],
  bodyColor: string,
  sortOrder: number
): BuiltinSeed {
  const face = WIFI_FACE[num];
  return {
    id: `tpl_wifi_face_${num}`,
    serviceId: "wifi",
    formFactorId: "stand_plate",
    name,
    description,
    previewHint: hint,
    previewImage: face.replace("/images/studio/wifi/", "/images/studio/wifi/thumb/"),
    defaultSpec: {
      lines,
      bodyColor,
      textColor: TEXT_COLOR_DESIGN,
      materialId: "pla_matte",
      textStyle: "raised",
      faceArtSrc: face,
    },
    sortOrder,
  };
}

const BUILTIN: readonly BuiltinSeed[] = [
  {
    id: "tpl_linku_keyring_brand",
    serviceId: "linku",
    formFactorId: "keyring_round",
    name: "안심 키링 · 브랜드",
    description: "LINK-U 문구와 틸 본체로 시작하는 기본 키링입니다.",
    previewHint: "틸 · 양각",
    previewImage: null,
    defaultSpec: {
      lines: ["LINK-U", ""],
      bodyColor: "#00A896",
      textColor: "#FFFFFF",
      materialId: "pla_matte",
      textStyle: "raised",
    },
    sortOrder: 10,
  },
  {
    id: "tpl_linku_keyring_name",
    serviceId: "linku",
    formFactorId: "keyring_round",
    name: "안심 키링 · 이름표",
    description: "이름과 연락 안내 문구를 넣는 편집용 키링입니다.",
    previewHint: "화이트 · 이름",
    previewImage: null,
    defaultSpec: {
      lines: ["이름", "찾아주세요"],
      bodyColor: "#FFFFFF",
      textColor: "#0F172A",
      materialId: "pla_matte",
      textStyle: "raised",
    },
    sortOrder: 20,
  },
  {
    id: "tpl_linku_bone_pet",
    serviceId: "linku",
    formFactorId: "pendant_bone",
    name: "펫 펜던트 · 뼈다귀",
    description: "반려동물 인식표에 맞춘 뼈다귀 모양 기본 템플릿입니다.",
    previewHint: "로즈 · 펫",
    previewImage: null,
    defaultSpec: {
      lines: ["초코", "LINK-U"],
      bodyColor: "#FDA4AF",
      textColor: "#0F172A",
      materialId: "pla_matte",
      textStyle: "raised",
    },
    sortOrder: 30,
  },
  cardTemplate("01", "네이비 사이드바", "왼쪽 시안 바와 NFC 마크가 있는 클래식 명함.", "네이비 · 사이드", ["NAME", "SHORT TEXT"], "#0B1B3A", 10),
  cardTemplate("02", "화이트 대각 컷", "밝은 바탕과 대각 네이비 코너 디자인.", "화이트 · 대각", ["NAME", "SHORT TEXT"], "#F8FAFC", 20),
  cardTemplate("03", "센터 NFC 터치", "중앙 NFC 원과 TOUCH HERE 안내형.", "네이비 · 센터", ["NAME", "SHORT TEXT"], "#0B1B3A", 30),
  cardTemplate("04", "회로 프레임", "시안 회로 패턴과 상단 NFC 탭.", "화이트 · 회로", ["NAME", "SHORT TEXT"], "#FFFFFF", 40),
  cardTemplate("05", "웨이브 바텀", "하단 웨이브와 우측 NFC 아이콘.", "화이트 · 웨이브", ["NAME", "SHORT TEXT"], "#FFFFFF", 50),
  cardTemplate("06", "명함 템플릿 06", "디지털 명함 전면 아트 06번.", "카드 · 06", ["NAME", "SHORT TEXT"], "#0B1B3A", 60),
  cardTemplate("07", "명함 템플릿 07", "디지털 명함 전면 아트 07번.", "카드 · 07", ["NAME", "SHORT TEXT"], "#0B1B3A", 70),
  cardTemplate("08", "명함 템플릿 08", "디지털 명함 전면 아트 08번.", "카드 · 08", ["NAME", "SHORT TEXT"], "#F8FAFC", 80),
  cardTemplate("09", "명함 템플릿 09", "디지털 명함 전면 아트 09번.", "카드 · 09", ["NAME", "SHORT TEXT"], "#FFFFFF", 90),
  cardTemplate("10", "명함 템플릿 10", "디지털 명함 전면 아트 10번.", "카드 · 10", ["NAME", "SHORT TEXT"], "#0B1B3A", 100),
  wifiTemplate("01", "스카이 프리 Wi-Fi", "밝은 스카이 톤의 기본 무료 Wi-Fi 스탠드.", "스카이 · 프리", ["NAME", "SHORT TEXT", ""], "#E0F2FE", 10),
  wifiTemplate("02", "나이트 커넥트", "다크 네이비 배경의 세련된 접속 안내.", "네이비 · 야간", ["NAME", "SHORT TEXT", ""], "#0B1B3A", 20),
  wifiTemplate("03", "게스트 앰버", "손님용·로비용 따뜻한 앰버 안내판.", "앰버 · 게스트", ["NAME", "SHORT TEXT", ""], "#FFFBEB", 30),
  wifiTemplate("04", "미니멀 프레임", "화이트 프레임과 틸 포인트의 심플형.", "화이트 · 프레임", ["NAME", "SHORT TEXT", ""], "#FFFFFF", 40),
  wifiTemplate("05", "브랜드 틸", "LINK-U 틸 컬러의 브랜드형 스탠드.", "틸 · 브랜드", ["NAME", "SHORT TEXT", ""], "#CCEDEA", 50),
  wifiTemplate("06", "호텔 골드", "호텔·숙박용 다크+골드 포인트.", "다크 · 골드", ["NAME", "SHORT TEXT", ""], "#1C1917", 60),
  wifiTemplate("07", "시안 존", "FREE Wi-Fi ZONE 강조형 시안 스탠드.", "시안 · 존", ["NAME", "SHORT TEXT", ""], "#083344", 70),
  wifiTemplate("08", "민트 안내", "한글 안내 문구가 잘 보이는 민트형.", "민트 · 안내", ["NAME", "SHORT TEXT", ""], "#F0FDFA", 80),
  wifiTemplate("09", "오피스 슬레이트", "사무실·회의실용 미니멀 슬레이트.", "슬레이트 · 오피스", ["NAME", "SHORT TEXT", ""], "#F1F5F9", 90),
  wifiTemplate("10", "카페 로즈", "카페·베이커리용 로즈 포인트 스탠드.", "로즈 · 카페", ["NAME", "SHORT TEXT", ""], "#FFF1F2", 100),
  {
    id: "tpl_store_stand",
    serviceId: "store",
    formFactorId: "stand_plate",
    name: "매장 리뷰 스탠드",
    description: "리뷰·메뉴·SNS로 연결하는 매장 카운터용입니다.",
    previewHint: "앰버 · 매장",
    previewImage: null,
    defaultSpec: {
      lines: ["리뷰 남겨요", "메뉴 보기", ""],
      bodyColor: "#FCD34D",
      textColor: "#0F172A",
      materialId: "pla_matte",
      textStyle: "raised",
    },
    sortOrder: 10,
  },
  {
    id: "tpl_asset_stand",
    serviceId: "asset",
    formFactorId: "stand_plate",
    name: "자산 라벨 플레이트",
    description: "설비·공구 이력 확인용 플레이트입니다.",
    previewHint: "슬레이트 · 자산",
    previewImage: null,
    defaultSpec: {
      lines: ["ASSET", "SCAN ME", ""],
      bodyColor: "#0F172A",
      textColor: "#FCD34D",
      materialId: "petg_gloss",
      textStyle: "raised",
    },
    sortOrder: 10,
  },
  {
    id: "tpl_custom_keyring",
    serviceId: "custom",
    formFactorId: "keyring_round",
    name: "자유 키링",
    description: "원하는 문구와 색으로 시작하는 자유 링크 키링입니다.",
    previewHint: "라벤더 · 자유",
    previewImage: null,
    defaultSpec: {
      lines: ["HELLO", ""],
      bodyColor: "#C4B5FD",
      textColor: "#0F172A",
      materialId: "pla_matte",
      textStyle: "raised",
    },
    sortOrder: 10,
  },
  {
    id: "tpl_custom_stand",
    serviceId: "custom",
    formFactorId: "stand_plate",
    name: "자유 스탠드",
    description: "이벤트·청첩장·포트폴리오용 스탠드입니다.",
    previewHint: "화이트 · 자유",
    previewImage: null,
    defaultSpec: {
      lines: ["EVENT", "TAP HERE", ""],
      bodyColor: "#FFFFFF",
      textColor: "#00655A",
      materialId: "pla_matte",
      textStyle: "engraved",
    },
    sortOrder: 20,
  },
] as const;

export function listBuiltinTemplates(serviceId?: PlatformServiceId): TagDesignTemplate[] {
  return BUILTIN.filter((t) => !serviceId || t.serviceId === serviceId)
    .map((t) => ({ ...t, source: "builtin" as const, active: true }))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "ko"));
}

export function getBuiltinTemplate(id: string): TagDesignTemplate | null {
  const t = BUILTIN.find((x) => x.id === id);
  return t ? { ...t, source: "builtin", active: true } : null;
}

export type DbTemplateRow = {
  id: string;
  service_id: string;
  form_factor_id: string;
  name: string;
  description: string;
  preview_hint: string;
  default_spec_json: string;
  sort_order: number;
  active: number;
};

export function dbRowToTemplate(row: DbTemplateRow): TagDesignTemplate | null {
  let partial: Partial<TagDesignSpec> = {};
  try {
    const parsed = JSON.parse(row.default_spec_json) as unknown;
    if (parsed && typeof parsed === "object") partial = parsed as Partial<TagDesignSpec>;
  } catch {
    partial = {};
  }
  const face = typeof partial.faceArtSrc === "string" ? partial.faceArtSrc : null;
  return {
    id: row.id,
    serviceId: row.service_id as PlatformServiceId,
    formFactorId: row.form_factor_id as FormFactorId,
    name: row.name,
    description: row.description ?? "",
    previewHint: row.preview_hint || "커스텀",
    previewImage: face,
    defaultSpec: partial,
    source: "custom",
    sortOrder: Number(row.sort_order) || 100,
    active: Number(row.active) === 1,
  };
}

/** builtin + DB(custom) 병합. 같은 id면 custom이 덮어쓴다. */
export function mergeTemplates(
  builtin: TagDesignTemplate[],
  custom: TagDesignTemplate[],
  opts?: { includeInactive?: boolean }
): TagDesignTemplate[] {
  const map = new Map<string, TagDesignTemplate>();
  for (const t of builtin) map.set(t.id, t);
  for (const t of custom) {
    if (!opts?.includeInactive && !t.active) continue;
    map.set(t.id, t);
  }
  return [...map.values()]
    .filter((t) => opts?.includeInactive || t.active)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "ko"));
}
