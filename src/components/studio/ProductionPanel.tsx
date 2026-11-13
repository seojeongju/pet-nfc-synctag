"use client";

/**
 * 제작 안전 검사 + 3D 파일 내보내기 패널. 검사는 편집 중 실시간으로 돌고, 오류가 있으면 "디자인 완료"를 막는다.
 * 내보내기 모듈(three.js)은 버튼을 눌렀을 때만 불러온다.
 */
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, Info, Loader2, ShieldCheck } from "lucide-react";
import type { FormFactor } from "@/lib/platform/form-factors";
import { runProductionChecks, type ProductionIssue } from "@/lib/platform/production-check";
import { faceGeometryFor } from "@/lib/platform/tag-geometry";
import type { TagDesignSpec } from "@/lib/platform/tag-design";
import { paintFace, useFaceImages, useStudioFonts } from "@/components/studio/tag-face-paint";
import { cn } from "@/lib/utils";

type Props = {
  formFactor: FormFactor;
  spec: TagDesignSpec;
  title: string;
  locked: boolean;
  onIssuesChange?: (errorCount: number) => void;
  /** 검사 항목을 누르면 해당 요소 선택 */
  onFocusTarget?: (target: string) => void;
};

const LEVEL_UI = {
  error: { icon: AlertTriangle, cls: "border-rose-200 bg-rose-50 text-rose-800", label: "수정 필요" },
  warn: { icon: AlertTriangle, cls: "border-amber-200 bg-amber-50 text-amber-800", label: "확인 권장" },
  info: { icon: Info, cls: "border-slate-200 bg-slate-50 text-slate-600", label: "안내" },
} as const;

export function ProductionPanel({ formFactor, spec, title, locked, onIssuesChange, onFocusTarget }: Props) {
  const { faceEl, logoEl } = useFaceImages(spec);
  const fontsVersion = useStudioFonts(spec);
  const [exporting, setExporting] = useState<"stl" | "3mf" | null>(null);
  const [exportMsg, setExportMsg] = useState<string | null>(null);

  const issues = useMemo<ProductionIssue[]>(() => {
    const { textArea } = faceGeometryFor(formFactor);
    const face = paintFace(spec, textArea, faceEl, logoEl);
    const info = face
      ? { pxPerMm: face.canvas.width / textArea.w, width: face.canvas.width, height: face.canvas.height, boxes: face.boxes }
      : null;
    return runProductionChecks(formFactor, spec, info);
    // fontsVersion: 글꼴이 도착하면 글자 폭이 바뀌므로 다시 검사
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formFactor, spec, faceEl, logoEl, fontsVersion]);

  const errorCount = issues.filter((i) => i.level === "error").length;
  useEffect(() => onIssuesChange?.(errorCount), [errorCount, onIssuesChange]);

  const doExport = async (kind: "stl" | "3mf") => {
    setExporting(kind);
    setExportMsg(null);
    try {
      const mod = await import("@/components/studio/tag-export");
      const objects = mod.buildExportObjects(formFactor, spec);
      try {
        const blob = kind === "stl" ? mod.exportStl(objects) : mod.export3mf(objects, { title, formFactor, spec });
        mod.downloadBlob(mod.exportFilename(title, kind), blob);
        setExportMsg(`${kind.toUpperCase()} 파일을 내려받았습니다 (${(blob.size / 1024).toFixed(0)}KB).`);
      } finally {
        mod.disposeExportObjects(objects);
      }
    } catch (e) {
      setExportMsg(e instanceof Error ? `내보내기 실패: ${e.message}` : "내보내기에 실패했습니다.");
    } finally {
      setExporting(null);
    }
  };

  return (
    <section className="rounded-[26px] border border-slate-200/80 bg-white/90 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-black tracking-wider text-teal-600">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          제작 검사
        </p>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[10px] font-black",
            errorCount > 0 ? "bg-rose-50 text-rose-700" : "bg-teal-50 text-teal-700"
          )}
        >
          {errorCount > 0 ? `수정 필요 ${errorCount}` : "제작 가능"}
        </span>
      </div>

      {issues.length === 0 ? (
        <p className="mt-2.5 inline-flex items-center gap-1.5 text-[12px] font-bold text-teal-700">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          문제가 없습니다. 칩 여유·글자 크기 모두 기준을 충족합니다.
        </p>
      ) : (
        <ul className="mt-2.5 space-y-1.5">
          {issues.map((it, i) => {
            const ui = LEVEL_UI[it.level];
            const Icon = ui.icon;
            const clickable = Boolean(it.target && onFocusTarget && !locked);
            return (
              <li key={`${it.code}-${it.target ?? ""}-${i}`}>
                <button
                  type="button"
                  disabled={!clickable}
                  onClick={() => it.target && onFocusTarget?.(it.target)}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-2xl border px-3 py-2 text-left text-[12px] font-semibold leading-snug break-keep [word-break:keep-all]",
                    ui.cls,
                    clickable && "transition hover:brightness-95"
                  )}
                >
                  <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span>
                    <span className="mr-1 text-[10px] font-black uppercase tracking-wider opacity-70">{ui.label}</span>
                    {it.message}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
        <p className="text-[11px] font-black text-slate-600">3D 파일 내보내기</p>
        <p className="mt-0.5 text-[11px] font-semibold leading-snug text-slate-500 break-keep [word-break:keep-all]">
          STL은 본체와 양각 문구를 합친 파일, 3MF는 본체·문구·NFC 칩 포켓을 분리한 제작용 파일입니다.
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {(["stl", "3mf"] as const).map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => void doExport(kind)}
              disabled={exporting !== null || errorCount > 0}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 text-[12px] font-black text-slate-700 transition hover:border-teal-200 hover:text-teal-700 disabled:opacity-50"
            >
              {exporting === kind ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Download className="h-3.5 w-3.5" aria-hidden />}
              {kind.toUpperCase()} 내려받기
            </button>
          ))}
        </div>
        {exportMsg ? <p className="mt-2 text-[11px] font-bold text-slate-500">{exportMsg}</p> : null}
      </div>
    </section>
  );
}
