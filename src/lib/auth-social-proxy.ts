/** better-auth sign-in/social 서버 프록시용 — canonical baseURL·프록시 헤더 정합 */
export function resolveAuthBaseUrl(env: { BETTER_AUTH_URL?: string }, requestUrl: URL): string {
  const fromEnv = env.BETTER_AUTH_URL?.trim().replace(/\/+$/, "");
  if (fromEnv) return fromEnv;
  return requestUrl.origin;
}

export function buildAuthSocialProxyHeaders(req: Request, authBase: string): Headers {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");

  const cookie = req.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);

  for (const name of ["x-forwarded-for", "x-real-ip", "cf-connecting-ip", "user-agent"]) {
    const value = req.headers.get(name);
    if (value) headers.set(name, value);
  }

  try {
    const authHost = new URL(authBase).host;
    headers.set("host", authHost);
    headers.set("x-forwarded-host", authHost);
    headers.set("x-forwarded-proto", new URL(authBase).protocol.replace(":", "") || "https");
  } catch {
    const host = req.headers.get("host");
    if (host) {
      headers.set("host", host);
      headers.set("x-forwarded-host", host);
    }
    headers.set("x-forwarded-proto", new URL(req.url).protocol.replace(":", "") || "https");
  }

  return headers;
}
