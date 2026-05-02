"use client";

import { useMemo, useState } from "react";

type Variant = "page" | "row";

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

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  if (variant === "row") {
    return (
      <div
        className="flex min-h-10 w-full min-w-0 flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-xl border border-amber-200 bg-amber-50/95 px-3 py-2 text-amber-900 shadow-sm"
        data-variant="row"
        role="status"
        aria-live="polite"
        aria-label={`${email} 임시 비밀번호`}
      >
        <span className="shrink-0 text-[10px] font-black uppercase tracking-wide text-amber-800/90">
          임시 비밀번호
        </span>
        <span className="min-w-0 max-w-full break-all text-center font-mono text-sm font-black tracking-tight text-amber-950 sm:text-sm">
          {temporaryPassword}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 rounded-lg border border-amber-300 bg-white px-2.5 py-1 text-[11px] font-black text-amber-900 hover:bg-amber-100"
        >
          {copyLabel}
        </button>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 break-all space-y-2"
      data-variant={variant}
    >
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
