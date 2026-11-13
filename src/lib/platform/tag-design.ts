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

export type TagDesignSpec = {
  version: 1;
  lines: string[];
  bodyColor: string;
  textColor: string;
  materialId: TagMaterialId;
  /** 문구 표현: 양각(raised) / 음각(engraved) */
  textStyle: "raised" | "engraved";
};

export function defaultTagDesign(formFactor: FormFactor, serviceId: PlatformServiceId): TagDesignSpec {
  const firstLine = serviceId === "linku" ? "LINK-U" : serviceId === "wifi" ? "FREE Wi-Fi" : "HELLO";
  return {
    version: 1,
    lines: [firstLine, ""].slice(0, formFactor.maxTextLines),
    bodyColor: TAG_BODY_COLORS[0]!.hex,
    textColor: TAG_TEXT_COLORS[0]!.hex,
    materialId: "pla_matte",
    textStyle: "raised",
  };
}

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

/** 신뢰할 수 없는 입력(JSON)을 폼팩터 제약에 맞게 정규화. 형식이 틀리면 기본값으로 채운다. */
export function normalizeTagDesign(raw: unknown, formFactorId: FormFactorId, serviceId: PlatformServiceId): TagDesignSpec {
  const ff = getFormFactor(formFactorId);
  if (!ff) throw new Error("알 수 없는 태그 모양입니다.");
  const base = defaultTagDesign(ff, serviceId);
  if (!raw || typeof raw !== "object") return base;
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

  return { version: 1, lines, bodyColor, textColor, materialId, textStyle };
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
