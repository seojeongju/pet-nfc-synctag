"use client";

/**
 * 태그 윗면(문구·로고·템플릿 아트) 그리기 — 2D 정면 미리보기와 3D 미리보기가 같은 결과를 쓰도록 공용화.
 * three.js에 의존하지 않는다(2D 탭은 three.js를 불러오지 않음).
 */
import { useEffect, useState } from "react";
import {
  TEXT_COLOR_DESIGN,
  effectiveTextDepthMm,
  effectiveTextStroke,
  getTagFont,
  layerOrderFor,
  type TagDesignSpec,
  type TagFontId,
} from "@/lib/platform/tag-design";
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

/** 윗면에 깔 아트 경로. 명함·Wi-Fi 템플릿은 자리표시 글자를 지운 배경을 쓴다 */
export function faceArtLoadSrc(spec: TagDesignSpec): string | null {
  return getCardFaceLayout(spec.faceArtSrc)?.blankSrc ?? spec.faceArtSrc ?? null;
}

/** 템플릿 자체 디자인(아이콘·프레임·하단 글씨 등) 전경 레이어 경로 */
export function faceFgLoadSrc(spec: TagDesignSpec): string | null {
  return getCardFaceLayout(spec.faceArtSrc)?.fgSrc ?? null;
}

/** 템플릿 아트·전경 디자인·로고 이미지를 불러온다 */
export function useFaceImages(spec: TagDesignSpec) {
  const faceEl = useLoadedImage(faceArtLoadSrc(spec));
  const fgEl = useLoadedImage(faceFgLoadSrc(spec));
  const logoEl = useLoadedImage(spec.image?.src ?? null);
  return { faceEl, fgEl, logoEl };
}

export function isLightColor(hex: string): boolean {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return false;
  const [r, g, b] = [m[1], m[2], m[3]].map((v) => parseInt(v!, 16));
  return 0.299 * r! + 0.587 * g! + 0.114 * b! > 160;
}

/** hex 색상을 밝게(>1) 또는 어둡게(<1) 조정 */
export function shadeColor(hex: string, factor: number): string {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return hex;
  const clamp255 = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  const [r, g, b] = [m[1], m[2], m[3]].map((v) => parseInt(v!, 16));
  const nr = factor >= 1 ? r! + (255 - r!) * (factor - 1) : r! * factor;
  const ng = factor >= 1 ? g! + (255 - g!) * (factor - 1) : g! * factor;
  const nb = factor >= 1 ? b! + (255 - b!) * (factor - 1) : b! * factor;
  return (
    "#" +
    [clamp255(nr), clamp255(ng), clamp255(nb)]
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
  );
}

/** 끌어서 편집할 수 있는 윗면 요소 (문구 줄은 최대 MAX_TEXT_LINES_TOTAL) */
export type FaceElementId = "line0" | "line1" | "line2" | "line3" | "line4" | "image";

/** 그려진 요소의 영역 (윗면 캔버스 픽셀, 왼쪽 위 기준). r이 있으면 박스 중심 기준으로 그만큼(도) 회전해 그려진 것 */
export type FaceBox = { x: number; y: number; w: number; h: number; r?: number };

export type FacePaintResult = {
  canvas: HTMLCanvasElement;
  boxes: Partial<Record<FaceElementId, FaceBox>>;
};

export type FacePaintMode = "full" | "base" | "text-top" | "text-wall" | "text-mask";

const fontCss = (px: number, fontId?: TagFontId | null, strokeAdj = 0) => {
  const weight = strokeAdj < -0.1 ? 700 : 900;
  return `${weight} ${px}px ${getTagFont(fontId).family}`;
};

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
  style: "raised" | "engraved";
  strip: boolean;
  rot: number;
  font?: TagFontId;
  depthMm: number;
  strokeAdj: number;
  pxPerMm: number;
  mode: FacePaintMode;
};

