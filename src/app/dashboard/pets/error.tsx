"use client";

import { useEffect } from "react";
import Link from "next/link";
export default function PetsSegmentError({ error, reset }: { error: Error & { digest?: string }; reset: () => void; }) {
  useEffect(() => { console.error("[dashboard/pets/error]", error?.digest, error?.message); }, [error]);
  return (
    <div className="mx-auto flex min-h-[40vh] max-w-lg flex-col items-center justify-center gap-4 px-4 py-12 text-center font-outfit">
      <p className="text-lg font-black text-slate-900">관리 대상 오류</p>
      <p className="text-sm text-slate-600">잠시 후 다시 시도하거나 /api/diag 를 확인하세요.</p>
      {error?.digest ? <p className="font-mono text-xs text-slate-400">Digest: {error.digest}</p> : null}
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" onClick={() => reset()} className="rounded-full bg-teal-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-700">다시 시도</button>
        <Link href="/dashboard" className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">대시보드</Link>
        <Link href="/" className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">홈</Link>
      </div>
    </div>
  );
}
