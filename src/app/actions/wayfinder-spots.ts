"use server";

import { nanoid } from "nanoid";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { getAuth } from "@/lib/auth";
import { getDB } from "@/lib/db";
import { parseSubjectKind, type SubjectKind } from "@/lib/subject-kind";
import {
  deleteWayfinderSpotByIdOnly,
  getWayfinderSpotForDashboard,
  normalizeWayfinderSlug,
  wayfinderSlugExists,
  wayfinderSlugExistsExcept,
  canMutateWayfinderSpot,
  updateWayfinderSpotFields,
  setWayfinderSpotPublished,
} from "@/lib/wayfinder-spots-db";
import { assertTenantRole, getMembership } from "@/lib/tenant-membership";
import { assertTenantActive } from "@/lib/tenant-status";
import type { D1Database } from "@cloudflare/workers-types";

async function requireSessionUserId(): Promise<string> {
  const context = getCfRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: await headers() });
  const id = session?.user?.id;
  if (!id) throw new Error("UNAUTHORIZED");
  return id;
}

function redirectToWayfinder(kind: SubjectKind, tenantId: string | null, err?: string): never {
  const qs = new URLSearchParams();
  if (tenantId) qs.set("tenant", tenantId);
  if (err) qs.set("err", err);
  const q = qs.toString();
  redirect(`/dashboard/${kind}/wayfinder${q ? `?${q}` : ""}`);
}

function redirectToWayfinderSpotEdit(kind: SubjectKind, spotId: string, tenantId: string | null, err?: string): never {
  const qs = new URLSearchParams();
  if (tenantId) qs.set("tenant", tenantId);
  if (err) qs.set("err", err);
  const q = qs.toString();
  redirect(`/dashboard/${kind}/wayfinder/${spotId}/edit${q ? `?${q}` : ""}`);
}

async function tenantRoleForUser(db: D1Database, userId: string, tenantId: string | null) {
  if (!tenantId) return null;
  return await getMembership(db, userId, tenantId);
}

