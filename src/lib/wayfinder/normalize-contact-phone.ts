/** 방문자 tel:/sms: 링크용 — 숫자·+ 만 유지 */
export function normalizeContactPhoneForLink(raw: string | null | undefined): string | null {
  const t = (raw ?? "").trim();
  if (!t) return null;
  const digits = t.replace(/[^\d+]/g, "");
  if (digits.replace(/\D/g, "").length < 8) return null;
  return digits;
}
