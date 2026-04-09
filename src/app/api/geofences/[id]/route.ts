import { getCfRequestContext } from "@/lib/cf-request-context";
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { getDB } from "@/lib/db";
import { deleteGeofenceById } from "@/lib/geofences-db";

export const runtime = "edge";

export async function DELETE(
  request: Request,
  segment: { params: Promise<{ id: string }> }
) {
  const { id } = await segment.params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const ctx = getCfRequestContext();
  const auth = getAuth(ctx.env);
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const deleted = await deleteGeofenceById(getDB(), id.trim(), userId);
    if (!deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "Database error", detail: msg }, { status: 500 });
  }
}
