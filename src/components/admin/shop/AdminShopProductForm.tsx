"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import type { LucideIcon } from "lucide-react";
import { deleteShopProduct, saveShopProduct, uploadShopAsset } from "@/app/actions/admin-shop";
import type { AdminShopProductRow } from "@/app/actions/admin-shop";
import { SUBJECT_KINDS, subjectKindMeta, type SubjectKind } from "@/lib/subject-kind";
import { adminUi } from "@/styles/admin/ui";
import { cn } from "@/lib/utils";
import {
  Settings,
  Image as ImageIcon,
  FileText,
  Upload,
  Video,
  Plus,
  X,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Package,
} from "lucide-react";
import type { ShopProductOptionGroup, ShopProductOptionValue } from "@/types/shop";
import {
  parseShopProductAdditionalImagesJson,
  shopProductOptionsForAdmin,
} from "@/lib/shop";
import {
  resizeProductImageForUpload,
  SHOP_UPLOAD_IMAGE_MAX_EDGE_PX,
} from "@/lib/resize-shop-image";
import { ProductContentEditorPanel } from "@/components/admin/shop/ProductContentEditorPanel";

function kindsChecked(row: AdminShopProductRow | null): Set<SubjectKind> {
  const s = new Set<SubjectKind>();
  if (!row?.target_modes) return s;
  try {
    const v = JSON.parse(String(row.target_modes)) as unknown;
    if (!Array.isArray(v)) return s;
    for (const x of v) {
      if (typeof x === "string" && (SUBJECT_KINDS as readonly string[]).includes(x)) {
        s.add(x as SubjectKind);
      }
    }
  } catch {
    /* ignore */
  }
  return s;
}

type Tab = "basic" | "media" | "options" | "content";

