import { parseSubjectKind, type SubjectKind } from "@/lib/subject-kind";

export const SELECTED_MODE_COOKIE_NAME = "selected_mode";
export const SELECTED_MODE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export function parseSelectedMode(raw: string | null | undefined): SubjectKind | null {
  return parseSubjectKind(raw ?? null);
}
