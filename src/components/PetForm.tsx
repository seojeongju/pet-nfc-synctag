"use client";

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { createPet, updatePet } from "@/app/actions/pet";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PawPrint, Camera, Loader2 } from "lucide-react";

interface PetFormProps {
    ownerId: string;
    initialData?: {
        id: string;
        name: string;
        breed?: string;
        medical_info?: string;
        emergency_contact?: string;
        photo_url?: string;
    };
}

export function PetForm({ ownerId, initialData }: PetFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: initialData || {
            name: "",
            breed: "",
            medical_info: "",
            emergency_contact: "",
        }
    });

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        try {
            if (initialData) {
                await updatePet(initialData.id, data);
            } else {
                await createPet(ownerId, data);
            }
            router.push("/dashboard");
            router.refresh();
        } catch (error) {
            console.error("Failed to save pet:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col items-center gap-6">
                <div className="relative group cursor-pointer">
                    <div className="w-32 h-32 rounded-[40px] bg-teal-50 border-2 border-dashed border-teal-200 flex items-center justify-center text-teal-400 group-hover:bg-teal-100 transition-colors overflow-hidden">
                        {initialData?.photo_url ? (
                            <img src={initialData.photo_url} alt="Pet" className="w-full h-full object-cover" />
                        ) : (
                            <PawPrint className="w-12 h-12" />
                        )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-teal-600 border border-slate-100 group-hover:scale-110 transition-transform">
                        <Camera className="w-5 h-5" />
                    </div>
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">아이 사진 등록 (선택)</p>
            </div>

            <div className="grid gap-6">
                <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-bold text-slate-700 ml-1">이름</Label>
                    <Input 
                        id="name" 
                        placeholder="아이의 이름을 입력하세요" 
                        {...register("name", { required: "이름은 필수입니다" })}
                        className="h-14 rounded-2xl border-slate-100 focus:ring-teal-500 shadow-sm"
                    />
                    {errors.name && <p className="text-xs text-rose-500 ml-1">{errors.name.message as string}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="breed" className="text-sm font-bold text-slate-700 ml-1">품종</Label>
                    <Input 
                        id="breed" 
                        placeholder="예: 푸들, 말티즈, 코리안 숏헤어" 
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
                    <Label htmlFor="medical_info" className="text-sm font-bold text-slate-700 ml-1">의료 정보 및 주의사항</Label>
                    <Textarea 
                        id="medical_info" 
                        placeholder="알레르기, 투약 정보 등 도움이 필요한 내용을 입력하세요" 
                        {...register("medical_info")}
                        className="min-h-[120px] rounded-2xl border-slate-100 focus:ring-teal-500 shadow-sm py-4"
                    />
                </div>
            </div>

            <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-16 rounded-[28px] bg-teal-600 hover:bg-teal-700 text-lg font-extrabold shadow-xl shadow-teal-100 transition-all active:scale-95 gap-3"
            >
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <PawPrint className="w-6 h-6" />}
                {initialData ? "정보 수정하기" : "아이 등록 완료"}
            </Button>
        </form>
    );
}
