import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { parseSubjectKind } from "@/lib/subject-kind";
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
  searchParams: Promise<{ kind?: string }>;
}) {
  const sp = await searchParams;
  if (!parseSubjectKind(sp.kind)) {
    redirect("/");
  }

  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
