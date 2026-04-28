import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { completeForcedPasswordChange } from "@/app/actions/account-security";
import { isPasswordChangeRequired } from "@/lib/password-change";

export const runtime = "edge";

export default async function ForcePasswordPage() {
  const context = getCfRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) {
    redirect("/login?kind=pet");
  }

  const required = await isPasswordChangeRequired(context.env.DB, userId);
  if (!required) {
    redirect("/hub");
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 font-outfit">
      <div className="mx-auto w-full max-w-md space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-600">보안 설정</p>
          <h1 className="text-2xl font-black text-slate-900">초기 비밀번호 변경</h1>
          <p className="text-sm font-semibold text-slate-500">
            조직에서 발급된 초기 비밀번호입니다. 계속 사용하려면 새 비밀번호로 변경해야 합니다.
          </p>
        </header>
        <form action={completeForcedPasswordChange} className="space-y-3">
          <input
            type="password"
            name="password"
            minLength={8}
            required
            autoComplete="new-password"
            placeholder="새 비밀번호 (8자 이상)"
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold"
          />
          <input
            type="password"
            name="password_confirm"
            minLength={8}
            required
            autoComplete="new-password"
            placeholder="새 비밀번호 확인"
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold"
          />
          <button
            type="submit"
            className="h-11 w-full rounded-xl bg-slate-900 text-sm font-black text-white hover:bg-teal-600"
          >
            비밀번호 변경 후 다시 로그인
          </button>
        </form>
      </div>
    </div>
  );
}
