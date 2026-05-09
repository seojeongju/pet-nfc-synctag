/**
 * 상품 URL 슬러그: 소문자 영문, 숫자, 하이픈만 허용 (서버 SLUG_RE와 동일 규칙).
 * 사용자가 공밅·한글·대문자 등을 입력해도 저장 전에 가능한 범위에서 정리합니다.
 */
export function normalizeShopProductSlug(input: string): string {
  let s = input.trim().toLowerCase();
  s = s.replace(/[\s_]+/g, "-");
  s = s.replace(/[^a-z0-9-]/g, "");
  s = s.replace(/-+/g, "-");
  s = s.replace(/^-+|-+$/g, "");
  return s;
}
