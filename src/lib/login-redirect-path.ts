import { SUBJECT_KINDS, type SubjectKind } from "@/lib/subject-kind";

type LoginRedirectOptions = {
  kind?: string | null;
  callbackUrl?: string | null;
  oauthError?: string | null;
  msg?: string | null;
};

/** 보호자 로그인 URL — `kind`·`callbackUrl`·OAuth 오류 복구 파라미터 유지 */
export function loginRedirectPath(options: LoginRedirectOptions = {}): string {
  const qs = new URLSearchParams();
  const kind =
    options.kind && (SUBJECT_KINDS as readonly string[]).includes(options.kind)
      ? (options.kind as SubjectKind)
      : null;

  if (kind) qs.set("kind", kind);
  if (options.callbackUrl?.trim()) qs.set("callbackUrl", options.callbackUrl.trim());
  if (options.oauthError?.trim()) qs.set("oauthError", options.oauthError.trim());
  if (options.msg?.trim()) qs.set("msg", options.msg.trim());

  if (!qs.has("kind") && !qs.has("callbackUrl") && !qs.has("oauthError")) {
    qs.set("kind", "pet");
  }

  return `/login?${qs.toString()}`;
}

export function loginRedirectForDashboardKind(kind: SubjectKind, query = ""): string {
  const callbackUrl = `/dashboard/${encodeURIComponent(kind)}${query}`;
  return loginRedirectPath({ kind, callbackUrl });
}
