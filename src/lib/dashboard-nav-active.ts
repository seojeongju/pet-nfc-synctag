export function isDashboardHome(pathname: string): boolean {
  // /dashboard (legacy) or /dashboard/[kind] (new)
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 1 && segments[0] === "dashboard") return true;
  if (segments.length === 2 && segments[0] === "dashboard" && segments[1] !== "pets" && segments[1] !== "scans" && segments[1] !== "geofences") return true;
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

/** /dashboard/[kind]/wayfinder — 링크유-동행(교통약자 맞춤 이동·시설 안내) */
export function isDashboardWayfinder(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  return segments.length >= 3 && segments[0] === "dashboard" && segments[2] === "wayfinder";
}
