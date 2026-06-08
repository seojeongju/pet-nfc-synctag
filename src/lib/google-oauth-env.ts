const GOOGLE_CLIENT_ID_SUFFIX = ".apps.googleusercontent.com";
const GOOGLE_CLIENT_ID_RE =
  /^[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com$/i;

/** Cloudflare 붙여넣기 시 따옴표·제로폭 문자·줄바꿈 제거 */
export function normalizeGoogleClientId(raw: string | undefined): string {
  let t = raw?.trim() ?? "";
  if (!t) return "";

  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    t = t.slice(1, -1).trim();
  }

  t = t.replace(/[\u200B-\u200D\uFEFF\r\n]/g, "");

  if (t && !t.toLowerCase().endsWith(GOOGLE_CLIENT_ID_SUFFIX)) {
    if (/^[0-9]+-[a-z0-9]+$/i.test(t)) {
      t = `${t}${GOOGLE_CLIENT_ID_SUFFIX}`;
    }
  }

  return t;
}

export function normalizeGoogleClientSecret(raw: string | undefined): string {
  let t = raw?.trim() ?? "";
  if (!t) return "";

  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    t = t.slice(1, -1).trim();
  }

  return t.replace(/[\u200B-\u200D\uFEFF\r\n]/g, "");
}

export function validateGoogleClientIdFormat(clientId: string): {
  ok: boolean;
  reason: string | null;
} {
  if (!clientId) {
    return { ok: false, reason: "missing" };
  }
  if (clientId.startsWith("GOCSPX-")) {
    return { ok: false, reason: "secret_in_id_field" };
  }
  if (!GOOGLE_CLIENT_ID_RE.test(clientId)) {
    return { ok: false, reason: "invalid_format" };
  }
  return { ok: true, reason: null };
}

/** Google authorize URL — client_id만으로 클라이언트 존재 여부 확인 (Secret 무관) */
export async function probeGoogleAuthorizeClient(
  clientId: string,
  redirectUri: string
): Promise<"ok" | "invalid_client" | "skipped"> {
  if (!clientId || !redirectUri) return "skipped";

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "openid email profile");

  try {
    const res = await fetch(url.toString(), { method: "HEAD", redirect: "manual" });
    const location = res.headers.get("location") ?? "";
    if (location.includes("/oauth/error") || location.includes("invalid_client")) {
      return "invalid_client";
    }
    if (res.status >= 300 && res.status < 400 && location.includes("accounts.google.com")) {
      return "ok";
    }
    return "skipped";
  } catch {
    return "skipped";
  }
}