function stampText(ctx: CanvasRenderingContext2D, line: string, x: number, y: number, fill: string, strokePx: number) {
  if (strokePx > 0.15) {
    ctx.strokeStyle = fill;
    ctx.lineWidth = strokePx;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeText(line, x, y);
  }
  ctx.fillStyle = fill;
  ctx.fillText(line, x, y);
}

function drawLine(ctx: CanvasRenderingContext2D, d: LineDraw): FaceBox {
  const { line, x, y, size, align, color, style, strip, rot, font, depthMm, strokeAdj, pxPerMm, mode } = d;
  if (rot) {
    // 회전: 중심(x,y) 기준으로 돌려 가운데 정렬로 그린다
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rot * Math.PI) / 180);
    const b = drawLine(ctx, { ...d, x: 0, y: 0, align: "center", rot: 0 });
    ctx.restore();
    return { x: x + b.x, y: y + b.y, w: b.w, h: b.h, r: rot };
  }
  ctx.font = fontCss(size, font, strokeAdj);
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  const strokePx = strokeAdj > 0 ? size * 0.055 * strokeAdj : 0;
  const tw = ctx.measureText(line).width + strokePx;
  const left = align === "center" ? x - tw / 2 : x - strokePx / 2;

  if (mode === "text-mask") {
    stampText(ctx, line, x, y, "#FFFFFF", strokePx);
    return { x: left, y: y - size * 0.6, w: tw, h: size * 1.2 };
  }

  if (mode === "text-wall") {
    const wallColor =
      style === "engraved"
        ? isLightColor(color)
          ? shadeColor(color, 0.42)
          : "#020617"
        : isLightColor(color)
          ? shadeColor(color, 0.68)
          : shadeColor(color, 1.35);
    stampText(ctx, line, x, y, wallColor, strokePx);
    return { x: left, y: y - size * 0.6, w: tw, h: size * 1.2 };
  }

  if (mode === "text-top") {
    const topColor = style === "engraved" ? shadeColor(color, isLightColor(color) ? 0.78 : 0.65) : color;
    stampText(ctx, line, x, y, topColor, strokePx);
    return { x: left, y: y - size * 0.6, w: tw, h: size * 1.2 };
  }

  if (strip && mode === "full") {
    // 전면 아트 위에서는 가독성을 위해 살짝 배경 스트립
    const padX = size * 0.2;
    const padY = size * 0.35;
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.fillRect(left - padX, y - size / 2 - padY * 0.2, tw + padX * 2, size + padY);
  }

  const offsetPx = Math.max(1.5, depthMm * pxPerMm * 0.48);
  const steps = Math.max(2, Math.min(8, Math.round(offsetPx)));

  if (style === "engraved") {
    // 음각(파임): 우하단 깎인 테두리 밝은 하이라이트 + 좌상단 안쪽 내벽 어두운 그림자 + 약간 어두운 바닥면
    stampText(
      ctx,
      line,
      x + offsetPx * 0.45,
      y + offsetPx * 0.55,
      isLightColor(color) ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.68)",
      strokePx
    );
    const cavityFloor = isLightColor(color) ? shadeColor(color, 0.72) : shadeColor(color, 0.85);
    stampText(ctx, line, x, y, cavityFloor, strokePx);
    const innerShadow = isLightColor(color) ? "rgba(15,23,42,0.52)" : "rgba(0,0,0,0.62)";
    for (let s = steps; s >= 1; s--) {
      const t = s / steps;
      ctx.save();
      ctx.globalAlpha = 0.22 * (1 - t * 0.5);
      stampText(ctx, line, x - offsetPx * 0.55 * t, y - offsetPx * 0.7 * t, innerShadow, strokePx);
      ctx.restore();
    }
  } else {
    // 양각(튀어나옴): 바닥 드롭 섀도우 + 다단계 3D 돌출 옆면 + 상단 밝은 하이라이트 + 전면 글자
    ctx.save();
    ctx.globalAlpha = isLightColor(color) ? 0.28 : 0.22;
    stampText(ctx, line, x + offsetPx * 0.85, y + offsetPx * 1.15, "#020617", strokePx);
    ctx.restore();
    const sideColor = isLightColor(color) ? shadeColor(color, 0.65) : shadeColor(color, 0.45);
    for (let s = steps; s >= 1; s--) {
      const t = s / steps;
      stampText(ctx, line, x + offsetPx * 0.55 * t, y + offsetPx * 0.75 * t, sideColor, strokePx);
    }
    stampText(
      ctx,
      line,
      x - offsetPx * 0.18,
      y - offsetPx * 0.22,
      isLightColor(color) ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.38)",
      strokePx
    );
    stampText(ctx, line, x, y, color, strokePx);
  }
  return { x: left, y: y - size * 0.6, w: tw, h: size * 1.2 };
}

