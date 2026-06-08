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
