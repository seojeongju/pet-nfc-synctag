/**
 * 태그 윗면 그림 영역·NFC 칩 위치 계산 (mm, 순수 함수).
 * 브라우저(2D/3D 미리보기)와 서버(제작 검사)가 함께 쓴다 — DOM·three.js에 의존하지 않는다.
 */
import type { FormFactor } from "@/lib/platform/form-factors";
import type { TagDesignSpec } from "@/lib/platform/tag-design";

/** 윗면 그림 영역 (중심 x,y · 가로 · 세로, mm, y는 위쪽이 +) */
export type FaceArea = { cx: number; cy: number; w: number; h: number };

export type FaceGeometry = { textArea: FaceArea; chipCenter: [number, number] };

/** 폼팩터별 윗면 그림 영역과 NFC 칩 기본 중심 (mm) */
export function faceGeometryFor(ff: FormFactor): FaceGeometry {
  switch (ff.id) {
    case "keyring_round": {
      const r = ff.widthMm / 2;
      const cy = -(ff.heightMm - ff.widthMm) / 2;
      return { textArea: { cx: 0, cy, w: r * 1.5, h: r * 1.1 }, chipCenter: [0, cy] };
    }
    case "pendant_bone": {
      const knobR = ff.heightMm * 0.27;
      return { textArea: { cx: 0, cy: 0, w: ff.widthMm - knobR * 2.4, h: ff.heightMm * 0.5 }, chipCenter: [0, 0] };
    }
    case "stand_plate":
      return {
        textArea: { cx: 0, cy: ff.heightMm * 0.12, w: ff.widthMm * 0.82, h: ff.heightMm * 0.42 },
        chipCenter: [0, -ff.heightMm * 0.22],
      };
    case "card_plate":
      return {
        textArea: { cx: 0, cy: 0, w: ff.widthMm * 0.96, h: ff.heightMm * 0.96 },
        chipCenter: [ff.widthMm * 0.28, -ff.heightMm * 0.05],
      };
  }
}

/** 칩 중심(그림 영역 비율 0..1, 왼쪽 위 기준). layout.chip이 없으면 폼팩터 기본 위치 */
export function chipPlacementFor(ff: FormFactor, spec: TagDesignSpec): { x: number; y: number } {
  if (spec.layout?.chip) return spec.layout.chip;
  const { textArea, chipCenter } = faceGeometryFor(ff);
  return {
    x: (chipCenter[0] - (textArea.cx - textArea.w / 2)) / textArea.w,
    y: (textArea.cy + textArea.h / 2 - chipCenter[1]) / textArea.h,
  };
}

/** 칩 중심을 mm 좌표(3D, y 위쪽 +)로 */
export function chipCenterMm(ff: FormFactor, spec: TagDesignSpec): [number, number] {
  const { textArea } = faceGeometryFor(ff);
  const p = chipPlacementFor(ff, spec);
  return [textArea.cx - textArea.w / 2 + p.x * textArea.w, textArea.cy + textArea.h / 2 - p.y * textArea.h];
}

/** 칩 원이 그림 영역 밖으로 나가지 않게 비율 좌표를 제한 */
export function clampChipPlacement(ff: FormFactor, x: number, y: number): { x: number; y: number } {
  const { textArea } = faceGeometryFor(ff);
  const rx = ff.chip.diameterMm / 2 / textArea.w;
  const ry = ff.chip.diameterMm / 2 / textArea.h;
  return {
    x: rx >= 0.5 ? 0.5 : Math.min(1 - rx, Math.max(rx, x)),
    y: ry >= 0.5 ? 0.5 : Math.min(1 - ry, Math.max(ry, y)),
  };
}

/** 칩 원 가장자리에서 그림 영역 가장자리까지의 최소 거리 (mm). 음수면 영역 밖 */
export function chipEdgeClearanceMm(ff: FormFactor, spec: TagDesignSpec): number {
  const { textArea } = faceGeometryFor(ff);
  const [cx, cy] = chipCenterMm(ff, spec);
  const r = ff.chip.diameterMm / 2;
  const left = cx - r - (textArea.cx - textArea.w / 2);
  const right = textArea.cx + textArea.w / 2 - (cx + r);
  const bottom = cy - r - (textArea.cy - textArea.h / 2);
  const top = textArea.cy + textArea.h / 2 - (cy + r);
  return Math.min(left, right, bottom, top);
}
