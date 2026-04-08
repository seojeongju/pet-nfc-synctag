import { getPets } from "@/app/actions/pet";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getRequestContext } from "@cloudflare/next-on-pages";
import DashboardClient from "@/components/dashboard/DashboardClient";
import { parseSubjectKind } from "@/lib/subject-kind";
import { listVisibleAnnouncementsForGuardian } from "@/app/actions/mode-announcements";

export const runtime = "edge";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const { kind: kindParam } = await searchParams;
  const subjectKind = parseSubjectKind(kindParam);
  const context = getRequestContext();
  const auth = getAuth(context.env);

  // 1. 세션 확인 - 실패 시에만 정해진 규칙에 따라 로그인 페이지로 리다이렉트
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // 2. 데이터 조회 및 관리자 권한 확인 - 이 과정에서의 오류는 세션 문제와 분리하여 처리
  try {
    const [pets, roleRow, announcements] = await Promise.all([
      getPets(session.user.id, subjectKind),
      context.env.DB
        .prepare("SELECT role FROM user WHERE id = ?")
        .bind(session.user.id)
        .first<{ role?: string | null }>(),
      listVisibleAnnouncementsForGuardian(session.user.id, subjectKind),
    ]);

    const isAdmin = roleRow?.role === "admin";

    return (
      <DashboardClient 
        session={session}
        pets={pets as any || []}
        isAdmin={isAdmin}
        subjectKind={subjectKind}
        modeAnnouncements={announcements}
      />
    );
  } catch (error: unknown) {
    // 넥스트 리다이렉트 에러는 그대로 던져줌
    const redirectError = error as { digest?: string };
    if (redirectError.digest?.includes("NEXT_REDIRECT")) {
      throw error;
    }
    
    // 데이터 조회 오류 시에는 로그를 남기고, 빈 대시보드라도 보여주거나 에러 메시지를 표시 (로그아웃 방지)
    console.error("Dashboard data fetch error:", error);
    
    return (
      <DashboardClient 
        session={session}
        pets={[]}
        isAdmin={false}
        subjectKind={subjectKind}
        modeAnnouncements={[]}
      />
    );
  }
}

