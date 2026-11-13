"use client";

/**
 * 태그 정면(2D) 미리보기 — 스튜디오 기본 탭. three.js 없이 캔버스로 외곽선 + 윗면(문구·아트)을 그린다.
 * 윗면은 3D 미리보기와 같은 paintFaceCanvas 결과를 써서 두 탭이 똑같이 보인다.
 */
import { useEffect, useRef, useState } from "react";
import type { FormFactor } from "@/lib/platform/form-factors";
import type { TagDesignSpec } from "@/lib/platform/tag-design";
import { faceGeometryFor, paintFaceCanvas, useFaceImages } from "@/components/studio/tag-face-paint";

type Props = {
  formFactor: FormFactor;
  spec: TagDesignSpec;
  showChip: boolean;
};

type Bounds = { minX: number; maxX: number; minY: number; maxY: number };

/** 외곽선(mm, y 위쪽 +)을 그리는 함수와 경계 상자 */
function outlineFor(ff: FormFactor): { bounds: Bounds; trace: (p: Path2D, X: (x: number) => number, Y: (y: number) => number, s: number) => void; holes: Array<[number, number, number]> } {
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

export default function TagPreview2D({ formFactor, spec, showChip }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const { faceEl, logoEl } = useFaceImages(spec);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

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
    const { textArea, chipCenter } = faceGeometryFor(formFactor);
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
    const hasContent = Boolean(spec.faceArtSrc) || spec.lines.some((l) => l.trim()) || Boolean(spec.image?.src);
    const face = hasContent ? paintFaceCanvas(spec, textArea, faceEl, logoEl) : null;
    if (face) {
      ctx.save();
      ctx.clip(body, "nonzero");
      const fx = X(textArea.cx - textArea.w / 2);
      const fy = Y(textArea.cy + textArea.h / 2);
      if (spec.faceArtSrc) {
        // 명함 아트는 카드 가장자리까지 둥글게
        const clip = new Path2D();
        clip.roundRect(fx, fy, textArea.w * s, textArea.h * s, 3 * s);
        ctx.clip(clip);
      }
      ctx.drawImage(face, fx, fy, textArea.w * s, textArea.h * s);
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
    if (showChip) {
      ctx.save();
      ctx.setLineDash([6, 5]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#F59E0B";
      ctx.fillStyle = "rgba(245,158,11,0.18)";
      ctx.beginPath();
      ctx.arc(X(chipCenter[0]), Y(chipCenter[1]), (formFactor.chip.diameterMm / 2) * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }, [size, formFactor, spec, showChip, faceEl, logoEl]);

  return (
    <div ref={wrapRef} className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,#FFF1F2,transparent_55%),radial-gradient(circle_at_80%_85%,#E5F6F4,transparent_55%),#F8FAFC]">
      <canvas ref={canvasRef} className="block h-full w-full" aria-label="태그 정면 미리보기" role="img" />
    </div>
  );
}
