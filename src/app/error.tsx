"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[app/error]", error?.digest, error?.message);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-4 px-4 py-16 text-center font-sans">
      <p className="text-lg font-black text-slate-900">문제가 발생했습니다</p>
      <p className="text-sm text-slate-600">
        잠시 후 다시 시도해 주세요. 계속되면 Cloudflare 로그 또는{" "}
        <code className="rounded bg-slate-100 px-1 text-xs">/api/diag</code>·
        <code className="rounded bg-slate-100 px-1 text-xs">/api/diag/rsc-probe</code>를 확인해 주세요.
      </p>
      {error?.digest ? (
        <p className="font-mono text-xs text-slate-400">Digest: {error.digest}</p>
      ) : null}
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full bg-teal-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-700"
        >
          다시 시도
        </button>
        <Link href="/" className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
          홈으로
        </Link>
      </div>
    </div>
  );
}