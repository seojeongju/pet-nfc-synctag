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
        시설·이동 안내 스팟을 등록하고, 발행된 주소로 방문자에게 NFC·QR·음성 안내를 제공합니다. 보호자는 허브에서
        링크유-동행 타일을 선택한 뒤 대시보드에서 스팟을 관리할 수 있습니다.
      </p>
      <p className="text-sm font-medium leading-relaxed text-slate-600">
        발행된 개별 스팟은{" "}
        <span className="font-mono text-xs text-slate-700">/wayfinder/s/스팟-slug</span> 주소로 열립니다.
      </p>
    </main>
  );
}
