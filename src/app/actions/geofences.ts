"use server";

import { nanoid } from "nanoid";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getAuth } from "@/lib/auth";
import { getDB } from "@/lib/db";
import { parseSubjectKind, type SubjectKind } from "@/lib/subject-kind";
import { isPetOwnedBy } from "@/lib/ble-location-events-db";
import {
  deleteGeofenceById,
  listGeofencesForOwnerKind,
  type GeofenceWithPetName,
} from "@/lib/geofences-db";

async function requireSessionUserId(): Promise<string> {
  const context = getRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: await headers() });
  const id = session?.user?.id;
  if (!id) throw new Error("UNAUTHORIZED");
  return id;
}

function parseNumber(name: string, formData: FormData, min: number, max: number): number | null {
  const raw = String(formData.get(name) ?? "").trim();
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return n;
}

export async function getGeofences(subjectKind: SubjectKind): Promise<GeofenceWithPetName[]> {
  const ownerId = await requireSessionUserId();
  const kind = parseSubjectKind(subjectKind);
  try {
    return await listGeofencesForOwnerKind(getDB(), ownerId, kind);
  } catch {
    return [];
  }
}

export async function createGeofenceForm(formData: FormData): Promise<void> {
  const ownerId = await requireSessionUserId();
  const pet_id = String(formData.get("pet_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  const lat = parseNumber("latitude", formData, -90, 90);
  const lon = parseNumber("longitude", formData, -180, 180);
  const radius = parseNumber("radius_meters", formData, 10, 100000);
  const kindParam = String(formData.get("kind") ?? "pet").trim();

  const kind = parseSubjectKind(kindParam);

  if (!pet_id || !name || lat === null || lon === null || radius === null) {
    redirect(`/dashboard/geofences?kind=${encodeURIComponent(kind)}&err=invalid`);
  }

  const db = getDB();
  const owned = await isPetOwnedBy(db, pet_id, ownerId);
  if (!owned) {
    redirect(`/dashboard/geofences?kind=${encodeURIComponent(kind)}&err=forbidden`);
  }

  const id = nanoid();
  await db
    .prepare(
      `INSERT INTO geofences (id, owner_id, pet_id, name, latitude, longitude, radius_meters, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`
    )
    .bind(id, ownerId, pet_id, name, lat, lon, radius)
    .run();

  revalidatePath("/dashboard/geofences");
  redirect(`/dashboard/geofences?kind=${encodeURIComponent(kind)}`);
}

export async function deleteGeofenceForm(formData: FormData): Promise<void> {
  const ownerId = await requireSessionUserId();
  const id = String(formData.get("id") ?? "").trim();
  const kindParam = String(formData.get("kind") ?? "pet").trim();
  const kind = parseSubjectKind(kindParam);
  if (!id) {
    redirect(`/dashboard/geofences?kind=${encodeURIComponent(kind)}&err=invalid`);
  }

  await deleteGeofenceById(getDB(), id, ownerId);
  revalidatePath("/dashboard/geofences");
  redirect(`/dashboard/geofences?kind=${encodeURIComponent(kind)}`);
}
