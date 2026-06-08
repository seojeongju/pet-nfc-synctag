/**
 * better-auth OAuth 응답의 Set-Cookie를 브라우저로 옮길 때
 * `new Headers(res.headers)`만 쓰면 여러 Set-Cookie가 한 줄로 합쳐져 PKCE 쿠키가 깨질 수 있음.
 */

/** Expires=Wed, … 처럼 쉼표가 들어간 단일 Set-Cookie 헤더를 안전하게 분리 */
export function splitCombinedSetCookieHeader(value: string): string[] {
  if (!value.trim()) return [];

  const cookies: string[] = [];
  let start = 0;

  for (let i = 0; i < value.length; i++) {
    if (value[i] !== ",") continue;
    const rest = value.slice(i + 1).trimStart();
    if (/^[\w!#$%&'*+\-.^`|~]+=/.test(rest)) {
      cookies.push(value.slice(start, i).trim());
      start = i + 1;
    }
  }

  cookies.push(value.slice(start).trim());
  return cookies.filter(Boolean);
}

/** better-auth handler 응답에서 Set-Cookie 목록 추출 (PKCE·state·session) */
export function collectSetCookies(res: Response): string[] {
  if (typeof res.headers.getSetCookie === "function") {
    const fromGet = res.headers.getSetCookie();
    if (fromGet.length > 0) return fromGet;
  }

  const fromForEach: string[] = [];
  res.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") fromForEach.push(value);
  });
  if (fromForEach.length > 1) return fromForEach;

  const single = res.headers.get("set-cookie");
  if (!single) return [];
  return splitCombinedSetCookieHeader(single);
}

export function forwardAuthHandlerResponse(
  res: Response,
  overrides?: { location?: string; status?: number }
): Response {
  const headers = new Headers();

  res.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") return;
    headers.set(key, value);
  });

  for (const cookie of collectSetCookies(res)) {
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
