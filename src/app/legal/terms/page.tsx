import { buildPublicMetadata } from "@/lib/seo";

export const runtime = "edge";

export const metadata = buildPublicMetadata({
  title: "링크유 서비스 이용약관",
  description: "링크유(Link-U) 서비스 이용약관 요약본입니다.",
  path: "/legal/terms",
  keywords: ["링크유 이용약관", "Link-U 약관"],
});

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
      <h1 className="text-2xl font-black text-slate-900">서비스 이용약관 (요약)</h1>
      <div className="mt-4 space-y-3 text-sm font-medium leading-relaxed text-slate-700">
        <p>1) 본 서비스는 인식표/태그를 통한 보호자 연결 및 모니터링 기능을 제공합니다.</p>
        <p>2) 계정 생성 및 소셜 로그인 시 이용자 식별을 위한 최소 정보(이메일, 이름 등)를 처리합니다.</p>
        <p>3) 위치 전송은 발견자/사용자 동작(버튼 클릭 및 기기 권한 허용) 이후에만 이루어집니다.</p>
        <p>4) 허위 신고, 무단 접근 등 서비스 운영을 방해하는 행위는 제한될 수 있습니다.</p>
        <p>5) 본 문서는 요약본이며, 실제 운영 약관은 법률 검토본으로 수시 갱신될 수 있습니다.</p>
      </div>
    </div>
  );
}

