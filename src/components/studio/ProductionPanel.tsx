"use client";

/**
 * 제작 안전 검사 + 3D 파일 내보내기 패널. 검사는 편집 중 실시간으로 돌고, 오류가 있으면 "디자인 완료"를 막는다.
 * 내보내기 모듈(three.js)은 버튼을 눌렀을 때만 불러온다.
 */
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, CloudUpload, Download, FolderDown, Info, Loader2, ShieldCheck } from "lucide-react";
import { saveStudioPrintModels } from "@/app/actions/studio";
import type { FormFactor } from "@/lib/platform/form-factors";
import { runProductionChecks, type ProductionIssue } from "@/lib/platform/production-check";
import { faceGeometryFor } from "@/lib/platform/tag-geometry";
import type { SavedPrintModels, TagDesignSpec } from "@/lib/platform/tag-design";
import { paintFace, useFaceImages, useStudioFonts } from "@/components/studio/tag-face-paint";
import { cn } from "@/lib/utils";

type Props = {
  designId: string;
  formFactor: FormFactor;
  spec: TagDesignSpec;
  title: string;
  locked: boolean;
  savedPrintModels?: SavedPrintModels | null;
  onPrintModelsSaved?: (models: SavedPrintModels) => void;
  onIssuesChange?: (errorCount: number) => void;
  /** 검사 항목을 누르면 해당 요소 선택 */
  onFocusTarget?: (target: string) => void;
};

const LEVEL_UI = {
  error: { icon: AlertTriangle, cls: "border-rose-200 bg-rose-50 text-rose-800", label: "수정 필요" },
  warn: { icon: AlertTriangle, cls: "border-amber-200 bg-amber-50 text-amber-800", label: "확인 권장" },
  info: { icon: Info, cls: "border-slate-200 bg-slate-50 text-slate-600", label: "안내" },
} as const;

