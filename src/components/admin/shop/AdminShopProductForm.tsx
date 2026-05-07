"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { 
  deleteShopProduct, 
  saveShopProduct, 
  uploadShopAsset 
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
  DollarSign,
  ChevronRight,
  Info,
  Layers,
  Monitor,
  CheckCircle2,
  type LucideIcon
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
  const [showPreview, setShowPreview] = useState(true);
  const [activeTab, setActiveTab] = useState("basic");
  
  const imgInputRef = useRef<HTMLInputElement>(null);
  const vidInputRef = useRef<HTMLInputElement>(null);
  const addImgInputRef = useRef<HTMLInputElement>(null);

  const navItems = [
    { id: "basic", label: "기본정보", icon: Package },
    { id: "media", label: "이미지/동영상", icon: ImageIcon },
    { id: "price", label: "판매정보", icon: DollarSign },
    { id: "option", label: "옵션설정", icon: Layers },
    { id: "detail", label: "상세설명", icon: FileText },
    { id: "display", label: "노출/판매설정", icon: Monitor },
  ];

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
      } else {
        setAdditionalImages(prev => [...prev, url]);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
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
    const template = `<div class="space-y-12 pb-20 font-outfit">
  <section class="space-y-6">
    <div class="aspect-square overflow-hidden rounded-[40px] bg-slate-100 shadow-2xl">
      <img src="${imageUrl || "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=1000"}" class="h-full w-full object-cover" />
    </div>
    <div class="space-y-2 px-2 text-center">
      <h2 class="text-3xl font-black text-slate-900">${product?.name || "상품명"}</h2>
      <p class="text-xl font-bold text-teal-600">${product?.price_krw?.toLocaleString() || "0"}원</p>
    </div>
  </section>

  <section class="rounded-[40px] bg-white border border-slate-100 p-8 shadow-sm space-y-4">
    <div class="flex items-center gap-2 mb-2">
       <span class="h-1 w-8 bg-teal-500 rounded-full"></span>
       <h3 class="text-xl font-black text-slate-900">상품 상세 설명</h3>
    </div>
    <div class="text-sm font-medium leading-relaxed text-slate-600">
      ${product?.description?.replace(/\n/g, "<br/>") || "상품에 대한 자세한 설명을 입력해 주세요."}
    </div>
  </section>

  ${videoUrl ? `<section class="space-y-4">
    <div class="flex items-center gap-2 px-2">
       <span class="h-1 w-8 bg-rose-500 rounded-full"></span>
       <h3 class="text-xl font-black text-slate-900">작동 영상</h3>
    </div>
    <div class="aspect-video overflow-hidden rounded-[40px] bg-black shadow-xl ring-1 ring-slate-200">
      <video src="${videoUrl}" controls class="h-full w-full"></video>
    </div>
  </section>` : ""}

  ${additionalImages.length > 0 ? `<section class="space-y-4">
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

  const checkedModes = kindsChecked(product);

  return (
    <form action={saveShopProduct} className="relative min-h-screen bg-[#f8fafc] pb-32" noValidate>
      {/* Hidden inputs for state synchronization */}
      {isEdit && <input type="hidden" name="id" value={product!.id} />}
      <input type="hidden" name="content_html" value={contentHtml} />
      <input type="hidden" name="image_url" value={imageUrl} />
      <input type="hidden" name="video_url" value={videoUrl} />
      <input type="hidden" name="additional_images" value={JSON.stringify(additionalImages)} />
      <input type="hidden" name="options_json" value={JSON.stringify(options)} />

      <div className="max-w-[1200px] mx-auto px-4 py-8 flex gap-8 items-start">
        
        {/* Left: Sticky Navigation (Naver Center Style) */}
        <aside className="hidden lg:block w-64 sticky top-24 shrink-0">
          <div className="bg-white rounded-[32px] p-4 shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-4 py-3 mb-2 border-b border-slate-50">
               <h4 className="text-[12px] font-black text-slate-900 uppercase tracking-tighter">Product Builder</h4>
            </div>
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
                    activeTab === item.id 
                      ? "bg-slate-900 text-white shadow-lg" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="mt-6 p-4 bg-teal-50 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-teal-600" />
                <span className="text-[11px] font-black text-teal-900">가이드</span>
              </div>
              <p className="text-[10px] font-bold text-teal-700 leading-relaxed">
                모든 항목은 자동으로 검증됩니다. 저장을 누르면 스토어에 즉시 반영됩니다.
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 space-y-8 min-w-0">
          
          {/* 1. 상품 기본 정보 */}
          <section id="section-basic" className={cn(adminUi.sectionCard, "p-8 md:p-10")}>
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

          {/* 2. 이미지 및 동영상 (Media Center) */}
          <section id="section-media" className={cn(adminUi.sectionCard, "p-8 md:p-10")}>
            <SectionHeader icon={ImageIcon} title="이미지 및 동영상" description="대표 이미지와 상세 갤러리를 관리합니다. 고화질 권장." />
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
              {/* Main Image Selection */}
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
                      <img src={imageUrl} alt="Main" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
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

              {/* Video & Additional Images */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <h4 className="text-[13px] font-black text-slate-900">상품 작동 영상</h4>
                  <div 
                    onClick={() => vidInputRef.current?.click()}
                    className="group relative aspect-video w-full rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden cursor-pointer hover:border-rose-400 transition-all shadow-inner"
                  >
                    {videoUrl ? (
                      <video src={videoUrl} className="h-full w-full object-cover" />
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
                      <div key={idx} className="group relative aspect-square rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden shadow-sm">
                        <img src={img} alt={`Additional ${idx + 1}`} className="h-full w-full object-cover" />
                        <button 
                          type="button" 
                          onClick={() => removeAdditionalImage(idx)} 
                          className="absolute top-1 right-1 h-5 w-5 rounded-full bg-white/90 text-slate-900 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center shadow-md hover:bg-rose-500 hover:text-white"
                        >
                          <X className="h-3 w-3" />
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
          <section id="section-price" className={cn(adminUi.sectionCard, "p-8 md:p-10")}>
            <SectionHeader icon={DollarSign} title="판매 정보" description="가격 정책 및 재고 수량을 설정합니다." badge="Price" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">판매 가격 (원)</label>
                <div className="relative">
                  <input
                    type="number"
                    name="price_krw"
                    defaultValue={product?.price_krw ?? ""}
                    className={cn("w-full h-14 pl-10 pr-5 rounded-2xl text-[15px] font-bold", adminUi.input)}
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₩</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">재고 수량</label>
                <input
                  type="number"
                  name="stock_quantity"
                  defaultValue={product?.stock_quantity ?? 999}
                  className={cn("w-full h-14 px-5 rounded-2xl text-[15px] font-bold", adminUi.input)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">정렬 순서</label>
                <input
                  type="number"
                  name="sort_order"
                  defaultValue={product?.sort_order ?? 0}
                  className={cn("w-full h-14 px-5 rounded-2xl text-[15px] font-bold", adminUi.input)}
                />
              </div>
              
              <div className="md:col-span-3 h-px bg-slate-100 my-2" />
              
              {/* Gold Link Options */}
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group w-fit">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      name="is_gold_linked" 
                      defaultChecked={product?.is_gold_linked === 1} 
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-amber-500 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                  </div>
                  <span className="text-[13px] font-black text-slate-900 group-hover:text-amber-600 transition-colors">금 시세 자동 연동</span>
                </label>
                <p className="text-[11px] font-bold text-slate-400 ml-14 leading-relaxed">활성화 시 실시간 금 가격과 중량을 곱하여 가격이 자동 계산됩니다.</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">중량 (g)</label>
                <input
                  type="number"
                  name="weight_grams"
                  step="0.01"
                  defaultValue={product?.weight_grams ?? ""}
                  className={cn("w-full h-14 px-5 rounded-2xl text-[15px] font-bold", adminUi.input)}
                  placeholder="예: 3.75"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">공임/기타 (원)</label>
                <input
                  type="number"
                  name="labor_fee_krw"
                  defaultValue={product?.labor_fee_krw ?? ""}
                  className={cn("w-full h-14 px-5 rounded-2xl text-[15px] font-bold", adminUi.input)}
                  placeholder="예: 50000"
                />
              </div>
            </div>
          </section>

          {/* 4. 옵션 설정 */}
          <section id="section-option" className={cn(adminUi.sectionCard, "p-8 md:p-10")}>
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
                  <Layers className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-[20px] font-black text-slate-900 tracking-tight">옵션 구성</h2>
                  <p className="text-[12px] font-bold text-slate-400 mt-0.5">선택사항별 가격 변동을 관리합니다.</p>
                </div>
              </div>
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
                   <p className="text-[11px] font-bold text-slate-300 mt-1">상단의 &apos;그룹 추가&apos; 버튼을 눌러보세요.</p>
                </div>
              ) : (
                options.map((group, gIdx) => (
                  <div key={group.id} className="relative bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden group/card transition-all hover:border-teal-200">
                    <div className="bg-slate-50/50 px-6 py-4 flex items-center justify-between border-b border-slate-100">
                      <div className="flex-1 flex items-center gap-4">
                        <span className="text-[10px] font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md">Option {gIdx + 1}</span>
                        <input
                          value={group.name}
                          onChange={(e) => updateGroupName(gIdx, e.target.value)}
                          className="bg-transparent border-none focus:ring-0 text-[15px] font-black text-slate-900 w-full"
                          placeholder="그룹명 (예: 색상, 사이즈)"
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeOptionGroup(gIdx)}
                        className="text-slate-300 hover:text-rose-500 transition-colors p-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="p-6 space-y-4">
                      {group.values.map((v, vIdx) => (
                        <div key={vIdx} className="flex gap-4 items-center bg-slate-50/30 p-3 rounded-2xl group/val hover:bg-slate-50 transition-colors">
                          <div className="flex-1">
                            <input
                              value={v.label}
                              onChange={(e) => updateOptionValue(gIdx, vIdx, "label", e.target.value)}
                              className="w-full bg-transparent border-none focus:ring-0 text-[13px] font-bold text-slate-700"
                              placeholder="항목명 (예: 블랙, XL)"
                            />
                          </div>
                          <div className="flex items-center gap-2 w-32">
                            <span className="text-[10px] font-black text-slate-400">+/-</span>
                            <input
                              type="number"
                              value={v.priceDeltaKrw}
                              onChange={(e) => updateOptionValue(gIdx, vIdx, "priceDeltaKrw", e.target.value)}
                              className="w-full bg-transparent border-none focus:ring-0 text-[13px] font-black text-teal-600 text-right"
                            />
                            <span className="text-[11px] font-bold text-slate-400">원</span>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => removeOptionValue(gIdx, vIdx)}
                            className="opacity-0 group-hover/val:opacity-100 text-slate-300 hover:text-rose-500 transition-all p-1"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      <button 
                        type="button" 
                        onClick={() => addOptionValue(gIdx)}
                        className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-100 text-[11px] font-black text-slate-400 hover:border-teal-200 hover:text-teal-600 hover:bg-teal-50/30 transition-all flex items-center justify-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        항목 추가
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* 5. 상세 설명 (Smart Editor Panel) */}
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
          <section id="section-display" className={cn(adminUi.sectionCard, "p-8 md:p-10")}>
            <SectionHeader icon={Monitor} title="노출 및 판매 설정" description="상품이 노출될 채널과 상태를 제어합니다." />
            <div className="space-y-10">
              <div className="space-y-4">
                <h4 className="text-[13px] font-black text-slate-900 flex items-center gap-2">
                  노출 채널 설정 <span className="text-slate-400 font-normal text-[10px]">(복수 선택 가능)</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {SUBJECT_KINDS.map((k) => (
                    <label
                      key={k}
                      className="group relative flex items-center gap-3 rounded-[24px] border-2 border-slate-100 bg-white px-5 py-4 text-[13px] font-black text-slate-600 cursor-pointer has-[:checked]:border-teal-500 has-[:checked]:shadow-lg has-[:checked]:shadow-teal-500/10 has-[:checked]:text-slate-900 transition-all hover:border-slate-300"
                    >
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          name={`kind_${k}`} 
                          defaultChecked={checkedModes.has(k)} 
                          className="sr-only peer" 
                        />
                        <div className="w-5 h-5 rounded-full border-2 border-slate-200 peer-checked:border-teal-500 peer-checked:bg-teal-500 transition-all flex items-center justify-center">
                          <CheckCircle2 className="h-3 w-3 text-white scale-0 peer-checked:scale-100 transition-transform" />
                        </div>
                      </div>
                      {subjectKindMeta[k].label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-8 rounded-[40px] bg-slate-900 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform">
                   <Monitor className="h-40 w-40" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <h4 className="text-lg font-black tracking-tight">즉시 판매 활성화</h4>
                    <p className="text-sm font-bold text-slate-400 leading-relaxed">설정 시 사용자의 스토어 화면에 즉시 상품이 노출되며 구매가 가능해집니다.</p>
                  </div>
                  <label className="flex items-center gap-4 cursor-pointer">
                    <span className="text-[12px] font-black text-slate-400">비활성</span>
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        name="active" 
                        defaultChecked={product == null || product.active === 1} 
                        className="sr-only peer"
                      />
                      <div className="w-16 h-8 bg-slate-700 rounded-full peer peer-checked:bg-teal-500 transition-all after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:after:translate-x-8" />
                    </div>
                    <span className="text-[12px] font-black text-teal-400">판매 중</span>
                  </label>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Naver Center Style Floating Action Bar */}
      <div className="fixed bottom-8 left-0 right-0 z-50 pointer-events-none">
        <div className="max-w-[1200px] mx-auto px-4 w-full pointer-events-auto">
          <div className="bg-white/80 backdrop-blur-2xl rounded-[32px] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white/50 flex items-center justify-between">
            <div className="flex items-center gap-3 px-6 border-r border-slate-100">
              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                <Info className="h-5 w-5 text-slate-400" />
              </div>
              <div>
                <p className="text-[11px] font-black text-slate-900 leading-tight">실시간 검증 완료</p>
                <p className="text-[9px] font-bold text-slate-400 mt-0.5">필수 항목 {isEdit ? "편집" : "등록"} 준비됨</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pr-2">
              <Link 
                href="/admin/shop/products" 
                className="h-14 px-8 rounded-2xl text-[13px] font-black text-slate-400 hover:text-slate-900 transition-colors flex items-center"
              >
                목록으로
              </Link>
              {isEdit && (
                <button
                  formAction={deleteShopProduct}
                  onClick={(e) => {
                    if (!confirm("정말 이 상품을 삭제하시겠습니까? 주문 내역이 있으면 삭제되지 않습니다.")) {
                      e.preventDefault();
                    }
                  }}
                  className="h-14 w-14 rounded-2xl bg-white border border-rose-100 text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center shadow-sm"
                  title="상품 삭제"
                >
                  <Trash2 className="h-5 w-5" />
                  <input type="hidden" name="product_id" value={product!.id} />
                </button>
              )}
              <button
                type="submit"
                disabled={isUploading}
                className="h-14 min-w-[200px] rounded-2xl bg-slate-900 hover:bg-teal-600 text-white px-12 text-[14px] font-black shadow-xl shadow-slate-900/10 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <Save className="h-5 w-5" />
                {isEdit ? "변경사항 저장하기" : "스토어 상품 등록"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
