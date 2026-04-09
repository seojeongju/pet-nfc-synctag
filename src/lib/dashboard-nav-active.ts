export function isDashboardHome(pathname: string): boolean {
  return pathname === "/dashboard";
}

export function isDashboardPets(pathname: string): boolean {
  return pathname.startsWith("/dashboard/pets");
}

export function isDashboardScans(pathname: string): boolean {
  return pathname.startsWith("/dashboard/scans");
}

export function isDashboardGeofences(pathname: string): boolean {
  return pathname.startsWith("/dashboard/geofences");
}
