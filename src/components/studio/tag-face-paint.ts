"use client";

/**
 * 태그 윗면(문구·로고·템플릿 아트) 그리기 — 2D 정면 미리보기와 3D 미리보기가 같은 결과를 쓰도록 공용화.
 * three.js에 의존하지 않는다(2D 탭은 three.js를 불러오지 않음).
 */
import { useEffect, useState } from "react";
import type { FormFactor } from "@/lib/platform/form-factors";
import { TEXT_COLOR_DESIGN, type TagDesignSpec } from "@/lib/platform/tag-design";
import { getCardFaceLayout } from "@/lib/platform/card-face-layouts";

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

export function loadImage(src: string | null): Promise<HTMLImageElement | null> {
  if (!src || typeof document === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export function useLoadedImage(src: string | null): HTMLImageElement | null {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    let cancelled = false;
    setImg(null);
    void loadImage(src).then((el) => {
      if (!cancelled) setImg(el);
    });
    return () => {
      cancelled = true;
    };
  }, [src]);
  return img;
}

/** 윗면에 깔 아트 경로. 명함 템플릿은 자리표시 글자를 지운 배경을 쓴다 */
export function faceArtLoadSrc(spec: TagDesignSpec): string | null {
  return getCardFaceLayout(spec.faceArtSrc)?.blankSrc ?? spec.faceArtSrc ?? null;
}

/** 템플릿 아트·로고 이미지를 불러온다 */
export function useFaceImages(spec: TagDesignSpec) {
  const faceEl = useLoadedImage(faceArtLoadSrc(spec));
  const logoEl = useLoadedImage(spec.image?.src ?? null);
  return { faceEl, logoEl };
}

export function isLightColor(hex: string): boolean {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return false;
  const [r, g, b] = [m[1], m[2], m[3]].map((v) => parseInt(v!, 16));
  return 0.299 * r! + 0.587 * g! + 0.114 * b! > 160;
}

/** 끌어서 편집할 수 있는 윗면 요소 */
export type FaceElementId = "line0" | "line1" | "line2" | "image";

/** 그려진 요소의 영역 (윗면 캔버스 픽셀, 왼쪽 위 기준) */
export type FaceBox = { x: number; y: number; w: number; h: number };

export type FacePaintResult = {
  canvas: HTMLCanvasElement;
  boxes: Partial<Record<FaceElementId, FaceBox>>;
};

const FONT = (px: number) => `900 ${px}px Outfit, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`;

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

function drawLine(
  ctx: CanvasRenderingContext2D,
  line: string,
  x: number,
  y: number,
  size: number,
  align: CanvasTextAlign,
  color: string,
  style: "raised" | "engraved" | "card",
  strip: boolean
): FaceBox {
  ctx.font = FONT(size);
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  const tw = ctx.measureText(line).width;
  const left = align === "center" ? x - tw / 2 : x;
  if (strip) {
    // 전면 아트 위에서는 가독성을 위해 살짝 배경 스트립
    const padX = size * 0.2;
    const padY = size * 0.35;
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.fillRect(left - padX, y - size / 2 - padY * 0.2, tw + padX * 2, size + padY);
  }
  if (style === "card") {
    // 원본 아트의 입체 글자 느낌: 아래쪽 옅은 그림자 (밝은 글자일수록 진하게)
    ctx.fillStyle = isLightColor(color) ? "rgba(0,0,0,0.28)" : "rgba(15,23,42,0.18)";
    ctx.fillText(line, x + size * 0.02, y + size * 0.05);
  } else if (style === "engraved") {
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillText(line, x, y - size * 0.04);
  } else if (!strip) {
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.fillText(line, x + size * 0.03, y + size * 0.05);
  }
  ctx.fillStyle = color;
  ctx.fillText(line, x, y);
  return { x: left, y: y - size * 0.6, w: tw, h: size * 1.2 };
}

/**
 * 윗면 캔버스: 템플릿 전면 아트 · 사용자 로고 · 문구.
 * spec.layout의 배치(끌어서 옮긴 위치·크기)를 반영하고, 요소별 영역(boxes)을 함께 돌려준다.
 */
