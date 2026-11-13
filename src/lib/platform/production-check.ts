/**
 * 제작 안전 검사 (순수 함수). 스튜디오 편집 화면에서 실시간으로, 서버에서는 "디자인 완료" 시 한 번 더 돌린다.
 * 캔버스 결과(요소 영역)가 있으면 글자 크기·영역 밖·칩 위 문구까지 검사하고, 없으면 칩 여유만 검사한다.
 */
import type { FormFactor } from "@/lib/platform/form-factors";
import { getTagMaterial, type TagDesignSpec } from "@/lib/platform/tag-design";
import { chipEdgeClearanceMm, chipPlacementFor } from "@/lib/platform/tag-geometry";

export const PRODUCTION_RULES = {
  /** 칩 원과 그림 영역 가장자리 사이 최소 여유 */
  chipEdgeMarginMm: 2,
  /** 칩 포켓 위에 남기는 덮개 두께 (3D 출력 중 일시정지 후 칩 삽입) */
  chipCoverMm: 1.0,
  /** 칩 포켓 지름·깊이 여유 */
  chipPocketToleranceMm: 0.3,
  /** 공법별 권장 최소 글자 높이 */
  minTextMm: { FDM: 3, SLA: 2 } as const,
  /** 양각 문구 높이 · 음각 깊이 */
  raisedTextMm: 0.6,
  engraveDepthMm: 0.5,
} as const;

export type ProductionIssueLevel = "error" | "warn" | "info";

export type ProductionIssue = {
  level: ProductionIssueLevel;
  code: string;
  message: string;
  /** 관련 요소 (편집기에서 선택 가능) — line0.. | image | chip */
  target?: string;
};

/** 윗면 캔버스 결과: 그려진 요소 영역 (캔버스 픽셀) */
export type FacePaintInfo = {
  pxPerMm: number;
  width: number;
  height: number;
  boxes: Partial<Record<string, { x: number; y: number; w: number; h: number; r?: number }>>;
};

/** 서버·클라이언트 공용: 칩이 가장자리에 너무 가깝거나 영역 밖이면 오류 */
export function checkChipMargin(ff: FormFactor, spec: TagDesignSpec): ProductionIssue | null {
  const clearance = chipEdgeClearanceMm(ff, spec);
  if (clearance < 0) {
    return { level: "error", code: "chip_outside", message: "NFC 칩이 태그 그림 영역 밖으로 나갔습니다. 칩을 안쪽으로 옮겨 주세요.", target: "chip" };
  }
  if (clearance < PRODUCTION_RULES.chipEdgeMarginMm) {
    return {
      level: "error",
      code: "chip_margin",
      message: `NFC 칩이 가장자리에서 ${clearance.toFixed(1)}mm 떨어져 있습니다. 출력 강도와 인식률을 위해 ${PRODUCTION_RULES.chipEdgeMarginMm}mm 이상 띄워 주세요.`,
      target: "chip",
    };
  }
  return null;
}

/** 회전을 고려한 축정렬 경계 상자 */
function aabb(b: { x: number; y: number; w: number; h: number; r?: number }) {
  if (!b.r) return { x0: b.x, y0: b.y, x1: b.x + b.w, y1: b.y + b.h };
  const a = (b.r * Math.PI) / 180;
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  const hw = (Math.abs(Math.cos(a)) * b.w + Math.abs(Math.sin(a)) * b.h) / 2;
  const hh = (Math.abs(Math.sin(a)) * b.w + Math.abs(Math.cos(a)) * b.h) / 2;
  return { x0: cx - hw, y0: cy - hh, x1: cx + hw, y1: cy + hh };
}

const LEVEL_ORDER: Record<ProductionIssueLevel, number> = { error: 0, warn: 1, info: 2 };

export function runProductionChecks(ff: FormFactor, spec: TagDesignSpec, face?: FacePaintInfo | null): ProductionIssue[] {
  const issues: ProductionIssue[] = [];
  const lines = spec.lines.map((l) => l.trim());
  const hasText = lines.some(Boolean);
  const hasLogo = Boolean(spec.image?.src);

  if (!hasText && !hasLogo) {
    issues.push({ level: "error", code: "empty", message: "태그에 넣을 문구 또는 이미지를 추가해 주세요." });
  }

  const chip = checkChipMargin(ff, spec);
  if (chip) issues.push(chip);

  if (face) {
    const process = getTagMaterial(spec.materialId).process;
    const minText = PRODUCTION_RULES.minTextMm[process];
    const chipP = chipPlacementFor(ff, spec);
    const chipPx = { x: chipP.x * face.width, y: chipP.y * face.height, r: (ff.chip.diameterMm / 2) * face.pxPerMm };

    lines.forEach((line, i) => {
      const box = face.boxes[`line${i}`];
      if (!line || !box) return;
      // drawLine은 박스 높이를 글자 크기의 1.2배로 잡는다
      const sizeMm = box.h / 1.2 / face.pxPerMm;
      if (sizeMm < minText) {
        issues.push({
          level: "warn",
          code: "text_small",
          message: `문구 ${i + 1} 글자 높이가 약 ${sizeMm.toFixed(1)}mm입니다. ${process} 출력은 ${minText}mm 이상을 권장합니다.`,
          target: `line${i}`,
        });
      }
      const { x0, y0, x1, y1 } = aabb(box);
      if (x0 < 0 || y0 < 0 || x1 > face.width || y1 > face.height) {
        issues.push({ level: "warn", code: "text_clipped", message: `문구 ${i + 1}이(가) 태그 영역 밖으로 잘립니다.`, target: `line${i}` });
      }
      // 칩 원과 겹침 (가장 가까운 점 거리)
      const nx = Math.max(x0, Math.min(chipPx.x, x1));
      const ny = Math.max(y0, Math.min(chipPx.y, y1));
      const overlaps = Math.hypot(nx - chipPx.x, ny - chipPx.y) < chipPx.r;
      if (overlaps && spec.textStyle === "engraved") {
        issues.push({
          level: "warn",
          code: "engrave_over_chip",
          message: `음각 문구 ${i + 1}이(가) NFC 칩 위에 있어 칩 덮개가 얇아집니다. 문구나 칩을 옮기거나 양각으로 바꿔 주세요.`,
          target: `line${i}`,
        });
      }
    });

    if (hasLogo && face.boxes.image) {
      const { x0, y0, x1, y1 } = aabb(face.boxes.image);
      if (x0 < 0 || y0 < 0 || x1 > face.width || y1 > face.height) {
        issues.push({ level: "warn", code: "logo_clipped", message: "로고가 태그 영역 밖으로 잘립니다.", target: "image" });
      }
    }
  }

  if (hasLogo) {
    issues.push({
      level: "info",
      code: "logo_print",
      message: "로고·사진은 표면 인쇄(UV/전사)로 처리되며 3D 형상 파일에는 포함되지 않습니다.",
      target: "image",
    });
  }
  if (spec.faceArtSrc) {
    issues.push({ level: "info", code: "art_print", message: "템플릿 전면 디자인은 표면 인쇄로, 문구는 양각/음각 형상으로 제작됩니다." });
  }

  return issues.sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);
}