/** 문구 폭이 maxW를 넘지 않도록 글자 크기를 줄인다 */
function fitSize(
  ctx: CanvasRenderingContext2D,
  line: string,
  size: number,
  maxW: number,
  font?: TagFontId,
  strokeAdj = 0
): number {
  ctx.font = fontCss(size, font, strokeAdj);
  const strokePx = strokeAdj > 0 ? size * 0.055 * strokeAdj : 0;
  const measured = ctx.measureText(line).width + strokePx;
  return measured > maxW ? size * (maxW / measured) : size;
}

/** 캔버스 알파 채널을 유지한 채 단색 실루엣 캔버스를 만든다 */
function makeSilhouette(src: HTMLCanvasElement, fillStyle: string): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = src.width;
  c.height = src.height;
  const g = c.getContext("2d");
  if (!g) return c;
  g.drawImage(src, 0, 0);
  g.globalCompositeOperation = "source-in";
  g.fillStyle = fillStyle;
  g.fillRect(0, 0, c.width, c.height);
  return c;
}

/** 획 두께(strokeAdj > 0) 조절 시 그래픽/글씨 선 두께를 8방향으로 확장 */
function dilateCanvas(src: HTMLCanvasElement, radiusPx: number): HTMLCanvasElement {
  if (radiusPx <= 0.25) return src;
  const c = document.createElement("canvas");
  c.width = src.width;
  c.height = src.height;
  const g = c.getContext("2d");
  if (!g) return src;
  for (let a = 0; a < 8; a++) {
    const rad = (a * Math.PI) / 4;
    g.drawImage(src, Math.cos(rad) * radiusPx, Math.sin(rad) * radiusPx);
  }
  g.drawImage(src, 0, 0);
  return c;
}

/** fgEl이 따로 없는 템플릿(명함 등)에서 배경 주조색 대비 그래픽·디자인 요소를 전경 캔버스로 추출 */
function extractForegroundFromBase(
  faceEl: HTMLImageElement,
  W: number,
  H: number,
  art: { x: number; y: number; w: number; h: number }
): HTMLCanvasElement | null {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");
  if (!g) return null;
  try {
    g.drawImage(faceEl, art.x, art.y, art.w, art.h);
    const imgData = g.getImageData(0, 0, W, H);
    const d = imgData.data;
    // 중앙·테두리 안쪽 샘플들의 중앙값으로 주 배경색 추정
    const samplesR: number[] = [];
    const samplesG: number[] = [];
    const samplesB: number[] = [];
    const pts = [
      [0.5, 0.5],
      [0.25, 0.5],
      [0.75, 0.5],
      [0.5, 0.25],
      [0.5, 0.75],
      [0.2, 0.2],
      [0.8, 0.2],
      [0.2, 0.8],
      [0.8, 0.8],
    ] as const;
    for (const [px, py] of pts) {
      const ix = Math.floor(px * (W - 1));
      const iy = Math.floor(py * (H - 1));
      const idx = (iy * W + ix) * 4;
      samplesR.push(d[idx]!);
      samplesG.push(d[idx + 1]!);
      samplesB.push(d[idx + 2]!);
    }
    samplesR.sort((a, b) => a - b);
    samplesG.sort((a, b) => a - b);
    samplesB.sort((a, b) => a - b);
    const mid = Math.floor(samplesR.length / 2);
    const bgR = samplesR[mid]!;
    const bgG = samplesG[mid]!;
    const bgB = samplesB[mid]!;

    for (let i = 0; i < d.length; i += 4) {
      const dr = d[i]! - bgR;
      const dg = d[i + 1]! - bgG;
      const db = d[i + 2]! - bgB;
      const dist = Math.hypot(dr, dg, db);
      if (dist < 36) {
        d[i + 3] = 0;
      } else {
        const alpha = Math.min(255, Math.round(((dist - 36) / 48) * 255));
        d[i + 3] = Math.min(d[i + 3]!, alpha);
      }
    }
    g.putImageData(imgData, 0, 0);
    return c;
  } catch {
    return null;
  }
}

