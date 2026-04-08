import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getRequestContext } from "@cloudflare/next-on-pages";
import HomeClient from "@/components/landing/HomeClient";

export const runtime = "edge";

export default async function Home() {
  const context = getRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const roleRow = session
    ? await context.env.DB
        .prepare("SELECT role FROM user WHERE id = ?")
        .bind(session.user.id)
        .first<{ role?: string | null }>()
    : null;
  const isAdmin = roleRow?.role === "admin";
  /** 보호자: 랜딩 → 로그인 → 허브. 비로그인 시 로그인부터 (허브는 미인증 시 로그인으로 보내지 않아도 됨) */
  const guardianEntryLink = session ? (isAdmin ? "/admin" : "/hub") : "/login";
  const guardianButtonLabel = session
    ? isAdmin
      ? "관리자 센터 바로가기"
      : "모드 선택 · 대시보드"
    : "보호자로 시작하기";

  return (
    <HomeClient
      session={session}
      isAdmin={isAdmin}
      guardianEntryLink={guardianEntryLink}
      guardianButtonLabel={guardianButtonLabel}
    />
  );
}
