import { Suspense } from "react";
import { redirect } from "next/navigation";
import PlatformHomeClient from "@/components/platform/PlatformHomeClient";
import { OAuthHomeErrorRedirect } from "@/components/auth/OAuthHomeErrorRedirect";
import { JsonLd } from "@/components/seo/JsonLd";
import { getLandingSessionState } from "@/lib/landing-session";
import { LINKU_HOME_PATH } from "@/lib/platform/services";
import { SITE_DESCRIPTION, buildHomePageJsonLd, buildPublicMetadata } from "@/lib/seo";

export const runtime = "edge";

export const metadata = buildPublicMetadata({
  title: "링크유 Link-U | NFC 태그 서비스·맞춤 제작 플랫폼",
  description: SITE_DESCRIPTION,
  path: "/",
  keywords: [
    "NFC 통합 플랫폼",
    "NFC 태그 제작",
    "맞춤 NFC 태그",
    "NFC 디지털 명함",
    "NFC 안심 플랫폼",
    "태그 스튜디오",
    "3D 프린팅 NFC",
    "Link-U",
  ],
});

/** 기존 홈(현 /linku)이 받던 쿼리 — 이미 배포된 태그·앱 딥링크가 `/?...`로 들어온다 */
const LEGACY_LINKU_QUERY_KEYS = ["uid", "ble", "mac", "device", "tag", "action"] as const;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  if (LEGACY_LINKU_QUERY_KEYS.some((k) => sp[k] !== undefined)) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) {
      if (typeof v === "string") qs.set(k, v);
    }
    redirect(`${LINKU_HOME_PATH}?${qs.toString()}`);
  }

  const { session, isAdmin } = await getLandingSessionState();

  return (
    <>
      <JsonLd data={buildHomePageJsonLd()} />
      <Suspense fallback={null}>
        <OAuthHomeErrorRedirect />
      </Suspense>
      <PlatformHomeClient isLoggedIn={Boolean(session)} userName={session?.user?.name ?? null} isAdmin={isAdmin} />
    </>
  );
}
