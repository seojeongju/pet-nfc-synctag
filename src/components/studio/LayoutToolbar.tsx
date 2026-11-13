"use client";

/**
 * 정면 편집기 도구 막대 — 편집할 요소 선택, 크기 슬라이더, 가운데 정렬, 위치 초기화.
 * 실제 배치 계산은 TagPreview2D가 apiRef로 제공한다(화면에 그려진 기본 위치를 알고 있으므로).
 */
import {
  AlignCenterHorizontal,
  ArrowDownToLine,
  ArrowUpToLine,
  Box,
  CircleDot,
  ImageIcon,
  Move,
  Redo2,
  RotateCcw,
  RotateCw,
  Type,
  Undo2,
} from "lucide-react";
import type { MutableRefObject } from "react";
import type { StudioCanvasApi, StudioEditTarget } from "@/components/studio/TagPreview2D";
import {
  IMAGE_SCALE_MAX,
  IMAGE_SCALE_MIN,
  PLACEMENT_SCALE_MAX,
  PLACEMENT_SCALE_MIN,
  TAG_FONTS,
  TAG_TEXT_COLORS,
  emptyLayout,
  layerOrderFor,
  type LayerId,
  type TagDesignSpec,
  type TagFontId,
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
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  /** 슬라이더처럼 연속 조작의 시작·끝 (실행 취소를 한 단계로 묶음) */
  onInteractionStart: () => void;
  onInteractionEnd: () => void;
};