export function AdminShopProductForm({ product }: { product: AdminShopProductRow | null }) {
  const checked = kindsChecked(product);
  const isEdit = Boolean(product);

  const [activeTab, setActiveTab] = useState<Tab>("basic");
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
  const [showPreview, setShowPreview] = useState(true);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const vidInputRef = useRef<HTMLInputElement>(null);
  const addImgInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: "main" | "video" | "additional") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      let uploadFile: File = file;
      if (target !== "video" && file.type.startsWith("image/")) {
        uploadFile = await resizeProductImageForUpload(file);
      }
      const formData = new FormData();
      formData.append("file", uploadFile);
      const { url } = await uploadShopAsset(formData);

      if (target === "main") {
        setImageUrl(url);
      } else if (target === "video") {
        setVideoUrl(url);
      } else if (target === "additional") {
        setAdditionalImages((prev) => [...prev, url]);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "업로드 실패");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const addOptionGroup = () => {
    setOptions(prev => [...prev, { id: nanoid_local(), name: "신규 옵션", values: [{ label: "기본값", priceDeltaKrw: 0 }] }]);
  };

  const removeOptionGroup = (idx: number) => {
    setOptions(prev => prev.filter((_, i) => i !== idx));
  };

  const addOptionValue = (groupIdx: number) => {
    const next = [...options];
    next[groupIdx].values.push({ label: "추가항목", priceDeltaKrw: 0 });
    setOptions(next);
  };

  const removeOptionValue = (groupIdx: number, valueIdx: number) => {
    const next = [...options];
    next[groupIdx].values = next[groupIdx].values.filter(
      (_: ShopProductOptionValue, i: number) => i !== valueIdx
    );
    setOptions(next);
  };

  const updateOptionValue = (
    groupIdx: number,
    valueIdx: number,
    field: keyof ShopProductOptionValue,
    val: string | number
  ) => {
    const next = [...options];
    const target: ShopProductOptionValue = { ...next[groupIdx].values[valueIdx] };
    if (field === "label") {
      target.label = String(val);
    } else {
      target.priceDeltaKrw = typeof val === "number" ? val : Number(val);
    }
    next[groupIdx].values[valueIdx] = target;
    setOptions(next);
  };

  const updateGroupName = (groupIdx: number, name: string) => {
    const next = [...options];
    next[groupIdx].name = name;
    setOptions(next);
  };

  const applyTemplate = () => {
    const template = `<div class="space-y-12 pb-20 font-outfit">
  <!-- 메인 섹션 -->
  <section class="space-y-6">
    <div class="aspect-square overflow-hidden rounded-[40px] bg-slate-100 shadow-2xl">
      <img src="${imageUrl || "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=1000"}" class="h-full w-full object-cover" />
    </div>
    <div class="space-y-2 px-2 text-center">
      <h2 class="text-3xl font-black text-slate-900">${product?.name || "상품명"}</h2>
      <p class="text-xl font-bold text-teal-600">${product?.price_krw?.toLocaleString() || "0"}원</p>
    </div>
  </section>

  <!-- 상세 설명 -->
  <section class="rounded-[40px] bg-white border border-slate-100 p-8 shadow-sm space-y-4">
    <div class="flex items-center gap-2 mb-2">
       <span class="h-1 w-8 bg-teal-500 rounded-full"></span>
       <h3 class="text-xl font-black text-slate-900">상품 상세 설명</h3>
    </div>
    <div class="text-sm font-medium leading-relaxed text-slate-600">
      ${product?.description?.replace(/\n/g, "<br/>") || "상품에 대한 자세한 설명을 입력해 주세요."}
    </div>
  </section>

  <!-- 영상 섹션 -->
  ${videoUrl ? `
  <section class="space-y-4">
    <div class="flex items-center gap-2 px-2">
       <span class="h-1 w-8 bg-rose-500 rounded-full"></span>
       <h3 class="text-xl font-black text-slate-900">작동 영상</h3>
    </div>
    <div class="aspect-video overflow-hidden rounded-[40px] bg-black shadow-xl ring-1 ring-slate-200">
      <video src="${videoUrl}" controls class="h-full w-full"></video>
    </div>
  </section>` : ""}

  <!-- 추가 이미지 갤러리 -->
  ${additionalImages.length > 0 ? `
  <section class="space-y-4">
    <div class="flex items-center gap-2 px-2">
       <span class="h-1 w-8 bg-indigo-500 rounded-full"></span>
       <h3 class="text-xl font-black text-slate-900">상세 갤러리</h3>
    </div>
    <div class="grid grid-cols-2 gap-4">
      ${additionalImages.map(img => `
        <div class="aspect-square overflow-hidden rounded-3xl bg-slate-100 shadow-md transition-transform hover:scale-[1.02]">
          <img src="${img}" class="h-full w-full object-cover" />
        </div>
      `).join("")}
    </div>
  </section>` : ""}

  <!-- 유의사항 -->
  <section class="rounded-3xl border-2 border-dashed border-slate-100 p-6 bg-slate-50/50">
    <h4 class="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
      <span class="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] text-white">!</span>
      구매 전 확인해 주세요
    </h4>
    <ul class="list-disc list-inside text-[11px] font-bold text-slate-500 space-y-1.5 ml-1">
      <li>NFC 태그는 방수 처리가 되어 있으나 과도한 충격에는 주의가 필요합니다.</li>
      <li>대시보드 등록 후 즉시 사용 가능합니다.</li>
      <li>단순 변심으로 인한 반품은 개봉 전까지만 가능합니다.</li>
    </ul>
  </section>
</div>`;
    setContentHtml(template);
  };

  const TabButton = ({ id, label, icon: Icon }: { id: Tab; label: string; icon: LucideIcon }) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={cn(
        "flex items-center gap-2 px-4 py-3 text-xs font-black transition-all border-b-2",
        activeTab === id 
          ? "border-teal-500 text-teal-600 bg-teal-50/30" 
          : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* 탭 네비게이션 */}
      <div className="flex border-b border-slate-100 bg-white rounded-t-[32px] overflow-hidden">
        <TabButton id="basic" label="기본 정보" icon={Settings} />
        <TabButton id="media" label="미디어 관리" icon={ImageIcon} />
        <TabButton id="options" label="옵션 관리" icon={Plus} />
        <TabButton id="content" label="상세 페이지 구성" icon={FileText} />
      </div>

      <form action={saveShopProduct} className="space-y-8 pb-20">
        {isEdit ? <input type="hidden" name="id" value={product!.id} /> : null}
        <input type="hidden" name="content_html" value={contentHtml} />
        <input type="hidden" name="image_url" value={imageUrl} />
        <input type="hidden" name="video_url" value={videoUrl} />
        <input type="hidden" name="additional_images" value={JSON.stringify(additionalImages)} />
        <input type="hidden" name="options_json" value={JSON.stringify(options)} />
        
        {/* 기본 정보 탭 */}
        <div className={cn(adminUi.sectionCard, "space-y-8 animate-in fade-in slide-in-from-bottom-2", activeTab !== "basic" && "hidden")}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">기본 정보</h2>
                <p className="text-[11px] font-bold text-slate-400">상품의 핵심 정보를 설정합니다.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">슬러그 (URL)</label>
                <div className="relative">
                  <input
                    name="slug"
                    required
                    defaultValue={product?.slug ?? ""}
                    pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                    className={cn("w-full pl-3 pr-10", adminUi.input, "h-11")}
                    placeholder="pet-nfc-starter"
                  />
                  <ExternalLink className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                </div>
                <p className="text-[9px] font-bold text-slate-400">영문 소문자, 숫자, 하이픈만 사용 가능</p>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">상품명</label>
                <input
                  name="name"
                  required
                  defaultValue={product?.name ?? ""}
                  className={cn("w-full", adminUi.input, "h-11")}
                  placeholder="예: 반려동물 안심 태그"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">간략 설명 (목록 표시용)</label>
              <textarea
                name="description"
                required
                rows={3}
                defaultValue={product?.description ?? ""}
                className={cn("w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-teal-500/20 transition-all")}
                placeholder="목록에서 상품 이름 아래에 보여줄 짧은 설명을 입력하세요."
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">가격 (KRW)</label>
                <div className="relative">
                  <input
                    name="price_krw"
                    type="number"
                    min={0}
                    required
                    defaultValue={product?.price_krw ?? 0}
                    className={cn("w-full pr-10", adminUi.input, "h-11 font-mono")}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-black text-slate-300">원</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">재고 수량</label>
                <div className="relative">
                  <input
                    name="stock_quantity"
                    type="number"
                    min={0}
                    required
                    defaultValue={product?.stock_quantity ?? 999}
                    className={cn("w-full", adminUi.input, "h-11 font-mono")}
                  />
                  <Package className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">노출 우선순위</label>
                <input
                  name="sort_order"
                  type="number"
                  required
                  defaultValue={product?.sort_order ?? 0}
                  className={cn("w-full", adminUi.input, "h-11 font-mono")}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">노출 대상 모드</label>
              <div className="flex flex-wrap gap-2">
                {SUBJECT_KINDS.map((k) => (
                  <label
                    key={k}
                    className="group relative inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-[11px] font-black text-slate-700 has-[:checked]:border-teal-300 has-[:checked]:bg-teal-50 cursor-pointer transition-all hover:border-slate-300"
                  >
                    <input type="checkbox" name={`kind_${k}`} defaultChecked={checked.has(k)} className="w-4 h-4 rounded-lg border-slate-300 text-teal-600 focus:ring-teal-500" />
                    {subjectKindMeta[k].label}
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-50">
               <button
                 type="button"
                 onClick={() => setActiveTab("media")}
                 className="flex items-center gap-2 text-xs font-black text-teal-600 hover:gap-3 transition-all"
               >
                 다음: 미디어 설정 <ArrowRight className="h-4 w-4" />
               </button>
            </div>
        </div>

        {/* 미디어 관리 탭 */}
        <div className={cn(adminUi.sectionCard, "space-y-10 animate-in fade-in slide-in-from-bottom-2", activeTab !== "media" && "hidden")}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
                <ImageIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">미디어 관리</h2>
                <p className="text-[11px] font-bold text-slate-400">이미지와 영상을 업로드하여 상품을 돋보이게 만듭니다.</p>
              </div>
            </div>
            
            {/* 대표 이미지 */}
            <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
              <div className="space-y-3">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">메인 대표 이미지</label>
                <div 
                  onClick={() => imgInputRef.current?.click()}
                  className="aspect-square rounded-[32px] bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-slate-100 hover:border-teal-300 transition-all group"
                >
                  {imageUrl ? (
                    <img src={imageUrl} className="h-full w-full object-cover" />
                  ) : (
                    <>
                      <div className="p-3 rounded-full bg-white shadow-sm group-hover:scale-110 transition-transform">
                        <Upload className="h-6 w-6 text-slate-400" />
                      </div>
                      <span className="text-[10px] font-black text-slate-400">이미지 업로드</span>
                    </>
                  )}
                </div>
                <input type="file" ref={imgInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, "main")} />
              </div>
              
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">이미지 URL</label>
                  <input 
                    value={imageUrl} 
                    onChange={(e) => setImageUrl(e.target.value)} 
                    className={cn("w-full", adminUi.input, "h-11")} 
                    placeholder="https://..." 
                  />
                </div>
                
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                   <p className="text-[10px] font-black text-amber-800 flex items-center gap-2">
                     <Sparkles className="h-3 w-3" /> Tip
                   </p>
                   <p className="text-[10px] font-bold text-amber-700/80 mt-1">
                     업로드 시 이미지는 자동으로 중앙 기준 1:1로 맞추고, 긴 변 최대 {SHOP_UPLOAD_IMAGE_MAX_EDGE_PX}px JPEG로 줄입니다. SVG·GIF는 원본입니다.
                     배경이 깔끔한 사진이 더 돋보입니다.
                   </p>
                </div>
              </div>
            </div>

            {/* 홍보 영상 */}
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">홍보 영상 (MP4/WebM)</label>
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="w-full sm:w-48 aspect-video rounded-2xl bg-slate-900 overflow-hidden flex items-center justify-center relative shadow-lg">
                  {videoUrl ? (
                    <video src={videoUrl} className="h-full w-full object-cover" />
                  ) : (
                    <Video className="h-8 w-8 text-slate-700" />
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex-1 w-full space-y-2">
                  <input 
                    value={videoUrl} 
                    onChange={(e) => setVideoUrl(e.target.value)} 
                    className={cn("w-full", adminUi.input)} 
                    placeholder="영상 URL 직접 입력 또는 업로드" 
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => vidInputRef.current?.click()}
                      className="flex-1 h-10 rounded-xl bg-slate-900 text-white text-[11px] font-black hover:bg-rose-500 transition-colors disabled:opacity-50"
                    >
                      영상 파일 선택
                    </button>
                    {videoUrl && (
                      <button type="button" onClick={() => setVideoUrl("")} className="px-3 h-10 rounded-xl bg-slate-100 text-slate-500 hover:text-rose-500">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <input type="file" ref={vidInputRef} className="hidden" accept="video/*" onChange={(e) => handleFileUpload(e, "video")} />
                </div>
              </div>
            </div>

            {/* 추가 이미지 */}
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">추가 상세 이미지 (갤러리)</label>
                <span className="text-[10px] font-bold text-slate-400">{additionalImages.length}개 등록됨</span>
              </div>
              <div className="flex flex-wrap gap-4">
                {additionalImages.map((img, idx) => (
                  <div key={idx} className="group relative h-24 w-24 rounded-[20px] bg-white p-1 border border-slate-100 shadow-sm transition-all hover:shadow-md">
                    <img src={img} className="h-full w-full object-cover rounded-[16px]" />
                    <button
                      type="button"
                      onClick={() => setAdditionalImages(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-rose-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg hover:scale-110 active:scale-95"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => addImgInputRef.current?.click()}
                  className="h-24 w-24 rounded-[20px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 hover:border-teal-400 hover:bg-teal-50/50 transition-all disabled:opacity-50 group"
                >
                  <Plus className="h-6 w-6 text-slate-300 group-hover:text-teal-500 transition-colors" />
                  <span className="text-[10px] font-black text-slate-400">이미지 추가</span>
                </button>
                <input type="file" ref={addImgInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, "additional")} />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-50 flex justify-between">
               <button type="button" onClick={() => setActiveTab("basic")} className="text-xs font-black text-slate-400 hover:text-slate-600">이전 단계로</button>
               <button
                 type="button"
                 onClick={() => setActiveTab("options")}
                 className="flex items-center gap-2 text-xs font-black text-teal-600 hover:gap-3 transition-all"
               >
                 다음: 옵션 관리 <ArrowRight className="h-4 w-4" />
               </button>
            </div>
        </div>

        {/* 옵션 관리 탭 */}
        <div className={cn(adminUi.sectionCard, "space-y-8 animate-in fade-in slide-in-from-bottom-2", activeTab !== "options" && "hidden")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">옵션 관리</h2>
                  <p className="text-[11px] font-bold text-slate-400">색상, 사이즈 등 구매 시 선택할 옵션을 구성합니다.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={addOptionGroup}
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-[11px] font-black text-white hover:bg-teal-600 transition-all"
              >
                <Plus className="h-4 w-4" /> 옵션 그룹 추가
              </button>
            </div>

            <div className="space-y-6">
              {options.map((group, gIdx) => (
                <div key={group.id} className="rounded-3xl border border-slate-200 bg-slate-50/50 p-6 space-y-5 relative group/card">
                  <button
                    type="button"
                    onClick={() => removeOptionGroup(gIdx)}
                    className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 transition-all opacity-0 group-hover/card:opacity-100"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <div className="max-w-xs space-y-1.5">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">옵션 그룹명</label>
                    <input
                      value={group.name}
                      onChange={(e) => updateGroupName(gIdx, e.target.value)}
                      className={cn("w-full", adminUi.input, "h-10 bg-white")}
                      placeholder="예: 색상, 사이즈"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">선택 항목</label>
                    <div className="space-y-2">
                      {group.values.map((v: ShopProductOptionValue, vIdx: number) => (
                        <div key={vIdx} className="flex gap-3 items-center">
                          <input
                            value={v.label}
                            onChange={(e) => updateOptionValue(gIdx, vIdx, "label", e.target.value)}
                            className={cn("flex-1", adminUi.input, "h-10 bg-white")}
                            placeholder="항목 이름 (예: 블랙)"
                          />
                          <div className="relative w-32">
                            <input
                              type="number"
                              value={v.priceDeltaKrw}
                              onChange={(e) => updateOptionValue(gIdx, vIdx, "priceDeltaKrw", Number(e.target.value))}
                              className={cn("w-full pl-6 pr-3", adminUi.input, "h-10 bg-white font-mono")}
                            />
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">+</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeOptionValue(gIdx, vIdx)}
                            className="h-10 w-10 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-rose-500 transition-colors"
                          >
                            <X className="h-4 w-4 mx-auto" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addOptionValue(gIdx)}
                        className="w-full h-10 rounded-xl border-2 border-dashed border-slate-200 text-[11px] font-black text-slate-400 hover:border-teal-300 hover:text-teal-600 hover:bg-white transition-all flex items-center justify-center gap-2"
                      >
                        <Plus className="h-3.5 w-3.5" /> 항목 추가
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {options.length === 0 && (
                <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-[32px]">
                   <p className="text-[12px] font-bold text-slate-300">등록된 옵션이 없습니다. (단일 상품)</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-50 flex justify-between">
               <button type="button" onClick={() => setActiveTab("media")} className="text-xs font-black text-slate-400 hover:text-slate-600">이전 단계로</button>
               <button
                 type="button"
                 onClick={() => setActiveTab("content")}
                 className="flex items-center gap-2 text-xs font-black text-teal-600 hover:gap-3 transition-all"
               >
                 다음: 상세 페이지 디자인 <ArrowRight className="h-4 w-4" />
               </button>
            </div>
        </div>

        {/* 상세 페이지 구성 탭 */}
        <div className={activeTab !== "content" ? "hidden" : ""}>
          <ProductContentEditorPanel
            contentHtml={contentHtml}
            onContentChange={setContentHtml}
            showPreview={showPreview}
            onTogglePreview={() => setShowPreview((v) => !v)}
            onApplyTemplate={applyTemplate}
            footerLeft={
              <button
                type="button"
                onClick={() => setActiveTab("options")}
                className="text-xs font-black text-slate-400 hover:text-slate-600"
              >
                ← 이전 단계 (옵션)
              </button>
            }
          />
        </div>

        {isEdit && product?.id ? (
          <div className="mt-10 rounded-3xl border border-rose-100 bg-rose-50/40 px-5 py-4">
            <p className="text-[11px] font-black uppercase tracking-wider text-rose-700">위험 영역</p>
            <p className="mt-1 text-xs font-semibold text-rose-900/80">
              주문 이력이 없을 때만 삭제할 수 있습니다.
            </p>
            <form action={deleteShopProduct} className="mt-3">
              <input type="hidden" name="product_id" value={product.id} />
              <button
                type="submit"
                className="rounded-xl border border-rose-200 bg-white px-4 py-2 text-[11px] font-black text-rose-700 hover:bg-rose-100"
                onClick={(e) => {
                  if (!confirm("이 상품을 삭제할까요? 이 작업은 되돌릴 수 없습니다.")) {
                    e.preventDefault();
                  }
                }}
              >
                상품 삭제
              </button>
            </form>
          </div>
        ) : null}

        {/* 저장/취소 하단 고정 바 (플로팅 스타일) */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 z-50">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-[32px] p-4 flex items-center justify-between">
            <label className="inline-flex items-center gap-3 cursor-pointer pl-2">
              <input type="checkbox" name="active" defaultChecked={product == null || product.active === 1} className="w-5 h-5 rounded-lg border-slate-200 text-teal-600 focus:ring-teal-500" />
              <div className="flex flex-col">
                <span className="text-xs font-black text-slate-800">활성화 상태</span>
                <span className="text-[10px] font-bold text-slate-400">체크 시 즉시 노출</span>
              </div>
            </label>
            
            <div className="flex gap-2">
              <Link
                href="/admin/shop/products"
                className="inline-flex h-12 items-center rounded-2xl px-6 text-xs font-black text-slate-500 hover:bg-slate-50 transition-colors"
              >
                취소
              </Link>
              <button
                type="submit"
                className="h-12 rounded-2xl px-10 text-xs font-black text-white shadow-lg bg-slate-900 hover:bg-teal-600 hover:scale-[1.02] active:scale-95 transition-all"
              >
                {isEdit ? "변경사항 저장하기" : "신규 상품 등록"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function nanoid_local() {
  return Math.random().toString(36).substring(2, 10);
}
