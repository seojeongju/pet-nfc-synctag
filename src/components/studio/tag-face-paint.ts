"use client";

/**
 * 태그 윗면(문구·로고·템플릿 아트) 그리기 — 2D 정면 미리보기와 3D 미리보기가 같은 결과를 쓰도록 공용화.
 * three.js에 의존하지 않는다(2D 탭은 three.js를 불러오지 않음).
 */
import { useEffect, useState } from "react";
import { TEXT_COLOR_DESIGN, getTagFont, layerOrderFor, type TagDesignSpec, type TagFontId } from "@/lib/platform/tag-design";
import { getCardFaceLayout } from "@/lib/platform/card-face-layouts";
import type { FaceArea } from "@/lib/platform/tag-geometry";

export {
  faceGeometryFor,
  chipPlacementFor,
  chipCenterMm,
  clampChipPlacement,
  type FaceArea,
  type FaceGeometry,
} from "@/lib/platform/tag-geometry";

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

/** 끌어서 편집할 수 있는 윗면 요소 (문구 줄은 최대 MAX_TEXT_LINES_TOTAL) */
export type FaceElementId = "line0" | "line1" | "line2" | "line3" | "line4" | "image";

/** 그려진 요소의 영역 (윗면 캔버스 픽셀, 왼쪽 위 기준). r이 있으면 박스 중심 기준으로 그만큼(도) 회전해 그려진 것 */
export type FaceBox = { x: number; y: number; w: number; h: number; r?: number };

export type FacePaintResult = {
  canvas: HTMLCanvasElement;
  boxes: Partial<Record<FaceElementId, FaceBox>>;
};

const fontCss = (px: number, fontId?: TagFontId | null) => `900 ${px}px ${getTagFont(fontId).family}`;

/** 디자인에 쓰인 웹폰트가 준비됐는지. 글꼴을 쓰는 줄이 있으면 Google Fonts를 불러오고, 로드되면 값이 바뀌어 다시 그리게 한다 */
export function useStudioFonts(spec: TagDesignSpec): number {
  const [version, setVersion] = useState(0);
  const needed = Array.from(
    new Set(
      (spec.layout?.styles ?? [])
        .map((st) => getTagFont(st?.font).webFont)
        .filter((f): f is string => Boolean(f))
    )
  )
    .sort()
    .join("|");
  useEffect(() => {
    if (!needed || typeof document === "undefined") return;
    const families = needed.split("|");
    const id = "studio-webfonts";
    let link = document.getElementById(id) as HTMLLinkElement | null;
    const href =
      "https://fonts.googleapis.com/css2?" +
      families.map((f) => `family=${encodeURIComponent(f).replace(/%20/g, "+")}:wght@400;700;900`).join("&") +
      "&display=swap";
    if (!link) {
      link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    if (link.href !== href) link.href = href;
    let cancelled = false;
    void Promise.all(families.map((f) => document.fonts.load(`900 32px "${f}"`).catch(() => null))).then(() => {
      if (!cancelled) setVersion((v) => v + 1);
    });
    return () => {
      cancelled = true;
    };
  }, [needed]);
  return version;
}

type LineDraw = {
  line: string;
  x: number;
  y: number;
  size: number;
  align: CanvasTextAlign;
  color: string;
  style: "raised" | "engraved" | "card";
  strip: boolean;
  rot: number;
  font?: TagFontId;
};

function drawLine(ctx: CanvasRenderingContext2D, d: LineDraw): FaceBox {
  const { line, x, y, size, align, color, style, strip, rot, font } = d;
  if (rot) {
    // 회전: 중심(x,y) 기준으로 돌려 가운데 정렬로 그린다
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rot * Math.PI) / 180);
    const b = drawLine(ctx, { ...d, x: 0, y: 0, align: "center", rot: 0 });
    ctx.restore();
    return { x: x + b.x, y: y + b.y, w: b.w, h: b.h, r: rot };
  }
  ctx.font = fontCss(size, font);
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

/** 문구 폭이 maxW를 넘지 않도록 글자 크기를 줄인다 */
function fitSize(ctx: CanvasRenderingContext2D, line: string, size: number, maxW: number, font?: TagFontId): number {
  ctx.font = fontCss(size, font);
  const measured = ctx.measureText(line).width;
  return measured > maxW ? size * (maxW / measured) : size;
}

