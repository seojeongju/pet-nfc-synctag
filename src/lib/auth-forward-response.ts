/**
 * better-auth OAuth 시작 응답의 Set-Cookie를 브라우저로 옮길 때
 * `new Headers(res.headers)`만 쓰면 여러 Set-Cookie가 한 줄로 합쳐져 PKCE 쿠키가 깨질 수 있음.
 */
export function forwardAuthHandlerResponse(
  res: Response,
  overrides?: { location?: string; status?: number }
): Response {
  const headers = new Headers();

  res.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") return;
    headers.set(key, value);
  });

  const setCookies =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : (() => {
          const single = res.headers.get("set-cookie");
          return single ? [single] : [];
        })();

  for (const cookie of setCookies) {
    headers.append("set-cookie", cookie);
  }

  if (overrides?.location) {
    headers.set("Location", overrides.location);
  }

  const status = overrides?.status ?? res.status;
  const body = overrides?.location != null ? null : res.body;

  return new Response(body, {
    status,
    statusText: res.statusText,
    headers,
  });
}