export function paintFace(
  spec: TagDesignSpec,
  area: FaceArea,
  faceEl: HTMLImageElement | null,
  logoEl: HTMLImageElement | null
): FacePaintResult | null {
  if (typeof document === "undefined") return null;
  const faceSrc = spec.faceArtSrc ?? null;
  const logoSrc = spec.image?.src ?? null;
  const pxPerMm = faceSrc ? 18 : 24;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(area.w * pxPerMm);
  canvas.height = Math.round(area.h * pxPerMm);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const W = canvas.width;
  const H = canvas.height;
  const boxes: FacePaintResult["boxes"] = {};
  const placements = spec.layout?.lines ?? [];

  // 템플릿 전면 아트(명함 등) — cover. 명함 템플릿은 글자 없는 배경(blank)이 faceEl로 들어온다
  const cardLayout = getCardFaceLayout(faceSrc);
  let art: { x: number; y: number; w: number; h: number } | null = null;
  if (faceEl && faceSrc) {
    const ratio = Math.max(W / faceEl.width, H / faceEl.height);
    const dw = faceEl.width * ratio;
    const dh = faceEl.height * ratio;
    art = { x: (W - dw) / 2, y: (H - dh) / 2, w: dw, h: dh };
    ctx.drawImage(faceEl, art.x, art.y, dw, dh);
  }

  // 명함 템플릿: 1·2번째 문구를 원래 NAME / SHORT TEXT 자리에 디자인 그대로(굵게·같은 색) 채운다
  if (cardLayout && art) {
    const frame = art;
    spec.lines.slice(0, cardLayout.slots.length).forEach((raw, i) => {
      const line = raw.trim();
      const slot = cardLayout.slots[i];
      if (!line || !slot) return;
      const sx = frame.x + slot.x * frame.w;
      const sy = frame.y + slot.y * frame.h;
      const sw = slot.w * frame.w;
      const sh = slot.h * frame.h;
      let size = sh * 0.82;
      ctx.font = FONT(size);
      const measured = ctx.measureText(line).width;
      if (measured > sw) size *= sw / measured;
      const color = spec.textColor === TEXT_COLOR_DESIGN ? slot.color : spec.textColor;
      const p = placements[i];
      boxes[`line${i}` as FaceElementId] = p
        ? drawLine(ctx, line, p.x * W, p.y * H, size * p.s, "center", color, "card", false)
        : drawLine(ctx, line, slot.align === "center" ? sx + sw / 2 : sx, sy + sh / 2, size, slot.align, color, "card", false);
    });
  }

  // 사용자 로고
  if (logoEl && logoSrc) {
    const scale = spec.image?.scale ?? 0.55;
    const opacity = spec.image?.opacity ?? 0.95;
    const maxW = W * scale * (faceSrc ? 0.28 : 1);
    const maxH = H * scale * (faceSrc ? 0.35 : 0.72);
    const ratio = Math.min(maxW / logoEl.width, maxH / logoEl.height);
    const dw = logoEl.width * ratio;
    const dh = logoEl.height * ratio;
    const p = spec.layout?.image;
    const dx = p ? p.x * W - dw / 2 : faceSrc ? W * 0.08 : (W - dw) / 2;
    const dy = p ? p.y * H - dh / 2 : faceSrc ? H * 0.12 : H * 0.08;
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.drawImage(logoEl, dx, dy, dw, dh);
    ctx.restore();
    boxes.image = { x: dx, y: dy, w: dw, h: dh };
  }

  const lines = spec.lines.map((l) => l.trim());
  const filled = lines.filter(Boolean);
  // 플레이스홀더(NAME 등)만 있으면 전면 아트에 이미 있으므로 겹쳐 그리지 않음
  const placeholderOnly =
    Boolean(faceSrc) && filled.length > 0 && filled.every((l) => /^(NAME|SHORT TEXT|HELLO|LINK-U)$/i.test(l));
  if (!cardLayout && filled.length > 0 && !placeholderOnly) {
    const textTop = faceSrc ? H * 0.32 : logoEl && logoSrc && !spec.layout?.image ? H * 0.55 : 0;
    const usableH = faceSrc ? H * 0.36 : H - textTop;
    const lineH = usableH / Math.max(filled.length, 1);
    const align: CanvasTextAlign = faceSrc ? "left" : "center";
    const x = faceSrc ? W * 0.1 : W / 2;
    const color = faceSrc || spec.textColor === TEXT_COLOR_DESIGN ? "#0F172A" : spec.textColor;
    const style = spec.textStyle === "engraved" ? "engraved" : "raised";
    let row = 0;
    lines.forEach((line, i) => {
      if (!line) return;
      let size = lineH * (row === 0 ? 0.72 : 0.55);
      ctx.font = FONT(size);
      const maxW = W * (faceSrc ? 0.55 : 0.94);
      const measured = ctx.measureText(line).width;
      if (measured > maxW) size *= maxW / measured;
      const y = textTop + lineH * (row + 0.5);
      row += 1;
      const p = placements[i];
      boxes[`line${i}` as FaceElementId] = p
        ? drawLine(ctx, line, p.x * W, p.y * H, size * p.s, "center", color, style, Boolean(faceSrc))
        : drawLine(ctx, line, x, y, size, align, color, style, Boolean(faceSrc));
    });
  }

  return { canvas, boxes };
}

/** 윗면 캔버스만 필요할 때 (3D 텍스처 등) */
export function paintFaceCanvas(
  spec: TagDesignSpec,
  area: FaceArea,
  faceEl: HTMLImageElement | null,
  logoEl: HTMLImageElement | null
): HTMLCanvasElement | null {
  return paintFace(spec, area, faceEl, logoEl)?.canvas ?? null;
}
