import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { getUserConsentStatus } from "@/lib/privacy-consent";
import { ConsentForm } from "./ConsentForm";
import { buildNoIndexMetadata } from "@/lib/seo";

export const runtime = "edge";
export const metadata = buildNoIndexMetadata("링크유 약관 및 동의");

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

        <ConsentForm next={next} err={err} />
      </div>
    </div>
  );
}

