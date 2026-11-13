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
  { hex: "#BE123C", name: "레드" },
] as const;

export const MAX_TEXT_LINE_LENGTH = 16;

/** 로고·사진 레이어 (R2 또는 스튜디오 공용 에셋) */
export type TagDesignImageLayer = {
  src: string | null;
  /** 0–1 */
  opacity: number;
  /** 텍스트 영역 대비 상대 크기 (0.3–1) */
  scale: number;
};

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
  const scale = typeof r.scale === "number" && Number.isFinite(r.scale) ? clamp(r.scale, 0.25, 1) : base.scale;
  return { src, opacity, scale };
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

  const lines = Array.isArray(r.lines)
    ? r.lines
        .slice(0, ff.maxTextLines)
        .map((l) => (typeof l === "string" ? l.replace(/[\r\n\t]/g, " ").slice(0, MAX_TEXT_LINE_LENGTH) : ""))
    : base.lines;
  while (lines.length < ff.maxTextLines) lines.push("");

  const bodyColor = typeof r.bodyColor === "string" && HEX_RE.test(r.bodyColor) ? r.bodyColor : base.bodyColor;
  const textColor = typeof r.textColor === "string" && HEX_RE.test(r.textColor) ? r.textColor : base.textColor;
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

  return { version: 2, lines, bodyColor, textColor, materialId, textStyle, image, faceArtSrc, templateId };
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