export function LayoutToolbar({
  spec,
  selected,
  locked,
  apiRef,
  onSelect,
  onChange,
  onShow3d,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onInteractionStart,
  onInteractionEnd,
}: Props) {
  const targets: Array<{ id: StudioEditTarget; label: string; icon: typeof Type }> = [];
  spec.lines.forEach((line, i) => {
    if (line.trim()) targets.push({ id: `line${i}` as StudioEditTarget, label: `문구 ${i + 1}`, icon: Type });
  });
  if (spec.image?.src) targets.push({ id: "image", label: "로고", icon: ImageIcon });
  targets.push({ id: "chip", label: "NFC 칩", icon: CircleDot });

  const lineIdx = selected?.startsWith("line") ? Number(selected.slice(4)) : null;
  const hasCustomLayout =
    spec.layout.lines.some(Boolean) ||
    Boolean(spec.layout.image) ||
    Boolean(spec.layout.chip) ||
    spec.layout.styles.some(Boolean) ||
    Boolean(spec.layout.order);

  const sizeValue =
    lineIdx !== null
      ? Math.round((spec.layout.lines[lineIdx]?.s ?? 1) * 100)
      : selected === "image"
        ? Math.round((spec.image?.scale ?? 0.55) * 100)
        : null;
  const sizeMin = selected === "image" ? IMAGE_SCALE_MIN * 100 : PLACEMENT_SCALE_MIN * 100;
  const sizeMax = selected === "image" ? IMAGE_SCALE_MAX * 100 : PLACEMENT_SCALE_MAX * 100;

  const rotValue =
    lineIdx !== null ? spec.layout.lines[lineIdx]?.r ?? 0 : selected === "image" ? spec.layout.image?.r ?? 0 : null;

  const patchPlacement = (patch: Partial<{ cx: number; cy: number; scale: number; rot: number }>) => {
    if (!selected) return;
    const p = apiRef.current?.getPlacement(selected);
    if (!p) return;
    apiRef.current?.setPlacement(selected, { ...p, ...patch });
  };

  const setSize = (pct: number) => patchPlacement({ scale: pct / 100 });
  const setRotation = (deg: number) => patchPlacement({ rot: deg });
  const centerHorizontally = () => {
    onInteractionStart();
    patchPlacement({ cx: 0.5 });
    onInteractionEnd();
  };
  const sliderEvents = { onPointerDown: onInteractionStart, onPointerUp: onInteractionEnd, onKeyDown: onInteractionStart, onKeyUp: onInteractionEnd };

  // ── 겹침 순서 (아래 → 위)
  const order = layerOrderFor(spec.lines.length, spec.layout.order);
  const layerId = selected && selected !== "chip" ? (selected as LayerId) : null;
  const layerPos = layerId ? order.indexOf(layerId) : -1;
  const moveLayer = (dir: "front" | "back") => {
    if (!layerId) return;
    const rest = order.filter((id) => id !== layerId);
    const next = dir === "front" ? [...rest, layerId] : [layerId, ...rest];
    onInteractionStart();
    onChange({ layout: { ...spec.layout, order: next } });
    onInteractionEnd();
  };

  // ── 줄별 색·글꼴
  const lineStyle = lineIdx !== null ? spec.layout.styles[lineIdx] ?? null : null;
  const setLineStyle = (patch: { color?: string | null; font?: TagFontId | null }) => {
    if (lineIdx === null) return;
    const styles = [...spec.layout.styles];
    const cur = { ...(styles[lineIdx] ?? {}) };
    if (patch.color !== undefined) {
      if (patch.color) cur.color = patch.color;
      else delete cur.color;
    }
    if (patch.font !== undefined) {
      if (patch.font && patch.font !== "outfit") cur.font = patch.font;
      else delete cur.font;
    }
    styles[lineIdx] = Object.keys(cur).length ? cur : null;
    onInteractionStart();
    onChange({ layout: { ...spec.layout, styles } });
    onInteractionEnd();
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
      const styles = [...spec.layout.styles];
      styles[lineIdx] = null;
      onChange({ layout: { ...spec.layout, lines, styles } });
    }
  };

  return (
    <div className="mt-3 rounded-[22px] border border-slate-200/80 bg-white/90 p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-black tracking-wider text-teal-600">
          <Move className="h-3.5 w-3.5" aria-hidden />
          요소 편집
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onUndo}
            disabled={locked || !canUndo}
            title="실행 취소 (Ctrl+Z)"
            aria-label="실행 취소"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 disabled:opacity-35"
          >
            <Undo2 className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={locked || !canRedo}
            title="다시 실행 (Ctrl+Shift+Z)"
            aria-label="다시 실행"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 disabled:opacity-35"
          >
            <Redo2 className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={onShow3d}
            className="ml-1 inline-flex items-center gap-1 text-[11px] font-black text-teal-700 hover:underline"
          >
            <Box className="h-3.5 w-3.5" aria-hidden />
            3D로 확인
          </button>
        </div>
      </div>
      <p className="mt-1 text-[11px] font-semibold leading-snug text-slate-400 break-keep [word-break:keep-all]">
        요소를 끌어 옮기면 가운데·여백·다른 요소에 자동으로 맞춰져요(Alt: 끄기). 모서리 점은 크기, 위쪽 손잡이는 회전(Shift: 15°)입니다.
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
                {...sliderEvents}
                className="mt-1 w-full accent-teal-600"
              />
            </label>
          ) : (
            <p className="text-[11px] font-semibold text-slate-500 break-keep [word-break:keep-all]">
              NFC 칩은 규격 크기가 정해져 있어 위치만 바꿀 수 있어요. 금속 부품·두꺼운 각인 아래는 인식이 약해질 수 있으니 여유를 두세요.
            </p>
          )}
          {rotValue !== null ? (
            <label className="block">
              <span className="flex items-center justify-between text-[11px] font-black text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <RotateCw className="h-3.5 w-3.5" aria-hidden />
                  회전
                </span>
                <span className="tabular-nums text-slate-400">{Math.round(rotValue)}°</span>
              </span>
              <input
                type="range"
                min={-180}
                max={180}
                step={1}
                value={Math.round(rotValue)}
                onChange={(e) => setRotation(Number(e.target.value))}
                {...sliderEvents}
                className="mt-1 w-full accent-teal-600"
              />
            </label>
          ) : null}
          {lineIdx !== null ? (
            <div className="space-y-2">
              <div>
                <span className="text-[11px] font-black text-slate-600">이 줄 색상</span>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setLineStyle({ color: null })}
                    aria-pressed={!lineStyle?.color}
                    className={cn(
                      "inline-flex h-8 items-center rounded-full border px-2.5 text-[11px] font-black transition",
                      !lineStyle?.color ? "border-teal-300 bg-teal-50 text-teal-800" : "border-slate-200 bg-white text-slate-600 hover:border-teal-200"
                    )}
                  >
                    전체 색 따름
                  </button>
                  {TAG_TEXT_COLORS.map((c) => {
                    const active = lineStyle?.color?.toLowerCase() === c.hex.toLowerCase();
                    return (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setLineStyle({ color: c.hex })}
                        aria-label={c.name}
                        aria-pressed={active}
                        title={c.name}
                        className={cn("h-7 w-7 rounded-full ring-1 ring-slate-200 transition", active && "ring-2 ring-teal-500 ring-offset-2")}
                        style={{ backgroundColor: c.hex }}
                      />
                    );
                  })}
                </div>
              </div>
              <div>
                <span className="text-[11px] font-black text-slate-600">이 줄 글꼴</span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {TAG_FONTS.map((f) => {
                    const active = (lineStyle?.font ?? "outfit") === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setLineStyle({ font: f.id })}
                        aria-pressed={active}
                        style={{ fontFamily: f.family }}
                        className={cn(
                          "inline-flex h-8 items-center rounded-full border px-3 text-[12px] font-black transition",
                          active ? "border-teal-300 bg-teal-50 text-teal-800" : "border-slate-200 bg-white text-slate-600 hover:border-teal-200"
                        )}
                      >
                        {f.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
          {layerId ? (
            <div>
              <span className="text-[11px] font-black text-slate-600">겹침 순서</span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => moveLayer("front")}
                  disabled={layerPos === order.length - 1}
                  className="inline-flex h-8 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 text-[11px] font-black text-slate-600 hover:border-teal-200 disabled:opacity-40"
                >
                  <ArrowUpToLine className="h-3.5 w-3.5" aria-hidden />
                  맨 앞으로
                </button>
                <button
                  type="button"
                  onClick={() => moveLayer("back")}
                  disabled={layerPos === 0}
                  className="inline-flex h-8 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 text-[11px] font-black text-slate-600 hover:border-teal-200 disabled:opacity-40"
                >
                  <ArrowDownToLine className="h-3.5 w-3.5" aria-hidden />
                  맨 뒤로
                </button>
              </div>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-1.5">
            {rotValue ? (
              <button
                type="button"
                onClick={() => {
                  onInteractionStart();
                  setRotation(0);
                  onInteractionEnd();
                }}
                className="inline-flex h-8 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 text-[11px] font-black text-slate-600 hover:border-teal-200"
              >
                <RotateCw className="h-3.5 w-3.5" aria-hidden />
                회전 0°
              </button>
            ) : null}
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
