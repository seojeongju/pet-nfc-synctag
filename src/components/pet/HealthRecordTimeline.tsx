"use client";

import { useTransition } from "react";
import { Syringe, Stethoscope, Scissors, StickyNote, Trash2, Loader2 } from "lucide-react";
import { deleteHealthRecord } from "@/app/actions/health-records";
import {
  healthRecordTypeLabel,
  healthRecordTypeColor,
  type HealthRecord,
  type HealthRecordType,
} from "@/lib/health-records-db";
import { cn } from "@/lib/utils";

const typeIcons: Record<HealthRecordType, React.ElementType> = {
  vaccine:  Syringe,
  medical:  Stethoscope,
  grooming: Scissors,
  note:     StickyNote,
};

interface HealthRecordTimelineProps {
  records: HealthRecord[];
  allowDelete?: boolean;
  onDelete?: () => void;
}

function TimelineItem({
  record,
  isLast,
  allowDelete,
  onDelete,
}: {
  record: HealthRecord;
  isLast: boolean;
  allowDelete: boolean;
  onDelete?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const Icon = typeIcons[record.type as HealthRecordType] ?? StickyNote;
  const color = healthRecordTypeColor[record.type as HealthRecordType] ?? healthRecordTypeColor.note;
  const label = healthRecordTypeLabel[record.type as HealthRecordType] ?? record.type;

  const handleDelete = () => {
    if (isPending) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", record.id);
      await deleteHealthRecord(fd);
      onDelete?.();
    });
  };

  return (
    <div className="relative flex gap-4 group">
      {/* 타임라인 선 */}
      {!isLast && (
        <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-slate-100 group-hover:bg-teal-100 transition-colors" />
      )}

      {/* 아이콘 */}
      <div
        className={cn(
          "relative z-10 w-10 h-10 rounded-[14px] border-2 flex items-center justify-center shrink-0 shadow-sm mt-1 transition-transform group-hover:scale-110",
          color.bg, color.text, color.border
        )}
      >
        <Icon className="w-4 h-4" />
      </div>

      {/* 내용 */}
      <div className="flex-1 min-w-0 bg-white rounded-[20px] border border-slate-100 px-4 py-3 shadow-sm space-y-1 group-hover:border-slate-200 transition-colors mb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-black text-slate-800 text-sm truncate">{record.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={cn(
                  "inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border",
                  color.bg, color.text, color.border
                )}
              >
                {label}
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                {record.record_date.slice(0, 10)}
              </span>
            </div>
          </div>

          {allowDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="shrink-0 w-7 h-7 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 hover:bg-rose-50 hover:text-rose-400 transition-colors"
              title="삭제"
            >
              {isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>

        {record.description && (
          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
            {record.description}
          </p>
        )}
      </div>
    </div>
  );
}

export function HealthRecordTimeline({
  records,
  allowDelete = false,
  onDelete,
}: HealthRecordTimelineProps) {
  if (records.length === 0) {
    return (
      <div className="py-10 flex flex-col items-center justify-center text-center space-y-3">
        <div className="w-14 h-14 rounded-[18px] bg-slate-50 flex items-center justify-center text-slate-300">
          <StickyNote className="w-7 h-7" />
        </div>
        <div>
          <p className="text-sm font-black text-slate-600">아직 기록이 없어요</p>
          <p className="text-xs text-slate-400 font-medium mt-1">
            예방접종, 진료, 미용 등 반려동물의 건강 기록을 남겨보세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0 pt-2">
      {records.map((record, idx) => (
        <TimelineItem
          key={record.id}
          record={record}
          isLast={idx === records.length - 1}
          allowDelete={allowDelete}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
