import type { D1Database } from "@cloudflare/workers-types";
import { SUBJECT_KINDS, subjectKindMeta, type SubjectKind, parseSubjectKind } from "@/lib/subject-kind";

const ALL_KINDS: SubjectKind[] = [...SUBJECT_KINDS];

/**
 * tenants.allowed_subject_kinds JSON 파싱 (어드민 UI·표시용).
 * ⚠ 기능 게이트에는 사용하지 않음 — 정책상 조직이 모드 사용을 막지 않음.
 */
function parseTenantAllowedList(raw: string | null | undefined): SubjectKind[] | null {
  if (raw == null) return null;
  const t = String(raw).trim();
  if (!t) return null;
  try {
    const v = JSON.parse(t) as unknown;
    if (!Array.isArray(v) || v.length === 0) return null;
    const out = new Set<SubjectKind>();
    for (const x of v) {
      if (typeof x === "string" && (SUBJECT_KINDS as readonly string[]).includes(x)) {
        out.add(x as SubjectKind);
      }
    }
    if (out.size === 0) return null;
    return ALL_KINDS.filter((k) => out.has(k));
  } catch {
    return null;
  }
}

/**
 * 보호자에게 허용되는 SubjectKind.
 * 정책: 전 사용자·전 모드 사용 가능 (조직·태그 종류로 모드 잠금 없음).
 */
export async function getEffectiveAllowedSubjectKinds(
  _db: D1Database,
  _userId: string,
  _opts: { isPlatformAdmin: boolean }
): Promise<SubjectKind[]> {
  return [...ALL_KINDS];
}

/**
 * 테넌트 컨텍스트에서 특정 모드 허용 여부.
 * 정책: 테넌트 allowed_subject_kinds 로 기능을 막지 않음 — 항상 허용.
 */
export async function isSubjectKindAllowedForTenant(
  _db: D1Database,
  _tenantId: string,
  _subjectKind: SubjectKind
): Promise<boolean> {
  return true;
}

/**
 * 단일 모드일 때 /hub 대신 이 경로로 보냄(레거시 — 현재는 허브 단일 모드 자동 스킵 안 함).
 */
export function getSingleModeDashboardPath(kind: SubjectKind): string {
  return `/dashboard/${encodeURIComponent(kind)}`;
}

/** UI용: tenants.allowed_subject_kinds JSON 또는 NULL */
export function formatAllowedSubjectKindsSummaryKo(raw: string | null | undefined): string {
  if (raw == null || !String(raw).trim()) {
    return "전체 모드";
  }
  try {
    const v = JSON.parse(String(raw)) as unknown;
    if (!Array.isArray(v) || v.length === 0) {
      return "전체 모드";
    }
    const kinds = v.filter(
      (x): x is SubjectKind => typeof x === "string" && (SUBJECT_KINDS as readonly string[]).includes(x)
    );
    if (kinds.length === 0) {
      return "전체 모드";
    }
    if (kinds.length >= SUBJECT_KINDS.length) {
      return "전체 모드";
    }
    return kinds.map((k) => subjectKindMeta[k].label).join(" · ");
  } catch {
    return "—";
  }
}

/** 허브·어드민 조직 폼의 기본값(전체 vs 부분 모드) — 표시·통계용 */
export function parseAllowedModesForForm(raw: string | null): {
  unrestricted: boolean;
  selected: SubjectKind[];
} {
  if (raw == null || !String(raw).trim()) {
    return { unrestricted: true, selected: [] };
  }
  try {
    const v = JSON.parse(String(raw)) as unknown;
    if (!Array.isArray(v) || v.length === 0) {
      return { unrestricted: true, selected: [] };
    }
    const selected = v.filter(
      (x): x is SubjectKind => typeof x === "string" && (SUBJECT_KINDS as readonly string[]).includes(x)
    );
    if (selected.length === 0) {
      return { unrestricted: true, selected: [] };
    }
    if (selected.length >= SUBJECT_KINDS.length) {
      return { unrestricted: true, selected };
    }
    return { unrestricted: false, selected };
  } catch {
    return { unrestricted: true, selected: [] };
  }
}

/**
 * 레거시: 단일 허용 모드면 허브 건너뛰기 URL.
 * 정책 변경 후에는 사용하지 않음(항상 null).
 */
export function getHubRedirectForGuardian(_allowed: SubjectKind[]): string | null {
  return null;
}

/** 조직 카드 → 대시보드 진입 URL (기본 모드 pet + tenant 쿼리) */
export async function getDashboardPathForUserTenant(
  _db: D1Database,
  _userId: string,
  tenantId: string,
  _opts: { isPlatformAdmin: boolean }
): Promise<string> {
  return `/dashboard/pet?tenant=${encodeURIComponent(tenantId)}`;
}

/**
 * 모드별 기능(쓰기 UI) 사용 가능 여부.
 * 정책: 모드로 잠금하지 않음. 조직 정지(tenant suspended) 등은 페이지·액션에서 별도 처리.
 */
export async function canUseModeFeature(
  _db: D1Database,
  _userId: string,
  _subjectKind: SubjectKind,
  _opts: {
    isPlatformAdmin: boolean;
    tenantId?: string | null;
  }
): Promise<boolean> {
  return true;
}
