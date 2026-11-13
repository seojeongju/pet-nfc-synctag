"use client";

/**
 * 태그 본체 외곽 형상 (three.js Shape, mm). 3D 미리보기와 STL/3MF 내보내기가 함께 쓴다.
 */
import * as THREE from "three";
import type { FormFactor } from "@/lib/platform/form-factors";
import { faceGeometryFor, type FaceGeometry } from "@/lib/platform/tag-geometry";

/** 미리보기 돌출 모서리 둥글림. 윗면 실제 높이 = 두께 + BEVEL_MM */
export const BEVEL_MM = 0.4;

export type BodyPart = { shape: THREE.Shape; depth: number };

export function circleShape(cx: number, cy: number, r: number, holeR?: number): THREE.Shape {
  const s = new THREE.Shape();
  s.absarc(cx, cy, r, 0, Math.PI * 2, false);
  if (holeR) {
    const hole = new THREE.Path();
    hole.absarc(cx, cy, holeR, 0, Math.PI * 2, true);
    s.holes.push(hole);
  }
  return s;
}

export function roundedRectShape(w: number, h: number, r: number, cx = 0, cy = 0): THREE.Shape {
  const x = cx - w / 2;
  const y = cy - h / 2;
  const s = new THREE.Shape();
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

export function buildBody(ff: FormFactor): { parts: BodyPart[] } & FaceGeometry {
  const t = ff.thicknessMm;
  switch (ff.id) {
    case "keyring_round": {
      const r = ff.widthMm / 2;
      const cy = -(ff.heightMm - ff.widthMm) / 2;
      const tabY = cy + r + 2;
      return {
        ...faceGeometryFor(ff),
        parts: [
          { shape: circleShape(0, cy, r), depth: t },
          { shape: circleShape(0, tabY, 6, 3), depth: t * 0.75 },
        ],
      };
    }
    case "pendant_bone": {
      const w = ff.widthMm;
      const h = ff.heightMm;
      const knobR = h * 0.27;
      const kx = w / 2 - knobR;
      const ky = h / 2 - knobR;
      return {
        ...faceGeometryFor(ff),
        parts: [
          { shape: roundedRectShape(w - knobR * 2, h * 0.55, 2), depth: t },
          { shape: circleShape(-kx, ky, knobR), depth: t },
          { shape: circleShape(-kx, -ky, knobR), depth: t },
          { shape: circleShape(kx, ky, knobR, 1.6), depth: t },
          { shape: circleShape(kx, -ky, knobR), depth: t },
        ],
      };
    }
    case "stand_plate": {
      return { ...faceGeometryFor(ff), parts: [{ shape: roundedRectShape(ff.widthMm, ff.heightMm, 8), depth: t }] };
    }
    case "card_plate": {
      return { ...faceGeometryFor(ff), parts: [{ shape: roundedRectShape(ff.widthMm, ff.heightMm, 4), depth: t }] };
    }
  }
}
