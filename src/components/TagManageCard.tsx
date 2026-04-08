"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { linkTag, unlinkTag } from "@/app/actions/tag";
import { Loader2, Plus, Trash2, Smartphone, ShieldCheck, Box, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface TagManageCardProps {
    petId: string;
    existingTags: Array<{ id: string; is_active?: boolean }>;
    writeLocked?: boolean;
}

export function TagManageCard({ petId, existingTags, writeLocked = false }: TagManageCardProps) {
    const [isPending, startTransition] = useTransition();
    const [newTagId, setNewTagId] = useState("");
    const router = useRouter();

    const handleLink = async () => {
        if (writeLocked) return;
        if (!newTagId) return;
        startTransition(async () => {
            await linkTag(petId, newTagId);
            setNewTagId("");
            router.refresh();
        });
    };

    const handleUnlink = (tagId: string) => {
        if (writeLocked) return;
        startTransition(async () => {
            await unlinkTag(tagId);
            router.refresh();
        });
    };

    return (
        <Card className="border-none shadow-app rounded-[40px] overflow-hidden bg-white/90 backdrop-blur-md relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 blur-3xl pointer-events-none" />
            
            <CardContent className="p-8 space-y-7 relative z-10">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-teal-600 font-black text-[10px] uppercase tracking-[0.2em]">
                           <Zap className="w-3.5 h-3.5" />
                           Smart Connect
                        </div>
                        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
                           NFC 태그 관리
                        </h3>
                        <p className="text-[11px] font-bold text-slate-400">아이의 정보를 담은 스마트 인식표 목록</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {writeLocked ? (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700">
                            조직이 중지 상태라 태그 연결/해제는 잠겨 있습니다.
                        </div>
                    ) : null}
                    <AnimatePresence mode="popLayout">
                        {existingTags.length > 0 ? (
                            existingTags.map((tag, index) => (
                                <motion.div 
                                    key={tag.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex items-center justify-between p-5 bg-white rounded-[24px] shadow-sm border border-slate-100 group hover:shadow-md transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-500 transition-colors">
                                            <Smartphone className="w-6 h-6" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-2">
                                               <span className="text-sm font-black text-slate-700">{tag.id}</span>
                                               <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                               <span className={cn(
                                                    "w-1.5 h-1.5 rounded-full",
                                                    tag.is_active ? "bg-teal-500 animate-pulse" : "bg-slate-300"
                                               )} />
                                               <span className={cn(
                                                    "text-[9px] font-black uppercase tracking-widest",
                                                    tag.is_active ? "text-teal-500" : "text-slate-400"
                                               )}>
                                                    {tag.is_active ? "Verified & Active" : "Inactive"}
                                               </span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="w-10 h-10 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all focus:ring-0"
                                        onClick={() => handleUnlink(tag.id)}
                                        disabled={writeLocked || isPending}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </motion.div>
                            ))
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="py-12 flex flex-col items-center gap-4 bg-slate-50/50 rounded-[32px] border-2 border-dashed border-slate-100"
                            >
                                <Box className="w-12 h-12 text-slate-200" />
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest text-center">
                                   연결된 태그 데이터가 <br /> 없습니다.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="relative group pt-2">
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-500 transition-colors z-10">
                        <Plus className="w-5 h-5" />
                    </div>
                    <Input 
                        placeholder="새 태그 ID 입력 (뒷면 참조)" 
                        value={newTagId}
                        onChange={(e) => setNewTagId(e.target.value)}
                        disabled={writeLocked}
                        className="h-16 pl-14 pr-16 rounded-[24px] border-none shadow-inner bg-slate-50 focus:bg-white focus:ring-4 focus:ring-teal-500/10 transition-all font-bold text-sm placeholder:text-slate-300"
                    />
                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleLink}
                        disabled={writeLocked || isPending || !newTagId}
                        className="absolute right-3 top-3 bottom-3 w-10 bg-slate-900 hover:bg-teal-500 text-white rounded-2xl shadow-lg flex items-center justify-center transition-all disabled:opacity-30 z-10"
                    >
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-5 h-5" />}
                    </motion.button>
                </div>
                
                <div className="text-center pt-2">
                   <p className="text-[10px] text-slate-300 font-bold uppercase tracking-tighter opacity-70">
                     * NFC Secure Link Protocol Enabled
                   </p>
                </div>
            </CardContent>
        </Card>
    );
}
