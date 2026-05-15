import { subjectKindMeta, type SubjectKind } from "@/lib/subject-kind";
import { linkuCompanionMenuTitle, linkuCompanionServiceDescription } from "@/lib/wayfinder/copy";

/** 상단 FlowTopNav 모드 라벨(동행 화면은 subject kind와 별도 표기) */
export function dashboardHeaderModeDisplay(
  pathname: string,
  kind: SubjectKind
): { label: string; description: string } {
  if (isDashboardWayfinder(pathname)) {
    return {
      label: linkuCompanionMenuTitle,
      description: linkuCompanionServiceDescription,
    };
  }
  const meta = subjectKindMeta[kind];
  return { label: meta.label, description: meta.description };
}

export function isDashboardHome(pathname: string): boolean {
  // /dashboard (legacy) or /dashboard/[kind] (new)
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 1 && segments[0] === "dashboard") return true;
  if (
    segments.length === 2 &&
    segments[0] === "dashboard" &&
    segments[1] !== "pets" &&
    segments[1] !== "scans" &&
    segments[1] !== "geofences" &&
    segments[1] !== "wayfinder"
  ) {
    return true;
  }
  return false;
}

export function isDashboardPets(pathname: string): boolean {
  return pathname === "/dashboard/pets" || pathname.startsWith("/dashboard/pets/") ||
         (pathname.includes("/dashboard/") && pathname.includes("/pets"));
}

export function isDashboardScans(pathname: string): boolean {
  return pathname === "/dashboard/scans" || pathname.startsWith("/dashboard/scans/") ||
         (pathname.includes("/dashboard/") && pathname.includes("/scans"));
}

export function isDashboardGeofences(pathname: string): boolean {
  return pathname === "/dashboard/geofences" || pathname.startsWith("/dashboard/geofences/") ||
         (pathname.includes("/dashboard/") && pathname.includes("/geofences"));
}

export function isDashboardAlbums(pathname: string): boolean {
  return pathname === "/dashboard/albums" || pathname.startsWith("/dashboard/albums/") ||
         (pathname.includes("/dashboard/") && pathname.includes("/albums"));
}

/** /dashboard/[kind]/nfc — NFC 태그 연결(NFC 읽기 화면) */
export function isDashboardNfc(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  return segments.length >= 3 && segments[0] === "dashboard" && segments[2] === "nfc";
}

/** /dashboard/[kind]/wayfinder — 링크유-동행(교통약자 맞춤 이동·시설 안내). 진입은 허브(/hub) 모드 타일 권장 */
export function isDashboardWayfinder(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  return segments.length >= 3 && segments[0] === "dashboard" && segments[2] === "wayfinder";
}
