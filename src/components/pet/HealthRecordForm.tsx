"use client";

import { useState, useTransition, useRef } from "react";
import { Syringe, Stethoscope, Scissors, StickyNote, Plus, Loader2, X } from "lucide-react";
import { createHealthRecord } from "@/app/actions/health-records";
import { cn } from "@/lib/utils";
import type { HealthRecordType } from "@/lib/health-records-db";

const typeConfig: { type: HealthRecordType; label: string; icon: React.ElementType; color: string }[] = [
  { type: "vaccine",  label: "예방접종", icon: Syringe,    color: "bg-emerald-50 text-emerald-700 border-emerald-200 data-[sel=true]:bg-emerald-500 data-[sel=true]:text-white data-[sel=true]:border-emerald-500" },
  { type: "medical",  label: "진료·치료", icon: Stethoscope, color: "bg-rose-50 text-rose-700 border-rose-200 data-[sel=true]:bg-rose-500 data-[sel=true]:text-white data-[sel=true]:border-rose-500" },
  { type: "grooming", label: "미용·목욕", icon: Scissors,   color: "bg-purple-50 text-purple-700 border-purple-200 data-[sel=true]:bg-purple-500 data-[sel=true]:text-white data-[sel=true]:border-purple-500" },
  { type: "note",     label: "메모",     icon: StickyNote,  color: "bg-amber-50 text-amber-700 border-amber-200 data-[sel=true]:bg-amber-500 data-[sel=true]:text-white data-[sel=true]:border-amber-500" },
];

interface HealthRecordFormProps {
  petId: string;
  onSuccess?: () => void;
}

export function HealthRecordForm({ petId, onSuccess }: HealthRecordFormProps) {
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<HealthRecordType>("vaccine");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("pet_id", petId);
    fd.set("type", selectedType);

    startTransition(async () => {
      try {
        await createHealthRecord(fd);
        formRef.current?.reset();
        setOpen(false);
        onSuccess?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
      }
    });
  };

  return (
    <div className="space-y-3">
      {/* 추가 버튼 토글 */}
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-center gap-2 h-12 rounded-[18px] border-2 border-dashed border-teal-200 bg-teal-50/50 text-teal-600 font-black text-sm hover:border-teal-400 hover:bg-teal-50 transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          기록 추가
        </button>
      ) : (
        <div className="rounded-[24px] border border-slate-100 bg-white shadow-sm p-5 space-y-4 animate-in slide-in-from-top-2 duration-300">
          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-black text-slate-800">새 건강 기록</p>
            <button
              type="button"
              onClick={() => { setOpen(false); setError(null); }}
              className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 유형 선택 */}
          <div className="grid grid-cols-4 gap-2">
            {typeConfig.map(({ type, label, icon: Icon, color }) => (
              <button
                key={type}
                type="button"
                data-sel={selectedType === type}
                onClick={() => setSelectedType(type)}
                className={cn(
                  "flex flex-col items-center gap-1.5 py-3 rounded-[14px] border-2 transition-all text-[10px] font-black uppercase tracking-wide",
                  color
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* 폼 */}
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
            <input type="hidden" name="pet_id" value={petId} />
            <input type="hidden" name="type" value={selectedType} />

            <input
              name="title"
              required
              placeholder="제목 (예: 광견병 3차 접종)"
              className="w-full h-12 rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-teal-300/50 transition"
            />
            <textarea
              name="description"
              placeholder="상세 내용 (선택)"
              rows={2}
              className="w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-teal-300/50 resize-none transition"
            />
            <input
              name="record_date"
              type="date"
              required
              defaultValue={new Date().toISOString().split("T")[0]}
              className="w-full h-12 rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-teal-300/50 transition"
            />

            {error && <p className="text-[11px] font-bold text-rose-500">{error}</p>}

            <button
              type="submit"
              disabled={isPending}
              className="w-full h-12 rounded-[18px] bg-slate-900 hover:bg-teal-500 text-white font-black text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {isPending ? "저장 중…" : "저장하기"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
