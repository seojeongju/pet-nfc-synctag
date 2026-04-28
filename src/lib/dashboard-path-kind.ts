import { SUBJECT_KINDS, type SubjectKind } from "@/lib/subject-kind";

/**
 * /dashboard/[kind]/...에서만 kind 추출 (pet·elder 등 SUBJECT_KINDS).
 * /dashboard, /dashboard/pets(복수) 등은 null — 이후 쿼리 `?kind=`로 보정.
 */
export function subjectKindFromDashboardPathname(pathname: string | null | undefined): SubjectKind | null {
  if (!pathname) return null;
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] !== "dashboard" || !segments[1]) return null;
  const s = segments[1];
  if ((SUBJECT_KINDS as readonly string[]).includes(s)) return s as SubjectKind;
  return null;
}