/** 템플릿 전경 디자인·로고 캔버스에 양각/음각 입체 효과(2D/3D/마스크)를 적용해 그린다 */
function drawReliefCanvas(
  ctx: CanvasRenderingContext2D,
  rawCanvas: HTMLCanvasElement,
  style: "raised" | "engraved",
  depthMm: number,
  strokeAdj: number,
  pxPerMm: number,
  mode: FacePaintMode
) {
  const dilatePx = strokeAdj > 0 ? strokeAdj * pxPerMm * 0.14 : 0;
  const fg = dilateCanvas(rawCanvas, dilatePx);

  if (mode === "text-mask") {
    const mask = makeSilhouette(fg, "#FFFFFF");
    ctx.drawImage(mask, 0, 0);
    return;
  }

  const darkSil = makeSilhouette(fg, "#020617");

  if (mode === "text-wall") {
    ctx.save();
    ctx.drawImage(fg, 0, 0);
    ctx.globalAlpha = style === "engraved" ? 0.68 : 0.45;
    ctx.drawImage(darkSil, 0, 0);
    ctx.restore();
    return;
  }

  if (mode === "text-top") {
    ctx.save();
    ctx.drawImage(fg, 0, 0);
    if (style === "engraved") {
      ctx.globalAlpha = 0.28;
      ctx.drawImage(darkSil, 0, 0);
    }
    ctx.restore();
    return;
  }

  const lightSil = makeSilhouette(fg, "#FFFFFF");
  const offsetPx = Math.max(1.5, depthMm * pxPerMm * 0.48);
  const steps = Math.max(2, Math.min(8, Math.round(offsetPx)));

  if (style === "engraved") {
    // 음각(파임): 우하단 깎인 테두리 밝은 하이라이트 + 오목 바닥면 + 좌상단 내벽 다단계 그림자
    ctx.save();
    ctx.globalAlpha = 0.78;
    ctx.drawImage(lightSil, offsetPx * 0.48, offsetPx * 0.58);
    ctx.restore();

    ctx.drawImage(fg, 0, 0);
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.drawImage(darkSil, 0, 0);
    ctx.restore();

    for (let s = steps; s >= 1; s--) {
      const t = s / steps;
      ctx.save();
      ctx.globalAlpha = 0.24 * (1 - t * 0.45);
      ctx.drawImage(darkSil, -offsetPx * 0.55 * t, -offsetPx * 0.7 * t);
      ctx.restore();
    }
  } else {
    // 양각(튀어나옴): 바닥 드롭 섀도우 + 다단계 3D 돌출 측면 + 좌상단 베벨 하이라이트 + 전면 그래픽
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.drawImage(darkSil, offsetPx * 0.85, offsetPx * 1.15);
    ctx.restore();

    for (let s = steps; s >= 1; s--) {
      const t = s / steps;
      const dx = offsetPx * 0.55 * t;
      const dy = offsetPx * 0.75 * t;
      ctx.drawImage(fg, dx, dy);
      ctx.save();
      ctx.globalAlpha = 0.42;
      ctx.drawImage(darkSil, dx, dy);
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = 0.65;
    ctx.drawImage(lightSil, -offsetPx * 0.2, -offsetPx * 0.25);
    ctx.restore();

    ctx.drawImage(fg, 0, 0);
  }
}

/**
 * 윗면 캔버스: 템플릿 전면 아트(바탕 + 양각/음각 전경 디자인) · 사용자 로고 · 문구.
 * spec.layout의 배치(끌어서 옮긴 위치·크기·회전)·줄별 색/글꼴·겹침 순서를 반영하고, 요소별 영역(boxes)을 함께 돌려준다.
 */
export function paintFace(
  spec: TagDesignSpec,
  area: FaceArea,
  faceEl: HTMLImageElement | null,
  logoEl: HTMLImageElement | null,
  opts?: { mode?: FacePaintMode; fgEl?: HTMLImageElement | null }
): FacePaintResult | null {
  if (typeof document === "undefined") return null;
  const mode: FacePaintMode = opts?.mode ?? "full";
  const fgEl = opts?.fgEl ?? null;
  const includeBase = mode === "full" || mode === "base";
  const includeRelief = mode !== "base";
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
  const depthMm = effectiveTextDepthMm(spec);
  const strokeAdj = effectiveTextStroke(spec);
  const globalStyle: LineDraw["style"] = spec.textStyle === "engraved" ? "engraved" : "raised";

  // 템플릿 전면 아트(명함·Wi-Fi 등) — cover. 슬롯 계산을 위해 faceEl이 없어도 cardLayout이면 art 영역을 잡는다.
  const cardLayout = getCardFaceLayout(faceSrc);
  let art: { x: number; y: number; w: number; h: number } | null = null;
  if (faceEl && faceSrc) {
    const ratio = Math.max(W / faceEl.width, H / faceEl.height);
    const dw = faceEl.width * ratio;
    const dh = faceEl.height * ratio;
    art = { x: (W - dw) / 2, y: (H - dh) / 2, w: dw, h: dh };
    if (includeBase) {
      ctx.drawImage(faceEl, art.x, art.y, dw, dh);
    }
  } else if (fgEl && faceSrc) {
    const ratio = Math.max(W / fgEl.width, H / fgEl.height);
    const dw = fgEl.width * ratio;
    const dh = fgEl.height * ratio;
    art = { x: (W - dw) / 2, y: (H - dh) / 2, w: dw, h: dh };
  } else if (cardLayout) {
    art = { x: 0, y: 0, w: W, h: H };
  }

  // 템플릿 자체 디자인(글씨·아이콘·프레임 등) 양각/음각 입체 적용
  if (includeRelief && faceSrc && art) {
    let fgCanvas: HTMLCanvasElement | null = null;
    if (fgEl) {
      fgCanvas = document.createElement("canvas");
      fgCanvas.width = W;
      fgCanvas.height = H;
      const fgCtx = fgCanvas.getContext("2d");
      if (fgCtx) fgCtx.drawImage(fgEl, art.x, art.y, art.w, art.h);
    } else if (faceEl) {
      fgCanvas = extractForegroundFromBase(faceEl, W, H, art);
    }
    if (fgCanvas) {
      drawReliefCanvas(ctx, fgCanvas, globalStyle, depthMm, strokeAdj, pxPerMm, mode);
    }
  }

  const lines = spec.lines.map((l) => l.trim());
  const filled = lines.filter(Boolean);
  // 플레이스홀더(NAME 등)만 있으면 전면 아트에 이미 있으므로 겹쳐 그리지 않음 (슬롯형 템플릿은 제외)
  const placeholderOnly =
    Boolean(faceSrc) &&
    !cardLayout &&
    filled.length > 0 &&
    filled.every((l) => /^(NAME|SHORT TEXT|HELLO|LINK-U)$/i.test(l));
  const globalColor = faceSrc || spec.textColor === TEXT_COLOR_DESIGN ? "#0F172A" : spec.textColor;

  // 일반(비슬롯) 배치: 채워진 줄을 위에서부터 쌓는다
  const stackTop = faceSrc ? H * 0.32 : logoEl && logoSrc && !spec.layout?.image ? H * 0.55 : 0;
  const stackH = faceSrc ? H * 0.36 : H - stackTop;
  const lineH = stackH / Math.max(filled.length, 1);
  let stackRow = 0;

  /** 줄 i의 기본 그리기 값 (템플릿 슬롯 → 슬롯 추가 줄 → 일반 쌓기) */
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
          size: fitSize(ctx, line, sh * 0.82, sw, font, strokeAdj),
          align: slot.align,
          color,
          style: globalStyle,
          strip: false,
          rot: 0,
          font,
          depthMm,
          strokeAdj,
          pxPerMm,
          mode,
        };
      }
      // 슬롯형 템플릿에 추가한 줄: 가운데 아래쪽에 차례로
      const k = i - cardLayout.slots.length;
      const color = st?.color ?? (spec.textColor === TEXT_COLOR_DESIGN ? "#0F172A" : spec.textColor);
      return {
        line,
        x: W / 2,
        y: H * (0.58 + 0.08 * k),
        size: fitSize(ctx, line, H * 0.075, W * 0.8, font, strokeAdj),
        align: "center",
        color,
        style: globalStyle,
        strip: false,
        rot: 0,
        font,
        depthMm,
        strokeAdj,
        pxPerMm,
        mode,
      };
    }
    if (placeholderOnly) return null;
    const row = stackRow++;
    const size0 = lineH * (row === 0 ? 0.72 : 0.55);
    return {
      line,
      x: faceSrc ? W * 0.1 : W / 2,
      y: stackTop + lineH * (row + 0.5),
      size: fitSize(ctx, line, size0, W * (faceSrc ? 0.55 : 0.94), font, strokeAdj),
      align: faceSrc ? "left" : "center",
      color: st?.color ?? globalColor,
      style: globalStyle,
      strip: Boolean(faceSrc),
      rot: 0,
      font,
      depthMm,
      strokeAdj,
      pxPerMm,
      mode,
    };
  };

  // 쌓기 순서(stackRow)는 줄 번호 순이어야 하므로 기본값을 먼저 전부 계산한다
  const defaults = lines.map((line, i) => (line ? lineDefaults(i, line) : null));

  const drawLogo = () => {
    if (!includeRelief || !logoEl || !logoSrc) return;
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
    const logoCanvas = document.createElement("canvas");
    logoCanvas.width = W;
    logoCanvas.height = H;
    const lc = logoCanvas.getContext("2d");
    if (lc) {
      lc.save();
      lc.globalAlpha = opacity;
      if (rot) {
        lc.translate(dx + dw / 2, dy + dh / 2);
        lc.rotate((rot * Math.PI) / 180);
        lc.drawImage(logoEl, -dw / 2, -dh / 2, dw, dh);
      } else {
        lc.drawImage(logoEl, dx, dy, dw, dh);
      }
      lc.restore();
      drawReliefCanvas(ctx, logoCanvas, globalStyle, depthMm, strokeAdj, pxPerMm, mode);
    }
    boxes.image = rot ? { x: dx, y: dy, w: dw, h: dh, r: rot } : { x: dx, y: dy, w: dw, h: dh };
  };

  const drawText = (i: number) => {
    if (!includeRelief) return;
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
  logoEl: HTMLImageElement | null,
  mode: FacePaintMode = "full",
  fgEl: HTMLImageElement | null = null
): HTMLCanvasElement | null {
  return paintFace(spec, area, faceEl, logoEl, { mode, fgEl })?.canvas ?? null;
}
