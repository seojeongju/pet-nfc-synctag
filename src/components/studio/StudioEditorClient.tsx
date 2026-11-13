"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowLeft, Box, Calculator, Check, CircleDot, ImagePlus, Loader2, Lock, PenLine, Plus, Save, Trash2 } from "lucide-react";
import { saveTagDesign, uploadStudioImage } from "@/app/actions/studio";
import type { FormFactor } from "@/lib/platform/form-factors";
import {
  emptyImageLayer,
  MAX_TEXT_LINE_LENGTH,
  MAX_TEXT_LINES_TOTAL,
  TAG_BODY_COLORS,
  TAG_MATERIALS,
  TAG_TEXT_COLORS,
  TEXT_COLOR_DESIGN,
  type TagDesignRecord,
  type TagDesignSpec,
  type TagDesignStatus,
} from "@/lib/platform/tag-design";
import { getCardFaceLayout } from "@/lib/platform/card-face-layouts";
import TagPreview2D, { type StudioCanvasApi, type StudioEditTarget } from "@/components/studio/TagPreview2D";
import { LayoutToolbar } from "@/components/studio/LayoutToolbar";
import { ProductionPanel } from "@/components/studio/ProductionPanel";
import { cn } from "@/lib/utils";

const TagPreview3D = dynamic(() => import("@/components/studio/TagPreview3D"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-[12px] font-bold text-slate-400">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
      3D 미리보기 불러오는 중…
    </div>
  ),
});

type Props = {
  design: TagDesignRecord;
  formFactor: FormFactor;
  serviceName: string;
};

