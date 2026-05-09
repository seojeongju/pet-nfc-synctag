/**
 * 상품 상세 HTML에 들어간 잘못된 URL(한글 문장·파일명만 있는 값 등)은
 * 현재 페이지 기준 상대 경로로 해석되어 `/admin/shop/products/...` 404를 유발합니다.
 * 허용된 스킴/형태만 남깁니다.
 */
const SAFE_RESOURCE_URL_RE =
  /^(https?:\/\/|\/|data:image\/|blob:|mailto:|tel:|#)/i;

function isSafeResourceUrl(raw: string): boolean {
  const s = raw.trim();
  if (!s) return false;
  if (/^javascript:/i.test(s)) return false;
  return SAFE_RESOURCE_URL_RE.test(s);
}

function stripUnsafeImgTags(html: string): string {
  let out = html;
  out = out.replace(
    /<img\b([^>]*?)\bsrc\s*=\s*(['"])(.*?)\2([^>]*)>/gi,
    (_full, before: string, quote: string, src: string, after: string) => {
      const s = String(src ?? "").trim();
      if (!isSafeResourceUrl(s)) return "";
      return `<img${before}src=${quote}${s}${quote}${after}>`;
    }
  );
  out = out.replace(
    /<img\b([^>]*?)\bsrc\s*=\s*([^\s"'=<>`]+)([^>]*)>/gi,
    (_full, before: string, src: string, after: string) => {
      const s = String(src ?? "").trim();
      if (!isSafeResourceUrl(s)) return "";
      return `<img${before}src="${s.replace(/"/g, "&quot;")}"${after}>`;
    }
  );
  return out;
}

function stripUnsafeSrcset(html: string): string {
  return html.replace(
    /\bsrcset\s*=\s*(['"])([^'"]*)\1/gi,
    (_full, quote: string, value: string) => {
      const parts = value.split(",").map((p) => p.trim());
      const kept: string[] = [];
      for (const part of parts) {
        const url = part.split(/\s+/)[0] ?? "";
        if (url && isSafeResourceUrl(url)) kept.push(part);
      }
      if (kept.length === 0) return "";
      return `srcset=${quote}${kept.join(", ")}${quote}`;
    }
  );
}

/** 상대/비정상 href는 #으로 바꿔 잘못된 네비게이션·프리로드를 막음 */
function neutralizeUnsafeAnchors(html: string): string {
  let out = html.replace(
    /<a\b([^>]*?)\bhref\s*=\s*(['"])(.*?)\2([^>]*)>/gi,
    (full, before: string, quote: string, href: string, after: string) => {
      const h = String(href ?? "").trim();
      if (isSafeResourceUrl(h)) return full;
      return `<a${before}href=${quote}#${quote} data-removed-invalid-href="1"${after}>`;
    }
  );
  out = out.replace(
    /<a\b([^>]*?)\bhref\s*=\s*([^\s"'=<>`]+)([^>]*)>/gi,
    (full, before: string, href: string, after: string) => {
      const h = String(href ?? "").trim();
      if (isSafeResourceUrl(h)) return full;
      return `<a${before}href="#" data-removed-invalid-href="1"${after}>`;
    }
  );
  return out;
}

/**
 * 상품 상세 HTML에서 위험·깨진 리소스 URL을 정리합니다.
 */
export function sanitizeShopContentHtml(html: string): string {
  if (!html) return "";
  let out = html;
  out = stripUnsafeImgTags(out);
  out = stripUnsafeSrcset(out);
  out = neutralizeUnsafeAnchors(out);
  return out;
}
