import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { findTagByDeviceHint } from "@/lib/device-mode";
import { parseSubjectKind } from "@/lib/subject-kind";

export const runtime = "edge";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const raw =
    url.searchParams.get("uid") ||
    url.searchParams.get("ble") ||
    url.searchParams.get("mac") ||
    "";
  if (!raw.trim()) {
    return NextResponse.json({ error: "uid or ble required" }, { status: 400 });
  }

  const db = getDB();
  const tag = await findTagByDeviceHint(db, raw);
  const kind = tag?.assigned_subject_kind
    ? parseSubjectKind(tag.assigned_subject_kind)
    : null;

  return NextResponse.json({
    subject_kind: kind,
    subject_kind_effective: kind ?? parseSubjectKind(null),
    product_name: tag?.product_name ?? null,
    tag_id: tag?.id ?? null,
    ble_mac: tag?.ble_mac ?? null,
    status: tag?.status ?? null,
    pet_id: tag?.pet_id ?? null,
    found: Boolean(tag),
  });
}
