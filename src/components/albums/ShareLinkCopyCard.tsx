"use client";

import { useMemo, useState } from "react";

type ShareLinkCopyCardProps = {
  sharePath: string;
};

export default function ShareLinkCopyCard({ sharePath }: ShareLinkCopyCardProps) {
  const [copied, setCopied] = useState(false);
  const absoluteUrl = useMemo(() => {
    if (sharePath.startsWith("http://") || sharePath.startsWith("https://")) return sharePath;
    if (typeof window === "undefined") return sharePath;
    return `${window.location.origin}${sharePath.startsWith("/") ? sharePath : `/${sharePath}`}`;
  }, [sharePath]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="rounded-2xl border border-teal-200 bg-teal-50 p-4 space-y-2 shadow-sm">
      <p className="text-[11px] font-black text-teal-800">새 공유 링크가 생성되었습니다</p>
      <div className="rounded-xl border border-teal-100 bg-white px-3 py-2">
        <p className="text-[11px] font-semibold text-slate-700 break-all">{absoluteUrl}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={copy}
          className="h-9 rounded-lg bg-teal-600 px-4 text-[11px] font-black text-white hover:bg-teal-500"
        >
          링크 복사
        </button>
        <span className={`text-[11px] font-black ${copied ? "text-teal-700" : "text-slate-400"}`}>
          {copied ? "복사 완료" : "복사 후 원하는 분에게 전달하세요"}
        </span>
      </div>
    </section>
  );
}
