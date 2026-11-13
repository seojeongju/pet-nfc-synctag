/**
 * 커스텀 태그 디자인 데이터(`tag_designs.design_json`) 형식과 검증.
 * 클라이언트 에디터·3D 프리뷰·서버 저장이 같은 정규화 함수를 쓴다.
 */
import { getFormFactor, type FormFactor, type FormFactorId } from "@/lib/platform/form-factors";
import type { PlatformServiceId } from "@/lib/platform/services";

export type TagMaterialId = "pla_matte" | "petg_gloss" | "resin_clear" | "wood_pla";

export type TagMaterial = { id: TagMaterialId; name: string; process: "FDM" | "SLA"; roughness: number; metalness: number; opacity: number };

export const TAG_MATERIALS: readonly TagMaterial[] = [
  { id: "pla_matte", name: "PLA 무광", process: "FDM", roughness: 0.85, metalness: 0, opacity: 1 },
  { id: "petg_gloss", name: "PETG 유광", process: "FDM", roughness: 0.25, metalness: 0.05, opacity: 1 },
  { id: "resin_clear", name: "레진 반투명", process: "SLA", roughness: 0.1, metalness: 0, opacity: 0.72 },
  { id: "wood_pla", name: "우드 PLA", process: "FDM", roughness: 0.95, metalness: 0, opacity: 1 },
] as const;

/** Link-U 브랜드 팔레트 기반 본체 색상 */
export const TAG_BODY_COLORS: readonly { hex: string; name: string }[] = [
  { hex: "#00A896", name: "링크유 틸" },
  { hex: "#FFFFFF", name: "화이트" },
  { hex: "#0F172A", name: "블랙" },
  { hex: "#FDA4AF", name: "로즈" },
  { hex: "#FCD34D", name: "앰버" },
  { hex: "#93C5FD", name: "스카이" },
  { hex: "#C4B5FD", name: "라벤더" },
  { hex: "#B45309", name: "브라운" },
] as const;

export const TAG_TEXT_COLORS: readonly { hex: string; name: string }[] = [
  { hex: "#FFFFFF", name: "화이트" },
  { hex: "#0F172A", name: "블랙" },
  { hex: "#00655A", name: "딥 틸" },
  { hex: "#1E3A8A", name: "네이비" },
  { hex: "#0891B2", name: "시안" },
  { hex: "#CA8A04", name: "골드" },
  { hex: "#BE123C", name: "레드" },
] as const;

/** 문구 색 "디자인 기본" — 명함 템플릿의 원래 글자색(슬롯별)을 그대로 쓴다 */
export const TEXT_COLOR_DESIGN = "design";

export const MAX_TEXT_LINE_LENGTH = 16;

/** 로고·사진 레이어 (R2 또는 스튜디오 공용 에셋) */
export type TagDesignImageLayer = {
  src: string | null;
  /** 0–1 */
  opacity: number;
  /** 텍스트 영역 대비 상대 크기 (0.3–1) */
  scale: number;
};

/**
 * 사용자가 끌어서 옮긴 요소 배치. 좌표는 윗면 그림 영역 대비 비율(0..1, 왼쪽 위 기준), s는 크기 배율.
 * null이면 템플릿·기본 배치를 쓴다.
 */
export type ElementPlacement = { x: number; y: number; s: number; /** 회전(도, -180..180) */ r?: number };

/** 문구 글꼴 */
export type TagFontId = "outfit" | "gothic" | "serif" | "round" | "display";

export const TAG_FONTS: readonly {
  id: TagFontId;
  name: string;
  family: string;
  /** 캔버스에서 쓰기 전에 불러올 웹폰트(Google Fonts family) */
  webFont?: string;
}[] = [
  { id: "outfit", name: "기본 (Outfit)", family: 'Outfit, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif' },
  { id: "gothic", name: "고딕", family: '"Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif' },
  { id: "serif", name: "명조", family: '"Noto Serif KR", "Apple Myungjo", Batang, Georgia, serif', webFont: "Noto Serif KR" },
  { id: "round", name: "둥근", family: 'Jua, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif', webFont: "Jua" },
  { id: "display", name: "굵은 제목", family: '"Black Han Sans", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif', webFont: "Black Han Sans" },
] as const;

export function getTagFont(id: TagFontId | undefined | null) {
  return TAG_FONTS.find((f) => f.id === id) ?? TAG_FONTS[0]!;
}

/** 줄별 스타일. 비어 있으면 전역 문구 색·기본 글꼴 */
export type LineStyle = { color?: string; font?: TagFontId };

/** 겹침 순서 대상 (뒤에 올수록 위에 그려짐) */
export type LayerId = "image" | `line${number}`;

export type TagDesignLayout = {
  /** 문구 줄별 배치 */
  lines: (ElementPlacement | null)[];
  /** 로고·이미지 중심 (크기는 image.scale) */
  image: ElementPlacement | null;
  /** NFC 칩 중심 (크기는 칩 규격 고정) */
  chip: { x: number; y: number } | null;
  /** 줄별 색·글꼴 */
  styles: (LineStyle | null)[];
  /** 겹침 순서. 없으면 로고 → 문구 순 */
  order: LayerId[] | null;
};

