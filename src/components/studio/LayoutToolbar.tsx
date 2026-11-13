"use client";

/**
 * 정면 편집기 도구 막대 — 편집할 요소 선택, 크기 슬라이더, 가운데 정렬, 위치 초기화.
 * 실제 배치 계산은 TagPreview2D가 apiRef로 제공한다(화면에 그려진 기본 위치를 알고 있으므로).
 */
import { AlignCenterHorizontal, Box, CircleDot, ImageIcon, Move, RotateCcw, Type } from "lucide-react";
import type { MutableRefObject } from "react";
import type { StudioCanvasApi, StudioEditTarget } from "@/components/studio/TagPreview2D";
import {
  IMAGE_SCALE_MAX,
  IMAGE_SCALE_MIN,
  PLACEMENT_SCALE_MAX,
  PLACEMENT_SCALE_MIN,
  emptyLayout,
  type TagDesignSpec,
} from "@/lib/platform/tag-design";
import { cn } from "@/lib/utils";

type Props = {
  spec: TagDesignSpec;
  selected: StudioEditTarget | null;
  locked: boolean;
  apiRef: MutableRefObject<StudioCanvasApi | null>;
  onSelect: (target: StudioEditTarget | null) => void;
  onChange: (patch: Partial<TagDesignSpec>) => void;
  onShow3d: () => void;
};

export function LayoutToolbar({ spec, selected, locked, apiRef, onSelect, onChange, onShow3d }: Props) {
  const targets: Array<{ id: StudioEditTarget; label: string; icon: typeof Type }> = [];
  spec.lines.forEach((line, i) => {
    if (line.trim()) targets.push({ id: `line${i}` as StudioEditTarget, label: `문구 ${i + 1}`, icon: Type });
  });
  if (spec.image?.src) targets.push({ id: "image", label: "로고", icon: ImageIcon });
  targets.push({ id: "chip", label: "NFC 칩", icon: CircleDot });

  const lineIdx = selected?.startsWith("line") ? Number(selected.slice(4)) : null;
  const hasCustomLayout =
    spec.layout.lines.some(Boolean) || Boolean(spec.layout.image) || Boolean(spec.layout.chip);

  const sizeValue =
    lineIdx !== null
      ? Math.round((spec.layout.lines[lineIdx]?.s ?? 1) * 100)
      : selected === "image"
        ? Math.round((spec.image?.scale ?? 0.55) * 100)
        : null;
  const sizeMin = selected === "image" ? IMAGE_SCALE_MIN * 100 : PLACEMENT_SCALE_MIN * 100;
  const sizeMax = selected === "image" ? IMAGE_SCALE_MAX * 100 : PLACEMENT_SCALE_MAX * 100;

  const setSize = (pct: number) => {
    if (!selected) return;
    const p = apiRef.current?.getPlacement(selected);
    if (!p) return;
    apiRef.current?.setPlacement(selected, p.cx, p.cy, pct / 100);
  };

  const centerHorizontally = () => {
    if (!selected) return;
    const p = apiRef.current?.getPlacement(selected);
    if (!p) return;
    apiRef.current?.setPlacement(selected, 0.5, p.cy, p.scale);
  };

  const resetSelected = () => {
    if (!selected) return;
    if (selected === "chip") {
      onChange({ layout: { ...spec.layout, chip: null } });
    } else if (selected === "image") {
      onChange({ layout: { ...spec.layout, image: null } });
    } else if (lineIdx !== null) {
      const lines = [...spec.layout.lines];
      lines[lineIdx] = null;
      onChange({ layout: { ...spec.layout, lines } });
    }
  };

  return (
    <div className="mt-3 rounded-[22px] border border-slate-200/80 bg-white/90 p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-black tracking-wider text-teal-600">
          <Move className="h-3.5 w-3.5" aria-hidden />
          요소 편집
        </p>
        <button
          type="button"
          onClick={onShow3d}
          className="inline-flex items-center gap-1 text-[11px] font-black text-teal-700 hover:underline"
        >
          <Box className="h-3.5 w-3.5" aria-hidden />
          3D로 확인
        </button>
      </div>
      <p className="mt-1 text-[11px] font-semibold leading-snug text-slate-400 break-keep [word-break:keep-all]">
        미리보기에서 요소를 끌어 옮기고, 선택 상자 모서리 점을 끌어 크기를 바꾸세요. 방향키로 미세 이동(Shift: 크게).
      </p>

      <div className="mt-2.5 flex flex-wrap gap-1.5" role="group" aria-label="편집할 요소">
        {targets.map((t) => {
          const Icon = t.icon;
          const active = selected === t.id;
          return (
            <button
              key={t.id}
              type="button"
              disabled={locked}
              aria-pressed={active}
              onClick={() => onSelect(active ? null : t.id)}
              className={cn(
                "inline-flex h-8 items-center gap-1 rounded-full border px-3 text-[12px] font-black transition disabled:opacity-60",
                active ? "border-teal-300 bg-teal-50 text-teal-800" : "border-slate-200 bg-white text-slate-600 hover:border-teal-200"
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {t.label}
            </button>
          );
        })}
      </div>

      {selected && !locked ? (
        <div className="mt-3 space-y-2.5 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
          {sizeValue !== null ? (
            <label className="block">
              <span className="flex items-center justify-between text-[11px] font-black text-slate-600">
                크기
                <span className="tabular-nums text-slate-400">{sizeValue}%</span>
              </span>
              <input
                type="range"
                min={sizeMin}
                max={sizeMax}
                step={1}
                value={sizeValue}
                onChange={(e) => setSize(Number(e.target.value))}
                className="mt-1 w-full accent-teal-600"
              />
            </label>
          ) : (
            <p className="text-[11px] font-semibold text-slate-500 break-keep [word-break:keep-all]">
              NFC 칩은 규격 크기가 정해져 있어 위치만 바꿀 수 있어요. 금속 부품·두꺼운 각인 아래는 인식이 약해질 수 있으니 여유를 두세요.
            </p>
          )}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={centerHorizontally}
              className="inline-flex h-8 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 text-[11px] font-black text-slate-600 hover:border-teal-200"
            >
              <AlignCenterHorizontal className="h-3.5 w-3.5" aria-hidden />
              가로 가운데
            </button>
            <button
              type="button"
              onClick={resetSelected}
              className="inline-flex h-8 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 text-[11px] font-black text-slate-600 hover:border-teal-200"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              이 요소 위치 초기화
            </button>
          </div>
        </div>
      ) : null}

      {hasCustomLayout && !locked ? (
        <button
          type="button"
          onClick={() => {
            onChange({ layout: emptyLayout(spec.lines.length) });
            onSelect(null);
          }}
          className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-black text-slate-500 hover:text-rose-600"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          전체 배치 기본값으로
        </button>
      ) : null}
    </div>
  );
}
