"use client";

/**
 * 태그 정면(2D) 미리보기 겸 편집기 — 스튜디오 기본 탭. three.js 없이 캔버스로 외곽선 + 윗면(문구·아트)을 그린다.
 * 윗면은 3D 미리보기와 같은 paintFace 결과를 써서 두 탭이 똑같이 보인다.
 *
 * editable이면
 * - 문구·로고·NFC 칩을 마우스/터치로 끌어 옮긴다. 가운데·안전 여백·다른 요소 중심선에 붙고 보조선을 그린다(Alt: 끄기).
 * - 선택 상자 오른쪽 아래 점으로 크기, 위쪽 둥근 손잡이로 회전(0°·90° 근처 자석, Shift: 15° 단위).
 * - 방향키로 미세 이동(Shift: 크게). 위치는 그림 영역 대비 비율로 spec.layout에 저장된다.
 * - 끌기 시작·끝을 onInteractionStart/End로 알려 실행 취소 기록을 한 단계로 묶게 한다.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { FormFactor } from "@/lib/platform/form-factors";
import {
  IMAGE_SCALE_MAX,
  IMAGE_SCALE_MIN,
  PLACEMENT_SCALE_MAX,
  PLACEMENT_SCALE_MIN,
  normalizeAngle,
  type TagDesignSpec,
} from "@/lib/platform/tag-design";
import {
  chipPlacementFor,
  clampChipPlacement,
  faceGeometryFor,
  paintFace,
  useFaceImages,
  type FaceBox,
  type FaceElementId,
} from "@/components/studio/tag-face-paint";

/** 편집 대상: 윗면 요소 + NFC 칩 */
export type StudioEditTarget = FaceElementId | "chip";

/** 현재 배치: 중심(비율), 크기 배율, 회전(도) */
export type StudioPlacement = { cx: number; cy: number; scale: number; rot: number };

/** 도구 막대가 쓰는 편집기 API — 현재 화면 기준 배치 조회와 적용 */
export type StudioCanvasApi = {
  getPlacement: (target: StudioEditTarget) => StudioPlacement | null;
  setPlacement: (target: StudioEditTarget, p: StudioPlacement) => void;
};

type Props = {
  formFactor: FormFactor;
  spec: TagDesignSpec;
  showChip: boolean;
  editable?: boolean;
  selected?: StudioEditTarget | null;
  onSelect?: (target: StudioEditTarget | null) => void;
  onSpecChange?: (patch: Partial<TagDesignSpec>) => void;
  /** 끌기·키보드 이동 등 한 번의 조작이 시작/끝날 때 (실행 취소 기록 묶음) */
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
  apiRef?: React.MutableRefObject<StudioCanvasApi | null>;
};

type Bounds = { minX: number; maxX: number; minY: number; maxY: number };

/** 외곽선(mm, y 위쪽 +)을 그리는 함수와 경계 상자 */
function outlineFor(ff: FormFactor): {
  bounds: Bounds;
  trace: (p: Path2D, X: (x: number) => number, Y: (y: number) => number, s: number) => void;
  holes: Array<[number, number, number]>;
} {
  switch (ff.id) {
    case "keyring_round": {
      const r = ff.widthMm / 2;
      const cy = -(ff.heightMm - ff.widthMm) / 2;
      const tabY = cy + r + 2;
      return {
        bounds: { minX: -r, maxX: r, minY: cy - r, maxY: tabY + 6 },
        trace: (p, X, Y, s) => {
          p.moveTo(X(r), Y(cy));
          p.arc(X(0), Y(cy), r * s, 0, Math.PI * 2);
          p.moveTo(X(6), Y(tabY));
          p.arc(X(0), Y(tabY), 6 * s, 0, Math.PI * 2);
        },
        holes: [[0, tabY, 3]],
      };
    }
    case "pendant_bone": {
      const w = ff.widthMm;
      const h = ff.heightMm;
      const knobR = h * 0.27;
      const kx = w / 2 - knobR;
      const ky = h / 2 - knobR;
      const bw = w - knobR * 2;
      const bh = h * 0.55;
      return {
        bounds: { minX: -w / 2, maxX: w / 2, minY: -h / 2, maxY: h / 2 },
        trace: (p, X, Y, s) => {
          p.roundRect(X(-bw / 2), Y(bh / 2), bw * s, bh * s, 2 * s);
          for (const [cx, cy] of [[-kx, ky], [-kx, -ky], [kx, ky], [kx, -ky]] as const) {
            p.moveTo(X(cx + knobR), Y(cy));
            p.arc(X(cx), Y(cy), knobR * s, 0, Math.PI * 2);
          }
        },
        holes: [[kx, ky, 1.6]],
      };
    }
    case "stand_plate":
    case "card_plate": {
      const w = ff.widthMm;
      const h = ff.heightMm;
      const r = ff.id === "card_plate" ? 4 : 8;
      return {
        bounds: { minX: -w / 2, maxX: w / 2, minY: -h / 2, maxY: h / 2 },
        trace: (p, X, Y, s) => {
          p.roundRect(X(-w / 2), Y(h / 2), w * s, h * s, r * s);
        },
        holes: [],
      };
    }
  }
}

