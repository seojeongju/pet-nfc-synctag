"use client";

import { cn } from "@/lib/utils";

/** 관리자 테이블: 식별자(UID·id 등) + 그 아래 연결 맥락 1~N줄 */
export function AdminInlineContextBlock({
  primary,
  primaryMono = true,
  sublines = [],
  title,
  className,
}: {
  primary: string;
  primaryMono?: boolean;
  sublines?: (string | null | undefined)[];
  title?: string;
  className?: string;
}) {
  const lines = sublines.map((l) => (l ?? "").trim()).filter(Boolean);
  return (
    <div className={cn("min-w-0", className)} title={title ?? primary}>
      <p
        className={cn(
          "break-all text-[10px] font-bold leading-snug text-slate-800",
          primaryMono && "font-mono"
        )}
      >
        {primary}
      </p>
      {lines.length > 0 ? (
        <div className="mt-0.5 space-y-0.5">
          {lines.map((line, i) => (
            <p key={i} className="break-words text-[9px] font-bold leading-snug text-slate-500">
              {line}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
