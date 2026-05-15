export function buildWayfinderPublicSpeechText(row: {
  title: string;
  summary: string | null;
  guide_text: string | null;
  floor_label: string | null;
  contact_phone?: string | null;
}): string {
  const parts: string[] = [row.title];
  if (row.floor_label?.trim()) {
    parts.push(`위치 안내. ${row.floor_label.trim()}`);
  }
  if (row.summary?.trim()) {
    parts.push(row.summary.trim());
  }
  if (row.guide_text?.trim()) {
    parts.push(row.guide_text.trim());
  }
  const phone = (row.contact_phone ?? "").trim();
  if (phone) {
    parts.push(`시설 연락처. ${phone}`);
  }
  return parts.join(". ");
}
