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
  Sparkles,
  ExternalLink,
  Package,
  Save,
  Trash2,
  LayoutGrid,
  DollarSign,
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
import { nanoid } from "nanoid";

function kindsChecked(row: AdminShopProductRow | null): Set<SubjectKind> {
function kindsChecked(product: AdminShopProductRow | null): Set<SubjectKind> {
  if (!product?.target_modes) return new Set();
  try {
    const arr = JSON.parse(product.target_modes);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

const SectionHeader = ({ icon: Icon, title, description }: { icon: LucideIcon, title: string, description: string }) => (
  <div className="flex items-center gap-4 mb-6">
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 shadow-sm ring-1 ring-teal-100">
      <Icon className="h-6 w-6" />
    </div>
    <div>
      <h2 className="text-[18px] font-black text-slate-900 leading-tight">{title}</h2>
      <p className="text-[12px] font-bold text-slate-400 mt-0.5">{description}</p>
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
    setOptions(prev => [...prev, { id: nanoid(8), name: "신규 옵션", values: [{ label: "기본값", priceDeltaKrw: 0 }] }]);
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
    <form action={saveShopProduct} className="relative pb-32" noValidate>
      {/* Hidden inputs for state synchronization */}
      {isEdit && <input type="hidden" name="id" value={product!.id} />}
      <input type="hidden" name="content_html" value={contentHtml} />
      <input type="hidden" name="image_url" value={imageUrl} />
      <input type="hidden" name="video_url" value={videoUrl} />
      <input type="hidden" name="additional_images" value={JSON.stringify(additionalImages)} />
      <input type="hidden" name="options_json" value={JSON.stringify(options)} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Main Content */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* 1. 상품 정체성 */}
          <section className={cn(adminUi.sectionCard, "p-8")}>
            <SectionHeader icon={Package} title="상품 정체성" description="상품의 이름과 URL, 간략한 소개를 작성하세요." />
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">상품명</label>
                  <input
                    name="name"
                    defaultValue={product?.name ?? ""}
                    className={cn("w-full h-12 px-4 rounded-2xl", adminUi.input)}
                    placeholder="예: 링크유-펫 NFC 안심 세트"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">URL 슬러그</label>
                  <div className="relative">
                    <input
                      name="slug"
                      defaultValue={product?.slug ?? ""}
                      className={cn("w-full h-12 pl-4 pr-10 rounded-2xl font-mono", adminUi.input)}
                      placeholder="pet-nfc-starter"
                    />
                    <ExternalLink className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">간략 요약 (목록용)</label>
                <textarea
                  name="description"
                  defaultValue={product?.description ?? ""}
                  rows={3}
                  className={cn("w-full p-4 rounded-2xl resize-none", adminUi.input)}
                  placeholder="목록에서 상품 이름 아래에 표시될 매력적인 한 줄 설명을 적어주세요."
                />
              </div>
            </div>
          </section>

          {/* 2. 미디어 센터 */}
          <section className={cn(adminUi.sectionCard, "p-8")}>
            <SectionHeader icon={ImageIcon} title="미디어 센터" description="대표 사진과 상세 이미지를 관리합니다." />
            
            <div className="space-y-8">
              {/* 대표 이미지 & 영상 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">메인 대표 이미지</label>
                  <div 
                    onClick={() => imgInputRef.current?.click()}
                    className="aspect-square rounded-[32px] bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-teal-50 hover:border-teal-300 transition-all group"
                  >
                    {imageUrl ? (
                      <img src={imageUrl} className="h-full w-full object-cover" />
                    ) : (
                      <>
                        <div className="p-3 rounded-full bg-white shadow-sm group-hover:scale-110 transition-transform">
                          <Upload className="h-6 w-6 text-slate-400" />
                        </div>
                        <span className="text-[11px] font-black text-slate-400">사진 업로드</span>
                      </>
                    )}
                  </div>
                  <input type="file" ref={imgInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, "main")} />
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">작동 홍보 영상</label>
                  <div className="aspect-square rounded-[32px] bg-slate-900 border border-slate-800 overflow-hidden flex flex-col items-center justify-center gap-3 relative shadow-inner group">
                    {videoUrl ? (
                      <video src={videoUrl} className="h-full w-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <div className="inline-flex p-3 rounded-full bg-slate-800 mb-2 group-hover:scale-110 transition-transform">
                          <Video className="h-6 w-6 text-slate-500" />
                        </div>
                        <p className="text-[11px] font-black text-slate-600 block">영상이 없습니다</p>
                      </div>
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => vidInputRef.current?.click()}
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-[10px] font-black px-4 py-2 rounded-full border border-white/10 transition-all opacity-0 group-hover:opacity-100"
                    >
                      영상 파일 업로드
                    </button>
                    {videoUrl && (
                      <button type="button" onClick={() => setVideoUrl("")} className="absolute top-4 right-4 h-8 w-8 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 z-10">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <input type="file" ref={vidInputRef} className="hidden" accept="video/*" onChange={(e) => handleFileUpload(e, "video")} />
                </div>
              </div>

              {/* 추가 이미지 갤러리 */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">상세 추가 이미지 갤러리</label>
                  <span className="text-[11px] font-bold text-slate-400">{additionalImages.length}개</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {additionalImages.map((img, idx) => (
                    <div key={idx} className="group relative aspect-square rounded-[24px] bg-white p-1 border border-slate-100 shadow-sm hover:shadow-md transition-all">
                      <img src={img} className="h-full w-full object-cover rounded-[20px]" />
                      <button
                        type="button"
                        onClick={() => setAdditionalImages(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-rose-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg hover:scale-110"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => addImgInputRef.current?.click()}
                    className="aspect-square rounded-[24px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 hover:border-teal-400 hover:bg-teal-50/50 transition-all group disabled:opacity-50"
                  >
                    <Plus className="h-6 w-6 text-slate-300 group-hover:text-teal-500 transition-colors" />
                    <span className="text-[10px] font-black text-slate-400">사진 추가</span>
                  </button>
                  <input type="file" ref={addImgInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, "additional")} />
                </div>
              </div>
            </div>
          </section>

          {/* 3. 상세 페이지 빌더 */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <SectionHeader icon={FileText} title="상세 페이지 빌더" description="사용자에게 보여줄 아름다운 상세 페이지를 구성하세요." />
              <button
                type="button"
                onClick={applyTemplate}
                className="flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2 text-[12px] font-black text-teal-800 hover:bg-teal-100 transition-all"
              >
                <Sparkles className="h-4 w-4" /> 스마트 템플릿 적용
              </button>
            </div>
            
            <div className="rounded-[32px] overflow-hidden border border-slate-100 shadow-xl">
              <ProductContentEditorPanel
                contentHtml={contentHtml}
                onContentChange={setContentHtml}
                showPreview={showPreview}
                onTogglePreview={() => setShowPreview(!showPreview)}
                onApplyTemplate={applyTemplate}
              />
            </div>
          </section>
        </div>

        {/* Right Column: Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* 4. 판매 및 재고 설정 */}
          <section className={cn(adminUi.sectionCard, "p-8")}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <DollarSign className="h-5 w-5" />
              </div>
              <h3 className="text-md font-black text-slate-900">판매 및 재고</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">판매가 (KRW)</label>
                <div className="relative">
                  <input
                    name="price_krw"
                    type="number"
                    defaultValue={product?.price_krw ?? 0}
                    className={cn("w-full h-12 pl-4 pr-10 rounded-2xl font-mono text-lg font-black", adminUi.input)}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-300">원</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">재고 수량</label>
                <div className="relative">
                  <input
                    name="stock_quantity"
                    type="number"
                    defaultValue={product?.stock_quantity ?? 999}
                    className={cn("w-full h-12 pl-4 pr-10 rounded-2xl font-mono", adminUi.input)}
                  />
                  <Package className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">노출 우선순위</label>
                <input
                  name="sort_order"
                  type="number"
                  defaultValue={product?.sort_order ?? 0}
                  className={cn("w-full h-12 px-4 rounded-2xl font-mono", adminUi.input)}
                />
              </div>
            </div>
          </section>

          {/* 5. 노출 모드 관리 */}
          <section className={cn(adminUi.sectionCard, "p-8")}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <LayoutGrid className="h-5 w-5" />
              </div>
              <h3 className="text-md font-black text-slate-900">노출 모드</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {SUBJECT_KINDS.map((k) => (
                <label
                  key={k}
                  className="group relative flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-[11px] font-black text-slate-600 cursor-pointer has-[:checked]:border-teal-300 has-[:checked]:bg-teal-50 has-[:checked]:text-teal-800 transition-all"
                >
                  <input type="checkbox" name={`kind_${k}`} defaultChecked={checkedModes.has(k)} className="w-4 h-4 rounded-lg border-slate-300 text-teal-600 focus:ring-teal-500" />
                  {subjectKindMeta[k].label}
                </label>
              ))}
            </div>
          </section>

          {/* 6. 옵션 센터 */}
          <section className={cn(adminUi.sectionCard, "p-8")}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <Plus className="h-5 w-5" />
                </div>
                <h3 className="text-md font-black text-slate-900">옵션 구성</h3>
              </div>
              <button type="button" onClick={addOptionGroup} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                <Plus className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-6">
              {options.map((group, gIdx) => (
                <div key={group.id} className="space-y-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 relative group/opt">
                  <button type="button" onClick={() => removeOptionGroup(gIdx)} className="absolute top-2 right-2 h-6 w-6 flex items-center justify-center text-slate-300 hover:text-rose-500 opacity-0 group-hover/opt:opacity-100 transition-all">
                    <X className="h-4 w-4" />
                  </button>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">옵션 그룹명</label>
                    <input
                      value={group.name}
                      onChange={(e) => updateGroupName(gIdx, e.target.value)}
                      className="w-full bg-transparent border-b border-slate-200 focus:border-teal-500 outline-none text-[12px] font-black py-1 transition-all"
                      placeholder="예: 색상"
                    />
                  </div>
                  <div className="space-y-2">
                    {group.values.map((v, vIdx) => (
                      <div key={vIdx} className="flex gap-2 items-center">
                        <input
                          value={v.label}
                          onChange={(e) => updateOptionValue(gIdx, vIdx, "label", e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded-lg h-8 px-2 text-[11px] font-bold"
                          placeholder="항목"
                        />
                        <input
                          type="number"
                          value={v.priceDeltaKrw}
                          onChange={(e) => updateOptionValue(gIdx, vIdx, "priceDeltaKrw", e.target.value)}
                          className="w-20 bg-white border border-slate-200 rounded-lg h-8 px-2 text-[11px] font-mono"
                        />
                        <button type="button" onClick={() => removeOptionValue(gIdx, vIdx)} className="text-slate-300 hover:text-rose-500">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => addOptionValue(gIdx)} className="w-full h-8 rounded-lg border border-dashed border-slate-300 text-[10px] font-black text-slate-400 hover:bg-white transition-all">
                      항목 추가 +
                    </button>
                  </div>
                </div>
              ))}
              {options.length === 0 && (
                <p className="text-center py-8 text-[11px] font-bold text-slate-300 italic">추가 옵션이 없습니다.</p>
              )}
            </div>
          </section>

          {/* 위험 영역 (편집 시에만) */}
          {isEdit && (
            <div className="p-6 rounded-[32px] border-2 border-dashed border-rose-100 bg-rose-50/20">
              <h4 className="text-[11px] font-black text-rose-700 uppercase mb-2">위험 영역</h4>
              <p className="text-[10px] font-bold text-rose-800/60 leading-relaxed mb-4">상품을 완전히 삭제합니다. 주문 이력이 있으면 삭제할 수 없습니다.</p>
              <form action={deleteShopProduct}>
                <input type="hidden" name="product_id" value={product!.id} />
                <button
                  type="submit"
                  className="w-full h-10 rounded-xl bg-white border border-rose-200 text-[11px] font-black text-rose-600 hover:bg-rose-600 hover:text-white transition-all"
                  onClick={(e) => { if (!confirm("정말 삭제하시겠습니까?")) e.preventDefault(); }}
                >
                  <Trash2 className="h-3.5 w-3.5 inline mr-1" /> 상품 삭제
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-50">
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-[32px] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-6 px-4 border-r border-white/10">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input 
                  type="checkbox" 
                  name="active" 
                  defaultChecked={product == null || product.active === 1} 
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-teal-500 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-black text-white group-hover:text-teal-400 transition-colors">활성화 상태</span>
                <span className="text-[9px] font-bold text-slate-400">체크 시 즉시 노출</span>
              </div>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              href="/admin/shop/products" 
              className="text-[13px] font-black text-slate-400 hover:text-white px-6 transition-colors"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={isUploading}
              className="h-14 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-900 px-12 text-[14px] font-black shadow-lg shadow-teal-500/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="h-5 w-5" />
              {isEdit ? "변경사항 저장하기" : "신규 상품 등록"}
            </button>
          </div>
        </div>
      </div>

      {/* Styles for preview are handled via Tailwind arbitrary variants in ProductContentEditorPanel wrapper */}
    </form>
  );
}
