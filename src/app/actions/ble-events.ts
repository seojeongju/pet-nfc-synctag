"use server";

import { nanoid } from "nanoid";
import { headers } from "next/headers";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getAuth } from "@/lib/auth";
import { getDB } from "@/lib/db";
import { parseSubjectKind, type SubjectKind } from "@/lib/subject-kind";
import {
  insertBleLocationEvent,
  isPetOwnedBy,
  listBleLocationEventsForOwner,
  type BleLocationEventRow,
} from "@/lib/ble-location-events-db";
import { parseBleEventBody, type BleEventInputNormalized } from "@/lib/ble-events-input";

async function requireSessionUserId(): Promise<string> {
  const context = getRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: await headers() });
  const id = session?.user?.id;
  if (!id) throw new Error("UNAUTHORIZED");
  return id;
}

export async function recordBleLocationEvent(
  input: BleEventInputNormalized
): Promise<{ id: string; event_type: string; raw_meta: BleEventInputNormalized["raw_meta"] }> {
  const ownerId = await requireSessionUserId();
  const db = getDB();
  const owned = await isPetOwnedBy(db, input.pet_id, ownerId);
  if (!owned) throw new Error("FORBIDDEN");

  const id = nanoid();
  await insertBleLocationEvent(db, {
    id,
    owner_id: ownerId,
    pet_id: input.pet_id,
    event_type: input.event_type,
    latitude: input.latitude,
    longitude: input.longitude,
    rssi: input.rssi,
    raw_payload: input.raw_payload,
  });
  return { id, event_type: input.event_type, raw_meta: input.raw_meta };
}

/** Server Action 또는 내부용: 원시 JSON 객체에서 기록 */
export async function recordBleLocationEventFromJson(
  body: unknown
): Promise<{ id: string; event_type: string; raw_meta: BleEventInputNormalized["raw_meta"] } | { error: string }> {
  const parsed = parseBleEventBody(body);
  if (!parsed.ok) return { error: parsed.error };
  try {
    return await recordBleLocationEvent(parsed.value);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "UNAUTHORIZED") return { error: "Unauthorized" };
    if (msg === "FORBIDDEN") return { error: "Forbidden" };
    throw e;
  }
}

export async function getBleLocationEvents(
  subjectKind: SubjectKind,
  limit = 40,
  tenantId?: string
): Promise<BleLocationEventRow[]> {
  const ownerId = await requireSessionUserId();
  const kind = parseSubjectKind(subjectKind);
  try {
    return await listBleLocationEventsForOwner(getDB(), ownerId, kind, limit, tenantId);
  } catch {
    return [];
  }
}
