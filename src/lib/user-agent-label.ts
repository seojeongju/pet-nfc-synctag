/**
 * HTTP User-Agent를 관리자 화면에 보여 주기 위한 짧은 한글 요약(휴리스틱).
 * 외부 라이브러리 없이 일반적인 브라우저·OS 패턴만 다룸.
 */
export function summarizeUserAgent(ua: string | null | undefined): string {
  if (!ua?.trim()) return "";
  const s = ua.trim();

  if (/iPhone|iPad|iPod/.test(s)) {
    const os = s.match(/OS ([\d_]+)/);
    const ver = os ? os[1].replace(/_/g, ".") : "";
    const browser = /CriOS\/[\d.]+/.test(s)
      ? "Chrome"
      : /FxiOS\/[\d.]+/.test(s)
        ? "Firefox"
        : /EdgiOS/.test(s)
          ? "Edge"
          : "Safari";
    return ver ? `iOS ${ver} · ${browser}` : `iPhone/iPad · ${browser}`;
  }

  if (/Android/.test(s)) {
    const a = s.match(/Android ([\d.]+)/);
    const ver = a ? a[1] : "";
    const isWebView = /; wv\)/.test(s) || /Version\//.test(s) && !/Chrome\//.test(s);
    const browser = isWebView
      ? "WebView"
      : /EdgA\//.test(s)
        ? "Edge"
        : /Chrome\//.test(s) || /CriOS\//.test(s)
          ? "Chrome"
          : /SamsungBrowser\//.test(s)
            ? "Samsung Internet"
            : "브라우저";
    return ver ? `Android ${ver} · ${browser}` : `Android · ${browser}`;
  }

  if (/Windows NT/.test(s)) {
    if (/Edg\//.test(s)) return "Windows · Edge";
    if (/Chrome\//.test(s)) return "Windows · Chrome";
    if (/Firefox\//.test(s)) return "Windows · Firefox";
    return "Windows";
  }

  if (/Mac OS X|Macintosh/.test(s) && !/iPhone|iPad/.test(s)) {
    return /Chrome\//.test(s) && !/Edg\//.test(s)
      ? "macOS · Chrome"
      : /Safari\//.test(s) && !/Chrome\//.test(s)
        ? "macOS · Safari"
        : "macOS";
  }

  if (s.length <= 70) return s;
  return `${s.slice(0, 67)}…`;
}
