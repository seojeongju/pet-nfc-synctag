/** 관리자 화면: UID/ID 옆에 붙이는 짧은 모드·보호자 라벨 */

export const SUBJECT_KIND_SHORT: Record<string, string> = {
  pet: "펫",
  elder: "어르신",
  child: "아이",
  luggage: "짐",
  gold: "골드",
};

export function subjectKindShortLabel(kind: string | null | undefined): string | null {
  const k = (kind ?? "").trim();
  if (!k) return null;
  return SUBJECT_KIND_SHORT[k] ?? k;
}

export function formatOwnerPrimaryLine(
  ownerName: string | null | undefined,
  ownerEmail: string | null | undefined
): string {
  const name = (ownerName ?? "").trim();
  const email = (ownerEmail ?? "").trim();
  if (name && email && name !== email) return `${name} (${email})`;
  return name || email || "";
}
