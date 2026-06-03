import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { SUBJECT_KINDS } from "@/lib/subject-kind";
import { redirect } from "next/navigation";
import { buildNoIndexMetadata } from "@/lib/seo";

export const runtime = "edge";
export const metadata = buildNoIndexMetadata("링크유 로그인");

function LoginFallback() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center font-outfit text-slate-400 text-sm">
      불러오는 중…
    </div>
  );
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; callbackUrl?: string; oauthError?: string }>;
}) {
  const sp = await searchParams;
  const hasKind = Boolean(sp.kind && (SUBJECT_KINDS as readonly string[]).includes(sp.kind));
  const hasCallback = Boolean(sp.callbackUrl?.trim());
  const hasOauthError = Boolean(sp.oauthError?.trim());

  // 모드 게이트를 거치지 않은 직접 /login 접근만 홈으로 돌림 (OAuth 오류·callbackUrl 복구는 허용)
  if (!hasKind && !hasCallback && !hasOauthError) {
    redirect("/");
  }

  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
