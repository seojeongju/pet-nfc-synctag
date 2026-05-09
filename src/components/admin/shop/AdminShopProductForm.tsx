"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  deleteShopProduct 
} from "@/app/actions/admin-shop";
import type { AdminShopProductRow } from "@/app/actions/admin-shop";
import { SUBJECT_KINDS, subjectKindMeta, type SubjectKind } from "@/lib/subject-kind";
import { adminUi } from "@/styles/admin/ui";
import { cn } from "@/lib/utils";
import {
  Image as ImageIcon,
  FileText,
  Upload,
  Video,
  Plus,
  X,
  Package,
  Save,
  Trash2,
  Coins,
  ChevronRight,
  Info,
  Layers,
  Monitor,
  CheckCircle2,
  type LucideIcon,
  ExternalLink
} from "lucide-react";
import type { ShopProductOptionGroup, ShopProductOptionValue } from "@/types/shop";
import {
  parseShopProductAdditionalImagesJson,
  shopProductOptionsForAdmin,
} from "@/lib/shop";
import {
  resizeProductImageForUpload,
} from "@/lib/resize-shop-image";
import { ProductContentEditorPanel } from "@/components/admin/shop/ProductContentEditorPanel";

type AdminShopSaveApiResult = {
  success?: boolean;
  error?: string;
};

type AdminShopUploadApiResult = {
  url?: string;
  error?: string;
};

