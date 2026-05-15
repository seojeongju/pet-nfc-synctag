/** 링크유-동행 공개 진입 URL (NFC·인벤토리 NDEF 공통) */

export type WayfinderCompanionEntryQuery = {
  from?: string | null;
  tag?: string | null;
  spot?: string | null;
};

export function buildWayfinderCompanionPublicUrl(
  base: string,
  tagUid: string,
  spotSlug?: string | null
): string {
  const b = base.replace(/\/$/, "").trim();
  const q = new URLSearchParams({ from: "nfc", tag: tagUid.trim() });
  const slug = (spotSlug ?? "").trim();
  if (slug) q.set("spot", slug);
  return `${b}/wayfinder?${q.toString()}`;
}

export function buildWayfinderCompanionPath(tagUid: string, spotSlug?: string | null): string {
  const q = new URLSearchParams({ from: "nfc", tag: tagUid.trim() });
  const slug = (spotSlug ?? "").trim();
  if (slug) q.set("spot", slug);
  return `/wayfinder?${q.toString()}`;
}

export function isWayfinderNfcEntryQuery(query: WayfinderCompanionEntryQuery): boolean {
  const from = (query.from ?? "").trim().toLowerCase();
  return from === "nfc" || Boolean((query.tag ?? "").trim());
}
