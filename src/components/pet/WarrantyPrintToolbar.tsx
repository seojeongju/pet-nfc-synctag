"use client";

import Link from "next/link";

export function WarrantyPrintToolbar({ backHref }: { backHref: string }) {
  return (
    <div className="print:hidden flex items-center justify-between gap-3 mb-6">
      <Link href={backHref} className="text-sm font-bold text-amber-900 hover:underline">
        ← 대상으로 돌아가기
      </Link>
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-2xl bg-slate-900 text-white text-sm font-black px-4 py-2.5"
      >
        인쇄
      </button>
    </div>
  );
}