/** 템플릿 기본 줄 수와 무관하게 추가할 수 있는 최대 문구 줄 수 */
export const MAX_TEXT_LINES_TOTAL = 5;

export const PLACEMENT_SCALE_MIN = 0.4;
export const PLACEMENT_SCALE_MAX = 2.5;
export const IMAGE_SCALE_MIN = 0.1;
export const IMAGE_SCALE_MAX = 2;

export function emptyLayout(lineCount = 3): TagDesignLayout {
  return {
    lines: Array.from({ length: lineCount }, () => null),
    image: null,
    chip: null,
    styles: Array.from({ length: lineCount }, () => null),
    order: null,
  };
}

/** 그리기 순서(아래→위). order가 없거나 빠진 항목은 로고 → 문구 순으로 뒤에 붙인다 */
export function layerOrderFor(lineCount: number, order: LayerId[] | null | undefined): LayerId[] {
  const all: LayerId[] = ["image", ...Array.from({ length: lineCount }, (_, i) => `line${i}` as LayerId)];
  const given = (order ?? []).filter((id) => all.includes(id));
  return [...given, ...all.filter((id) => !given.includes(id))];
}

export type TagDesignSpec = {
  version: 2;
  lines: string[];
  bodyColor: string;
  textColor: string;
  materialId: TagMaterialId;
  /** 문구 표현: 양각(raised) / 음각(engraved) */
  textStyle: "raised" | "engraved";
  image: TagDesignImageLayer;
  /** 템플릿 전면 아트 (`/images/studio/...`) — 명함 등 풀페이스 디자인 */
  faceArtSrc: string | null;
  /** 시작한 템플릿 id (추적·통계용, 없어도 됨) */
  templateId: string | null;
  /** 문구·로고·NFC 칩 위치·크기 (스튜디오에서 끌어서 편집) */
  layout: TagDesignLayout;
};

export function emptyImageLayer(): TagDesignImageLayer {
  return { src: null, opacity: 0.95, scale: 0.55 };
}

export function defaultTagDesign(formFactor: FormFactor, serviceId: PlatformServiceId): TagDesignSpec {
  const firstLine = serviceId === "linku" ? "LINK-U" : serviceId === "wifi" ? "FREE Wi-Fi" : "HELLO";
  return {
    version: 2,
    lines: [firstLine, ""].slice(0, formFactor.maxTextLines),
    bodyColor: TAG_BODY_COLORS[0]!.hex,
    textColor: TAG_TEXT_COLORS[0]!.hex,
    materialId: "pla_matte",
    textStyle: "raised",
    image: emptyImageLayer(),
    faceArtSrc: null,
    templateId: null,
    layout: emptyLayout(formFactor.maxTextLines),
  };
}

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

/** 업로드(R2) 또는 공용 스튜디오 에셋(`/images/studio/`)만 허용 */
export function isAllowedStudioImageSrc(src: string | null | undefined): boolean {
  if (!src) return true;
  if (src.startsWith("/api/r2/studio/")) return true;
  if (src.startsWith("/api/r2/pets/")) return true;
  if (src.startsWith("/images/studio/")) return true;
  return false;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function normalizeImage(raw: unknown): TagDesignImageLayer {
  const base = emptyImageLayer();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Record<string, unknown>;
  const src = typeof r.src === "string" && isAllowedStudioImageSrc(r.src) ? r.src : null;
  const opacity = typeof r.opacity === "number" && Number.isFinite(r.opacity) ? clamp(r.opacity, 0.15, 1) : base.opacity;
  const scale =
    typeof r.scale === "number" && Number.isFinite(r.scale) ? clamp(r.scale, IMAGE_SCALE_MIN, IMAGE_SCALE_MAX) : base.scale;
  return { src, opacity, scale };
}

function finite(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

/** 각도를 -180..180(도)로 */
export function normalizeAngle(deg: number): number {
  const a = ((((deg + 180) % 360) + 360) % 360) - 180;
  return Math.round(a * 10) / 10;
}

function normalizePlacement(raw: unknown): ElementPlacement | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (!finite(r.x) || !finite(r.y)) return null;
  const s = finite(r.s) ? clamp(r.s, PLACEMENT_SCALE_MIN, PLACEMENT_SCALE_MAX) : 1;
  const rot = finite(r.r) ? normalizeAngle(r.r) : 0;
  return rot ? { x: clamp(r.x, 0, 1), y: clamp(r.y, 0, 1), s, r: rot } : { x: clamp(r.x, 0, 1), y: clamp(r.y, 0, 1), s };
}

function normalizeLineStyle(raw: unknown): LineStyle | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const out: LineStyle = {};
  if (typeof r.color === "string" && HEX_RE.test(r.color)) out.color = r.color;
  if (typeof r.font === "string" && r.font !== "outfit" && TAG_FONTS.some((f) => f.id === r.font)) out.font = r.font as TagFontId;
  return Object.keys(out).length ? out : null;
}