function kindsChecked(product: AdminShopProductRow | null): Set<SubjectKind> {
  if (!product?.target_modes) return new Set();
  try {
    const arr = JSON.parse(product.target_modes);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

const SectionHeader = ({ icon: Icon, title, description, badge }: { icon: LucideIcon, title: string, description: string, badge?: string }) => (
  <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
    <div className="flex items-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-[20px] font-black text-slate-900 tracking-tight">{title}</h2>
          {badge && (
            <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-600 text-[10px] font-black uppercase">
              {badge}
            </span>
          )}
        </div>
        <p className="text-[12px] font-bold text-slate-400 mt-0.5">{description}</p>
      </div>
    </div>
  </div>
);

export function AdminShopProductForm({ product }: { product: AdminShopProductRow | null }) {
  const isEdit = Boolean(product);
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? "");
  const [videoUrl, setVideoUrl] = useState(product?.video_url ?? "");
  const [contentHtml, setContentHtml] = useState(product?.content_html ?? "");
  const [additionalImages, setAdditionalImages] = useState<string[]>(() =>
    parseShopProductAdditionalImagesJson(product?.additional_images)
  );
  const [options, setOptions] = useState<ShopProductOptionGroup[]>(() =>
    shopProductOptionsForAdmin(product?.options_json)
  );

  const [isUploading, setIsUploading] = useState(false);
  const [price, setPrice] = useState(product?.price_krw ?? 0);
  const [stock, setStock] = useState(product?.stock_quantity ?? 999);
  const [sortOrder, setSortOrder] = useState(product?.sort_order ?? 0);
  const [showPreview, setShowPreview] = useState(true);
  const [activeTab, setActiveTab] = useState("basic");

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSaving || isUploading) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const formData = new FormData(e.currentTarget);
      
      // 저장 시에는 캐시 버스팅용 타임스탬프(?t=...) 제거하여 순수 URL만 저장
      const cleanImageUrl = imageUrl.split('?')[0];
      const cleanVideoUrl = videoUrl.split('?')[0];
      const cleanAdditionalImages = additionalImages.map(url => url.split('?')[0]);

      // 클라이언트 상태 병합
      const clientState = {
        contentHtml,
        imageUrl: cleanImageUrl,
        videoUrl: cleanVideoUrl,
        additionalImages: cleanAdditionalImages,
        options,
        id: product?.id,
        slug: product?.slug
      };
      
      formData.append("_clientState", JSON.stringify(clientState));

      const res = await fetch("/api/admin/shop/save", {
        method: "POST",
        body: formData,
      });

      const result = (await res.json().catch(() => ({}))) as AdminShopSaveApiResult;

      if (!res.ok || !result.success) {
        throw new Error(result.error || "저장에 실패했습니다.");
      }

      // 저장 성공 시 리다이렉트
      window.location.href = "/admin/shop/products?ok=1";
    } catch (err) {
      console.error("SAVE ERROR:", err);
      setSaveError(err instanceof Error ? err.message : "저장 중 오류가 발생했습니다.");
      setIsSaving(false);
    }
  };

  useEffect(() => {
    // URL에 에러 메시지가 있으면 표시
    const params = new URLSearchParams(window.location.search);
    const e = params.get("e");
    if (e) setSaveError(decodeURIComponent(e));
  }, []);

  const imgInputRef = useRef<HTMLInputElement>(null);
  const vidInputRef = useRef<HTMLInputElement>(null);
  const addImgInputRef = useRef<HTMLInputElement>(null);

  const navItems = [
    { id: "basic", label: "기본정보", icon: Package },
    { id: "media", label: "이미지/동영상", icon: ImageIcon },
    { id: "price", label: "판매정보", icon: Coins },
    { id: "option", label: "옵션설정", icon: Layers },
    { id: "detail", label: "상세설명", icon: FileText },
    { id: "display", label: "노출/판매설정", icon: Monitor },
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: "main" | "video" | "additional") => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadUrls: string[] = [];

      for (const file of Array.from(files)) {
        let uploadFile: File = file;
        if (target !== "video" && file.type.startsWith("image/")) {
          uploadFile = await resizeProductImageForUpload(file);
        }

        const formData = new FormData();
        formData.append("file", uploadFile);
        
        const res = await fetch("/api/admin/shop/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const errorData = (await res.json().catch(() => ({}))) as AdminShopUploadApiResult;
          throw new Error(errorData.error || "업로드에 실패했습니다.");
        }

        const uploadData = (await res.json().catch(() => ({}))) as AdminShopUploadApiResult;
        if (!uploadData.url) {
          throw new Error("업로드 URL이 비어 있습니다.");
        }
        const { url } = uploadData;
        // 미리보기 시 브라우저 캐시 방지를 위해 타임스탬프 추가
        const cacheBustUrl = `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
        uploadUrls.push(cacheBustUrl);
      }

      if (target === "main") {
        setImageUrl(uploadUrls[0]);
      } else if (target === "video") {
        setVideoUrl(uploadUrls[0]);
      } else {
        setAdditionalImages(prev => [...prev, ...uploadUrls]);
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert(err instanceof Error ? err.message : "업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const removeAdditionalImage = (index: number) => {
    setAdditionalImages(prev => prev.filter((_, i) => i !== index));
  };

  const addOptionGroup = () => {
    setOptions([...options, { id: `group-${options.length}`, name: "새 옵션 그룹", values: [{ label: "기본값", priceDeltaKrw: 0 }] }]);
  };

  const removeOptionGroup = (idx: number) => {
    setOptions(options.filter((_, i) => i !== idx));
  };

  const addOptionValue = (groupIdx: number) => {
    const next = [...options];
    next[groupIdx].values.push({ label: "새 항목", priceDeltaKrw: 0 });
    setOptions(next);
  };

  const removeOptionValue = (groupIdx: number, valIdx: number) => {
    const next = [...options];
    next[groupIdx].values = next[groupIdx].values.filter((_, i) => i !== valIdx);
    setOptions(next);
  };

  const updateOptionValue = (groupIdx: number, valueIdx: number, field: keyof ShopProductOptionValue, val: string | number) => {
    const next = [...options];
    const target = { ...next[groupIdx].values[valueIdx] };
    if (field === "label") target.label = String(val);
    else target.priceDeltaKrw = Number(val) || 0;
    next[groupIdx].values[valueIdx] = target;
    setOptions(next);
  };

  const updateGroupName = (groupIdx: number, name: string) => {
    const next = [...options];
    next[groupIdx].name = name;
    setOptions(next);
  };

  const applyTemplate = () => {
    const form = document.querySelector('form') as HTMLFormElement;
    const currentName = (form?.querySelector('input[name="name"]') as HTMLInputElement)?.value || product?.name || "상품명";
    const currentPrice = (form?.querySelector('input[name="price_krw"]') as HTMLInputElement)?.value || product?.price_krw || "0";
    const currentDesc = (form?.querySelector('textarea[name="description"]') as HTMLTextAreaElement)?.value || product?.description || "";

    const template = `<div class="space-y-12 pb-20 font-outfit">
  <section class="space-y-6">
    <div class="aspect-square overflow-hidden rounded-[40px] bg-slate-100 shadow-2xl">
      <img src="${imageUrl || "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=1000"}" class="h-full w-full object-cover" />
    </div>
    <div class="space-y-2 px-2 text-center">
      <h2 class="text-3xl font-black text-slate-900">${currentName}</h2>
      <p class="text-xl font-bold text-teal-600">${Number(currentPrice).toLocaleString()}원</p>
    </div>
  </section>

  <section class="rounded-[40px] bg-white border border-slate-100 p-8 shadow-sm space-y-4">
    <div class="flex items-center gap-2 mb-2">
       <span class="h-1 w-8 bg-teal-500 rounded-full"></span>
       <h3 class="text-xl font-black text-slate-900">상품 상세 설명</h3>
    </div>
    <div class="text-sm font-medium leading-relaxed text-slate-600">
      ${currentDesc.replace(/\n/g, "<br/>") || "상품에 대한 자세한 설명을 입력해 주세요."}
    </div>
  </section>
</div>`;
    setContentHtml(template);
  };

  const checkedModes = kindsChecked(product);

  return (
    <form onSubmit={handleSubmit} className="relative min-h-screen bg-[#f8fafc] pb-32" noValidate>
      {saveError && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 shadow-xl flex items-center gap-3">
            <X className="h-5 w-5 text-rose-600" />
            <p className="text-sm font-black text-rose-900">{saveError}</p>
          </div>
        </div>
      )}

      {isEdit && <input type="hidden" name="id" value={product!.id} />}
      <input type="hidden" name="content_html" value={contentHtml} />
      <input type="hidden" name="image_url" value={imageUrl} />
      <input type="hidden" name="video_url" value={videoUrl} />
      <input type="hidden" name="additional_images" value={JSON.stringify(additionalImages)} />
      <input type="hidden" name="options_json" value={JSON.stringify(options)} />

      <div className="max-w-[1200px] mx-auto px-4 py-8 flex gap-8 items-start">
        <aside className="hidden lg:block w-64 sticky top-24 shrink-0">
          <div className="bg-white rounded-[32px] p-4 shadow-sm border border-slate-100">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <button 
                  key={item.id} 
                  type="button" 
                  onClick={() => { 
                    setActiveTab(item.id); 
                    document.getElementById(`section-${item.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }); 
                  }} 
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-bold transition-all", 
                    activeTab === item.id ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </nav>
            {isEdit && (
              <div className="mt-6 p-4 bg-teal-50 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <Monitor className="h-4 w-4 text-teal-600" />
                  <span className="text-[11px] font-black text-teal-900">미리보기</span>
                </div>
                <Link
                  href={`/shop/${product?.slug}?kind=${SUBJECT_KINDS[0]}`}
                  target="_blank"
                  className="flex items-center justify-between group"
                >
                  <span className="text-[10px] font-bold text-teal-700 underline underline-offset-2">상품 페이지 확인</span>
                  <ExternalLink className="h-3 w-3 text-teal-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>
            )}
          </div>
        </aside>

        <div className="flex-1 space-y-8 min-w-0">
          {/* 1. 상품 기본 정보 */}
          <section id="section-basic" className={cn(adminUi.sectionCard, "p-6 md:p-10 scroll-mt-24")}>
            <SectionHeader icon={Package} title="기본 정보" description="스토어에 노출될 상품의 기본 정체성을 정의합니다." badge="Essential" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">
                  상품명 <span className="text-rose-500">*</span>
                </label>
                <input
                  name="name"
                  defaultValue={product?.name ?? ""}
                  className={cn("w-full h-14 px-5 rounded-2xl text-[15px] font-bold", adminUi.input)}
                  placeholder="예: 링크유-펫 NFC 안심 스마트 태그"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">
                  URL 슬러그 <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    name="slug"
                    defaultValue={product?.slug ?? ""}
                    className={cn("w-full h-14 pl-5 pr-12 rounded-2xl text-[15px] font-mono font-bold", adminUi.input)}
                    placeholder="pet-nfc-tag"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">간단 요약 설명</label>
                <textarea
                  name="description"
                  defaultValue={product?.description ?? ""}
                  rows={2}
                  className={cn("w-full p-5 rounded-2xl text-[14px] font-medium resize-none", adminUi.input)}
                  placeholder="상품 목록에 노출될 짧은 설명을 작성하세요."
                />
              </div>
            </div>
          </section>

          {/* 2. 이미지 및 동영상 */}
          <section id="section-media" className={cn(adminUi.sectionCard, "p-6 md:p-10 scroll-mt-24")}>
            <SectionHeader icon={ImageIcon} title="이미지 및 동영상" description="대표 이미지와 상세 갤러리를 관리합니다. 고화질 권장." />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
              <div className="space-y-4">
                <h4 className="text-[13px] font-black text-slate-900 flex items-center gap-2">
                  대표 이미지 <span className="text-rose-500 text-xs">*</span>
                </h4>
                <div 
                  onClick={() => imgInputRef.current?.click()}
                  className="group relative aspect-square w-full max-w-[400px] overflow-hidden rounded-[40px] bg-slate-50 border-2 border-dashed border-slate-200 cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-all shadow-sm"
                >
                  {imageUrl ? (
                    <>
                      <img key={imageUrl} src={imageUrl} alt="Main" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30 text-white text-[12px] font-black">이미지 변경</div>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                      <div className="p-4 rounded-3xl bg-white shadow-sm group-hover:shadow-md transition-all">
                        <Upload className="h-8 w-8 text-slate-400 group-hover:text-teal-500" />
                      </div>
                      <p className="text-[11px] font-black text-slate-400 group-hover:text-teal-600">대표 이미지를 업로드하세요 (1:1 권장)</p>
                    </div>
                  )}
                  <input type="file" ref={imgInputRef} onChange={(e) => handleFileUpload(e, "main")} accept="image/*" className="hidden" />
                </div>
              </div>
              <div className="space-y-8">
                <div className="space-y-4">
                  <h4 className="text-[13px] font-black text-slate-900">상품 작동 영상</h4>
                  <div 
                    onClick={() => vidInputRef.current?.click()}
                    className="group relative aspect-video w-full rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden cursor-pointer hover:border-rose-400 transition-all shadow-inner"
                  >
                    {videoUrl ? (
                      <video key={videoUrl} src={videoUrl} className="h-full w-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                        <Video className="h-8 w-8 text-slate-600 group-hover:text-rose-500 transition-colors" />
                        <span className="text-[10px] font-black text-slate-500">영상 업로드 (Optional)</span>
                      </div>
                    )}
                    <input type="file" ref={vidInputRef} onChange={(e) => handleFileUpload(e, "video")} accept="video/*" className="hidden" />
                    {videoUrl && (
                      <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); setVideoUrl(""); }} 
                        className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/50 text-white hover:bg-rose-500 transition-colors flex items-center justify-center"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[13px] font-black text-slate-900">추가 이미지 ({additionalImages.length})</h4>
                  <div className="grid grid-cols-4 gap-3">
                    {additionalImages.map((img, idx) => (
                      <div key={`${img}-${idx}`} className="group relative aspect-square rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden shadow-sm">
                        <img src={img} alt={`Additional ${idx + 1}`} className="h-full w-full object-cover" />
                        <button 
                          type="button" 
                          onClick={() => removeAdditionalImage(idx)} 
                          className="absolute top-1 right-1 h-5 w-5 rounded-full bg-white/90 text-slate-900 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center shadow-md hover:bg-rose-500 hover:text-white"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    <button 
                      type="button" 
                      onClick={() => addImgInputRef.current?.click()}
                      className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 bg-white flex flex-col items-center justify-center gap-1 hover:border-teal-400 hover:bg-teal-50/30 transition-all text-slate-400 hover:text-teal-600"
                    >
                      <Plus className="h-5 w-5" />
                      <span className="text-[10px] font-black">추가</span>
                    </button>
                    <input type="file" ref={addImgInputRef} onChange={(e) => handleFileUpload(e, "additional")} accept="image/*" multiple className="hidden" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 3. 판매 정보 */}
          <section id="section-price" className={cn(adminUi.sectionCard, "p-6 md:p-10 scroll-mt-24")}>
            <SectionHeader icon={Coins} title="판매 정보" description="가격 정책 및 재고 수량을 설정합니다." badge="Price" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">판매 가격 (원)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={price.toLocaleString()}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9]/g, "");
                      setPrice(Number(v) || 0);
                    }}
                    className={cn(adminUi.input, "w-full h-14 pl-5 pr-16 rounded-2xl text-[15px] font-bold text-right")}
                  />
                  <input type="hidden" name="price_krw" value={price} />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">원</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">재고 수량</label>
                <input
                  type="text"
                  value={stock.toLocaleString()}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9]/g, "");
                    setStock(Number(v) || 0);
                  }}
                  className={cn(adminUi.input, "w-full h-14 pl-5 pr-16 rounded-2xl text-[15px] font-bold text-right")}
                />
                <input type="hidden" name="stock_quantity" value={stock} />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">정렬 순서</label>
                <input
                  type="text"
                  value={sortOrder.toLocaleString()}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9]/g, "");
                    setSortOrder(Number(v) || 0);
                  }}
                  className={cn(adminUi.input, "w-full h-14 pl-5 pr-16 rounded-2xl text-[15px] font-bold text-right")}
                />
                <input type="hidden" name="sort_order" value={sortOrder} />
              </div>
            </div>
          </section>

          {/* 4. 옵션 설정 */}
          <section id="section-option" className={cn(adminUi.sectionCard, "p-6 md:p-10 scroll-mt-24")}>
            <SectionHeader icon={Layers} title="옵션 구성" description="선택사항별 가격 변동을 관리합니다." />
            <div className="flex justify-end mb-6">
              <button 
                type="button" 
                onClick={addOptionGroup}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 text-white text-[12px] font-black shadow-lg hover:bg-slate-800 transition-all active:scale-95"
              >
                <Plus className="h-4 w-4" />
                그룹 추가
              </button>
            </div>
            <div className="space-y-8">
              {options.length === 0 ? (
                <div className="py-20 text-center bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-100">
                   <p className="text-sm font-black text-slate-400">설정된 옵션이 없습니다.</p>
                </div>
              ) : (
                options.map((group, gIdx) => (
                  <div key={group.id} className="relative bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="bg-slate-50/50 px-6 py-4 flex items-center justify-between border-b border-slate-100">
                      <input
                        value={group.name}
                        onChange={(e) => updateGroupName(gIdx, e.target.value)}
                        className="bg-transparent border-none focus:ring-0 text-[15px] font-black text-slate-900 w-full"
                        placeholder="그룹명 (예: 색상, 사이즈)"
                      />
                      <button type="button" onClick={() => removeOptionGroup(gIdx)} className="text-slate-300 hover:text-rose-500 p-2">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="p-6 space-y-4">
                      {group.values.map((v, vIdx) => (
                        <div key={vIdx} className="flex gap-4 items-center bg-slate-50/30 p-3 rounded-2xl group/val">
                          <input
                            value={v.label}
                            onChange={(e) => updateOptionValue(gIdx, vIdx, "label", e.target.value)}
                            className="flex-1 bg-transparent border-none focus:ring-0 text-[13px] font-bold text-slate-700"
                            placeholder="항목명"
                          />
                          <div className="flex items-center gap-2 w-32">
                            <input
                              type="number"
                              value={v.priceDeltaKrw}
                              onChange={(e) => updateOptionValue(gIdx, vIdx, "priceDeltaKrw", e.target.value)}
                              className="w-full bg-transparent border-none focus:ring-0 text-[13px] font-black text-teal-600 text-right"
                            />
                            <span className="text-[11px] font-bold text-slate-400">원</span>
                          </div>
                          <button type="button" onClick={() => removeOptionValue(gIdx, vIdx)} className="text-slate-300 hover:text-rose-500 p-1">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      <button 
                        type="button" 
                        onClick={() => addOptionValue(gIdx)}
                        className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-100 text-[11px] font-black text-slate-400 hover:border-teal-200 hover:text-teal-600 transition-all flex items-center justify-center gap-2"
                      >
                        <Plus className="h-4 w-4" /> 항목 추가
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* 5. 상세 설명 */}
          <section id="section-detail" className="scroll-mt-24">
            <ProductContentEditorPanel
              contentHtml={contentHtml}
              onContentChange={setContentHtml}
              showPreview={showPreview}
              onTogglePreview={() => setShowPreview(!showPreview)}
              onApplyTemplate={applyTemplate}
            />
          </section>

          {/* 6. 노출 및 판매 설정 */}
          <section id="section-display" className={cn(adminUi.sectionCard, "p-6 md:p-10 scroll-mt-24")}>
            <SectionHeader icon={Monitor} title="노출 및 판매 설정" description="상품이 노출될 채널과 상태를 제어합니다." />
            <div className="space-y-10">
              <div className="space-y-4">
                <h4 className="text-[13px] font-black text-slate-900">노출 채널 설정</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {SUBJECT_KINDS.map((k) => (
                    <label
                      key={k}
                      className="relative flex items-center gap-3 rounded-[24px] border-2 border-slate-100 bg-white px-5 py-4 text-[13px] font-black text-slate-600 cursor-pointer has-[:checked]:border-teal-500 transition-all"
                    >
                      <input
                        type="checkbox"
                        name={`kind_${k}`}
                        defaultChecked={isEdit ? checkedModes.has(k) : k === SUBJECT_KINDS[0]}
                        className="sr-only peer"
                      />
                      <div className="w-5 h-5 rounded-full border-2 border-slate-200 peer-checked:bg-teal-500 peer-checked:border-teal-500 transition-all flex items-center justify-center">
                        <CheckCircle2 className="h-3 w-3 text-white scale-0 peer-checked:scale-100" />
                      </div>
                      {subjectKindMeta[k].label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="p-8 rounded-[40px] bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <h4 className="text-lg font-black">즉시 판매 활성화</h4>
                  <p className="text-sm font-bold text-slate-400">설정 시 사용자의 스토어 화면에 즉시 상품이 노출됩니다.</p>
                </div>
                <label className="flex items-center gap-4 cursor-pointer">
                  <span className="text-[12px] font-black text-slate-400">비활성</span>
                  <div className="relative">
                    <input type="checkbox" name="active" defaultChecked={product == null || product.active === 1} className="sr-only peer" />
                    <div className="w-16 h-8 bg-slate-700 rounded-full peer peer-checked:bg-teal-500 transition-all after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:after:translate-x-8" />
                  </div>
                  <span className="text-[12px] font-black text-teal-400">판매 중</span>
                </label>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-8 left-0 right-0 z-50 pointer-events-none">
        <div className="max-w-[1200px] mx-auto px-4 w-full pointer-events-auto">
          <div className="bg-white/90 backdrop-blur-2xl rounded-[32px] p-4 shadow-2xl border border-white/50 flex items-center justify-between">
            <div className="hidden sm:flex items-center gap-3 px-6 border-r border-slate-100">
              <Info className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-[11px] font-black text-slate-900">실시간 저장 준비</p>
                <p className="text-[9px] font-bold text-slate-400">필수 항목 입력 확인됨</p>
              </div>
            </div>
            <div className="flex items-center gap-3 pr-2">
              <Link href="/admin/shop/products" className="h-12 sm:h-14 px-6 rounded-2xl text-[13px] font-black text-slate-400 hover:text-slate-900 flex items-center">목록으로</Link>
              {isEdit && (
                <button
                  formAction={deleteShopProduct}
                  onClick={(e) => !confirm("정말 삭제하시겠습니까?") && e.preventDefault()}
                  className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl border border-rose-100 text-rose-500 hover:bg-rose-50 flex items-center justify-center"
                >
                  <Trash2 className="h-5 w-5" />
                  <input type="hidden" name="product_id" value={product!.id} />
                </button>
              )}
              <button
                type="submit"
                disabled={isSaving || isUploading}
                className={cn(
                  "h-12 sm:h-14 min-w-[140px] sm:min-w-[160px] rounded-2xl bg-slate-900 text-white px-5 sm:px-8 text-[13px] sm:text-[14px] font-black shadow-xl hover:bg-teal-600 transition-all flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-50 whitespace-nowrap shrink-0",
                  (isSaving || isUploading) && "bg-slate-400"
                )}
              >
                {isSaving ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="h-5 w-5" />
                )}
                {isEdit ? (isSaving ? "저장 중..." : "변경사항 저장") : (isSaving ? "등록 중..." : "상품 등록")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