export default function StudioEditorClient({ design, formFactor, serviceName }: Props) {
  const [spec, setSpec] = useState<TagDesignSpec>(() => ({
    ...design.spec,
    image: design.spec.image ?? emptyImageLayer(),
    faceArtSrc: design.spec.faceArtSrc ?? null,
  }));
  const hasFaceArt = Boolean(spec.faceArtSrc);
  const [title, setTitle] = useState(design.title);
  const [status, setStatus] = useState<TagDesignStatus>(design.status);
  const [showChip, setShowChip] = useState(false);
  /** 기본은 정면 디자인(2D). 3D는 탭을 열 때만 three.js를 불러온다 */
  const [view, setView] = useState<"design" | "3d">("design");
  /** 정면 편집기에서 선택한 요소 (문구 줄 · 로고 · NFC 칩) */
  const [selected, setSelected] = useState<StudioEditTarget | null>(null);
  const canvasApiRef = useRef<StudioCanvasApi | null>(null);
  /** 제작 검사 오류 수 — 0보다 크면 디자인 완료를 막는다 */
  const [productionErrors, setProductionErrors] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const locked = status === "requested" || status === "locked";

  // ── 실행 취소 / 다시 실행 ──────────────────────────────
  // 끌기·슬라이더 같은 연속 조작은 시작 시점 한 번만 기록하고, 그 밖의 변경은 0.5초 안의 연속 변경을 묶는다.
  const specRef = useRef(spec);
  specRef.current = spec;
  const undoRef = useRef<TagDesignSpec[]>([]);
  const redoRef = useRef<TagDesignSpec[]>([]);
  const interactingRef = useRef(false);
  const lastRecordRef = useRef(0);
  const [, setHistoryVersion] = useState(0);
  const HISTORY_LIMIT = 50;

  const pushHistory = () => {
    undoRef.current.push(specRef.current);
    if (undoRef.current.length > HISTORY_LIMIT) undoRef.current.shift();
    redoRef.current = [];
    setHistoryVersion((v) => v + 1);
  };

  const recordChange = () => {
    if (interactingRef.current) return;
    const now = Date.now();
    if (now - lastRecordRef.current > 500) pushHistory();
    lastRecordRef.current = now;
  };

  const beginInteraction = () => {
    if (locked || interactingRef.current) return;
    pushHistory();
    interactingRef.current = true;
  };

  const endInteraction = () => {
    interactingRef.current = false;
    lastRecordRef.current = 0;
  };

  const restore = (from: React.MutableRefObject<TagDesignSpec[]>, to: React.MutableRefObject<TagDesignSpec[]>) => {
    const prev = from.current.pop();
    if (!prev) return;
    to.current.push(specRef.current);
    setSpec(prev);
    setDirty(true);
    setMessage(null);
    lastRecordRef.current = 0;
    setHistoryVersion((v) => v + 1);
  };
  const undo = () => !locked && restore(undoRef, redoRef);
  const redo = () => !locked && restore(redoRef, undoRef);

  const update = (patch: Partial<TagDesignSpec>) => {
    if (locked) return;
    recordChange();
    setSpec((prev) => ({ ...prev, ...patch }));
    setDirty(true);
    setMessage(null);
  };

  /** 문구 줄 추가 — 배치·스타일 배열도 같은 길이로 */
  const addLine = () => {
    if (locked || spec.lines.length >= MAX_TEXT_LINES_TOTAL) return;
    beginInteraction();
    const idx = spec.lines.length;
    update({
      lines: [...spec.lines, ""],
      layout: { ...spec.layout, lines: [...spec.layout.lines, null], styles: [...spec.layout.styles, null] },
    });
    endInteraction();
    setSelected(`line${idx}` as StudioEditTarget);
  };

  /** 추가한 문구 줄 삭제 — 겹침 순서의 번호도 당겨 맞춘다 */
  const removeLine = (i: number) => {
    if (locked || i < formFactor.maxTextLines) return;
    beginInteraction();
    const drop = <T,>(arr: T[]) => arr.filter((_, k) => k !== i);
    const order = spec.layout.order
      ? spec.layout.order
          .filter((id) => id !== `line${i}`)
          .map((id) => {
            const n = id.startsWith("line") ? Number(id.slice(4)) : -1;
            return n > i ? (`line${n - 1}` as typeof id) : id;
          })
      : null;
    update({
      lines: drop(spec.lines),
      layout: { ...spec.layout, lines: drop(spec.layout.lines), styles: drop(spec.layout.styles), order },
    });
    endInteraction();
    setSelected(null);
  };

  const updateImage = (patch: Partial<TagDesignSpec["image"]>) => {
    if (locked) return;
    recordChange();
    setSpec((prev) => ({ ...prev, image: { ...(prev.image ?? emptyImageLayer()), ...patch } }));
    setDirty(true);
    setMessage(null);
  };

  // Ctrl/Cmd+Z 실행 취소, Ctrl/Cmd+Shift+Z · Ctrl+Y 다시 실행 (글자 입력칸에서는 브라우저 기본 동작)
  const undoRedoRef = useRef({ undo, redo });
  undoRedoRef.current = { undo, redo };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) {
        if ((el as HTMLInputElement).type !== "range") return;
      }
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        undoRedoRef.current.undo();
      } else if ((key === "z" && e.shiftKey) || key === "y") {
        e.preventDefault();
        undoRedoRef.current.redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const save = (markReady: boolean) => {
    if (markReady && productionErrors > 0) {
      setMessage({ kind: "error", text: "제작 검사에서 수정이 필요한 항목이 있습니다. 아래 제작 검사 목록을 확인해 주세요." });
      return;
    }
    startTransition(async () => {
      const res = await saveTagDesign({ designId: design.id, title, spec, markReady });
      if (res.ok) {
        setSpec(res.spec);
        setStatus(res.status);
        setDirty(false);
        setMessage({ kind: "ok", text: markReady ? "디자인을 완료했습니다. 3D로 확인하고 견적·제작 단계로 이어가세요." : "저장했습니다." });
        if (markReady) setView("3d");
      } else {
        setMessage({ kind: "error", text: res.error });
      }
    });
  };

  const onPickImage = async (file: File | null) => {
    if (!file || locked) return;
    setUploading(true);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadStudioImage(fd);
      if (!res.ok) {
        setMessage({ kind: "error", text: res.error });
        return;
      }
      updateImage({ src: res.url });
      setMessage({ kind: "ok", text: "이미지를 올렸습니다. 저장을 눌러 디자인을 보관하세요." });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-screen-sm flex-col gap-4 px-4 pb-28 pt-5 min-[430px]:px-5 lg:max-w-5xl lg:flex-row lg:items-start lg:gap-6">
      <section className="lg:sticky lg:top-20 lg:w-[55%]">
        <div className="mb-2 flex items-center justify-between">
          <Link href="/studio" className="inline-flex items-center gap-1 text-[12px] font-black text-slate-500 hover:text-teal-700">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            스튜디오
          </Link>
          <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-black text-teal-700">
            {serviceName} · {formFactor.name}
          </span>
        </div>
        <div className="mb-2 grid grid-cols-2 gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm" role="tablist" aria-label="미리보기 방식">
          {(
            [
              ["design", "디자인 (정면)"],
              ["3d", "3D 보기"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={view === key}
              onClick={() => setView(key)}
              className={cn(
                "inline-flex h-9 items-center justify-center gap-1.5 rounded-full text-[12px] font-black transition",
                view === key ? "bg-teal-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              )}
            >
              {key === "3d" ? <Box className="h-3.5 w-3.5" aria-hidden /> : <PenLine className="h-3.5 w-3.5" aria-hidden />}
              {label}
            </button>
          ))}
        </div>
        <div className="relative aspect-square w-full overflow-hidden rounded-[32px] border border-slate-200/80 bg-slate-50 shadow-[0_24px_60px_rgba(15,23,42,0.10)]">
          {view === "3d" ? (
            <TagPreview3D formFactor={formFactor} spec={spec} showChip={showChip} />
          ) : (
            <TagPreview2D
              formFactor={formFactor}
              spec={spec}
              showChip={showChip}
              editable={!locked}
              selected={selected}
              onSelect={setSelected}
              onSpecChange={update}
              onInteractionStart={beginInteraction}
              onInteractionEnd={endInteraction}
              apiRef={canvasApiRef}
            />
          )}
          <button
            type="button"
            onClick={() => setShowChip((v) => !v)}
            aria-pressed={showChip}
            className={cn(
              "absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-black shadow-sm backdrop-blur",
              showChip ? "border-amber-200 bg-amber-50/95 text-amber-800" : "border-slate-200 bg-white/90 text-slate-600"
            )}
          >
            <CircleDot className="h-3.5 w-3.5" aria-hidden />
            NFC 칩 위치
          </button>
          <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-slate-500 shadow-sm">
            {formFactor.widthMm}×{formFactor.heightMm}×{formFactor.thicknessMm}mm
          </span>
        </div>
        {view === "3d" ? (
          <p className="mt-2 text-center text-[11px] font-semibold text-slate-400">드래그해서 돌려 보고, 두 손가락으로 확대할 수 있어요.</p>
        ) : (
          <LayoutToolbar
            spec={spec}
            selected={selected}
            locked={locked}
            apiRef={canvasApiRef}
            onSelect={(t) => {
              setSelected(t);
              if (t === "chip") setShowChip(true);
            }}
            onChange={update}
            onShow3d={() => setView("3d")}
            canUndo={undoRef.current.length > 0}
            canRedo={redoRef.current.length > 0}
            onUndo={undo}
            onRedo={redo}
            onInteractionStart={beginInteraction}
            onInteractionEnd={endInteraction}
          />
        )}
      </section>

      <section className="flex flex-col gap-4 lg:flex-1">
        {locked ? (
          <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] font-bold text-amber-800">
            <Lock className="h-4 w-4 shrink-0" aria-hidden />
            제작 요청이 접수된 디자인이라 수정할 수 없습니다.
          </div>
        ) : null}

        <Panel label="디자인 이름">
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setDirty(true);
            }}
            maxLength={40}
            disabled={locked}
            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-400/30"
          />
        </Panel>

        {hasFaceArt ? (
          <Panel label="선택한 템플릿 아트">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={spec.faceArtSrc!}
                alt="템플릿 전면"
                className={`${formFactor.id === "stand_plate" ? "aspect-[4/5]" : "aspect-[86/54]"} w-full object-cover`}
              />
            </div>
            <p className="mt-2 text-[11px] font-semibold leading-relaxed text-slate-500 break-keep [word-break:keep-all]">
              전면 디자인은 템플릿 이미지를 사용합니다. 아래 문구를 실제 이름·직함으로 바꾸면 미리보기에 바로 반영됩니다.
            </p>
          </Panel>
        ) : null}

        <Panel label="태그 문구" hint={`줄당 최대 ${MAX_TEXT_LINE_LENGTH}자`}>
          <div className="space-y-2">
            {spec.lines.map((line, i) => {
              const extra = i >= formFactor.maxTextLines;
              return (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={line}
                    onChange={(e) => {
                      const lines = [...spec.lines];
                      lines[i] = e.target.value.slice(0, MAX_TEXT_LINE_LENGTH);
                      update({ lines });
                    }}
                    placeholder={
                      extra
                        ? `추가 문구 ${i - formFactor.maxTextLines + 1}`
                        : hasFaceArt
                          ? i === 0
                            ? "이름 (NAME 자리)"
                            : "직함·한 줄 소개 (SHORT TEXT)"
                          : i === 0
                            ? "이름 또는 문구"
                            : `${i + 1}번째 줄 (선택)`
                    }
                    disabled={locked}
                    className="h-11 min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 outline-none placeholder:text-slate-300 focus:border-teal-300 focus:ring-2 focus:ring-teal-400/30"
                  />
                  {extra && !locked ? (
                    <button
                      type="button"
                      onClick={() => removeLine(i)}
                      aria-label={`추가 문구 ${i - formFactor.maxTextLines + 1} 삭제`}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
          {!locked && spec.lines.length < MAX_TEXT_LINES_TOTAL ? (
            <button
              type="button"
              onClick={addLine}
              className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-full border border-dashed border-teal-300 bg-teal-50/40 px-3.5 text-[12px] font-black text-teal-700 transition hover:bg-teal-50"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              문구 줄 추가
              <span className="text-[10px] font-bold text-teal-600/70">
                {spec.lines.length}/{MAX_TEXT_LINES_TOTAL}
              </span>
            </button>
          ) : null}
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(["raised", "engraved"] as const).map((style) => (
              <ChoiceButton key={style} active={spec.textStyle === style} disabled={locked} onClick={() => update({ textStyle: style })}>
                {style === "raised" ? "양각 (튀어나옴)" : "음각 (파임)"}
              </ChoiceButton>
            ))}
          </div>
        </Panel>

        <Panel label="이미지·로고" hint="PNG/JPG · 2MB 이하">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            disabled={locked || uploading}
            onChange={(e) => void onPickImage(e.target.files?.[0] ?? null)}
          />
          {spec.image?.src ? (
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={spec.image.src} alt="업로드한 로고" className="h-14 w-14 rounded-xl object-contain bg-white ring-1 ring-slate-200" />
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-black text-slate-800">이미지가 적용되었습니다</p>
                <p className="mt-0.5 text-[10px] font-semibold text-slate-400">크기·투명도를 조절한 뒤 저장하세요.</p>
              </div>
              <button
                type="button"
                disabled={locked}
                onClick={() => updateImage({ src: null })}
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                aria-label="이미지 제거"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={locked || uploading}
              onClick={() => fileRef.current?.click()}
              className="flex h-24 w-full flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-teal-200 bg-teal-50/40 text-teal-700 transition hover:bg-teal-50 disabled:opacity-60"
            >
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <ImagePlus className="h-5 w-5" aria-hidden />}
              <span className="text-[12px] font-black">{uploading ? "올리는 중…" : "이미지 추가"}</span>
            </button>
          )}
          {spec.image?.src ? (
            <div className="mt-3 space-y-3">
              <label className="block">
                <span className="text-[10px] font-black text-slate-500">크기</span>
                <input
                  type="range"
                  min={25}
                  max={100}
                  value={Math.round((spec.image.scale ?? 0.55) * 100)}
                  disabled={locked}
                  onChange={(e) => updateImage({ scale: Number(e.target.value) / 100 })}
                  className="mt-1 w-full accent-teal-600"
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-black text-slate-500">투명도</span>
                <input
                  type="range"
                  min={15}
                  max={100}
                  value={Math.round((spec.image.opacity ?? 0.95) * 100)}
                  disabled={locked}
                  onChange={(e) => updateImage({ opacity: Number(e.target.value) / 100 })}
                  className="mt-1 w-full accent-teal-600"
                />
              </label>
              <button
                type="button"
                disabled={locked || uploading}
                onClick={() => fileRef.current?.click()}
                className="text-[11px] font-black text-teal-700 hover:underline"
              >
                다른 이미지로 바꾸기
              </button>
            </div>
          ) : null}
        </Panel>

        <Panel label="본체 색상">
          <Swatches colors={TAG_BODY_COLORS} value={spec.bodyColor} disabled={locked} onChange={(hex) => update({ bodyColor: hex })} />
        </Panel>

        <Panel label="문구 색상" hint={getCardFaceLayout(spec.faceArtSrc) ? "디자인 기본 = 템플릿 원래 색" : undefined}>
          <div className="flex flex-wrap items-center gap-2.5">
            {getCardFaceLayout(spec.faceArtSrc) ? (
              <button
                type="button"
                onClick={() => update({ textColor: TEXT_COLOR_DESIGN })}
                disabled={locked}
                aria-pressed={spec.textColor === TEXT_COLOR_DESIGN}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[12px] font-black transition disabled:opacity-60",
                  spec.textColor === TEXT_COLOR_DESIGN
                    ? "border-teal-300 bg-gradient-to-r from-teal-50 to-cyan-50 text-teal-800 ring-2 ring-teal-500 ring-offset-2"
                    : "border-slate-200 bg-white text-slate-600 hover:border-teal-200"
                )}
              >
                <span className="h-4 w-4 rounded-full bg-[conic-gradient(#0F172A_0_50%,#FFFFFF_50%_100%)] ring-1 ring-slate-300" aria-hidden />
                디자인 기본
              </button>
            ) : null}
            <Swatches colors={TAG_TEXT_COLORS} value={spec.textColor} disabled={locked} onChange={(hex) => update({ textColor: hex })} />
          </div>
        </Panel>

        <Panel label="재질">
          <div className="grid grid-cols-2 gap-2">
            {TAG_MATERIALS.map((m) => (
              <ChoiceButton key={m.id} active={spec.materialId === m.id} disabled={locked} onClick={() => update({ materialId: m.id })}>
                {m.name}
                <span className="ml-1 text-[10px] font-bold text-slate-400">{m.process}</span>
              </ChoiceButton>
            ))}
          </div>
        </Panel>

        <ProductionPanel
          formFactor={formFactor}
          spec={spec}
          title={title}
          locked={locked}
          onIssuesChange={setProductionErrors}
          onFocusTarget={(t) => {
            setView("design");
            setSelected(t as StudioEditTarget);
            if (t === "chip") setShowChip(true);
          }}
        />

        <section className="rounded-[26px] border border-teal-100/90 bg-gradient-to-br from-teal-50/95 to-white p-[18px]">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-teal-600 shadow-sm">
              <Calculator className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-teal-600">다음 단계 · 견적·제작</p>
              <p className="mt-1 text-[13px] font-black text-slate-900">
                {formFactor.basePriceKrw.toLocaleString("ko-KR")}원부터 <span className="text-[11px] font-bold text-slate-400">(1개, NFC 칩 포함 예상가)</span>
              </p>
              <p className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-500 break-keep [word-break:keep-all]">
                디자인을 완료하면 WOW3D 자동견적으로 정확한 가격을 받고 제작을 요청할 수 있습니다. 견적·제작 요청 화면은 곧 열립니다.
              </p>
            </div>
          </div>
        </section>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/90 bg-white/95 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-screen-sm flex-col gap-2 px-4 min-[430px]:px-5 lg:max-w-5xl">
          {message ? (
            <p role="status" className={cn("text-center text-[12px] font-bold", message.kind === "ok" ? "text-teal-700" : "text-rose-600")}>
              {message.text}
            </p>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => save(false)}
              disabled={locked || isPending || !dirty}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
              {dirty ? "임시 저장" : "저장됨"}
            </button>
            <button
              type="button"
              onClick={() => save(true)}
              disabled={locked || isPending || (status === "ready" && !dirty)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-teal-600 px-4 text-sm font-black text-white shadow-sm transition hover:bg-teal-700 active:scale-[0.98] disabled:opacity-50"
            >
              <Check className="h-4 w-4" aria-hidden />
              {status === "ready" && !dirty ? "디자인 완료됨" : "디자인 완료"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function Panel({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[26px] border border-slate-200/80 bg-white/90 p-4 shadow-sm">
      <div className="mb-2.5 flex items-center justify-between">
        <p className="text-[11px] font-black tracking-wider text-teal-600">{label}</p>
        {hint ? <p className="text-[10px] font-bold text-slate-400">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

function ChoiceButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-2xl border px-3 text-[12px] font-black transition disabled:opacity-60",
        active ? "border-teal-300 bg-gradient-to-r from-teal-50 to-cyan-50 text-teal-800" : "border-slate-200 bg-white text-slate-600 hover:border-teal-200"
      )}
    >
      {children}
    </button>
  );
}

function Swatches({
  colors,
  value,
  disabled,
  onChange,
}: {
  colors: readonly { hex: string; name: string }[];
  value: string;
  disabled?: boolean;
  onChange: (hex: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {colors.map((c) => {
        const active = c.hex.toLowerCase() === value.toLowerCase();
        return (
          <button
            key={c.hex}
            type="button"
            onClick={() => onChange(c.hex)}
            disabled={disabled}
            aria-label={c.name}
            aria-pressed={active}
            title={c.name}
            className={cn("h-9 w-9 rounded-full ring-1 ring-slate-200 transition disabled:opacity-60", active && "ring-2 ring-teal-500 ring-offset-2")}
            style={{ backgroundColor: c.hex }}
          />
        );
      })}
    </div>
  );
}
