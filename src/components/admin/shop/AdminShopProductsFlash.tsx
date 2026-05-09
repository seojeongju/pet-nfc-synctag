"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus, Zap } from "lucide-react";

type AdminShopProductsFlashProps = {
  ok: boolean;
  err: string | null;
};

export function AdminShopProductsFlash({ ok, err }: AdminShopProductsFlashProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [visible, setVisible] = useState(ok || Boolean(err));

  const nextUrl = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("ok");
    params.delete("e");
    const q = params.toString();
    return q ? `${pathname}?${q}` : pathname;
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!(ok || err)) return;

    // 새로고침/뒤로가기 시 플래시가 반복 노출되지 않도록 쿼리를 정리한다.
    router.replace(nextUrl, { scroll: false });

    const timer = window.setTimeout(() => {
      setVisible(false);
    }, 2800);

    return () => window.clearTimeout(timer);
  }, [ok, err, nextUrl, router]);

  if (!visible) return null;

  if (err) {
    return (
      <div className="mb-8 flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4" role="alert">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500 text-white">
          <Plus className="h-4 w-4 rotate-45" />
        </div>
        <p className="text-[13px] font-black text-rose-900">{err}</p>
      </div>
    );
  }

  if (ok) {
    return (
      <div className="mb-8 flex items-center gap-3 rounded-2xl border border-teal-100 bg-teal-50/50 p-4 animate-in fade-in slide-in-from-top-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-500 text-white">
          <Zap className="h-4 w-4 fill-current" />
        </div>
        <p className="text-[13px] font-black text-teal-900">
          요청이 반영되었습니다. (저장 또는 삭제)
        </p>
      </div>
    );
  }

  return null;
}
