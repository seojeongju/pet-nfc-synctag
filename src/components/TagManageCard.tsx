"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { linkTag, unlinkTag } from "@/app/actions/tag";
import { Loader2, Plus, Trash2, Smartphone, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

interface TagManageCardProps {
    petId: string;
    existingTags: any[];
}

export function TagManageCard({ petId, existingTags }: TagManageCardProps) {
    const [isPending, startTransition] = useTransition();
    const [newTagId, setNewTagId] = useState("");
    const router = useRouter();

    const handleLink = async () => {
        if (!newTagId) return;
        startTransition(async () => {
            await linkTag(petId, newTagId);
            setNewTagId("");
            router.refresh();
        });
    };

    const handleUnlink = (tagId: string) => {
        startTransition(async () => {
            await unlinkTag(tagId);
            router.refresh();
        });
    };

    return (
        <Card className="border-none shadow-xl rounded-[32px] overflow-hidden bg-slate-50/50 backdrop-blur-sm">
            <CardContent className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                           <Smartphone className="w-5 h-5 text-teal-500" />
                           NFC 태그 관리
                        </h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">연결된 스마트 인식표</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {existingTags.length > 0 ? (
                        existingTags.map((tag) => (
                            <div key={tag.id} className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-slate-100 group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
                                        <Smartphone className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                           <span className="text-sm font-bold text-slate-700">{tag.id}</span>
                                           <ShieldCheck className="w-3 h-3 text-teal-500" />
                                        </div>
                                        <span className={tag.is_active ? "text-[10px] text-teal-500 font-bold uppercase tracking-widest" : "text-[10px] text-slate-300 font-bold uppercase"}>
                                            {tag.is_active ? "Active" : "Inactive"}
                                        </span>
                                    </div>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                    onClick={() => handleUnlink(tag.id)}
                                    disabled={isPending}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))
                    ) : (
                        <div className="py-8 text-center bg-white rounded-2xl border-2 border-dashed border-teal-50">
                            <p className="text-xs font-bold text-slate-400">연결된 태그가 없습니다.</p>
                        </div>
                    )}
                </div>

                <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-500 transition-colors">
                        <Plus className="w-5 h-5" />
                    </div>
                    <Input 
                        placeholder="새 태그 ID 입력" 
                        value={newTagId}
                        onChange={(e) => setNewTagId(e.target.value)}
                        className="h-14 pl-12 pr-12 rounded-2xl border-none shadow-inner bg-white focus:ring-2 focus:ring-teal-100 transition-all font-bold text-sm"
                    />
                    <button 
                        onClick={handleLink}
                        disabled={isPending || !newTagId}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-white rounded-xl shadow-lg shadow-teal-200 flex items-center justify-center transition-all disabled:opacity-50"
                    >
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-6 h-6" />}
                    </button>
                </div>
                
                <div className="text-center pt-2">
                   <p className="text-[10px] text-slate-300 font-medium">
                     *태그 ID는 제품 뒷면 혹은 스캔 시 표시되는 고유 번호입니다.
                   </p>
                </div>
            </CardContent>
        </Card>
    );
}
