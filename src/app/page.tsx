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

  const isAdmin = (session?.user as any)?.role === "admin";
  const dashboardLink = isAdmin ? "/admin" : "/dashboard";
  const buttonLabel = session 
    ? (isAdmin ? "관리자 센터 바로가기" : "내 대시보드로 이동") 
    : "지금 시작하기";

  return (
    <HomeClient 
      session={session}
      isAdmin={isAdmin}
      dashboardLink={dashboardLink}
      buttonLabel={buttonLabel}
    />
  );
}
