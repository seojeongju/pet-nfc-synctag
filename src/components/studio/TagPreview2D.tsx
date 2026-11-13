"use client";

/**
 * 태그 정면(2D) 미리보기 겸 편집기 — 스튜디오 기본 탭. three.js 없이 캔버스로 외곽선 + 윗면(문구·아트)을 그린다.
 * 윗면은 3D 미리보기와 같은 paintFace 결과를 써서 두 탭이 똑같이 보인다.
 *
 * editable이면 문구·로고·NFC 칩을 마우스/터치로 끌어 옮기고, 선택 박스 모서리 점으로 크기를 바꾼다.
 * 방향키로 미세 이동(Shift: 크게). 위치는 그림 영역 대비 비율로 spec.layout에 저장된다.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { FormFactor } from "@/lib/platform/form-factors";
import {
  IMAGE_SCALE_MAX,
  IMAGE_SCALE_MIN,
  PLACEMENT_SCALE_MAX,
  PLACEMENT_SCALE_MIN,
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

/** 도구 막대가 쓰는 편집기 API — 현재 화면 기준 중심(비율)·크기 조회와 배치 적용 */
export type StudioCanvasApi = {
  getPlacement: (target: StudioEditTarget) => { cx: number; cy: number; scale: number } | null;
  setPlacement: (target: StudioEditTarget, cx: number, cy: number, scale: number) => void;
};

type Props = {
  formFactor: FormFactor;
  spec: TagDesignSpec;
  showChip: boolean;
  editable?: boolean;
  selected?: StudioEditTarget | null;
  onSelect?: (target: StudioEditTarget | null) => void;
  onSpecChange?: (patch: Partial<TagDesignSpec>) => void;
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
  mode: "move" | "resize";
  startX: number;
  startY: number;
  /** 시작 시 중심(비율) */
  cx: number;
  cy: number;
  /** 시작 시 크기 배율 (문구: layout s, 로고: image.scale) */
  scale: number;
  /** resize: 시작 시 중심→포인터 거리 */
  dist: number;
};

const HANDLE = 10;
const NUDGE = 0.01;
const NUDGE_BIG = 0.05;
const LINE_TARGETS: FaceElementId[] = ["line0", "line1", "line2"];

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function lineIndex(target: StudioEditTarget): number | null {
  return target.startsWith("line") ? Number(target.slice(4)) : null;
}

/** 요소 박스를 화면(CSS 픽셀) 좌표로 */
function cssBox(geo: Geo, target: FaceElementId) {
  const b = geo.boxes[target];
  if (!b) return null;
  return {
    x: geo.fx + (b.x / geo.faceW) * geo.fw,
    y: geo.fy + (b.y / geo.faceH) * geo.fh,
    w: (b.w / geo.faceW) * geo.fw,
    h: (b.h / geo.faceH) * geo.fh,
  };
}

