"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

export type AlbumAssetLightboxItem = {
  id: string;
  r2Key: string;
  caption: string | null;
  createdAt: string | null;
};

type AlbumAssetLightboxGridProps = {
  assets: AlbumAssetLightboxItem[];
  variant?: "guardian" | "shared";
};

function formatDateTime(value: string | null): string {
  if (!value) return "-";
  const d = new Date(value.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}

function clampPan(
  x: number,
  y: number,
  zoom: number,
  viewportEl: HTMLDivElement | null
): { x: number; y: number } {
  if (!viewportEl || zoom <= 1) return { x: 0, y: 0 };
  const rect = viewportEl.getBoundingClientRect();
  const maxX = Math.max(0, ((zoom - 1) * rect.width) / 2);
  const maxY = Math.max(0, ((zoom - 1) * rect.height) / 2);
  return {
    x: Math.min(maxX, Math.max(-maxX, x)),
    y: Math.min(maxY, Math.max(-maxY, y)),
  };
}

export default function AlbumAssetLightboxGrid({
  assets,
  variant = "guardian",
}: AlbumAssetLightboxGridProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const active = activeIndex == null ? null : assets[activeIndex] ?? null;
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const lastTapAtRef = useRef<number>(0);
  const pinchStartDistanceRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef<number>(1);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const gridClassName = useMemo(
    () => (variant === "shared" ? "grid grid-cols-1 gap-3" : "grid grid-cols-2 gap-2 sm:grid-cols-3"),
    [variant]
  );

  useEffect(() => {
    if (activeIndex == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveIndex(null);
        return;
      }
      if (e.key === "ArrowRight") {
        setActiveIndex((prev) => {
          if (prev == null) return 0;
          return (prev + 1) % assets.length;
        });
      }
      if (e.key === "ArrowLeft") {
        setActiveIndex((prev) => {
          if (prev == null) return 0;
          return (prev - 1 + assets.length) % assets.length;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, assets.length]);

  const movePrev = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setActiveIndex((prev) => {
      if (prev == null) return 0;
      return (prev - 1 + assets.length) % assets.length;
    });
  };

  const moveNext = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setActiveIndex((prev) => {
      if (prev == null) return 0;
      return (prev + 1) % assets.length;
    });
  };

  const onTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (e.touches.length >= 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      if (t1 && t2) {
        const dx = t1.clientX - t2.clientX;
        const dy = t1.clientY - t2.clientY;
        pinchStartDistanceRef.current = Math.hypot(dx, dy);
        pinchStartZoomRef.current = zoom;
      }
      touchStartXRef.current = null;
      touchStartYRef.current = null;
      return;
    }
    const t = e.changedTouches[0];
    if (!t) return;
    const now = Date.now();
    if (now - lastTapAtRef.current < 280) {
      setZoom((prev) => (prev > 1 ? 1 : 2));
    }
    lastTapAtRef.current = now;
    touchStartXRef.current = t.clientX;
    touchStartYRef.current = t.clientY;
    if (zoom > 1) {
      pointerStartRef.current = { x: t.clientX, y: t.clientY };
      panStartRef.current = { ...pan };
    }
  };

  const onTouchMove: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (e.touches.length === 1 && zoom > 1 && pointerStartRef.current) {
      const t = e.touches[0];
      if (!t) return;
      const dx = t.clientX - pointerStartRef.current.x;
      const dy = t.clientY - pointerStartRef.current.y;
      setPan(clampPan(panStartRef.current.x + dx, panStartRef.current.y + dy, zoom, viewportRef.current));
      return;
    }
    if (e.touches.length < 2) return;
    const t1 = e.touches[0];
    const t2 = e.touches[1];
    const startDist = pinchStartDistanceRef.current;
    if (!t1 || !t2 || !startDist || startDist <= 0) return;
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    const currentDist = Math.hypot(dx, dy);
    const scale = currentDist / startDist;
    const next = Math.min(3, Math.max(1, Number((pinchStartZoomRef.current * scale).toFixed(3))));
    setZoom(next);
    setPan((prev) => clampPan(prev.x, prev.y, next, viewportRef.current));
  };

  const onTouchEnd: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (e.touches.length < 2) {
      pinchStartDistanceRef.current = null;
      pinchStartZoomRef.current = zoom;
    }
    const t = e.changedTouches[0];
    if (!t) return;
    if (zoom > 1) {
      pointerStartRef.current = null;
      return;
    }
    const startX = touchStartXRef.current;
    const startY = touchStartYRef.current;
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    if (startX == null || startY == null) return;

    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (absX < 42 || absX < absY) return; // 수직 스크롤과 구분
    if (zoom > 1) return; // 확대 중에는 스와이프 이동 비활성
    if (dx < 0) {
      moveNext();
    } else {
      movePrev();
    }
  };

  const zoomIn = () => setZoom((z) => Math.min(3, Number((z + 0.5).toFixed(2))));
  const zoomOut = () =>
    setZoom((z) => {
      const next = Math.max(1, Number((z - 0.5).toFixed(2)));
      if (next <= 1) setPan({ x: 0, y: 0 });
      else setPan((prev) => clampPan(prev.x, prev.y, next, viewportRef.current));
      return next;
    });
  const resetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const onMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (zoom <= 1) return;
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const onMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (zoom <= 1 || !pointerStartRef.current) return;
    const dx = e.clientX - pointerStartRef.current.x;
    const dy = e.clientY - pointerStartRef.current.y;
    setPan(clampPan(panStartRef.current.x + dx, panStartRef.current.y + dy, zoom, viewportRef.current));
  };

  const onMouseUp: React.MouseEventHandler<HTMLDivElement> = () => {
    pointerStartRef.current = null;
  };

  useEffect(() => {
    if (zoom <= 1) {
      setPan({ x: 0, y: 0 });
      return;
    }
    setPan((prev) => clampPan(prev.x, prev.y, zoom, viewportRef.current));
  }, [zoom]);

  return (
    <>
      <section className={gridClassName}>
        {assets.map((asset, index) => {
          const href = `/api/r2/${asset.r2Key}`;
          return (
            <article
              key={asset.id}
              className={
                variant === "shared"
                  ? "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  : "overflow-hidden rounded-lg border border-slate-200 bg-white"
              }
            >
              <button
                type="button"
                onClick={() => setActiveIndex(index)}
                className="block w-full text-left"
                title="클릭해 확대 보기"
              >
                <div className={variant === "shared" ? "relative aspect-[4/3] w-full bg-slate-100" : "relative aspect-square w-full bg-slate-100"}>
                  <Image
                    src={href}
                    alt={asset.caption || "앨범 이미지"}
                    fill
                    className="object-cover"
                    sizes={variant === "shared" ? "(max-width: 768px) 100vw, 720px" : "(max-width: 640px) 50vw, 180px"}
                  />
                </div>
              </button>
              <div className={variant === "shared" ? "px-3 py-2" : "space-y-1 px-2 py-2"}>
                <p className={variant === "shared" ? "text-[12px] font-semibold text-slate-700 break-words" : "truncate text-[10px] font-bold text-slate-600"}>
                  {asset.caption || asset.r2Key.split("/").slice(-1)[0]}
                </p>
                <p className={variant === "shared" ? "mt-1 text-[10px] font-bold text-slate-400" : "text-[10px] font-semibold text-slate-400"}>
                  {formatDateTime(asset.createdAt)}
                </p>
              </div>
            </article>
          );
        })}
      </section>

      {active ? (
        <div className="fixed inset-0 z-[100] bg-black/85 p-3 sm:p-6" role="dialog" aria-modal="true">
          <div className="absolute left-4 top-4 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-black text-white">
            {activeIndex != null ? activeIndex + 1 : 1} / {assets.length}
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveIndex(null);
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="absolute right-4 top-4 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-black text-white hover:bg-white/20"
          >
            닫기 (Esc)
          </button>
          <div className="absolute right-4 top-14 flex items-center gap-1">
            <button
              type="button"
              onClick={zoomOut}
              className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-black text-white hover:bg-white/20"
              title="축소"
            >
              -
            </button>
            <span className="rounded-lg bg-white/10 px-2 py-1 text-[11px] font-black text-white">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={zoomIn}
              className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-black text-white hover:bg-white/20"
              title="확대"
            >
              +
            </button>
            <button
              type="button"
              onClick={resetZoom}
              className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-black text-white hover:bg-white/20"
              title="배율 초기화"
            >
              1x
            </button>
          </div>
          <div className="mx-auto flex h-full w-full max-w-5xl items-center justify-center">
            <button
              type="button"
              onClick={movePrev}
              className="mr-2 rounded-full bg-white/10 px-3 py-2 text-sm font-black text-white hover:bg-white/20"
            >
              이전
            </button>
            <div
              ref={viewportRef}
              className="relative h-[78vh] w-full overflow-hidden rounded-2xl bg-slate-900"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
            >
              <Image
                src={`/api/r2/${active.r2Key}`}
                alt={active.caption || "확대 이미지"}
                fill
                className="object-contain transition-transform duration-150"
                style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
                sizes="100vw"
                priority
              />
            </div>
            <button
              type="button"
              onClick={moveNext}
              className="ml-2 rounded-full bg-white/10 px-3 py-2 text-sm font-black text-white hover:bg-white/20"
            >
              다음
            </button>
          </div>
          <div className="mx-auto mt-3 w-full max-w-5xl rounded-xl bg-white/10 px-3 py-2">
            <p className="text-xs font-black text-white break-words">{active.caption || active.r2Key.split("/").slice(-1)[0]}</p>
            <p className="text-[11px] font-bold text-slate-200">{formatDateTime(active.createdAt)}</p>
          </div>
          <div className="mx-auto mt-2 flex w-full max-w-5xl gap-2 overflow-x-auto rounded-xl bg-white/5 p-2">
            {assets.map((item, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border ${
                    isActive ? "border-teal-300 ring-2 ring-teal-300/60" : "border-white/20"
                  }`}
                  aria-label={`이미지 ${idx + 1} 보기`}
                >
                  <Image
                    src={`/api/r2/${item.r2Key}`}
                    alt={item.caption || `이미지 ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </>
  );
}