const LAYER_ID_RE = /^(image|line\d)$/;

function normalizeLayout(raw: unknown, lineCount: number): TagDesignLayout {
  const base = emptyLayout(lineCount);
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Record<string, unknown>;
  const lines = Array.isArray(r.lines) ? r.lines.slice(0, lineCount).map(normalizePlacement) : base.lines;
  while (lines.length < lineCount) lines.push(null);
  const styles = Array.isArray(r.styles) ? r.styles.slice(0, lineCount).map(normalizeLineStyle) : base.styles;
  while (styles.length < lineCount) styles.push(null);
  const image = normalizePlacement(r.image);
  let chip: TagDesignLayout["chip"] = null;
  if (r.chip && typeof r.chip === "object") {
    const c = r.chip as Record<string, unknown>;
    if (finite(c.x) && finite(c.y)) chip = { x: clamp(c.x, 0, 1), y: clamp(c.y, 0, 1) };
  }
  const order = Array.isArray(r.order)
    ? r.order.filter((id): id is LayerId => typeof id === "string" && LAYER_ID_RE.test(id))
    : null;
  return { lines, image, chip, styles, order: order && order.length ? order : null };
}

/** 신뢰할 수 없는 입력(JSON)을 폼팩터 제약에 맞게 정규화. 형식이 틀리면 기본값으로 채운다. */
export function normalizeTagDesign(
  raw: unknown,
  formFactorId: FormFactorId,
  serviceId: PlatformServiceId,
  opts?: { templateId?: string | null }
): TagDesignSpec {
  const ff = getFormFactor(formFactorId);
  if (!ff) throw new Error("알 수 없는 태그 모양입니다.");
  const base = defaultTagDesign(ff, serviceId);
  if (!raw || typeof raw !== "object") {
    return { ...base, templateId: opts?.templateId ?? null };
  }
  const r = raw as Record<string, unknown>;

  // 템플릿 기본 줄(ff.maxTextLines)은 항상 두고, 그 뒤에 사용자가 추가한 줄(최대 MAX_TEXT_LINES_TOTAL)을 둔다
  const lines = Array.isArray(r.lines)
    ? r.lines
        .slice(0, MAX_TEXT_LINES_TOTAL)
        .map((l) => (typeof l === "string" ? l.replace(/[\r\n\t]/g, " ").slice(0, MAX_TEXT_LINE_LENGTH) : ""))
    : base.lines;
  while (lines.length < ff.maxTextLines) lines.push("");
  while (lines.length > ff.maxTextLines && !lines[lines.length - 1]!.trim()) lines.pop();

  const bodyColor = typeof r.bodyColor === "string" && HEX_RE.test(r.bodyColor) ? r.bodyColor : base.bodyColor;
  const textColor =
    typeof r.textColor === "string" && (HEX_RE.test(r.textColor) || r.textColor === TEXT_COLOR_DESIGN)
      ? r.textColor
      : base.textColor;
  const materialId = TAG_MATERIALS.some((m) => m.id === r.materialId) ? (r.materialId as TagMaterialId) : base.materialId;
  const textStyle = r.textStyle === "engraved" ? "engraved" : "raised";
  const image = normalizeImage(r.image);
  const faceArtSrc =
    typeof r.faceArtSrc === "string" && isAllowedStudioImageSrc(r.faceArtSrc) ? r.faceArtSrc : null;
  const templateId =
    opts?.templateId !== undefined
      ? opts.templateId
      : typeof r.templateId === "string" && r.templateId.trim()
        ? r.templateId.trim().slice(0, 64)
        : null;

  const layout = normalizeLayout(r.layout, lines.length);

  return { version: 2, lines, bodyColor, textColor, materialId, textStyle, image, faceArtSrc, templateId, layout };
}

/** 템플릿 기본값 + 서비스/폼팩터로 완성된 spec 생성 */
export function buildSpecFromTemplatePartial(
  partial: Partial<TagDesignSpec> | null | undefined,
  formFactorId: FormFactorId,
  serviceId: PlatformServiceId,
  templateId: string | null
): TagDesignSpec {
  return normalizeTagDesign(partial ?? null, formFactorId, serviceId, { templateId });
}

export function getTagMaterial(id: TagMaterialId): TagMaterial {
  return TAG_MATERIALS.find((m) => m.id === id) ?? TAG_MATERIALS[0]!;
}

export type TagDesignStatus = "draft" | "ready" | "requested" | "locked";

export type TagDesignRecord = {
  id: string;
  serviceId: PlatformServiceId;
  formFactorId: FormFactorId;
  title: string;
  spec: TagDesignSpec;
  status: TagDesignStatus;
  updatedAt: string;
};