/** 마지막으로 그린 화면의 좌표 정보 (포인터 판정용, CSS 픽셀) */
type Geo = {
  /** 윗면 그림 영역의 화면 위치·크기 */
  fx: number;
  fy: number;
  fw: number;
  fh: number;
  /** 윗면 캔버스 픽셀 크기 */
  faceW: number;
  faceH: number;
  boxes: Partial<Record<FaceElementId, FaceBox>>;
  chip: { x: number; y: number; r: number } | null;
};

type Drag = {
  target: StudioEditTarget;
  mode: "move" | "resize" | "rotate";
  startX: number;
  startY: number;
  start: StudioPlacement;
  /** resize: 시작 시 중심→포인터 거리 / rotate: 시작 시 포인터 각도(도) */
  ref: number;
  /** 스냅 후보: 다른 요소 중심(비율) */
  others: { x: number[]; y: number[] };
  /** 끌기 대상의 절반 크기(비율) */
  half: { w: number; h: number };
};

/** 보조선 (그림 영역 비율 좌표) */
type Guides = { x: number[]; y: number[] };

const HANDLE = 10;
const ROT_OFFSET = 26;
const NUDGE = 0.01;
const NUDGE_BIG = 0.05;
/** 안전 여백(그림 영역 비율) — 가장자리 스냅·표시용 */
const SAFE = 0.06;
const SNAP_PX = 6;
const ROT_SNAP_DEG = 4;
const LINE_TARGETS: FaceElementId[] = ["line0", "line1", "line2"];

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function lineIndex(target: StudioEditTarget): number | null {
  return target.startsWith("line") ? Number(target.slice(4)) : null;
}

/** 요소 박스를 화면(CSS 픽셀) 좌표로 — 중심·크기·회전 */
function cssBox(geo: Geo, target: FaceElementId) {
  const b = geo.boxes[target];
  if (!b) return null;
  const w = (b.w / geo.faceW) * geo.fw;
  const h = (b.h / geo.faceH) * geo.fh;
  return {
    cx: geo.fx + ((b.x + b.w / 2) / geo.faceW) * geo.fw,
    cy: geo.fy + ((b.y + b.h / 2) / geo.faceH) * geo.fh,
    w,
    h,
    r: b.r ?? 0,
  };
}

/** 화면 좌표를 박스 회전을 풀어 박스 중심 기준 좌표로 */
function toLocal(px: number, py: number, box: { cx: number; cy: number; r: number }) {
  const a = (-box.r * Math.PI) / 180;
  const dx = px - box.cx;
  const dy = py - box.cy;
  return { x: dx * Math.cos(a) - dy * Math.sin(a), y: dx * Math.sin(a) + dy * Math.cos(a) };
}

function angleDeg(px: number, py: number, cx: number, cy: number) {
  // 손잡이가 위쪽(-90°)에 있으므로 +90 해서 0°가 "위"가 되게
  return (Math.atan2(py - cy, px - cx) * 180) / Math.PI + 90;
}

