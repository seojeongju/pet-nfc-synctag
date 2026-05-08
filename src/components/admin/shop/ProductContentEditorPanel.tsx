"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  Image as ImageIcon,
  Video,
  PlusCircle,
  Quote,
  Minus,
  Link2,
  Code2,
  Eye,
  EyeOff,
  Sparkles,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Eraser,
  Monitor,
  Smartphone,
  Maximize2,
} from "lucide-react";

const STORAGE_KEY = "admin-shop-product-content-mode";

type EditMode = "visual" | "html";

function loadStoredMode(): EditMode {
  if (typeof window === "undefined") return "visual";
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "html" || v === "visual" ? v : "visual";
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
  footerLeft?: ReactNode;
}) {
  const [editMode, setEditMode] = useState<EditMode>("visual");
  const [isUploading, setIsUploading] = useState(false);
  const visualRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const visualFocusRef = useRef(false);

  useEffect(() => {
    setEditMode(loadStoredMode());
  }, []);

  useEffect(() => {
    if (editMode !== "visual") return;
    const el = visualRef.current;
    if (!el) return;
    if (visualFocusRef.current) return;
    if (el.innerHTML !== contentHtml) {
      el.innerHTML = contentHtml || "<p><br></p>";
    }
  }, [contentHtml, editMode]);

  const persistMode = useCallback((m: EditMode) => {
    setEditMode(m);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, m);
    }
  }, []);

  const runCmd = (cmd: string, value?: string) => {
    if (typeof document === "undefined") return;
    visualRef.current?.focus();
    document.execCommand(cmd, false, value);
    const next = visualRef.current?.innerHTML ?? "";
    onContentChange(next);
  };

  const handleInlineImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch("/api/admin/shop/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error((errorData as any).error || "업로드에 실패했습니다.");
      }

      const { url } = await res.json();
      
      runCmd("insertImage", url);
      // 포커스 유지 및 추가 정리
      if (visualRef.current) {
        const next = visualRef.current.innerHTML;
        onContentChange(next);
      }
    } catch (err) {
      console.error("Inline image upload failed:", err);
      alert(err instanceof Error ? err.message : "이미지 삽입에 실패했습니다.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 1단: 컴포넌트 삽입 툴바 (Naver Style Top) */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group flex flex-col items-center gap-1 rounded-xl px-2.5 py-1.5 transition hover:bg-white hover:shadow-sm"
          >
            <div className="rounded-lg bg-white p-1.5 text-slate-600 shadow-sm transition group-hover:text-teal-600">
              <ImageIcon className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-black text-slate-500">사진</span>
          </button>
          <button
            type="button"
            className="group flex flex-col items-center gap-1 rounded-xl px-2.5 py-1.5 transition hover:bg-white hover:shadow-sm opacity-50 cursor-not-allowed"
          >
            <div className="rounded-lg bg-white p-1.5 text-slate-600 shadow-sm transition">
              <Video className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-black text-slate-500">동영상</span>
          </button>
          <div className="mx-2 h-8 w-px bg-slate-200" />
          <button
            type="button"
            onClick={() => runCmd("formatBlock", "blockquote")}
            className="group flex flex-col items-center gap-1 rounded-xl px-2.5 py-1.5 transition hover:bg-white hover:shadow-sm"
          >
            <div className="rounded-lg bg-white p-1.5 text-slate-600 shadow-sm transition group-hover:text-teal-600">
              <Quote className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-black text-slate-500">인용구</span>
          </button>
          <button
            type="button"
            onClick={() => runCmd("insertHorizontalRule")}
            className="group flex flex-col items-center gap-1 rounded-xl px-2.5 py-1.5 transition hover:bg-white hover:shadow-sm"
          >
            <div className="rounded-lg bg-white p-1.5 text-slate-600 shadow-sm transition group-hover:text-teal-600">
              <Minus className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-black text-slate-500">구분선</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const url = window.prompt("링크 URL을 입력하세요.", "https://");
              if (url) runCmd("createLink", url);
            }}
            className="group flex flex-col items-center gap-1 rounded-xl px-2.5 py-1.5 transition hover:bg-white hover:shadow-sm"
          >
            <div className="rounded-lg bg-white p-1.5 text-slate-600 shadow-sm transition group-hover:text-teal-600">
              <Link2 className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-black text-slate-500">링크</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onApplyTemplate}
            className="hidden items-center gap-2 rounded-xl border border-teal-100 bg-white px-3 py-2 text-[11px] font-black text-teal-700 shadow-sm transition hover:bg-teal-50 sm:flex"
          >
            <Sparkles className="h-3.5 w-3.5" />
            스마트 템플릿
          </button>
          <div className="h-8 w-px bg-slate-200" />
          <button
            type="button"
            onClick={() => persistMode(editMode === "visual" ? "html" : "visual")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-black transition",
              editMode === "html" ? "bg-slate-900 text-white shadow-lg" : "bg-white text-slate-600 shadow-sm hover:bg-slate-50"
            )}
          >
            <Code2 className="h-4 w-4" />
            HTML
          </button>
        </div>
      </div>

      {/* 2단: 텍스트 서식 툴바 */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-100 bg-white px-4 py-2 scrollbar-hide sm:px-6">
        <div className="flex items-center gap-0.5 rounded-xl border border-slate-100 p-0.5 shadow-sm">
          <button type="button" onClick={() => runCmd("bold")} className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"><Bold className="h-4 w-4" /></button>
          <button type="button" onClick={() => runCmd("italic")} className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"><Italic className="h-4 w-4" /></button>
          <button type="button" onClick={() => runCmd("underline")} className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"><Underline className="h-4 w-4" /></button>
          <button type="button" onClick={() => runCmd("strikeThrough")} className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"><Strikethrough className="h-4 w-4" /></button>
        </div>
        <div className="mx-1 h-6 w-px bg-slate-100" />
        <div className="flex items-center gap-0.5 rounded-xl border border-slate-100 p-0.5 shadow-sm">
          <button type="button" onClick={() => runCmd("justifyLeft")} className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"><AlignLeft className="h-4 w-4" /></button>
          <button type="button" onClick={() => runCmd("justifyCenter")} className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"><AlignCenter className="h-4 w-4" /></button>
          <button type="button" onClick={() => runCmd("justifyRight")} className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"><AlignRight className="h-4 w-4" /></button>
        </div>
        <div className="mx-1 h-6 w-px bg-slate-100" />
        <div className="flex items-center gap-0.5 rounded-xl border border-slate-100 p-0.5 shadow-sm">
          <button type="button" onClick={() => runCmd("insertUnorderedList")} className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"><List className="h-4 w-4" /></button>
          <button type="button" onClick={() => runCmd("insertOrderedList")} className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"><ListOrdered className="h-4 w-4" /></button>
        </div>
        <div className="mx-1 h-6 w-px bg-slate-100" />
        <button type="button" onClick={() => runCmd("removeFormat")} className="rounded-xl border border-slate-100 p-1.5 text-slate-400 shadow-sm hover:bg-slate-50" title="서식 지우기">
          <Eraser className="h-4 w-4" />
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleInlineImageUpload}
      />

      <div className={cn(
        "grid min-h-[600px] flex-1",
        showPreview ? "lg:grid-cols-[1fr,420px]" : "grid-cols-1"
      )}>
        {/* 메인 편집 영역 */}
        <div className="relative flex flex-col border-r border-slate-100 bg-white">
          {isUploading && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
              <div className="flex items-center gap-3 rounded-2xl bg-slate-900 px-6 py-3 shadow-2xl">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                <span className="text-sm font-black text-white">이미지 처리 중…</span>
              </div>
            </div>
          )}

          {editMode === "visual" ? (
            <div className="group relative flex-1 overflow-y-auto px-10 py-12 sm:px-16 sm:py-20">
              {/* 플로팅 버튼 (Naver Style +) */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute left-4 top-12 rounded-full border border-slate-200 bg-white p-1 text-slate-400 shadow-sm transition hover:scale-110 hover:border-teal-500 hover:text-teal-600 sm:left-8 sm:top-20"
              >
                <PlusCircle className="h-6 w-6" />
              </button>
              
              <div
                ref={visualRef}
                contentEditable
                suppressContentEditableWarning
                onFocus={() => { visualFocusRef.current = true; }}
                onBlur={() => { visualFocusRef.current = false; }}
                onInput={(e) => onContentChange(e.currentTarget.innerHTML)}
                className={cn(
                  "prose prose-slate max-w-none min-h-[500px] outline-none",
                  "prose-img:rounded-[24px] prose-img:shadow-xl prose-img:my-8 prose-img:mx-auto prose-img:block",
                  "prose-blockquote:border-l-4 prose-blockquote:border-teal-500 prose-blockquote:bg-teal-50/30 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-2xl",
                  "prose-h2:text-2xl prose-h2:font-black prose-slate:text-slate-800"
                )}
                data-placeholder="이곳에 상품 상세 내용을 입력하세요…"
              />
            </div>
          ) : (
            <textarea
              value={contentHtml}
              onChange={(e) => onContentChange(e.target.value)}
              className="h-full w-full flex-1 resize-none bg-slate-900 p-8 font-mono text-[13px] leading-relaxed text-emerald-400 outline-none selection:bg-teal-500/30"
              spellCheck={false}
              placeholder="HTML 소스를 직접 편집하세요…"
            />
          )}
        </div>

        {/* 라이브 미리보기 영역 (모바일 프레임) */}
        {showPreview && (
          <div className="hidden flex-col bg-slate-50/50 lg:flex">
            <div className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-slate-400" />
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Mobile View</span>
              </div>
              <button
                type="button"
                onClick={onTogglePreview}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
              <div className="mx-auto w-full max-w-[340px] overflow-hidden rounded-[48px] border-[8px] border-slate-900 bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)]">
                {/* 모바일 상단 바 흉내 */}
                <div className="h-8 w-full bg-white flex items-center justify-center">
                  <div className="h-1 w-12 rounded-full bg-slate-100" />
                </div>
                
                <div className="max-h-[640px] min-h-[500px] overflow-y-auto px-5 py-6 scrollbar-hide">
                  {contentHtml ? (
                    <div 
                      className="prose prose-sm prose-slate max-w-none [&_img]:max-w-full [&_img]:rounded-2xl"
                      dangerouslySetInnerHTML={{ __html: contentHtml }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
                        <ImageIcon className="h-6 w-6 text-slate-200" />
                      </div>
                      <p className="text-[11px] font-bold text-slate-300">미리볼 내용이 없습니다.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 푸터 하단 바 */}
      <div className="flex items-center justify-between border-t border-slate-100 bg-white px-6 py-4">
        <div className="flex items-center gap-4">
          {footerLeft}
          <div className="hidden h-6 w-px bg-slate-100 sm:block" />
          <div className="hidden items-center gap-2 text-[11px] font-bold text-slate-400 sm:flex">
            <Monitor className="h-3.5 w-3.5" />
            <span>데스크톱 모드 편집 중</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onTogglePreview}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-[11px] font-black transition shadow-sm",
              showPreview ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            )}
          >
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPreview ? "미리보기 닫기" : "미리보기 보기"}
          </button>
        </div>
      </div>
    </div>
  );
}
