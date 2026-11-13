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

/** 폼팩터별 윗면 그림 영역과 NFC 칩 중심 (mm) */
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

/** 윗면 캔버스: 템플릿 전면 아트 · 사용자 로고 · 문구 */
export function paintFaceCanvas(
  spec: TagDesignSpec,
  area: FaceArea,
  faceEl: HTMLImageElement | null,
  logoEl: HTMLImageElement | null
): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  const faceSrc = spec.faceArtSrc ?? null;
  const logoSrc = spec.image?.src ?? null;
  const pxPerMm = faceSrc ? 18 : 24;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(area.w * pxPerMm);
  canvas.height = Math.round(area.h * pxPerMm);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // 템플릿 전면 아트(명함 등) — cover. 명함 템플릿은 글자 없는 배경(blank)이 faceEl로 들어온다
  const cardLayout = getCardFaceLayout(faceSrc);
  let art: { x: number; y: number; w: number; h: number } | null = null;
  if (faceEl && faceSrc) {
    const ratio = Math.max(canvas.width / faceEl.width, canvas.height / faceEl.height);
    const dw = faceEl.width * ratio;
    const dh = faceEl.height * ratio;
    art = { x: (canvas.width - dw) / 2, y: (canvas.height - dh) / 2, w: dw, h: dh };
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
      const font = (px: number) => `900 ${px}px Outfit, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`;
      ctx.font = font(size);
      const measured = ctx.measureText(line).width;
      if (measured > sw) {
        size *= sw / measured;
        ctx.font = font(size);
      }
      ctx.textBaseline = "middle";
      ctx.textAlign = slot.align;
      const x = slot.align === "center" ? sx + sw / 2 : sx;
      const y = sy + sh / 2;
      const color = spec.textColor === TEXT_COLOR_DESIGN ? slot.color : spec.textColor;
      // 원본 아트의 입체 글자 느낌: 아래쪽 옅은 그림자 (밝은 글자일수록 진하게)
      ctx.fillStyle = isLightColor(color) ? "rgba(0,0,0,0.28)" : "rgba(15,23,42,0.18)";
      ctx.fillText(line, x + size * 0.02, y + size * 0.05);
      ctx.fillStyle = color;
      ctx.fillText(line, x, y);
    });
  }

  // 사용자 로고
  if (logoEl && logoSrc) {
    const scale = spec.image?.scale ?? 0.55;
    const opacity = spec.image?.opacity ?? 0.95;
    const maxW = canvas.width * scale * (faceSrc ? 0.28 : 1);
    const maxH = canvas.height * scale * (faceSrc ? 0.35 : 0.72);
    const ratio = Math.min(maxW / logoEl.width, maxH / logoEl.height);
    const dw = logoEl.width * ratio;
    const dh = logoEl.height * ratio;
    const dx = faceSrc ? canvas.width * 0.08 : (canvas.width - dw) / 2;
    const dy = faceSrc ? canvas.height * 0.12 : canvas.height * 0.08;
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.drawImage(logoEl, dx, dy, dw, dh);
    ctx.restore();
  }

  const lines = spec.lines.map((l) => l.trim()).filter(Boolean);
  // 플레이스홀더(NAME 등)만 있으면 전면 아트에 이미 있으므로 겹쳐 그리지 않음
  const placeholderOnly =
    Boolean(faceSrc) && lines.length > 0 && lines.every((l) => /^(NAME|SHORT TEXT|HELLO|LINK-U)$/i.test(l));
  if (!cardLayout && lines.length > 0 && !placeholderOnly) {
    const textTop = faceSrc ? canvas.height * 0.32 : logoEl && logoSrc ? canvas.height * 0.55 : 0;
    const usableH = faceSrc ? canvas.height * 0.36 : canvas.height - textTop;
    const lineH = usableH / Math.max(lines.length, 1);
    ctx.textAlign = faceSrc ? "left" : "center";
    ctx.textBaseline = "middle";
    const x = faceSrc ? canvas.width * 0.1 : canvas.width / 2;
    lines.forEach((line, i) => {
      let size = lineH * (i === 0 ? 0.72 : 0.55);
      ctx.font = `900 ${size}px Outfit, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`;
      const maxW = canvas.width * (faceSrc ? 0.55 : 0.94);
      const measured = ctx.measureText(line).width;
      if (measured > maxW) {
        size *= maxW / measured;
        ctx.font = `900 ${size}px Outfit, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`;
      }
      const y = textTop + lineH * (i + 0.5);
      // 전면 아트 위에서는 가독성을 위해 살짝 배경 스트립
      if (faceSrc) {
        const padX = size * 0.2;
        const padY = size * 0.35;
        const tw = ctx.measureText(line).width;
        ctx.fillStyle = "rgba(255,255,255,0.82)";
        ctx.fillRect(x - padX, y - size / 2 - padY * 0.2, tw + padX * 2, size + padY);
      }
      if (spec.textStyle === "engraved") {
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillText(line, x, y - size * 0.04);
      } else if (!faceSrc) {
        ctx.fillStyle = "rgba(0,0,0,0.22)";
        ctx.fillText(line, x + size * 0.03, y + size * 0.05);
      }
      ctx.fillStyle = faceSrc || spec.textColor === TEXT_COLOR_DESIGN ? "#0F172A" : spec.textColor;
      ctx.fillText(line, x, y);
    });
  }

  return canvas;
}