/**
 * 윗면 캔버스: 템플릿 전면 아트 · 사용자 로고 · 문구.
 * spec.layout의 배치(끌어서 옮긴 위치·크기·회전)·줄별 색/글꼴·겹침 순서를 반영하고, 요소별 영역(boxes)을 함께 돌려준다.
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
  const styles = spec.layout?.styles ?? [];

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

  const lines = spec.lines.map((l) => l.trim());
  const filled = lines.filter(Boolean);
  // 플레이스홀더(NAME 등)만 있으면 전면 아트에 이미 있으므로 겹쳐 그리지 않음
  const placeholderOnly =
    Boolean(faceSrc) && filled.length > 0 && filled.every((l) => /^(NAME|SHORT TEXT|HELLO|LINK-U)$/i.test(l));
  const globalColor = faceSrc || spec.textColor === TEXT_COLOR_DESIGN ? "#0F172A" : spec.textColor;
  const globalStyle: LineDraw["style"] = spec.textStyle === "engraved" ? "engraved" : "raised";

  // 일반(비명함) 배치: 채워진 줄을 위에서부터 쌓는다
  const stackTop = faceSrc ? H * 0.32 : logoEl && logoSrc && !spec.layout?.image ? H * 0.55 : 0;
  const stackH = faceSrc ? H * 0.36 : H - stackTop;
  const lineH = stackH / Math.max(filled.length, 1);
  let stackRow = 0;

  /** 줄 i의 기본 그리기 값 (템플릿 슬롯 → 명함 추가 줄 → 일반 쌓기) */
  const lineDefaults = (i: number, line: string): LineDraw | null => {
    const slot = cardLayout?.slots[i];
    const st = styles[i];
    const font = st?.font;
    if (cardLayout && art) {
      if (slot) {
        const sx = art.x + slot.x * art.w;
        const sy = art.y + slot.y * art.h;
        const sw = slot.w * art.w;
        const sh = slot.h * art.h;
        const color = st?.color ?? (spec.textColor === TEXT_COLOR_DESIGN ? slot.color : spec.textColor);
        return {
          line,
          x: slot.align === "center" ? sx + sw / 2 : sx,
          y: sy + sh / 2,
          size: fitSize(ctx, line, sh * 0.82, sw, font),
          align: slot.align,
          color,
          style: "card",
          strip: false,
          rot: 0,
          font,
        };
      }
      // 명함 템플릿에 추가한 줄: 가운데 아래쪽에 차례로
      const k = i - cardLayout.slots.length;
      const color = st?.color ?? (spec.textColor === TEXT_COLOR_DESIGN ? "#0F172A" : spec.textColor);
      return {
        line,
        x: W / 2,
        y: H * (0.5 + 0.13 * k),
        size: fitSize(ctx, line, H * 0.1, W * 0.8, font),
        align: "center",
        color,
        style: "card",
        strip: false,
        rot: 0,
        font,
      };
    }
    if (placeholderOnly) return null;
    const row = stackRow++;
    const size0 = lineH * (row === 0 ? 0.72 : 0.55);
    return {
      line,
      x: faceSrc ? W * 0.1 : W / 2,
      y: stackTop + lineH * (row + 0.5),
      size: fitSize(ctx, line, size0, W * (faceSrc ? 0.55 : 0.94), font),
      align: faceSrc ? "left" : "center",
      color: st?.color ?? globalColor,
      style: globalStyle,
      strip: Boolean(faceSrc),
      rot: 0,
      font,
    };
  };

  // 쌓기 순서(stackRow)는 줄 번호 순이어야 하므로 기본값을 먼저 전부 계산한다
  const defaults = lines.map((line, i) => (line ? lineDefaults(i, line) : null));

  const drawLogo = () => {
    if (!logoEl || !logoSrc) return;
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
    const rot = p?.r ?? 0;
    ctx.save();
    ctx.globalAlpha = opacity;
    if (rot) {
      ctx.translate(dx + dw / 2, dy + dh / 2);
      ctx.rotate((rot * Math.PI) / 180);
      ctx.drawImage(logoEl, -dw / 2, -dh / 2, dw, dh);
    } else {
      ctx.drawImage(logoEl, dx, dy, dw, dh);
    }
    ctx.restore();
    boxes.image = rot ? { x: dx, y: dy, w: dw, h: dh, r: rot } : { x: dx, y: dy, w: dw, h: dh };
  };

  const drawText = (i: number) => {
    const d = defaults[i];
    if (!d) return;
    const p = placements[i];
    const box = p
      ? drawLine(ctx, { ...d, x: p.x * W, y: p.y * H, size: d.size * p.s, align: "center", rot: p.r ?? 0 })
      : drawLine(ctx, d);
    boxes[`line${i}` as FaceElementId] = box;
  };

  // 겹침 순서대로 (아래 → 위)
  for (const id of layerOrderFor(lines.length, spec.layout?.order)) {
    if (id === "image") drawLogo();
    else drawText(Number(id.slice(4)));
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
