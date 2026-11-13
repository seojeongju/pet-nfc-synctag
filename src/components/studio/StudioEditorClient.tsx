"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowLeft, Calculator, Check, CircleDot, Loader2, Lock, Save } from "lucide-react";
import { saveTagDesign } from "@/app/actions/studio";
import type { FormFactor } from "@/lib/platform/form-factors";
import {
  MAX_TEXT_LINE_LENGTH,
  TAG_BODY_COLORS,
  TAG_MATERIALS,
  TAG_TEXT_COLORS,
  type TagDesignRecord,
  type TagDesignSpec,
  type TagDesignStatus,
} from "@/lib/platform/tag-design";
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
  const [spec, setSpec] = useState<TagDesignSpec>(design.spec);
  const [title, setTitle] = useState(design.title);
  const [status, setStatus] = useState<TagDesignStatus>(design.status);
  const [showChip, setShowChip] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const locked = status === "requested" || status === "locked";

  const update = (patch: Partial<TagDesignSpec>) => {
    if (locked) return;
    setSpec((prev) => ({ ...prev, ...patch }));
    setDirty(true);
    setMessage(null);
  };

  const save = (markReady: boolean) => {
    startTransition(async () => {
      const res = await saveTagDesign({ designId: design.id, title, spec, markReady });
      if (res.ok) {
        setSpec(res.spec);
        setStatus(res.status);
        setDirty(false);
        setMessage({ kind: "ok", text: markReady ? "디자인을 완료했습니다. 견적·제작 단계로 이어갈 수 있어요." : "저장했습니다." });
      } else {
        setMessage({ kind: "error", text: res.error });
      }
    });
  };

  return (
    <main className="mx-auto flex w-full max-w-screen-sm flex-col gap-4 px-4 pb-28 pt-5 min-[430px]:px-5 lg:max-w-5xl lg:flex-row lg:items-start lg:gap-6">
      {/* 미리보기 */}
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
        <div className="relative aspect-square w-full overflow-hidden rounded-[32px] border border-slate-200/80 bg-slate-50 shadow-[0_24px_60px_rgba(15,23,42,0.10)]">
          <TagPreview3D formFactor={formFactor} spec={spec} showChip={showChip} />
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
        <p className="mt-2 text-center text-[11px] font-semibold text-slate-400">드래그해서 돌려 보고, 두 손가락으로 확대할 수 있어요.</p>
      </section>

      {/* 편집 */}
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

        <Panel label="태그 문구" hint={`줄당 최대 ${MAX_TEXT_LINE_LENGTH}자`}>
          <div className="space-y-2">
            {spec.lines.map((line, i) => (
              <input
                key={i}
                value={line}
                onChange={(e) => {
                  const lines = [...spec.lines];
                  lines[i] = e.target.value.slice(0, MAX_TEXT_LINE_LENGTH);
                  update({ lines });
                }}
                placeholder={i === 0 ? "이름 또는 문구" : `${i + 1}번째 줄 (선택)`}
                disabled={locked}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 outline-none placeholder:text-slate-300 focus:border-teal-300 focus:ring-2 focus:ring-teal-400/30"
              />
            ))}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(["raised", "engraved"] as const).map((style) => (
              <ChoiceButton key={style} active={spec.textStyle === style} disabled={locked} onClick={() => update({ textStyle: style })}>
                {style === "raised" ? "양각 (튀어나옴)" : "음각 (파임)"}
              </ChoiceButton>
            ))}
          </div>
        </Panel>

        <Panel label="본체 색상">
          <Swatches colors={TAG_BODY_COLORS} value={spec.bodyColor} disabled={locked} onChange={(hex) => update({ bodyColor: hex })} />
        </Panel>

        <Panel label="문구 색상">
          <Swatches colors={TAG_TEXT_COLORS} value={spec.textColor} disabled={locked} onChange={(hex) => update({ textColor: hex })} />
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

      {/* 하단 고정 저장 바 */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/90 bg-white/95 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-screen-sm flex-col gap-2 px-4 min-[430px]:px-5 lg:max-w-5xl">
          {message ? (
            <p
              role="status"
              className={cn("text-center text-[12px] font-bold", message.kind === "ok" ? "text-teal-700" : "text-rose-600")}
            >
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
            className={cn(
              "h-9 w-9 rounded-full ring-1 ring-slate-200 transition disabled:opacity-60",
              active && "ring-2 ring-teal-500 ring-offset-2"
            )}
            style={{ backgroundColor: c.hex }}
          />
        );
      })}
    </div>
  );
}
