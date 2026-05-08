const SAFE_IMAGE_SRC_RE =
  /^(https?:\/\/|\/|data:image\/|blob:|about:blank$)/i;

function isSafeImageSrc(src: string): boolean {
  const trimmed = src.trim();
  if (!trimmed) return false;
  return SAFE_IMAGE_SRC_RE.test(trimmed);
}

/**
 * 상품 상세 HTML에서 깨진 이미지 src를 제거해
 * 상대경로 404 폭주 및 SW 에러를 방지합니다.
 */
export function sanitizeShopContentHtml(html: string): string {
  if (!html) return "";
  return html.replace(
    /<img\b([^>]*?)\bsrc\s*=\s*(['"])(.*?)\2([^>]*)>/gi,
    (full, before, quote, src, after) => {
      const s = String(src ?? "").trim();
      if (!isSafeImageSrc(s)) {
        return "";
      }
      return `<img${before}src=${quote}${s}${quote}${after}>`;
    }
  );
}

