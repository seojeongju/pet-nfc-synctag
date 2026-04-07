"use client";
import { useState, useTransition, useEffect } from "react";
import { registerBulkTags, getAllTags } from "@/app/actions/admin";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, CheckCircle, AlertCircle, Package, Database, Layers, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminTagsPage() {
  type AdminTag = {
    id: string;
    pet_name?: string | null;
    owner_email?: string | null;
    batch_id?: string | null;
    status: string;
    created_at: string;
  };
  const [uids, setUids] = useState("");
  const [tags, setTags] = useState<AdminTag[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    const results = await getAllTags();
    setTags(results);
  };

  const filteredTags = tags.filter(tag => 
    tag.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tag.pet_name && tag.pet_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleRegister = async () => {
    if (!uids.trim()) return;

    const uidList = Array.from(new Set(
      uids.split(/[\n,]/).map(u => u.trim()).filter(u => u.length > 0)
    ));

    if (uidList.length === 0) return;

    startTransition(async () => {
      try {
        const result = await registerBulkTags(uidList);
        setMessage({ type: "success", text: `${result.count}개의 태그가 성공적으로 등록되었습니다.` });
        setUids("");
        fetchTags();
      } catch {
        setMessage({ type: "error", text: "태그 등록 중 오류가 발생했습니다." });
      }
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } }
  };

  return (
    <div className="min-h-screen bg-slate-950 font-outfit pb-20 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-teal-500/5 blur-[120px] rounded-full pointer-events-none" />
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto px-6 pt-10 space-y-10 relative z-10"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
             <div className="flex items-center gap-2 text-teal-500 font-black text-[10px] uppercase tracking-[0.2em]">
                <Package className="w-3.5 h-3.5" />
                태그 자산
             </div>
             <h1 className="text-4xl font-black text-white tracking-tight">태그 인벤토리</h1>
             <p className="text-slate-500 text-sm font-bold">시스템 전체 NFC 마스터 데이터 관리 및 인벤토리 추적</p>
          </div>
          
          <Link href="/admin" className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-white transition-colors group">
             <div className="w-10 h-10 rounded-2xl glass-dark flex items-center justify-center group-hover:scale-110 transition-transform">
                <Layers className="w-4 h-4" />
             </div>
             대시보드
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Bulk Input Form */}
          <motion.div variants={itemVariants} className="lg:col-span-1 h-fit">
            <Card className="bg-slate-900 border-white/5 rounded-[40px] p-8 space-y-7 shadow-2xl relative overflow-hidden">
              <div className="space-y-2 relative z-10">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-teal-400" />
                  신규 태그 등록
                </h3>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">NFC UID 대량 등록</p>
              </div>

              <div className="relative z-10">
                <textarea
                  value={uids}
                  onChange={(e) => setUids(e.target.value)}
                  placeholder="예: 04:A1:B2:C3, 04:D4:E5:F6..."
                  className="w-full h-80 bg-slate-950/80 border border-white/5 rounded-[32px] p-6 text-sm font-mono text-teal-400/80 focus:border-teal-500/50 focus:ring-4 focus:ring-teal-500/5 outline-none transition-all resize-none shadow-inner custom-scrollbar"
                />
              </div>

              <AnimatePresence>
                {message && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn(
                      "p-4 rounded-2xl flex items-center gap-3 text-xs font-bold relative z-10",
                      message.type === "success" ? "bg-teal-500/10 text-teal-400" : "bg-rose-500/10 text-rose-400"
                    )}
                  >
                    {message.type === "success" ? <CheckCircle className="w-4 h-4 hover:scale-110 transition-transform" /> : <AlertCircle className="w-4 h-4" />}
                    {message.text}
                  </motion.div>
                )}
              </AnimatePresence>

              <Button 
                onClick={handleRegister} 
                disabled={isPending || !uids.trim()}
                className="w-full h-16 rounded-[24px] bg-white hover:bg-teal-500 text-slate-950 font-black shadow-xl hover:text-white transition-all active:scale-95 group relative z-10"
              >
                {isPending ? "시스템 주입 중..." : "태그 인벤토리 등록"}
                <ArrowUpRight className="ml-2 w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
              </Button>

              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 blur-3xl pointer-events-none" />
            </Card>
          </motion.div>

          {/* Tags Inventory List */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="bg-slate-900/40 border-white/5 rounded-[40px] p-8 space-y-8 shadow-2xl backdrop-blur-sm h-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-2">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-white flex items-center gap-2">
                    <Database className="w-5 h-5 text-teal-400" />
                    자산 목록 ({filteredTags.length})
                  </h3>
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">마스터 데이터 목록</p>
                </div>
                <div className="relative group min-w-[240px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="UID 또는 펫 이름 검색..." 
                        className="w-full h-12 bg-slate-950/80 border border-white/5 rounded-2xl pl-12 pr-4 text-xs font-bold text-slate-300 focus:ring-2 focus:ring-teal-500/20 transition-all outline-none"
                    />
                </div>
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="py-5 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] w-[40%]">태그 UID</th>
                      <th className="py-5 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">상태</th>
                      <th className="py-5 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">연결 정보</th>
                      <th className="py-5 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">등록일</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredTags.length > 0 ? (
                      filteredTags.map((tag) => (
                        <tr key={tag.id} className="group hover:bg-white/5 transition-all duration-300">
                          <td className="py-5 px-6">
                            <div className="flex items-center gap-3">
                               <div className="w-2 h-2 rounded-full bg-slate-700 group-hover:bg-teal-500 transition-colors shadow-[0_0_8px_rgba(20,184,166,0)] group-hover:shadow-[0_0_8px_rgba(20,184,166,0.5)]" />
                               <span className="font-mono text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{tag.id}</span>
                            </div>
                            {tag.batch_id && (
                                <p className="text-[9px] text-slate-600 font-black mt-1 uppercase tracking-tighter ml-5">배치: {tag.batch_id}</p>
                            )}
                          </td>
                          <td className="py-5 px-6">
                            <span className={cn(
                              "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                              tag.status === 'active' ? "bg-teal-500/10 text-teal-400 border-teal-500/20 shadow-[0_0_15px_rgba(20,184,166,0.1)]" : 
                              tag.status === 'unsold' ? "bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]" : "bg-slate-800 text-slate-500 border-transparent"
                            )}>
                              {tag.status}
                            </span>
                          </td>
                          <td className="py-5 px-6">
                            {tag.pet_name ? (
                                <div className="space-y-0.5">
                                    <p className="text-xs font-black text-white">{tag.pet_name}</p>
                                    <p className="text-[10px] text-slate-500 font-bold truncate max-w-[150px]">{tag.owner_email}</p>
                                </div>
                            ) : (
                                <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">미할당</span>
                            )}
                          </td>
                          <td className="py-5 px-6 text-[10px] font-black text-slate-600 uppercase tabular-nums">
                            {new Date(tag.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                        <tr>
                            <td colSpan={4} className="py-24 text-center">
                               <div className="flex flex-col items-center gap-3 opacity-20">
                                  <Database className="w-12 h-12 text-slate-400" />
                                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">등록된 인벤토리가 없습니다</p>
                               </div>
                            </td>
                        </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

const Link = ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
);
