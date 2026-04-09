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
