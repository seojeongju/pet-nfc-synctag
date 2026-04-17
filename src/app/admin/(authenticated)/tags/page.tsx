import { redirect } from "next/navigation";

export const runtime = "edge";

/** @deprecated `/admin/nfc-tags`로 통합되었습니다. 쿼리가 있으면 감사 로그용으로 이력 페이지로 전달합니다. */
export default async function AdminTagsLegacyRedirect({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const p = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, raw] of Object.entries(p)) {
    if (raw === undefined) continue;
    if (Array.isArray(raw)) raw.forEach((v) => qs.append(key, v));
    else qs.set(key, raw);
  }
  const q = qs.toString();
  redirect(q ? `/admin/nfc-tags/history?${q}` : "/admin/nfc-tags");
}
