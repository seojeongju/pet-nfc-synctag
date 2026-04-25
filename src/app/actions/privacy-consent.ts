"use server";

import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { upsertUserRequiredConsents } from "@/lib/privacy-consent";

export async function submitRequiredPrivacyConsent(formData: FormData): Promise<{ ok: true }> {
  const context = getCfRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("로그인이 필요합니다.");
  }

  const terms = String(formData.get("agree_terms") ?? "") === "on";
  const privacy = String(formData.get("agree_privacy") ?? "") === "on";
  const location = String(formData.get("agree_location") ?? "") === "on";
  if (!terms || !privacy || !location) {
    throw new Error("필수 동의 항목을 모두 체크해 주세요.");
  }

  await upsertUserRequiredConsents(userId);
  return { ok: true };
}

