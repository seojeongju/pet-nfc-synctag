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

/**
 * 로그인/회원가입 화면에서 필수 3항목을 이미 체크한 뒤 세션이 잡힌 직후 호출합니다.
 * (클라이언트에서만 검증 — /consent 제출과 동일하게 D1에 최신 약관 버전으로 기록합니다.)
 */
export async function recordConsentsFromAuthenticatedLogin(): Promise<{ ok: true }> {
  const context = getCfRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("로그인이 필요합니다.");
  }
  await upsertUserRequiredConsents(userId);
  return { ok: true };
}

