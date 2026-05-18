/** wayfinder_spots.subject_kind — 링크유-동행 전용 스코프 (5모드 SubjectKind 와 별도) */
export const COMPANION_SPOT_SUBJECT_KIND = "companion" as const;

export type CompanionSpotSubjectKind = typeof COMPANION_SPOT_SUBJECT_KIND;

export function isCompanionSpotSubjectKind(value: string | null | undefined): boolean {
  return (value ?? "").trim() === COMPANION_SPOT_SUBJECT_KIND;
}