export async function createWayfinderSpotForm(formData: FormData): Promise<void> {
  const ownerId = await requireSessionUserId();
  const title = String(formData.get("title") ?? "").trim().slice(0, 200);
  const summary = String(formData.get("summary") ?? "").trim().slice(0, 2000) || null;
  const guideText = String(formData.get("guide_text") ?? "").trim().slice(0, 8000) || null;
  const floorLabel = String(formData.get("floor_label") ?? "").trim().slice(0, 80) || null;
  const kindParam = String(formData.get("kind") ?? "pet").trim();
  const tenantParam = String(formData.get("tenant") ?? "").trim();
  const tenantId = tenantParam || null;
  const kind = parseSubjectKind(kindParam);

  const latRaw = String(formData.get("latitude") ?? "").trim();
  const lonRaw = String(formData.get("longitude") ?? "").trim();
  const lat = latRaw === "" ? null : Number(latRaw);
  const lon = lonRaw === "" ? null : Number(lonRaw);
  if (lat !== null && Number.isNaN(lat)) {
    redirectToWayfinder(kind, tenantId, "invalid");
  }
  if (lon !== null && Number.isNaN(lon)) {
    redirectToWayfinder(kind, tenantId, "invalid");
  }
  const publishedRaw = String(formData.get("is_published") ?? "").trim();
  const isPublished = publishedRaw === "1" || publishedRaw === "on" ? 1 : 0;

  if (!title) {
    redirectToWayfinder(kind, tenantId, "invalid");
  }
  if (lat !== null && (!Number.isFinite(lat) || lat < -90 || lat > 90)) {
    redirectToWayfinder(kind, tenantId, "invalid");
  }
  if (lon !== null && (!Number.isFinite(lon) || lon < -180 || lon > 180)) {
    redirectToWayfinder(kind, tenantId, "invalid");
  }

  const db = getDB();
  if (tenantId) {
    await assertTenantActive(db, tenantId).catch(() => redirectToWayfinder(kind, tenantId, "tenant_suspended"));
    try {
      await assertTenantRole(db, ownerId, tenantId, "admin");
    } catch {
      redirectToWayfinder(kind, tenantId, "forbidden");
    }
  }

  const slugInput = String(formData.get("slug") ?? "").trim();
  let slug: string;
  if (!slugInput) {
    slug = `spot-${nanoid(12)}`;
    while (await wayfinderSlugExists(db, slug)) {
      slug = `spot-${nanoid(12)}`;
    }
  } else {
    const normalized = normalizeWayfinderSlug(slugInput);
    if (!normalized) {
      redirectToWayfinder(kind, tenantId, "invalid_slug");
    }
    slug = normalized;
    if (await wayfinderSlugExists(db, slug)) {
      redirectToWayfinder(kind, tenantId, "slug_taken");
    }
  }

  const id = nanoid();
  try {
    await db
      .prepare(
        `INSERT INTO wayfinder_spots (
           id, owner_id, tenant_id, subject_kind, slug, title, summary, guide_text,
           latitude, longitude, floor_label, is_published
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        ownerId,
        tenantId,
        kind,
        slug,
        title,
        summary,
        guideText,
        lat,
        lon,
        floorLabel,
        isPublished
      )
      .run();
  } catch {
    redirectToWayfinder(kind, tenantId, "db");
  }

  revalidatePath(`/dashboard/${kind}/wayfinder`);
  redirectToWayfinder(kind, tenantId);
}

export async function updateWayfinderSpotForm(formData: FormData): Promise<void> {
  const ownerId = await requireSessionUserId();
  const spotId = String(formData.get("id") ?? "").trim();
  const kindParam = String(formData.get("kind") ?? "pet").trim();
  const tenantParam = String(formData.get("tenant") ?? "").trim();
  const tenantId = tenantParam || null;
  const kind = parseSubjectKind(kindParam);

  if (!spotId) {
    redirectToWayfinder(kind, tenantId, "invalid");
  }

  const title = String(formData.get("title") ?? "").trim().slice(0, 200);
  const summary = String(formData.get("summary") ?? "").trim().slice(0, 2000) || null;
  const guideText = String(formData.get("guide_text") ?? "").trim().slice(0, 8000) || null;
  const floorLabel = String(formData.get("floor_label") ?? "").trim().slice(0, 80) || null;
  const latRaw = String(formData.get("latitude") ?? "").trim();
  const lonRaw = String(formData.get("longitude") ?? "").trim();
  const lat = latRaw === "" ? null : Number(latRaw);
  const lon = lonRaw === "" ? null : Number(lonRaw);
  if (lat !== null && Number.isNaN(lat)) {
    redirectToWayfinderSpotEdit(kind, spotId, tenantId, "invalid");
  }
  if (lon !== null && Number.isNaN(lon)) {
    redirectToWayfinderSpotEdit(kind, spotId, tenantId, "invalid");
  }
  const publishedRaw = String(formData.get("is_published") ?? "").trim();
  const isPublished = publishedRaw === "1" || publishedRaw === "on" ? 1 : 0;

  if (!title) {
    redirectToWayfinderSpotEdit(kind, spotId, tenantId, "invalid");
  }
  if (lat !== null && (!Number.isFinite(lat) || lat < -90 || lat > 90)) {
    redirectToWayfinderSpotEdit(kind, spotId, tenantId, "invalid");
  }
  if (lon !== null && (!Number.isFinite(lon) || lon < -180 || lon > 180)) {
    redirectToWayfinderSpotEdit(kind, spotId, tenantId, "invalid");
  }

  const db = getDB();
  if (tenantId) {
    await assertTenantActive(db, tenantId).catch(() => redirectToWayfinderSpotEdit(kind, spotId, tenantId, "tenant_suspended"));
  }

  const spot = await getWayfinderSpotForDashboard(db, spotId, ownerId, kind, tenantId ?? undefined);
  if (!spot) {
    redirectToWayfinder(kind, tenantId, "forbidden");
  }
  const tenantRole = await tenantRoleForUser(db, ownerId, tenantId);
  if (!canMutateWayfinderSpot(ownerId, spot, tenantId, tenantRole)) {
    redirectToWayfinder(kind, tenantId, "forbidden");
  }

  const slugInput = String(formData.get("slug") ?? "").trim();
  const normalized = normalizeWayfinderSlug(slugInput);
  if (!normalized) {
    redirectToWayfinderSpotEdit(kind, spotId, tenantId, "invalid_slug");
  }
  if (normalized !== spot.slug && (await wayfinderSlugExistsExcept(db, normalized, spotId))) {
    redirectToWayfinderSpotEdit(kind, spotId, tenantId, "slug_taken");
  }

  const ok = await updateWayfinderSpotFields(db, spotId, {
    slug: normalized,
    title,
    summary,
    guideText,
    lat,
    lon,
    floorLabel,
    isPublished,
  });
  if (!ok) {
    redirectToWayfinderSpotEdit(kind, spotId, tenantId, "db");
  }

  revalidatePath(`/dashboard/${kind}/wayfinder`);
  revalidatePath(`/dashboard/${kind}/wayfinder/${spotId}/edit`);
  redirectToWayfinder(kind, tenantId);
}

export async function toggleWayfinderSpotPublishedForm(formData: FormData): Promise<void> {
  const ownerId = await requireSessionUserId();
  const spotId = String(formData.get("id") ?? "").trim();
  const kindParam = String(formData.get("kind") ?? "pet").trim();
  const tenantParam = String(formData.get("tenant") ?? "").trim();
  const tenantId = tenantParam || null;
  const kind = parseSubjectKind(kindParam);

  if (!spotId) {
    redirectToWayfinder(kind, tenantId, "invalid");
  }

  const db = getDB();
  if (tenantId) {
    await assertTenantActive(db, tenantId).catch(() => redirectToWayfinder(kind, tenantId, "tenant_suspended"));
  }

  const spot = await getWayfinderSpotForDashboard(db, spotId, ownerId, kind, tenantId ?? undefined);
  if (!spot) {
    redirectToWayfinder(kind, tenantId, "forbidden");
  }
  const tenantRole = await tenantRoleForUser(db, ownerId, tenantId);
  if (!canMutateWayfinderSpot(ownerId, spot, tenantId, tenantRole)) {
    redirectToWayfinder(kind, tenantId, "forbidden");
  }

  const next = spot.is_published ? 0 : 1;
  await setWayfinderSpotPublished(db, spotId, next);
  revalidatePath(`/dashboard/${kind}/wayfinder`);
  revalidatePath(`/dashboard/${kind}/wayfinder/${spotId}/edit`);
  redirectToWayfinder(kind, tenantId);
}

export async function deleteWayfinderSpotForm(formData: FormData): Promise<void> {
  const ownerId = await requireSessionUserId();
  const spotId = String(formData.get("id") ?? "").trim();
  const kindParam = String(formData.get("kind") ?? "pet").trim();
  const tenantParam = String(formData.get("tenant") ?? "").trim();
  const tenantId = tenantParam || null;
  const kind = parseSubjectKind(kindParam);

  if (!spotId) {
    redirectToWayfinder(kind, tenantId, "invalid");
  }

  const db = getDB();
  if (tenantId) {
    await assertTenantActive(db, tenantId).catch(() => redirectToWayfinder(kind, tenantId, "tenant_suspended"));
  }

  const spot = await getWayfinderSpotForDashboard(db, spotId, ownerId, kind, tenantId ?? undefined);
  if (!spot) {
    redirectToWayfinder(kind, tenantId, "forbidden");
  }
  const tenantRole = await tenantRoleForUser(db, ownerId, tenantId);
  if (!canMutateWayfinderSpot(ownerId, spot, tenantId, tenantRole)) {
    redirectToWayfinder(kind, tenantId, "forbidden");
  }

  await deleteWayfinderSpotByIdOnly(db, spotId);
  revalidatePath(`/dashboard/${kind}/wayfinder`);
  revalidatePath(`/dashboard/${kind}/wayfinder/${spotId}/edit`);
  redirectToWayfinder(kind, tenantId);
}
