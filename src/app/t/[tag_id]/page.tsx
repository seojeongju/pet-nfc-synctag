import { getDB } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { parseSubjectKind } from "@/lib/subject-kind";

export const runtime = "edge";

export default async function TagResolvePage({ params }: { params: Promise<{ tag_id: string }> }) {
  const db = getDB();
  const { tag_id } = await params;

  // 1. Find the pet linked to this tag (+ subject_kind for public profile / kind query)
  const tag = await db
    .prepare(
      `SELECT t.pet_id, t.is_active, COALESCE(p.subject_kind, 'pet') AS subject_kind
       FROM tags t
       INNER JOIN pets p ON p.id = t.pet_id
       WHERE t.id = ?`
    )
    .bind(tag_id)
    .first<{ pet_id: string; is_active: boolean; subject_kind: string }>();

  if (!tag || !tag.pet_id || !tag.is_active) {
    notFound();
  }

  // 2. Initial Scan Log (Server Side Info)
  const headerList = await headers();
  const ip = headerList.get("x-real-ip") || "unknown";
  const userAgent = headerList.get("user-agent") || "unknown";

  await db
    .prepare(
      "INSERT INTO scan_logs (tag_id, ip_address, user_agent) VALUES (?, ?, ?)"
    )
    .bind(tag_id, ip, userAgent)
    .run();

  const kind = parseSubjectKind(tag.subject_kind);
  // 3. Redirect to the public profile (tag + kind for S3 NFC branching / deep links)
  redirect(
    `/profile/${tag.pet_id}?tag=${encodeURIComponent(tag_id)}&kind=${encodeURIComponent(kind)}`
  );
}