/** Google token 엔드포인트로 ID·Secret 쌍 확인 (더미 code → invalid_grant면 인식됨) */
export async function probeGoogleOAuthClient(options: {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}): Promise<"ok" | "invalid_client" | "invalid_secret" | "skipped"> {
  const { clientId, clientSecret, redirectUri } = options;
  if (!clientId || !clientSecret || !redirectUri) return "skipped";

  const body = new URLSearchParams({
    code: "probe-invalid-code",
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const json = (await res.json()) as { error?: string };
    const err = json.error ?? "";

    if (err === "invalid_grant") return "ok";
    if (err === "invalid_client" || err === "unauthorized_client") {
      return "invalid_client";
    }
    if (err === "invalid_request") return "ok";
    return "invalid_secret";
  } catch {
    return "skipped";
  }
}

export function googleClientIdProjectNumber(clientId: string | undefined): string | null {
  const t = normalizeGoogleClientId(clientId);
  const m = t.match(/^([0-9]+)-/);
  return m?.[1] ?? null;
}

export const EXPECTED_GOOGLE_CLIENT_ID_TAIL = "uu8scdsfi6g3";

export type GoogleOAuthDiagSlice = {
  GOOGLE_CLIENT_ID_TAIL?: string | null;
  GOOGLE_CLIENT_ID_FORMAT_OK?: boolean;
  GOOGLE_CLIENT_ID_FORMAT_REASON?: string | null;
  GOOGLE_CLIENT_ID_AUTHORIZE_PROBE?: string;
  GOOGLE_OAUTH_PROBE?: string;
  GOOGLE_CLIENT_ID_HINT?: string | null;
};

/** /api/diag 결과로 Google 로그인 실패 안내 문구 결정 */
export function resolveGoogleOAuthLoginErrorMessage(
  env: GoogleOAuthDiagSlice | undefined
): string {
  if (!env) {
    return "Google OAuth 인증에 실패했습니다. 시크릿 탭에서 다시 시도하거나, Cloudflare GOOGLE_CLIENT_ID·SECRET을 확인해 주세요.";
  }

  if (env.GOOGLE_CLIENT_ID_FORMAT_OK === false) {
    if (env.GOOGLE_CLIENT_ID_FORMAT_REASON === "secret_in_id_field") {
      return "Cloudflare GOOGLE_CLIENT_ID에 클라이언트 Secret(GOCSPX-…)이 들어가 있습니다. Google 콘솔의 클라이언트 ID(…apps.googleusercontent.com)를 넣어 주세요.";
    }
    return "Cloudflare GOOGLE_CLIENT_ID 형식이 올바르지 않습니다. Google 콘솔에서 클라이언트 ID 전체를 복사해 붙여넣은 뒤 재배포하세요.";
  }

  if (env.GOOGLE_CLIENT_ID_TAIL === "uu8scdsfl6g3") {
    return "Cloudflare GOOGLE_CLIENT_ID 끝이 …fl6g3(소문자 L)입니다. Google 콘솔(NFC-TAG)은 …fi6g3(소문자 i)입니다. 콘솔에서 클라이언트 ID 전체를 다시 복사 → Cloudflare GOOGLE_CLIENT_ID 교체 → 재배포하세요.";
  }

  if (env.GOOGLE_CLIENT_ID_AUTHORIZE_PROBE === "invalid_client") {
    return `Cloudflare GOOGLE_CLIENT_ID(힌트 ${env.GOOGLE_CLIENT_ID_HINT ?? "—"})가 Google에 등록되어 있지 않습니다. Google 콘솔(NFC-TAG)에서 **현재** 클라이언트 ID 전체(…fi6g3.apps.googleusercontent.com)를 복사 → Cloudflare Production GOOGLE_CLIENT_ID에 붙여넣기 → Secret도 함께 갱신 → 재배포하세요.`;
  }

  if (env.GOOGLE_OAUTH_PROBE === "invalid_client") {
    return "Google Client ID는 인식되지만 GOOGLE_CLIENT_SECRET이 콘솔과 다릅니다. Google 콘솔에서 클라이언트 보안 비밀번호를 새로 발급 → Cloudflare GOOGLE_CLIENT_SECRET에 붙여넣기 → 재배포 후 다시 시도하세요.";
  }

  if (
    env.GOOGLE_OAUTH_PROBE === "ok" &&
    env.GOOGLE_CLIENT_ID_TAIL === EXPECTED_GOOGLE_CLIENT_ID_TAIL
  ) {
    return "Google 연동 설정(ID·Secret)은 서버에서 정상입니다. OAuth 보안 쿠키(PKCE)가 브라우저에 저장되지 않았을 수 있습니다. 시크릿(비공개) 창에서 다시 시도하고, wow-linku.co.kr 사이트 데이터를 삭제한 뒤 재시도해 주세요. 카카오톡·인앱 브라우저가 아닌 Chrome·Safari에서 시도해 주세요.";
  }

  if (env.GOOGLE_CLIENT_ID_TAIL && env.GOOGLE_CLIENT_ID_TAIL !== EXPECTED_GOOGLE_CLIENT_ID_TAIL) {
    return `Cloudflare GOOGLE_CLIENT_ID가 콘솔(NFC-TAG)과 다릅니다. 현재 …${env.GOOGLE_CLIENT_ID_TAIL} / 필요 …${EXPECTED_GOOGLE_CLIENT_ID_TAIL}. ID·SECRET을 같은 클라이언트에서 복사한 뒤 재배포하세요.`;
  }

  return "Google OAuth 인증에 실패했습니다. 시크릿 탭에서 다시 시도하거나, Cloudflare GOOGLE_CLIENT_ID·SECRET을 확인해 주세요.";
}
