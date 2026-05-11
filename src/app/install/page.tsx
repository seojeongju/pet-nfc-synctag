import { Suspense } from "react";
import { InstallPageClient } from "./InstallPageClient";
import { buildPublicMetadata } from "@/lib/seo";

export const metadata = buildPublicMetadata({
  title: "링크유 설치 안내 | 앱·PWA 시작 가이드",
  description: "링크유(Link-U)를 브라우저 또는 앱으로 설치하고 사용하는 방법을 안내합니다.",
  path: "/install",
  keywords: ["링크유 설치", "Link-U 설치", "PWA 설치", "NFC 앱 설치"],
});

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
