"use client";
import { useState, useTransition, useEffect } from "react";
import { registerBulkTags, getAllTags } from "@/app/actions/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tag, Plus, Search, FileUp, CheckCircle, AlertCircle, Package } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminTagsPage() {
  const [uids, setUids] = useState("");
  const [tags, setTags] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    const results = await getAllTags();
    setTags(results);
  };

  const handleRegister = async () => {
    if (!uids.trim()) return;

    // Remove duplicates and white spaces
    const uidList = Array.from(new Set(
      uids.split(/[\n,]/).map(u => u.trim()).filter(u => u.length > 0)
    ));

    if (uidList.length === 0) return;

    startTransition(async () => {
      try {
        const result = await registerBulkTags(uidList);
        setMessage({ type: "success", text: `${result.count}개의 태그가 성공적으로 등록되었습니다. (Batch: ${result.batchId})` });
        setUids("");
        fetchTags();
      } catch (e: any) {
        setMessage({ type: "error", text: "태그 등록 중 오류가 발생했습니다." });
      }
    });
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 font-outfit">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">NFC 태그 인벤토리</h1>
          <p className="text-sm text-slate-500">시스템 전체 NFC 마스터 데이터 관리 및 신규 태그 등록</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bulk Input Form */}
        <Card className="rounded-[40px] border-none shadow-2xl shadow-slate-200/50 p-8 space-y-6 lg:col-span-1 h-fit">
          <div className="space-y-2">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Plus className="w-5 h-5 text-teal-500" />
              신규 태그 대량 등록
            </h3>
            <p className="text-xs text-slate-400 font-medium">NFC UID를 줄바꿈 또는 콤마(,)로 구분하여 입력하세요.</p>
          </div>

          <textarea
            value={uids}
            onChange={(e) => setUids(e.target.value)}
            placeholder="예: 04:A1:B2:C3, 04:D4:E5:F6..."
            className="w-full h-64 bg-slate-50 rounded-3xl p-6 text-sm border-2 border-slate-100 focus:border-teal-200 focus:ring-4 focus:ring-teal-50 outline-none transition-all resize-none shadow-inner"
          />

          {message && (
            <div className={cn(
              "p-4 rounded-2xl flex items-center gap-3 text-xs font-bold",
              message.type === "success" ? "bg-teal-50 text-teal-700" : "bg-rose-50 text-rose-700"
            )}>
              {message.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {message.text}
            </div>
          )}

          <Button 
            onClick={handleRegister} 
            disabled={isPending || !uids.trim()}
            className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-xl shadow-slate-200"
          >
            {isPending ? "등록 중..." : "태그 일괄 등록하기"}
          </Button>
        </Card>

        {/* Tags Inventory List */}
        <Card className="rounded-[40px] border-none shadow-2xl shadow-slate-200/50 p-8 space-y-6 lg:col-span-2">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Package className="w-5 h-5 text-teal-500" />
              등록된 태그 목록 ({tags.length})
            </h3>
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="UID 검색..." 
                    className="h-11 bg-slate-50 border-none rounded-2xl pl-10 pr-4 text-xs focus:ring-2 focus:ring-teal-200 transition-all outline-none"
                />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">NFC ID (UID)</th>
                  <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Owner / Pet</th>
                  <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {tags.length > 0 ? (
                  tags.map((tag) => (
                    <tr key={tag.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4">
                        <span className="font-mono text-sm font-bold text-slate-700">{tag.id}</span>
                        {tag.batch_id && (
                            <p className="text-[10px] text-slate-300 font-bold mt-1 uppercase tracking-tighter">{tag.batch_id}</p>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                          tag.status === 'active' ? "bg-teal-100 text-teal-700" : 
                          tag.status === 'unsold' ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500"
                        )}>
                          {tag.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {tag.pet_name ? (
                            <div className="space-y-0.5">
                                <p className="text-xs font-bold text-slate-800">{tag.pet_name}</p>
                                <p className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">{tag.owner_email}</p>
                            </div>
                        ) : (
                            <span className="text-[10px] font-bold text-slate-300 italic">No Match</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-xs font-medium text-slate-400">
                        {new Date(tag.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                    <tr>
                        <td colSpan={4} className="py-20 text-center text-sm font-bold text-slate-300">
                            등록된 태그 정보가 없습니다.
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
