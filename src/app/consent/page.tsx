import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { getUserConsentStatus } from "@/lib/privacy-consent";
import { submitRequiredPrivacyConsent } from "@/app/actions/privacy-consent";

export const runtime = "edge";

function sanitizeNext(raw: string | undefined): string {
  const t = (raw ?? "").trim();
  if (!t) return "/hub";
  try {
    const d = decodeURIComponent(t);
    if (!d.startsWith("/") || d.startsWith("//") || d.includes("://")) return "/hub";
    return d.length > 2048 ? "/hub" : d;
  } catch {
    return "/hub";
  }
}

export default async function ConsentPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; err?: string }>;
}) {
  const sp = await searchParams;
  const next = sanitizeNext(sp.next);
  let err = "";
  if (sp.err) {
    try {
      err = decodeURIComponent(sp.err);
    } catch {
      err = "동의 저장에 실패했습니다. 다시 시도해 주세요.";
    }
  }
  const context = getCfRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) {
    redirect(`/login?callbackUrl=${encodeURIComponent(next)}`);
  }

  const consent = await getUserConsentStatus(userId);
  if (consent.hasRequired) {
    redirect(next);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-16">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-black text-slate-900">개인정보·위치 정보 동의</h1>
        <p className="mt-2 text-sm font-semibold text-slate-600">
          서비스 이용을 위해 필수 항목 동의가 필요합니다. 동의 내역은 계정에 저장되며, 약관 개정 시 다시 요청될 수 있습니다.
        </p>

        <form
          action={async (formData) => {
            "use server";
            const n = sanitizeNext(String(formData.get("next") ?? ""));
            try {
              await submitRequiredPrivacyConsent(formData);
            } catch (e) {
              const msg = e instanceof Error ? e.message : "동의 저장에 실패했습니다.";
              redirect(`/consent?next=${encodeURIComponent(n)}&err=${encodeURIComponent(msg)}`);
            }
            redirect(n);
          }}
          className="mt-6 space-y-4"
        >
          <input type="hidden" name="next" value={next} />
          <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <input type="checkbox" name="agree_terms" required className="mt-1 h-4 w-4" />
            <span className="text-sm font-semibold text-slate-700">
              (필수) 서비스 이용약관에 동의합니다.{" "}
              <Link href="/legal/terms" className="font-black text-teal-700 underline">
                약관 보기
              </Link>
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <input type="checkbox" name="agree_privacy" required className="mt-1 h-4 w-4" />
            <span className="text-sm font-semibold text-slate-700">
              (필수) 개인정보 처리방침에 동의합니다.{" "}
              <Link href="/legal/privacy" className="font-black text-teal-700 underline">
                방침 보기
              </Link>
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <input type="checkbox" name="agree_location" required className="mt-1 h-4 w-4" />
            <span className="text-sm font-semibold text-slate-700">
              (필수) 위치·모니터링 데이터 처리(발견자 위치 공유, 기기 식별자 로그)를 이해하고 동의합니다.
            </span>
          </label>

          <button
            type="submit"
            className="h-12 w-full rounded-2xl bg-slate-900 text-sm font-black text-white hover:bg-teal-600"
          >
            동의하고 계속하기
          </button>
          {err ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
              {err}
            </p>
          ) : null}
        </form>
      </div>
    </div>
  );
}

