"use client";

import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createPetSafe, updatePetSafe, uploadToR2 } from "@/app/actions/pet";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useRef } from "react";
import { PawPrint, Camera, Loader2, X, UserRound, Baby, Briefcase, Gem } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { parseSubjectKind, subjectKindMeta, type SubjectKind } from "@/lib/subject-kind";

const formIcons: Record<SubjectKind, LucideIcon> = {
    pet: PawPrint,
    elder: UserRound,
    child: Baby,
    luggage: Briefcase,
    gold: Gem,
};

interface PetFormProps {
    ownerId: string;
    subjectKind?: SubjectKind;
    tenantId?: string | null;
    writeLocked?: boolean;
    initialData?: {
        id: string;
        name: string;
        breed?: string;
        medical_info?: string;
        emergency_contact?: string;
        photo_url?: string;
    };
}
type PetFormValues = {
    name: string;
    breed?: string;
    medical_info?: string;
    emergency_contact?: string;
};

export function PetForm({ ownerId, subjectKind: kindProp, tenantId, initialData, writeLocked = false }: PetFormProps) {
    const router = useRouter();
    const subjectKind = parseSubjectKind(kindProp);
    const meta = subjectKindMeta[subjectKind];
    const FormIcon = formIcons[subjectKind];
    const [isLoading, setIsLoading] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.photo_url || null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const { register, handleSubmit, formState: { errors } } = useForm<PetFormValues>({
        defaultValues: initialData || {
            name: "",
            breed: "",
            medical_info: "",
            emergency_contact: "",
        }
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const onSubmit = async (data: PetFormValues) => {
        if (writeLocked) return;
        setSubmitError(null);
        setIsLoading(true);
        try {
            let photoUrl = initialData?.photo_url;

            // 이미지가 새로 선택되었을 경우 업로드를 진행합니다.
            if (selectedFile) {
                const formData = new FormData();
                formData.append("file", selectedFile);
                const uploadResult = await uploadToR2(formData);
                if (uploadResult) {
                    photoUrl = uploadResult;
                }
            }

            const petData = {
                ...data,
                photo_url: photoUrl,
                subject_kind: subjectKind,
                tenant_id: tenantId ?? undefined,
            };

            if (initialData) {
                const result = await updatePetSafe(initialData.id, petData);
                if (!result.ok) {
                    setSubmitError(result.error);
                    return;
                }
            } else {
                const result = await createPetSafe(ownerId, petData);
                if (!result.ok) {
                    setSubmitError(result.error);
                    return;
                }
            }
            const tenantQs = tenantId ? `?tenant=${encodeURIComponent(tenantId)}` : "";
            // 중간 /dashboard 리다이렉트 체인을 거치지 않고 목적지로 바로 이동해
            // 등록 직후 RSC 재렌더 실패 가능성을 줄입니다.
            router.push(`/dashboard/${subjectKind}${tenantQs}`);
        } catch (error) {
            console.error("Failed to save pet:", error);
            setSubmitError(
                error instanceof Error && error.message
                    ? error.message
                    : "저장에 실패했습니다. 잠시 후 다시 시도해 주세요."
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {writeLocked ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
                    조직이 중지 상태라 저장이 잠겨 있습니다. 조회만 가능합니다.
                </div>
            ) : null}
            <fieldset disabled={writeLocked} className="space-y-8">
            <div className="flex flex-col items-center gap-6">
                <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                />
                <div 
                    className="relative group cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="relative w-32 h-32 rounded-[40px] bg-teal-50 border-2 border-dashed border-teal-200 flex items-center justify-center text-teal-400 group-hover:bg-teal-100 transition-colors overflow-hidden">
                        {previewUrl ? (
                            <Image
                                src={previewUrl}
                                alt="미리보기"
                                fill
                                className="object-cover"
                                unoptimized
                                sizes="128px"
                            />
                        ) : (
                            <FormIcon className="w-12 h-12" />
                        )}
                    </div>
                    {previewUrl && (
                        <div 
                            className="absolute -top-2 -right-2 w-8 h-8 bg-rose-500 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-rose-600 transition-colors z-10"
                            onClick={(e) => {
                                e.stopPropagation();
                                setPreviewUrl(null);
                                setSelectedFile(null);
                            }}
                        >
                            <X className="w-4 h-4" />
                        </div>
                    )}
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-teal-600 border border-slate-100 group-hover:scale-110 transition-transform">
                        <Camera className="w-5 h-5" />
                    </div>
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {previewUrl ? "사진 변경" : "사진 등록 (선택)"}
                </p>
            </div>

            <div className="grid gap-6">
                <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-bold text-slate-700 ml-1">이름</Label>
                    <Input 
                        id="name" 
                        placeholder={subjectKind === "luggage" ? "예: 캐리어 블루" : "이름을 입력하세요"}
                        {...register("name", { required: "이름은 필수입니다" })}
                        className="h-14 rounded-2xl border-slate-100 focus:ring-teal-500 shadow-sm"
                    />
                    {errors.name && <p className="text-xs text-rose-500 ml-1">{errors.name.message as string}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="breed" className="text-sm font-bold text-slate-700 ml-1">
                        {subjectKind === "pet" ? "품종" : "비고 · 관계"}
                    </Label>
                    <Input 
                        id="breed" 
                        placeholder={
                            subjectKind === "pet"
                                ? "예: 푸들, 말티즈"
                                : "예: 부모, 보조 연락처 메모"
                        }
                        {...register("breed")}
                        className="h-14 rounded-2xl border-slate-100 focus:ring-teal-500 shadow-sm"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="emergency_contact" className="text-sm font-bold text-slate-700 ml-1">비상 연락처</Label>
                    <Input 
                        id="emergency_contact" 
                        placeholder="발견 시 연락받을 전화번호" 
                        {...register("emergency_contact")}
                        className="h-14 rounded-2xl border-slate-100 focus:ring-teal-500 shadow-sm"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="medical_info" className="text-sm font-bold text-slate-700 ml-1">
                        {subjectKind === "pet"
                            ? "의료 정보 및 주의사항"
                            : subjectKind === "elder"
                              ? "건강 · 복약 · 특이사항"
                              : "추가 메모"}
                    </Label>
                    <Textarea 
                        id="medical_info" 
                        placeholder={
                            subjectKind === "pet"
                                ? "알레르기, 투약 정보 등"
                                : "도움이 될 만한 정보를 입력하세요"
                        }
                        {...register("medical_info")}
                        className="min-h-[120px] rounded-2xl border-slate-100 focus:ring-teal-500 shadow-sm py-4"
                    />
                </div>
            </div>

            <button 
                type="submit" 
                disabled={writeLocked || isLoading}
                className="w-full h-16 rounded-[28px] bg-teal-600 hover:bg-teal-700 text-lg font-extrabold shadow-xl shadow-teal-100 transition-all active:scale-95 gap-3 text-white flex items-center justify-center"
            >
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <FormIcon className="w-6 h-6" />}
                {initialData ? (
                    "정보 수정하기"
                ) : (
                    <span className="text-center leading-tight">
                        <span className="block">{meta.label} 등록</span>
                        <span className="block">완료</span>
                    </span>
                )}
            </button>
            {submitError ? (
                <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                    {submitError}
                </p>
            ) : null}
            </fieldset>
        </form>
    );
}
