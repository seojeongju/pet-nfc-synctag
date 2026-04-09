import { permanentRedirect } from "next/navigation";

function searchParamsToSuffix(sp: Record<string, string | string[] | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, val] of Object.entries(sp)) {
    if (val === undefined) continue;
    if (Array.isArray(val)) {
      for (const v of val) qs.append(key, v);
    } else {
      qs.set(key, val);
    }
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

/** 예: /pets → /dashboard/pets (쿼리 유지). 북마크·상대 링크 오류 대응 */
export async function permanentRedirectToDashboardSubpath(
  searchParams: Promise<Record<string, string | string[] | undefined>>,
  subpath: "pets" | "scans" | "geofences"
): Promise<never> {
  const sp = await searchParams;
  permanentRedirect(`/dashboard/${subpath}${searchParamsToSuffix(sp)}`);
}
