import type { D1Database } from "@cloudflare/workers-types";
import { SUBJECT_KINDS, subjectKindMeta, type SubjectKind, parseSubjectKind } from "@/lib/subject-kind";

const ALL_KINDS: SubjectKind[] = [...SUBJECT_KINDS];

/**
 * tenants.allowed_subject_kinds JSON 파싱. null/빈 문자열 = 제한 없음(전체 모드).
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
 * 보호자에게 허용되는 SubjectKind (합집합).
 * - 플랫폼 관리자: 전체
 * - 소속 조직(테넌트)별 allowed_subject_kinds — 지정되면 그 모드만 누적, 미지정이면 5개 모드 누적(=제한 없음 취급)
 * - 본인 소유 pets 의 subject_kind
 * - 본인 펫에 연결된 tags 의 assigned_subject_kind
 *
 * 누적 결과가 비면(이론상) 전체 모드(기존 솔로 사용자 호환).
 */
export async function getEffectiveAllowedSubjectKinds(
  db: D1Database,
  userId: string,
  opts: { isPlatformAdmin: boolean }
): Promise<SubjectKind[]> {
  if (opts.isPlatformAdmin) {
    return ALL_KINDS;
  }

  const out = new Set<SubjectKind>();

  const tenantRows = await db
    .prepare(
      `SELECT t.allowed_subject_kinds AS allowed
       FROM tenants t
       INNER JOIN tenant_members tm ON tm.tenant_id = t.id
       WHERE tm.user_id = ?`
    )
    .bind(userId)
    .all<{ allowed: string | null }>();

  for (const r of tenantRows.results ?? []) {
    const list = parseTenantAllowedList(r.allowed);
    if (list == null) {
      for (const k of ALL_KINDS) out.add(k);
    } else {
      for (const k of list) out.add(k);
    }
  }

  const petKindRows = await db
    .prepare(
      `SELECT DISTINCT COALESCE(p.subject_kind, 'pet') AS k
       FROM pets p
       WHERE p.owner_id = ?`
    )
    .bind(userId)
    .all<{ k: string }>();

  for (const r of petKindRows.results ?? []) {
    if (r.k) out.add(parseSubjectKind(r.k));
  }

  const tagKindRows = await db
    .prepare(
      `SELECT DISTINCT t.assigned_subject_kind AS k
       FROM tags t
       INNER JOIN pets p ON p.id = t.pet_id
       WHERE p.owner_id = ?
         AND t.assigned_subject_kind IS NOT NULL
         AND TRIM(t.assigned_subject_kind) != ''`
    )
    .bind(userId)
    .all<{ k: string }>();
  for (const r of tagKindRows.results ?? []) {
    out.add(parseSubjectKind(r.k));
  }

  if (out.size === 0) {
    return ALL_KINDS;
  }

  return ALL_KINDS.filter((k) => out.has(k));
}

/**
 * 특정 테넌트 컨텍스트(쿼리 ?tenant=)로 대시보드에 들어온 경우, 조직이 명시한 모드만 추가로 막는다.
 * tenants.allowed_subject_kinds 가 비어(null)면 이 추가 검사는 통과(글로벌 합집계만 사용).
 */
export async function isSubjectKindAllowedForTenant(
  db: D1Database,
  tenantId: string,
  subjectKind: SubjectKind
): Promise<boolean> {
  const row = await db
    .prepare("SELECT allowed_subject_kinds AS allowed FROM tenants WHERE id = ?")
    .bind(tenantId)
    .first<{ allowed: string | null }>();
  if (!row) return false;
  const list = parseTenantAllowedList(row.allowed);
  if (list == null) return true;
  return list.includes(subjectKind);
}

/**
 * 단일 모드일 때 /hub 대신 이 경로로 보냄(개인, tenant 쿼리 없음).
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

export function getHubRedirectForGuardian(allowed: SubjectKind[]): string | null {
  if (allowed.length === 1) {
    return getSingleModeDashboardPath(allowed[0]!);
  }
  return null;
}

/**
 * B2B 카드의 "대시보드" 링크: 조직이 허용한 모드 ∩ 사용자의 글로벌 허용 중, 우선순위가 가장 앞인 모드.
 * 조직이 아직 allowed를 비웠으면(DTO null) — 사용자에 허용된 첫 모드, 그도 없으면 pet.
 */
export async function getDashboardPathForUserTenant(
  db: D1Database,
  userId: string,
  tenantId: string,
  opts: { isPlatformAdmin: boolean }
): Promise<string> {
  const globalAllowed = await getEffectiveAllowedSubjectKinds(db, userId, opts);
  const row = await db
    .prepare("SELECT allowed_subject_kinds AS allowed FROM tenants WHERE id = ?")
    .bind(tenantId)
    .first<{ allowed: string | null }>();
  const tList = parseTenantAllowedList(row?.allowed ?? null);
  const candidates: SubjectKind[] = (() => {
    if (tList == null) {
      return globalAllowed;
    }
    const s = new Set(
      tList.filter((k) => globalAllowed.includes(k))
    );
    return ALL_KINDS.filter((k) => s.has(k));
  })();
  const kind = candidates[0] ?? "pet";
  return `/dashboard/${encodeURIComponent(kind)}?tenant=${encodeURIComponent(tenantId)}`;
}
