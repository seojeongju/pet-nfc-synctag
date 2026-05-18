/** 대시보드 URL 세그먼트 — SubjectKind(pet/elder/…) 와 분리 */
export const COMPANION_DASHBOARD_SEGMENT = "companion";

export function companionDashboardBase(): string {
  return `/dashboard/${COMPANION_DASHBOARD_SEGMENT}`;
}

function tenantQuery(tenantId?: string | null): string {
  const id = (tenantId ?? "").trim();
  return id ? `?tenant=${encodeURIComponent(id)}` : "";
}

export function companionWayfinderPath(tenantId?: string | null): string {
  return `${companionDashboardBase()}/wayfinder${tenantQuery(tenantId)}`;
}

export function companionWayfinderRegisterPath(tenantId?: string | null): string {
  const base = companionWayfinderPath(tenantId);
  return base.includes("?") ? `${base}&register=1` : `${base}?register=1`;
}

export function companionWayfinderSpotEditPath(spotId: string, tenantId?: string | null): string {
  const id = spotId.trim();
  return `${companionDashboardBase()}/wayfinder/${encodeURIComponent(id)}/edit${tenantQuery(tenantId)}`;
}

/** 레거시 /dashboard/[kind]/wayfinder → 동행 대시보드 */
export function legacyKindWayfinderRedirectPath(
  _kind: string,
  searchParams?: { tenant?: string; err?: string; register?: string }
): string {
  const qs = new URLSearchParams();
  const tenant = (searchParams?.tenant ?? "").trim();
  if (tenant) qs.set("tenant", tenant);
  if (searchParams?.err) {
    qs.set("err", searchParams.err);
    qs.set("register", "1");
  } else if (searchParams?.register) {
    qs.set("register", searchParams.register);
  }
  const q = qs.toString();
  return q ? `${companionDashboardBase()}/wayfinder?${q}` : `${companionDashboardBase()}/wayfinder`;
}

export function legacyKindWayfinderSpotEditRedirectPath(
  spotId: string,
  searchParams?: { tenant?: string; err?: string }
): string {
  const qs = new URLSearchParams();
  const tenant = (searchParams?.tenant ?? "").trim();
  if (tenant) qs.set("tenant", tenant);
  if (searchParams?.err) qs.set("err", searchParams.err);
  const q = qs.toString();
  const base = `${companionDashboardBase()}/wayfinder/${encodeURIComponent(spotId.trim())}/edit`;
  return q ? `${base}?${q}` : base;
}

export function isCompanionDashboardPath(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  return segments.length >= 2 && segments[0] === "dashboard" && segments[1] === COMPANION_DASHBOARD_SEGMENT;
}