/** 가장 가까운 스냅 후보 (임계값 이내) */
function snapAxis(
  value: number,
  half: number,
  others: number[],
  threshold: number
): { value: number; guide: number } | null {
  const cands: Array<{ value: number; guide: number }> = [
    { value: 0.5, guide: 0.5 },
    { value: SAFE + half, guide: SAFE },
    { value: 1 - SAFE - half, guide: 1 - SAFE },
    ...others.map((o) => ({ value: o, guide: o })),
  ];
  let best: { value: number; guide: number } | null = null;
  let bestD = threshold;
  for (const c of cands) {
    const d = Math.abs(value - c.value);
    if (d <= bestD) {
      best = c;
      bestD = d;
    }
  }
  return best;
}

export default function TagPreview2D({
  formFactor,
  spec,
  showChip,
  editable = false,
  selected = null,
  onSelect,
  onSpecChange,
  onInteractionStart,
  onInteractionEnd,
  apiRef,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const geoRef = useRef<Geo | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const specRef = useRef(spec);
  specRef.current = spec;
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [guides, setGuides] = useState<Guides | null>(null);
  const { faceEl, logoEl } = useFaceImages(spec);
  const chipVisible = showChip || selected === "chip";

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // 그리기
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.w === 0 || size.h === 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(size.w * dpr);
    canvas.height = Math.round(size.h * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.w, size.h);

    const { bounds, trace, holes } = outlineFor(formFactor);
    const { textArea } = faceGeometryFor(formFactor);
    const bw = bounds.maxX - bounds.minX;
    const bh = bounds.maxY - bounds.minY;
    const pad = Math.min(size.w, size.h) * 0.12;
    const s = Math.min((size.w - pad * 2) / bw, (size.h - pad * 2) / bh);
    const ox = size.w / 2 - ((bounds.minX + bounds.maxX) / 2) * s;
    const oy = size.h / 2 + ((bounds.minY + bounds.maxY) / 2) * s;
    const X = (x: number) => ox + x * s;
    const Y = (y: number) => oy - y * s;

    const body = new Path2D();
    trace(body, X, Y, s);

    // 본체 + 그림자
    ctx.save();
    ctx.shadowColor = "rgba(15,23,42,0.18)";
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = spec.faceArtSrc ? "#E2E8F0" : spec.bodyColor;
    ctx.fill(body, "nonzero");
    ctx.restore();
    // 한 덩어리 외곽(명함·스탠드)만 테두리. 여러 조각을 합친 키링·펜던트는 조각 경계가 비쳐 보이므로 생략
    if (formFactor.id === "card_plate" || formFactor.id === "stand_plate") {
      ctx.strokeStyle = "rgba(15,23,42,0.12)";
      ctx.lineWidth = 1;
      ctx.stroke(body);
    }

    // 윗면(문구·아트) — 본체 안으로 잘라서
    const fx = X(textArea.cx - textArea.w / 2);
    const fy = Y(textArea.cy + textArea.h / 2);
    const fw = textArea.w * s;
    const fh = textArea.h * s;
    const hasContent = Boolean(spec.faceArtSrc) || spec.lines.some((l) => l.trim()) || Boolean(spec.image?.src);
    const face = hasContent ? paintFace(spec, textArea, faceEl, logoEl) : null;
    if (face) {
      ctx.save();
      ctx.clip(body, "nonzero");
      if (spec.faceArtSrc) {
        // 명함 아트는 카드 가장자리까지 둥글게
        const clip = new Path2D();
        clip.roundRect(fx, fy, fw, fh, 3 * s);
        ctx.clip(clip);
      }
      ctx.drawImage(face.canvas, fx, fy, fw, fh);
      ctx.restore();
    }

    // 고리 구멍
    for (const [hx, hy, hr] of holes) {
      ctx.beginPath();
      ctx.arc(X(hx), Y(hy), hr * s, 0, Math.PI * 2);
      ctx.fillStyle = "#F8FAFC";
      ctx.fill();
      ctx.strokeStyle = "rgba(15,23,42,0.15)";
      ctx.stroke();
    }

    // NFC 칩 위치
    const chipP = chipPlacementFor(formFactor, spec);
    const chip = { x: fx + chipP.x * fw, y: fy + chipP.y * fh, r: (formFactor.chip.diameterMm / 2) * s };
    if (chipVisible) {
      ctx.save();
      ctx.setLineDash([6, 5]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#F59E0B";
      ctx.fillStyle = "rgba(245,158,11,0.18)";
      ctx.beginPath();
      ctx.arc(chip.x, chip.y, chip.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#B45309";
      ctx.font = `900 ${Math.max(9, chip.r * 0.32)}px Outfit, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("NFC", chip.x, chip.y);
      ctx.restore();
    }

    const geo: Geo = {
      fx,
      fy,
      fw,
      fh,
      faceW: face?.canvas.width ?? 1,
      faceH: face?.canvas.height ?? 1,
      boxes: face?.boxes ?? {},
      chip: chipVisible ? chip : null,
    };
    geoRef.current = geo;

    // 끌기 중: 안전 여백 + 보조선
    if (editable && guides) {
      ctx.save();
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = "rgba(100,116,139,0.35)";
      ctx.lineWidth = 1;
      ctx.strokeRect(fx + SAFE * fw, fy + SAFE * fh, fw * (1 - SAFE * 2), fh * (1 - SAFE * 2));
      ctx.setLineDash([]);
      ctx.strokeStyle = "#EC4899";
      ctx.lineWidth = 1.25;
      for (const gx of guides.x) {
        ctx.beginPath();
        ctx.moveTo(fx + gx * fw, fy - 8);
        ctx.lineTo(fx + gx * fw, fy + fh + 8);
        ctx.stroke();
      }
      for (const gy of guides.y) {
        ctx.beginPath();
        ctx.moveTo(fx - 8, fy + gy * fh);
        ctx.lineTo(fx + fw + 8, fy + gy * fh);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 선택 표시 (회전 반영) + 크기 점 + 회전 손잡이
    if (editable && selected) {
      ctx.save();
      ctx.strokeStyle = "#00A896";
      ctx.lineWidth = 1.5;
      if (selected === "chip") {
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.arc(chip.x, chip.y, chip.r + 4, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        const b = cssBox(geo, selected);
        if (b) {
          ctx.translate(b.cx, b.cy);
          ctx.rotate((b.r * Math.PI) / 180);
          ctx.setLineDash([5, 4]);
          ctx.strokeRect(-b.w / 2 - 4, -b.h / 2 - 4, b.w + 8, b.h + 8);
          ctx.setLineDash([]);
          // 회전 손잡이
          ctx.beginPath();
          ctx.moveTo(0, -b.h / 2 - 4);
          ctx.lineTo(0, -b.h / 2 - ROT_OFFSET + 6);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, -b.h / 2 - ROT_OFFSET, 6, 0, Math.PI * 2);
          ctx.fillStyle = "#FFFFFF";
          ctx.fill();
          ctx.stroke();
          // 크기 점
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(b.w / 2 + 4 - HANDLE / 2, b.h / 2 + 4 - HANDLE / 2, HANDLE, HANDLE);
          ctx.strokeRect(b.w / 2 + 4 - HANDLE / 2, b.h / 2 + 4 - HANDLE / 2, HANDLE, HANDLE);
        }
      }
      ctx.restore();
    }
  }, [size, formFactor, spec, chipVisible, faceEl, logoEl, editable, selected, guides]);

  const pointFrom = (e: { clientX: number; clientY: number }) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  /** 포인터 아래 요소 판정: 선택 요소의 손잡이 > 칩 > 문구 > 로고 */
  const hitTest = useCallback(
    (px: number, py: number): { target: StudioEditTarget; mode: Drag["mode"] } | null => {
      const geo = geoRef.current;
      if (!geo) return null;
      if (selected && selected !== "chip") {
        const b = cssBox(geo, selected);
        if (b) {
          const l = toLocal(px, py, b);
          if (Math.abs(l.x - (b.w / 2 + 4)) <= HANDLE && Math.abs(l.y - (b.h / 2 + 4)) <= HANDLE) {
            return { target: selected, mode: "resize" };
          }
          if (Math.hypot(l.x, l.y - (-b.h / 2 - ROT_OFFSET)) <= HANDLE) return { target: selected, mode: "rotate" };
        }
      }
      if (geo.chip && Math.hypot(px - geo.chip.x, py - geo.chip.y) <= geo.chip.r) return { target: "chip", mode: "move" };
      for (const id of [...LINE_TARGETS, "image" as const]) {
        const b = cssBox(geo, id);
        if (!b) continue;
        const l = toLocal(px, py, b);
        if (Math.abs(l.x) <= b.w / 2 + 4 && Math.abs(l.y) <= b.h / 2 + 4) return { target: id, mode: "move" };
      }
      return null;
    },
    [selected]
  );

  /** 대상의 현재 배치 (화면에 그려진 값 기준) */
  const currentPlacement = useCallback(
    (target: StudioEditTarget): StudioPlacement => {
      const geo = geoRef.current!;
      const cur = specRef.current;
      if (target === "chip") {
        const p = chipPlacementFor(formFactor, cur);
        return { cx: p.x, cy: p.y, scale: 1, rot: 0 };
      }
      const b = geo.boxes[target];
      const cx = b ? (b.x + b.w / 2) / geo.faceW : 0.5;
      const cy = b ? (b.y + b.h / 2) / geo.faceH : 0.5;
      if (target === "image") return { cx, cy, scale: cur.image?.scale ?? 0.55, rot: cur.layout?.image?.r ?? 0 };
      const p = cur.layout?.lines?.[lineIndex(target)!];
      return { cx, cy, scale: p?.s ?? 1, rot: p?.r ?? 0 };
    },
    [formFactor]
  );

  /** 대상 배치를 spec 변경으로 */
  const applyPlacement = useCallback(
    (target: StudioEditTarget, p: StudioPlacement) => {
      const cur = specRef.current;
      const layout = cur.layout;
      if (target === "chip") {
        onSpecChange?.({ layout: { ...layout, chip: clampChipPlacement(formFactor, p.cx, p.cy) } });
        return;
      }
      const x = clamp(p.cx, 0, 1);
      const y = clamp(p.cy, 0, 1);
      const r = normalizeAngle(p.rot);
      if (target === "image") {
        onSpecChange?.({
          layout: { ...layout, image: r ? { x, y, s: 1, r } : { x, y, s: 1 } },
          image: { ...cur.image, scale: clamp(p.scale, IMAGE_SCALE_MIN, IMAGE_SCALE_MAX) },
        });
        return;
      }
      const idx = lineIndex(target)!;
      const lines = [...layout.lines];
      const s = clamp(p.scale, PLACEMENT_SCALE_MIN, PLACEMENT_SCALE_MAX);
      lines[idx] = r ? { x, y, s, r } : { x, y, s };
      onSpecChange?.({ layout: { ...layout, lines } });
    },
    [formFactor, onSpecChange]
  );

  useEffect(() => {
    if (!apiRef) return;
    apiRef.current = {
      getPlacement: (target) => (geoRef.current ? currentPlacement(target) : null),
      setPlacement: applyPlacement,
    };
  });

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!editable) return;
    const { x, y } = pointFrom(e);
    const hit = hitTest(x, y);
    onSelect?.(hit?.target ?? null);
    if (!hit) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // 일부 환경(합성 이벤트 등)에서는 캡처가 불가 — 이동 판정에는 영향 없음
    }
    const geo = geoRef.current!;
    const start = currentPlacement(hit.target);
    const centerX = geo.fx + start.cx * geo.fw;
    const centerY = geo.fy + start.cy * geo.fh;
    // 스냅 후보: 다른 요소 중심
    const others = { x: [] as number[], y: [] as number[] };
    for (const id of [...LINE_TARGETS, "image" as const]) {
      if (id === hit.target) continue;
      const b = geo.boxes[id];
      if (!b) continue;
      others.x.push((b.x + b.w / 2) / geo.faceW);
      others.y.push((b.y + b.h / 2) / geo.faceH);
    }
    if (hit.target !== "chip" && geo.chip) {
      others.x.push((geo.chip.x - geo.fx) / geo.fw);
      others.y.push((geo.chip.y - geo.fy) / geo.fh);
    }
    let half = { w: 0, h: 0 };
    if (hit.target === "chip") {
      const { textArea } = faceGeometryFor(formFactor);
      half = { w: formFactor.chip.diameterMm / 2 / textArea.w, h: formFactor.chip.diameterMm / 2 / textArea.h };
    } else {
      const b = geo.boxes[hit.target];
      if (b) half = { w: b.w / geo.faceW / 2, h: b.h / geo.faceH / 2 };
    }
    dragRef.current = {
      target: hit.target,
      mode: hit.mode,
      startX: x,
      startY: y,
      start,
      ref:
        hit.mode === "rotate"
          ? angleDeg(x, y, centerX, centerY)
          : Math.max(8, Math.hypot(x - centerX, y - centerY)),
      others,
      half,
    };
    onInteractionStart?.();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!editable) return;
    const { x, y } = pointFrom(e);
    const drag = dragRef.current;
    const geo = geoRef.current;
    if (!drag || !geo) {
      const hit = hitTest(x, y);
      e.currentTarget.style.cursor = hit
        ? hit.mode === "resize"
          ? "nwse-resize"
          : hit.mode === "rotate"
            ? "grab"
            : "move"
        : "default";
      return;
    }
    const centerX = geo.fx + drag.start.cx * geo.fw;
    const centerY = geo.fy + drag.start.cy * geo.fh;
    if (drag.mode === "move") {
      let cx = drag.start.cx + (x - drag.startX) / geo.fw;
      let cy = drag.start.cy + (y - drag.startY) / geo.fh;
      const next: Guides = { x: [], y: [] };
      if (!e.altKey) {
        const sx = snapAxis(cx, drag.half.w, drag.others.x, SNAP_PX / geo.fw);
        const sy = snapAxis(cy, drag.half.h, drag.others.y, SNAP_PX / geo.fh);
        if (sx) {
          cx = sx.value;
          next.x.push(sx.guide);
        }
        if (sy) {
          cy = sy.value;
          next.y.push(sy.guide);
        }
      }
      setGuides(next);
      applyPlacement(drag.target, { ...drag.start, cx, cy });
    } else if (drag.mode === "resize") {
      const ratio = Math.hypot(x - centerX, y - centerY) / drag.ref;
      applyPlacement(drag.target, { ...drag.start, scale: drag.start.scale * ratio });
    } else {
      let rot = drag.start.rot + (angleDeg(x, y, centerX, centerY) - drag.ref);
      if (e.shiftKey) {
        rot = Math.round(rot / 15) * 15;
      } else {
        const near = Math.round(rot / 90) * 90;
        if (Math.abs(rot - near) <= ROT_SNAP_DEG) rot = near;
      }
      applyPlacement(drag.target, { ...drag.start, rot });
    }
  };

  const endDrag = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      if (dragRef.current && e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // 캡처가 없던 포인터
    }
    if (dragRef.current) onInteractionEnd?.();
    dragRef.current = null;
    setGuides(null);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    if (!editable || !selected || !geoRef.current) return;
    if (e.key === "Escape") {
      onSelect?.(null);
      return;
    }
    const step = e.shiftKey ? NUDGE_BIG : NUDGE;
    const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (!d) return;
    e.preventDefault();
    const p = currentPlacement(selected);
    applyPlacement(selected, { ...p, cx: p.cx + d[0]!, cy: p.cy + d[1]! });
  };

  return (
    <div
      ref={wrapRef}
      className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,#FFF1F2,transparent_55%),radial-gradient(circle_at_80%_85%,#E5F6F4,transparent_55%),#F8FAFC]"
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full outline-none"
        style={{ touchAction: editable ? "none" : "auto" }}
        aria-label={
          editable
            ? "태그 정면 편집기 — 요소를 끌어서 옮기고, 모서리 점으로 크기, 위쪽 손잡이로 회전합니다"
            : "태그 정면 미리보기"
        }
        role="img"
        tabIndex={editable ? 0 : -1}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}
