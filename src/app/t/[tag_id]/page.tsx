import { getDB } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";

export const runtime = "edge";

export default async function TagResolvePage({ params }: { params: Promise<{ tag_id: string }> }) {
  const db = getDB();
  const { tag_id } = await params;

  // 1. Find the pet linked to this tag
  const tag = await db
    .prepare("SELECT pet_id, is_active FROM tags WHERE id = ?")
    .bind(tag_id)
    .first<{ pet_id: string; is_active: boolean }>();

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

  // 3. Redirect to the public profile page
  // We can pass the scan log ID to the public page to update it with GPS coords later
  redirect(`/profile/${tag.pet_id}?tag=${tag_id}`);
}
