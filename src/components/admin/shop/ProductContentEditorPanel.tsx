"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { adminUi } from "@/styles/admin/ui";
import { cn } from "@/lib/utils";
import {
  FileText,
  Image as ImageIcon,
  Eye,
  Sparkles,
  LayoutTemplate,
  Code2,
  Info,
  CheckCircle2,
} from "lucide-react";
import "react-quill/dist/quill.snow.css";

const STORAGE_KEY = "admin-shop-product-content-mode";

const ReactQuill = dynamic(
  () => import("react-quill").then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-1 items-center justify-center bg-slate-50 p-8 text-sm font-bold text-slate-500">
        편집기를 불러오는 중…
      </div>
    ),
  }
);

type EditMode = "visual" | "html";

const quillModules = {
  toolbar: {
    container: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ indent: "-1" }, { indent: "+1" }],
      ["link"],
      ["blockquote", "code-block"],
      ["clean"],
    ],
  },
  clipboard: { matchVisual: false },
};

const quillFormats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "indent",
  "link",
  "blockquote",
  "code-block",
];

function loadStoredMode(): EditMode {
  if (typeof window === "undefined") return "visual";
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "html" || v === "visual" ? v : "visual";
}

function isLikelyComplexTailwind(html: string) {
  if (!html || html.trim().length < 20) return false;
  if (!/class=/i.test(html)) return false;
  return /\b(?:sm:|md:|lg:|xl:|grid|flex|gap-|space-|container|@apply)/.test(html);
}

