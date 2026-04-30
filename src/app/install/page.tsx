import { Suspense } from "react";
import { InstallPageClient } from "./InstallPageClient";

function InstallPageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white font-outfit">
      <p className="text-sm font-bold text-slate-400">로딩 중…</p>
    </div>
  );
}

export default function InstallPage() {
  return (
    <Suspense fallback={<InstallPageFallback />}>
      <InstallPageClient />
    </Suspense>
  );
}
