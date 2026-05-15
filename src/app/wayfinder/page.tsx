import { notFound } from "next/navigation";
import { isWayfinderEnabled } from "@/lib/wayfinder/feature";
import { buildPublicMetadata } from "@/lib/seo";

export const metadata = buildPublicMetadata({
  title: "Wayfinder | 교통약자 정밀 안내",
  description: "NFC 스팟 기반 장소 안내 기능을 준비 중입니다.",
  path: "/wayfinder",
  keywords: ["Wayfinder", "교통약자", "NFC 안내", "접근성"],
  noIndex: true,
});

export default function WayfinderPage() {
  if (!isWayfinderEnabled()) {
    notFound();
  }

  return (
    <main
      className="mx-auto flex min-h-[70vh] max-w-lg flex-col gap-6 px-4 py-12 font-outfit text-slate-900"
      lang="ko"
    >
      <h1 className="text-2xl font-black tracking-tight">Wayfinder</h1>
      <p className="text-base font-medium leading-relaxed text-slate-700">
        교통약자 정밀 안내 모듈 개발 영역입니다. 로컬·스테이징에서만 플래그를 켠 뒤 작업하세요.
      </p>
      <p className="text-sm text-slate-500">
        환경 변수 <span className="font-mono text-xs">NEXT_PUBLIC_WAYFINDER_ENABLED=true</span>
      </p>
    </main>
  );
}
