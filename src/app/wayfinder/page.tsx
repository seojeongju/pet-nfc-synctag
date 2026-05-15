import { notFound } from "next/navigation";
import { linkuCompanionMenuTitle, linkuCompanionServiceDescription } from "@/lib/wayfinder/copy";
import { isWayfinderEnabled } from "@/lib/wayfinder/feature";
import { buildPublicMetadata } from "@/lib/seo";

export const metadata = buildPublicMetadata({
  title: `${linkuCompanionMenuTitle} | ${linkuCompanionServiceDescription}`,
  description: `${linkuCompanionServiceDescription} — NFC 스팟 연동을 준비 중입니다.`,
  path: "/wayfinder",
  keywords: ["링크유", "동행", "교통약자", "NFC 안내", "접근성", "시설 안내"],
  noIndex: true,
});

export default function WayfinderPage() {
  if (!isWayfinderEnabled()) {
    notFound();
  }

  return (
    <main
      className="mx-auto flex min-h-[70vh] max-w-lg flex-col gap-5 px-4 py-12 font-outfit text-slate-900"
      lang="ko"
    >
      <header className="space-y-2">
        <p className="text-xs font-black uppercase tracking-widest text-indigo-600">{linkuCompanionMenuTitle}</p>
        <h1 className="text-2xl font-black tracking-tight leading-snug">{linkuCompanionServiceDescription}</h1>
      </header>
      <p className="text-base font-medium leading-relaxed text-slate-700">
        공개 스팟 URL로 열리는 안내 화면입니다. 개발·스테이징에서는 플래그를 켠 뒤 내용을 채워 넣습니다.
      </p>
      <p className="text-sm text-slate-500">
        환경 변수 <span className="font-mono text-xs">NEXT_PUBLIC_WAYFINDER_ENABLED=true</span>
      </p>
    </main>
  );
}
