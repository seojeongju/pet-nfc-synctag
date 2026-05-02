"use client";

import { useEffect, useMemo, useState } from "react";
import { clearAdminTenantPwFlashCookie } from "@/app/actions/admin-tenants";
import { cn } from "@/lib/utils";

type Variant = "page" | "inline";

export default function AdminTenantPasswordFlash({
  email,
  temporaryPassword,
  variant = "page",
}: {
  email: string;
  temporaryPassword: string;
  variant?: Variant;
}) {
  const [copied, setCopied] = useState(false);
  const copyLabel = useMemo(() => (copied ? "복사됨" : "복사"), [copied]);

  useEffect(() => {
    void clearAdminTenantPwFlashCookie();
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 break-all space-y-2",
        variant === "inline" && "mt-3 border-amber-300 shadow-sm ring-1 ring-amber-200/80"
      )}
      data-variant={variant}
    >
      {variant === "inline" ? (
        <p className="text-[11px] font-black uppercase tracking-wide text-amber-900">
          방금 발급된 임시 비밀번호
        </p>
      ) : null}
      <p>조직관리자 비밀번호 재생성 완료: {email}</p>
      <div className="flex flex-wrap items-center gap-2">
        <p className="min-w-0 flex-1">
          임시 비밀번호:{" "}
          <span className="font-mono font-black tracking-tight">{temporaryPassword}</span>
        </p>
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 h-9 rounded-xl border border-amber-300 bg-white px-3 text-xs font-black text-amber-900 hover:bg-amber-100"
        >
          {copyLabel}
        </button>
      </div>
      <p className="text-[12px] font-semibold text-amber-700">
        보안상 이 비밀번호는 안전한 채널로만 전달하고, 전달 후 즉시 화면에서 이탈하세요.
      </p>
    </div>
  );
}