export function ProductionPanel({
  designId,
  formFactor,
  spec,
  title,
  locked,
  savedPrintModels,
  onPrintModelsSaved,
  onIssuesChange,
  onFocusTarget,
}: Props) {
  const { faceEl, fgEl, logoEl } = useFaceImages(spec);
  const fontsVersion = useStudioFonts(spec);
  const [exporting, setExporting] = useState<"stl" | "3mf" | "both" | "save-stl" | "save-3mf" | "cloud" | null>(null);
  const [exportMsg, setExportMsg] = useState<string | null>(null);

  const issues = useMemo<ProductionIssue[]>(() => {
    const { textArea } = faceGeometryFor(formFactor);
    const face = paintFace(spec, textArea, faceEl, logoEl, { fgEl });
    const info = face
      ? { pxPerMm: face.canvas.width / textArea.w, width: face.canvas.width, height: face.canvas.height, boxes: face.boxes }
      : null;
    return runProductionChecks(formFactor, spec, info);
    // fontsVersion: 글꼴이 도착하면 글자 폭이 바뀌므로 다시 검사
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formFactor, spec, faceEl, fgEl, logoEl, fontsVersion]);

  const errorCount = issues.filter((i) => i.level === "error").length;
  useEffect(() => onIssuesChange?.(errorCount), [errorCount, onIssuesChange]);

  const doExport = async (kind: "stl" | "3mf", useSavePicker = false) => {
    setExporting(useSavePicker ? (kind === "stl" ? "save-stl" : "save-3mf") : kind);
    setExportMsg(null);
    try {
      const mod = await import("@/components/studio/tag-export");
      const imgs = { faceEl, fgEl, logoEl };
      const objects = mod.buildExportObjects(formFactor, spec, imgs);
      try {
        const blob =
          kind === "stl"
            ? mod.exportStl(objects, { formFactor, spec, imgs })
            : mod.export3mf(objects, { title, formFactor, spec });
        const filename = mod.exportFilename(title, kind);
        if (useSavePicker) {
          const saved = await mod.saveBlobAsFile(filename, blob, kind);
          if (saved) {
            setExportMsg(`${kind.toUpperCase()} 파일을 저장했습니다 (${(blob.size / 1024).toFixed(0)}KB).`);
          }
        } else {
          mod.downloadBlob(filename, blob);
          setExportMsg(`${kind.toUpperCase()} 파일을 내려받았습니다 (${(blob.size / 1024).toFixed(0)}KB).`);
        }
      } finally {
        mod.disposeExportObjects(objects);
      }
    } catch (e) {
      setExportMsg(e instanceof Error ? `내보내기 실패: ${e.message}` : "내보내기에 실패했습니다.");
    } finally {
      setExporting(null);
    }
  };

  const doExportBoth = async () => {
    setExporting("both");
    setExportMsg(null);
    try {
      const mod = await import("@/components/studio/tag-export");
      const imgs = { faceEl, fgEl, logoEl };
      const objects = mod.buildExportObjects(formFactor, spec, imgs);
      try {
        const stlBlob = mod.exportStl(objects, { formFactor, spec, imgs });
        const threemfBlob = mod.export3mf(objects, { title, formFactor, spec });
        mod.downloadBlob(mod.exportFilename(title, "stl"), stlBlob);
        setTimeout(() => {
          mod.downloadBlob(mod.exportFilename(title, "3mf"), threemfBlob);
        }, 250);
        setExportMsg(
          `STL (${(stlBlob.size / 1024).toFixed(0)}KB) · 3MF (${(threemfBlob.size / 1024).toFixed(0)}KB) 파일을 모두 내려받았습니다.`
        );
      } finally {
        mod.disposeExportObjects(objects);
      }
    } catch (e) {
      setExportMsg(e instanceof Error ? `내보내기 실패: ${e.message}` : "내보내기에 실패했습니다.");
    } finally {
      setExporting(null);
    }
  };

  const doSaveToServer = async () => {
    setExporting("cloud");
    setExportMsg(null);
    try {
      const mod = await import("@/components/studio/tag-export");
      const imgs = { faceEl, fgEl, logoEl };
      const objects = mod.buildExportObjects(formFactor, spec, imgs);
      let stlBlob: Blob;
      let threemfBlob: Blob;
      try {
        stlBlob = mod.exportStl(objects, { formFactor, spec, imgs });
        threemfBlob = mod.export3mf(objects, { title, formFactor, spec });
      } finally {
        mod.disposeExportObjects(objects);
      }

      const fd = new FormData();
      fd.append("designId", designId);
      fd.append("stlFile", new File([stlBlob], mod.exportFilename(title, "stl"), { type: "model/stl" }));
      fd.append("threemfFile", new File([threemfBlob], mod.exportFilename(title, "3mf"), { type: "model/3mf" }));
      const res = await saveStudioPrintModels(fd);
      if (!res.ok) {
        setExportMsg(`저장 실패: ${res.error}`);
        return;
      }
      onPrintModelsSaved?.(res.printModels);
      setExportMsg("STL · 3MF 3D 파일을 서버에 저장했습니다. 언제든 다시 내려받을 수 있습니다.");
    } catch (e) {
      setExportMsg(e instanceof Error ? `저장 실패: ${e.message}` : "3D 파일 저장에 실패했습니다.");
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

      <div className="mt-3 rounded-2xl bg-slate-50 p-3.5 ring-1 ring-slate-100">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-black text-slate-700">3D 파일 내려받기 · 저장</p>
          <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-extrabold text-teal-700">
            {spec.textStyle === "engraved" ? "음각 반영" : "양각 반영"}
          </span>
        </div>
        <p className="mt-1 text-[11px] font-semibold leading-snug text-slate-500 break-keep [word-break:keep-all]">
          STL은 양각·음각 형상이 합쳐진 단일 3D 모델 파일, 3MF는 본체·문구(디자인)·NFC 칩 포켓을 분리한 슬라이서용 파일입니다.
        </p>

        {/* 즉시 내려받기 */}
        <div className="mt-2.5 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {(["stl", "3mf"] as const).map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => void doExport(kind, false)}
              disabled={exporting !== null || errorCount > 0}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-[12px] font-black text-slate-700 transition hover:border-teal-300 hover:text-teal-700 disabled:opacity-50"
            >
              {exporting === kind ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Download className="h-3.5 w-3.5" aria-hidden />}
              {kind.toUpperCase()} 내려받기
            </button>
          ))}
          <button
            type="button"
            onClick={() => void doExportBoth()}
            disabled={exporting !== null || errorCount > 0}
            className="col-span-2 inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-teal-600 px-3 text-[12px] font-black text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-50 sm:col-span-1"
          >
            {exporting === "both" ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Download className="h-3.5 w-3.5" aria-hidden />}
            STL + 3MF 일괄 받기
          </button>
        </div>

        {/* 폴더 지정 저장 & 서버 보관 */}
        <div className="mt-2 flex flex-wrap gap-1.5 border-t border-slate-200/80 pt-2.5">
          {(["stl", "3mf"] as const).map((kind) => {
            const busy = exporting === (kind === "stl" ? "save-stl" : "save-3mf");
            return (
              <button
                key={`save-${kind}`}
                type="button"
                onClick={() => void doExport(kind, true)}
                disabled={exporting !== null || errorCount > 0}
                className="inline-flex h-8 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 text-[11px] font-extrabold text-slate-600 transition hover:border-teal-200 hover:text-teal-700 disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> : <FolderDown className="h-3 w-3" aria-hidden />}
                {kind.toUpperCase()} 폴더 지정 저장
              </button>
            );
          })}
          {!locked ? (
            <button
              type="button"
              onClick={() => void doSaveToServer()}
              disabled={exporting !== null || errorCount > 0}
              className="inline-flex h-8 items-center gap-1 rounded-full border border-teal-200 bg-teal-50/80 px-3 text-[11px] font-black text-teal-800 transition hover:bg-teal-100 disabled:opacity-50"
            >
              {exporting === "cloud" ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> : <CloudUpload className="h-3 w-3" aria-hidden />}
              서버에 STL·3MF 보관
            </button>
          ) : null}
        </div>

        {savedPrintModels && (savedPrintModels.stlUrl || savedPrintModels.threemfUrl) ? (
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-teal-200/70 bg-white px-3 py-2">
            <span className="text-[11px] font-extrabold text-teal-800">서버 보관된 3D 파일</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {savedPrintModels.stlUrl ? (
                <a
                  href={savedPrintModels.stlUrl}
                  download={`${title.trim() || "linku-tag"}.stl`}
                  className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-black text-teal-700 hover:bg-teal-100"
                >
                  <Download className="h-3 w-3" aria-hidden />
                  보관된 STL
                </a>
              ) : null}
              {savedPrintModels.threemfUrl ? (
                <a
                  href={savedPrintModels.threemfUrl}
                  download={`${title.trim() || "linku-tag"}.3mf`}
                  className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-black text-teal-700 hover:bg-teal-100"
                >
                  <Download className="h-3 w-3" aria-hidden />
                  보관된 3MF
                </a>
              ) : null}
            </div>
          </div>
        ) : null}

        {exportMsg ? <p className="mt-2 text-[11px] font-bold text-teal-700">{exportMsg}</p> : null}
      </div>
    </section>
  );
}