export default function TagPreview2D({
  formFactor,
  spec,
  showChip,
  editable = false,
  selected = null,
  onSelect,
  onSpecChange,
  apiRef,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const geoRef = useRef<Geo | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const specRef = useRef(spec);
  specRef.current = spec;
  const [size, setSize] = useState({ w: 0, h: 0 });
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

    geoRef.current = {
      fx,
      fy,
      fw,
      fh,
      faceW: face?.canvas.width ?? 1,
      faceH: face?.canvas.height ?? 1,
      boxes: face?.boxes ?? {},
      chip: chipVisible ? chip : null,
    };

    // 선택 표시
    if (editable && selected) {
      ctx.save();
      ctx.strokeStyle = "#00A896";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      if (selected === "chip") {
        ctx.beginPath();
        ctx.arc(chip.x, chip.y, chip.r + 4, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        const r = cssBox(geoRef.current, selected);
        if (r) {
          ctx.strokeRect(r.x - 4, r.y - 4, r.w + 8, r.h + 8);
          ctx.setLineDash([]);
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(r.x + r.w + 4 - HANDLE / 2, r.y + r.h + 4 - HANDLE / 2, HANDLE, HANDLE);
          ctx.strokeRect(r.x + r.w + 4 - HANDLE / 2, r.y + r.h + 4 - HANDLE / 2, HANDLE, HANDLE);
        }
      }
      ctx.restore();
    }
  }, [size, formFactor, spec, chipVisible, faceEl, logoEl, editable, selected]);

  const pointFrom = (e: { clientX: number; clientY: number }) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  /** 포인터 아래 요소 판정 (칩 > 문구 > 로고 순) */
  const hitTest = useCallback(
    (px: number, py: number): { target: StudioEditTarget; mode: Drag["mode"] } | null => {
      const geo = geoRef.current;
      if (!geo) return null;
      if (selected && selected !== "chip") {
        const r = cssBox(geo, selected);
        if (r && Math.abs(px - (r.x + r.w + 4)) <= HANDLE && Math.abs(py - (r.y + r.h + 4)) <= HANDLE) {
          return { target: selected, mode: "resize" };
        }
      }
      if (geo.chip && Math.hypot(px - geo.chip.x, py - geo.chip.y) <= geo.chip.r) return { target: "chip", mode: "move" };
      for (const id of [...LINE_TARGETS, "image" as const]) {
        const r = cssBox(geo, id);
        if (r && px >= r.x - 4 && px <= r.x + r.w + 4 && py >= r.y - 4 && py <= r.y + r.h + 4) return { target: id, mode: "move" };
      }
      return null;
    },
    [selected]
  );

  /** 대상의 현재 중심(비율)과 크기 배율 */
  const currentPlacement = (target: StudioEditTarget) => {
    const geo = geoRef.current!;
    const cur = specRef.current;
    if (target === "chip") {
      const p = chipPlacementFor(formFactor, cur);
      return { cx: p.x, cy: p.y, scale: 1 };
    }
    const b = geo.boxes[target];
    const cx = b ? (b.x + b.w / 2) / geo.faceW : 0.5;
    const cy = b ? (b.y + b.h / 2) / geo.faceH : 0.5;
    if (target === "image") return { cx, cy, scale: cur.image?.scale ?? 0.55 };
    const idx = lineIndex(target)!;
    return { cx, cy, scale: cur.layout?.lines?.[idx]?.s ?? 1 };
  };

  /** 대상 배치를 spec 변경으로 */
  const applyPlacement = useCallback(
    (target: StudioEditTarget, cx: number, cy: number, scale: number) => {
      const cur = specRef.current;
      const layout = cur.layout;
      if (target === "chip") {
        onSpecChange?.({ layout: { ...layout, chip: clampChipPlacement(formFactor, cx, cy) } });
        return;
      }
      const x = clamp(cx, 0, 1);
      const y = clamp(cy, 0, 1);
      if (target === "image") {
        onSpecChange?.({
          layout: { ...layout, image: { x, y, s: 1 } },
          image: { ...cur.image, scale: clamp(scale, IMAGE_SCALE_MIN, IMAGE_SCALE_MAX) },
        });
        return;
      }
      const idx = lineIndex(target)!;
      const lines = [...layout.lines];
      lines[idx] = { x, y, s: clamp(scale, PLACEMENT_SCALE_MIN, PLACEMENT_SCALE_MAX) };
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
    const p = currentPlacement(hit.target);
    const geo = geoRef.current!;
    const centerX = geo.fx + p.cx * geo.fw;
    const centerY = geo.fy + p.cy * geo.fh;
    dragRef.current = {
      target: hit.target,
      mode: hit.mode,
      startX: x,
      startY: y,
      cx: p.cx,
      cy: p.cy,
      scale: p.scale,
      dist: Math.max(8, Math.hypot(x - centerX, y - centerY)),
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!editable) return;
    const { x, y } = pointFrom(e);
    const drag = dragRef.current;
    const geo = geoRef.current;
    if (!drag || !geo) {
      const hit = hitTest(x, y);
      e.currentTarget.style.cursor = hit ? (hit.mode === "resize" ? "nwse-resize" : "move") : "default";
      return;
    }
    if (drag.mode === "move") {
      applyPlacement(drag.target, drag.cx + (x - drag.startX) / geo.fw, drag.cy + (y - drag.startY) / geo.fh, drag.scale);
    } else {
      const centerX = geo.fx + drag.cx * geo.fw;
      const centerY = geo.fy + drag.cy * geo.fh;
      const ratio = Math.hypot(x - centerX, y - centerY) / drag.dist;
      applyPlacement(drag.target, drag.cx, drag.cy, drag.scale * ratio);
    }
  };

  const endDrag = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      if (dragRef.current && e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // 캡처가 없던 포인터
    }
    dragRef.current = null;
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
    applyPlacement(selected, p.cx + d[0]!, p.cy + d[1]!, p.scale);
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
        aria-label={editable ? "태그 정면 편집기 — 요소를 끌어서 옮기고 모서리 점으로 크기를 바꿉니다" : "태그 정면 미리보기"}
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