export function ProductContentEditorPanel({
  contentHtml,
  onContentChange,
  showPreview,
  onTogglePreview,
  onApplyTemplate,
  footerLeft,
}: {
  contentHtml: string;
  onContentChange: (next: string) => void;
  showPreview: boolean;
  onTogglePreview: () => void;
  onApplyTemplate: () => void;
  /** 예: 이전 탭으로 이동 */
  footerLeft?: ReactNode;
}) {
  const [editMode, setEditMode] = useState<EditMode>("visual");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setEditMode(loadStoredMode());
    setMounted(true);
  }, []);

  const persistMode = useCallback((m: EditMode) => {
    setEditMode(m);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, m);
    }
  }, []);

  const trySetMode = (next: EditMode) => {
    if (next === editMode) return;
    if (next === "visual" && editMode === "html" && isLikelyComplexTailwind(contentHtml)) {
      const ok = window.confirm(
        "이 HTML은 Tailwind·복잡한 레이아웃이 포함돼 있을 수 있습니다. 일반 편집 모드로 바꾸면 일부 서식이 단순화되거나 누락될 수 있어요. 계속할까요?"
      );
      if (!ok) return;
    }
    persistMode(next);
  };

  return (
    <div
      className={cn(
        adminUi.sectionCard,
        "p-0 overflow-hidden border-none animate-in fade-in slide-in-from-bottom-2"
      )}
    >
      <div className="flex flex-col gap-3 border-b border-slate-100 bg-white p-4 sm:p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3 sm:items-center">
          <div className="shrink-0 rounded-xl bg-slate-100 p-2 text-slate-600">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-black text-slate-900">상세 페이지 디자인</h2>
            <p className="text-[11px] font-bold text-slate-400">
              <span className="text-slate-500">일반</span>은 풍부한 문단·목록·링크 편집,{" "}
              <span className="text-slate-500">HTML</span>은 Tailwind 등 자유로운 마크업에 맞춰 주세요.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div
            className="inline-flex rounded-2xl border border-slate-200 bg-slate-50/80 p-1 shadow-inner"
            role="group"
            aria-label="편집 모드"
          >
            <button
              type="button"
              onClick={() => trySetMode("visual")}
              aria-pressed={editMode === "visual"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-black transition",
                editMode === "visual"
                  ? "bg-white text-teal-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              <LayoutTemplate className="h-3.5 w-3.5 shrink-0" />
              일반 편집
            </button>
            <button
              type="button"
              onClick={() => trySetMode("html")}
              aria-pressed={editMode === "html"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-black transition",
                editMode === "html"
                  ? "bg-white text-teal-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              <Code2 className="h-3.5 w-3.5 shrink-0" />
              HTML
            </button>
          </div>
          <button
            type="button"
            onClick={onTogglePreview}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-black transition",
              showPreview
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            )}
          >
            <Eye className="h-4 w-4" />
            {showPreview ? "미리보기 끄기" : "미리보기 켜기"}
          </button>
          <button
            type="button"
            onClick={() => {
              onApplyTemplate();
              persistMode("html");
            }}
            className="flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-[11px] font-black text-teal-800 transition hover:bg-teal-100"
            title="Tailwind가 포함된 HTML이 로드됩니다. 편집은 HTML 모드로 전환돼요."
          >
            <Sparkles className="h-4 w-4" />
            스마트 템플릿
          </button>
        </div>
      </div>

      {editMode === "visual" && (
        <div className="flex items-start gap-2 border-b border-amber-100 bg-amber-50/60 px-4 py-2.5 text-[11px] font-bold text-amber-900 sm:px-6">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            굵게·제목·목록·인용·링크 등을 빠르게 쓰려면 <strong>일반 편집</strong>을 사용하세요. 반응형
            그리드·고급 Tailwind 컴포넌트는 <strong>HTML</strong> 모드에서 직접 편집하는 것이 안전합니다.
          </p>
        </div>
      )}

      <div
        className={cn(
          "grid h-[min(72vh,760px)] min-h-[480px]",
          showPreview ? "md:grid-cols-2" : "grid-cols-1"
        )}
      >
        <div
          className={cn(
            "relative flex h-full min-h-0 flex-col border-slate-800/10",
            editMode === "html" ? "bg-slate-900" : "bg-white"
          )}
        >
          {editMode === "html" ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-800/50 bg-slate-800/50 px-4 py-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  HTML
                </span>
                <span className="text-[10px] font-bold text-slate-500">Tailwind / 자유 마크업</span>
              </div>
              <textarea
                value={contentHtml}
                onChange={(e) => onContentChange(e.target.value)}
                className="h-full min-h-0 w-full flex-1 resize-none bg-transparent p-5 text-[12px] font-mono leading-relaxed text-emerald-300 outline-none selection:bg-teal-500/30 sm:p-6"
                spellCheck={false}
                placeholder="상세 페이지 HTML을 직접 입력하세요…"
                autoComplete="off"
                data-gramm="false"
              />
            </>
          ) : (
            <div
              className={cn(
                "shop-product-rte flex h-full min-h-0 flex-1 flex-col border-r border-slate-100",
                !mounted && "min-h-[480px] animate-pulse bg-slate-50"
              )}
            >
              {mounted && (
                <div className="min-h-0 flex-1 overflow-y-auto p-1 sm:p-2">
                  <ReactQuill
                    theme="snow"
                    value={contentHtml}
                    onChange={onContentChange}
                    modules={quillModules}
                    formats={quillFormats}
                    className="[&_.ql-container]:!border-slate-200 [&_.ql-container]:!rounded-2xl [&_.ql-container]:!bg-slate-50/50 [&_.ql-editor]:!min-h-[min(58vh,560px)] [&_.ql-editor]:!text-sm [&_.ql-editor]:!leading-relaxed [&_.ql-editor]:!text-slate-800 [&_.ql-editor]:!px-4 [&_.ql-editor]:!py-3 [&_.ql-toolbar]:!rounded-t-2xl [&_.ql-toolbar]:!border-slate-200 [&_.ql-toolbar]:!bg-slate-100/80 [&_.ql-toolbar_.ql-stroke]:!text-slate-600"
                    placeholder="제목·문단·목록·강조를 쉽게 입력하세요…"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {showPreview && (
          <div className="flex h-full min-h-0 flex-col bg-[#F8FAFC]">
            <div className="flex items-center justify-between border-b border-slate-100 bg-white/50 px-4 py-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Live Preview
              </span>
              <div className="flex gap-1" aria-hidden>
                <div className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 scrollbar-hide sm:p-6">
              <div className="mx-auto min-h-full w-full max-w-[430px] overflow-hidden rounded-[40px] border border-slate-100 bg-white shadow-2xl">
                {contentHtml ? (
                  <div className="prose-sm shop-detail-preview text-slate-800" style={{ maxWidth: "100%" }}>
                    <div
                      className="break-words p-0 [&_img]:max-w-full"
                      dangerouslySetInnerHTML={{ __html: contentHtml }}
                    />
                  </div>
                ) : (
                  <div className="flex h-full min-h-[280px] flex-col items-center justify-center space-y-4 p-12 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-50">
                      <ImageIcon className="h-8 w-8 text-slate-200" />
                    </div>
                    <p className="text-xs font-bold text-slate-300">
                      콘텐츠가 없습니다.
                      <br />
                      템플릿을 로드하거나 편집을 시작해 보세요.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="min-w-0">{footerLeft}</div>
        <p className="flex items-center justify-end gap-1.5 text-[10px] font-bold text-slate-400 sm:max-w-[60%] sm:justify-end">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-teal-500" />
          실시간으로 서버에 저장되지 않습니다. 하단 <strong>저장</strong>을 눌러 반영하세요.
        </p>
      </div>
    </div>
  );
}
