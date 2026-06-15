import { ManualPageClient } from "@/components/manual/ManualPageClient";
import { getLandingSessionState } from "@/lib/landing-session";
import { getOrgManageHrefForUser } from "@/lib/org-manage-href";
import { buildPublicMetadata } from "@/lib/seo";

export const runtime = "edge";

export const metadata = buildPublicMetadata({
  title: "링크유 사용 설명서 | NFC 태그 인포그래픽 가이드",
  description:
    "링크유(Link-U) 스마트 NFC 태그 등록·연결 방법을 인포그래픽과 단계별 그림 안내로 확인하고 PDF 설명서를 다운로드할 수 있습니다.",
  path: "/manual",
  keywords: ["링크유 사용법", "Link-U 메뉴얼", "NFC 태그 설정", "보호자 가이드"],
});

export default async function ManualPage() {
  const { session, isAdmin } = await getLandingSessionState();
  const orgManageHref = await getOrgManageHrefForUser(session?.user?.id).catch(() => null);

  return <ManualPageClient session={session} isAdmin={isAdmin} orgManageHref={orgManageHref} />;
}
