import { getDB } from "@/lib/db";

export const PRIVACY_TERMS_VERSION = "2026-04-25";
export const PRIVACY_PROCESSING_VERSION = "2026-04-25";
export const LOCATION_MONITORING_VERSION = "2026-04-25";

export type UserConsentStatus = {
  hasRequired: boolean;
  termsConsentAt: string | null;
  privacyConsentAt: string | null;
  locationConsentAt: string | null;
};

async function ensureConsentTable() {
  const db = getDB();
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS user_privacy_consents (
        user_id TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE,
        terms_version TEXT NOT NULL,
        terms_consented_at DATETIME NOT NULL,
        privacy_version TEXT NOT NULL,
        privacy_consented_at DATETIME NOT NULL,
        location_version TEXT NOT NULL,
        location_consented_at DATETIME NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`
    )
    .run();
}

export async function getUserConsentStatus(userId: string): Promise<UserConsentStatus> {
  await ensureConsentTable();
  const db = getDB();
  const row = await db
    .prepare(
      `SELECT
         terms_version, terms_consented_at,
         privacy_version, privacy_consented_at,
         location_version, location_consented_at
       FROM user_privacy_consents
       WHERE user_id = ?`
    )
    .bind(userId)
    .first<{
      terms_version: string;
      terms_consented_at: string;
      privacy_version: string;
      privacy_consented_at: string;
      location_version: string;
      location_consented_at: string;
    }>();

  const hasRequired =
    !!row &&
    row.terms_version === PRIVACY_TERMS_VERSION &&
    row.privacy_version === PRIVACY_PROCESSING_VERSION &&
    row.location_version === LOCATION_MONITORING_VERSION;

  return {
    hasRequired,
    termsConsentAt: row?.terms_consented_at ?? null,
    privacyConsentAt: row?.privacy_consented_at ?? null,
    locationConsentAt: row?.location_consented_at ?? null,
  };
}

export async function upsertUserRequiredConsents(userId: string): Promise<void> {
  await ensureConsentTable();
  const db = getDB();
  await db
    .prepare(
      `INSERT INTO user_privacy_consents (
         user_id,
         terms_version, terms_consented_at,
         privacy_version, privacy_consented_at,
         location_version, location_consented_at,
         created_at, updated_at
       )
       VALUES (?, ?, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id) DO UPDATE SET
         terms_version = excluded.terms_version,
         terms_consented_at = excluded.terms_consented_at,
         privacy_version = excluded.privacy_version,
         privacy_consented_at = excluded.privacy_consented_at,
         location_version = excluded.location_version,
         location_consented_at = excluded.location_consented_at,
         updated_at = CURRENT_TIMESTAMP`
    )
    .bind(
      userId,
      PRIVACY_TERMS_VERSION,
      PRIVACY_PROCESSING_VERSION,
      LOCATION_MONITORING_VERSION
    )
    .run();
}

