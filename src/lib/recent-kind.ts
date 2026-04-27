import type { SubjectKind } from "@/lib/subject-kind";

const LAST_KIND_STORAGE_KEY = "linku:last-kind";
const LAST_KIND_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface StoredRecentKind {
  kind: SubjectKind;
  savedAt: number;
}

export function saveRecentKind(kind: SubjectKind): void {
  if (typeof window === "undefined") return;
  const payload: StoredRecentKind = {
    kind,
    savedAt: Date.now(),
  };
  window.localStorage.setItem(LAST_KIND_STORAGE_KEY, JSON.stringify(payload));
}

export function loadRecentKind(): SubjectKind | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(LAST_KIND_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<StoredRecentKind>;
    if (typeof parsed.kind !== "string" || typeof parsed.savedAt !== "number") {
      window.localStorage.removeItem(LAST_KIND_STORAGE_KEY);
      return null;
    }
    if (Date.now() - parsed.savedAt > LAST_KIND_TTL_MS) {
      window.localStorage.removeItem(LAST_KIND_STORAGE_KEY);
      return null;
    }
    return parsed.kind as SubjectKind;
  } catch {
    window.localStorage.removeItem(LAST_KIND_STORAGE_KEY);
    return null;
  }
}
