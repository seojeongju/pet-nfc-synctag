"use server";

import { headers } from "next/headers";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { getAuth } from "@/lib/auth";
import { getDB } from "@/lib/db";
import { isPlatformAdminRole } from "@/lib/platform-admin";
import {
  LOCATION_MONITORING_VERSION,
  PRIVACY_PROCESSING_VERSION,
  PRIVACY_TERMS_VERSION,
} from "@/lib/privacy-consent";

const PAGE_SIZE_DEFAULT = 20;
const PAGE_SIZE_MAX = 50;

export type ConsentListStatus = "all" | "current" | "missing" | "outdated";

export type AdminPrivacyConsentRow = {
  userId: string;
  email: string;
  name: string | null;
  role: string | null;
  userCreatedAt: string;
  termsVersion: string | null;
  termsConsentedAt: string | null;
  privacyVersion: string | null;
  privacyConsentedAt: string | null;
  locationVersion: string | null;
  locationConsentedAt: string | null;
  consentUpdatedAt: string | null;
};

export async function listAdminPrivacyConsents(params: {
  q?: string;
  status?: ConsentListStatus;
  page?: number;
  pageSize?: number;
} = {}) {
  const context = getCfRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("로그인이 필요합니다.");
  }
  const roleRow = await context.env.DB.prepare("SELECT role FROM user WHERE id = ?")
    .bind(userId)
    .first<{ role?: string | null }>();
  if (!isPlatformAdminRole(roleRow?.role)) {
    throw new Error("플랫폼 관리자 권한이 필요합니다.");
  }

  const db = getDB();
  const q = (params.q ?? "").trim().toLowerCase().slice(0, 120);
  const status: ConsentListStatus =
    params.status === "current" || params.status === "missing" || params.status === "outdated"
      ? params.status
      : "all";
  let page = Number(params.page) || 1;
  if (!Number.isFinite(page) || page < 1) page = 1;
  let pageSize = Number(params.pageSize) || PAGE_SIZE_DEFAULT;
  if (!Number.isFinite(pageSize) || pageSize < 1) pageSize = PAGE_SIZE_DEFAULT;
  pageSize = Math.min(PAGE_SIZE_MAX, Math.max(1, Math.floor(pageSize)));

  const where: string[] = [];
  const binds: unknown[] = [];

  if (q) {
    where.push("(LOWER(u.email) LIKE ? OR LOWER(COALESCE(u.name,'')) LIKE ?)");
    const like = `%${q}%`;
    binds.push(like, like);
  }

  if (status === "missing") {
    where.push("c.user_id IS NULL");
  } else if (status === "current") {
    where.push("c.user_id IS NOT NULL");
    where.push("c.terms_version = ?");
    where.push("c.privacy_version = ?");
    where.push("c.location_version = ?");
    binds.push(PRIVACY_TERMS_VERSION, PRIVACY_PROCESSING_VERSION, LOCATION_MONITORING_VERSION);
  } else if (status === "outdated") {
    where.push(
      "(c.user_id IS NULL OR c.terms_version <> ? OR c.privacy_version <> ? OR c.location_version <> ?)"
    );
    binds.push(PRIVACY_TERMS_VERSION, PRIVACY_PROCESSING_VERSION, LOCATION_MONITORING_VERSION);
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
  const countRow = await db
    .prepare(
      `SELECT COUNT(*) AS c
       FROM user u
       LEFT JOIN user_privacy_consents c ON c.user_id = u.id
       ${whereSql}`
    )
    .bind(...binds)
    .first<{ c?: number }>()
    .catch(() => ({ c: 0 }));
  const total = Number(countRow?.c ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  page = Math.min(page, totalPages);
  const offset = (page - 1) * pageSize;

  const { results } = await db
    .prepare(
      `SELECT
         u.id AS userId,
         u.email AS email,
         u.name AS name,
         u.role AS role,
         u.createdAt AS userCreatedAt,
         c.terms_version AS termsVersion,
         c.terms_consented_at AS termsConsentedAt,
         c.privacy_version AS privacyVersion,
         c.privacy_consented_at AS privacyConsentedAt,
         c.location_version AS locationVersion,
         c.location_consented_at AS locationConsentedAt,
         c.updated_at AS consentUpdatedAt
       FROM user u
       LEFT JOIN user_privacy_consents c ON c.user_id = u.id
       ${whereSql}
       ORDER BY datetime(u.createdAt) DESC
       LIMIT ? OFFSET ?`
    )
    .bind(...binds, pageSize, offset)
    .all<AdminPrivacyConsentRow>()
    .catch(() => ({ results: [] as AdminPrivacyConsentRow[] }));

  return {
    rows: results ?? [],
    total,
    page,
    pageSize,
    latestVersions: {
      terms: PRIVACY_TERMS_VERSION,
      privacy: PRIVACY_PROCESSING_VERSION,
      location: LOCATION_MONITORING_VERSION,
    },
  };
}

