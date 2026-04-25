"use server";

import { nanoid } from "nanoid";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getAuth } from "@/lib/auth";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { getDB, getR2 } from "@/lib/db";
import { parseSubjectKind, type SubjectKind } from "@/lib/subject-kind";
import { assertTenantActive } from "@/lib/tenant-status";
import { assertTenantRole, requireTenantMember } from "@/lib/tenant-membership";
import { assertUserStorageQuotaForUpload, applyUserStorageUsageDelta } from "@/lib/storage-quota";
import type { AlbumAssetRow, AlbumListItem, AlbumShareLinkListItem } from "@/types/album";

const MAX_ALBUM_ASSET_BYTES = 15 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = Array.from(new Uint8Array(digest));
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function buildSharePath(token: string): string {
  return `/share/albums/${encodeURIComponent(token)}`;
}

async function requireActorId(): Promise<string> {
  const context = getCfRequestContext();
  const auth = getAuth(context.env);
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("로그인이 필요합니다.");
  return session.user.id;
}

async function assertAlbumWriteAccess(userId: string, albumId: string): Promise<{
  id: string;
  owner_id: string;
  subject_kind: SubjectKind;
  tenant_id: string | null;
}> {
  const db = getDB();
  const album = await db
    .prepare("SELECT id, owner_id, subject_kind, tenant_id FROM albums WHERE id = ?")
    .bind(albumId)
    .first<{ id: string; owner_id: string; subject_kind: string; tenant_id: string | null }>();
  if (!album) throw new Error("앨범을 찾을 수 없습니다.");

  const kind = parseSubjectKind(album.subject_kind);
  if (album.tenant_id) {
    await assertTenantActive(db, album.tenant_id);
    await assertTenantRole(db, userId, album.tenant_id, "admin");
  } else if (album.owner_id !== userId) {
    throw new Error("앨범 수정 권한이 없습니다.");
  }
  return {
    id: album.id,
    owner_id: album.owner_id,
    subject_kind: kind,
    tenant_id: album.tenant_id,
  };
}

export async function listAlbumsForGuardian(
  kindRaw: string,
  tenantId?: string | null
): Promise<AlbumListItem[]> {
  const userId = await requireActorId();
  const kind = parseSubjectKind(kindRaw);
  const db = getDB();
  const tenant = (tenantId ?? "").trim() || null;

  if (tenant) {
    await requireTenantMember(db, userId, tenant);
  }

  const { results } = await (tenant
    ? db
        .prepare(
          `SELECT a.*,
                  COUNT(s.id) AS asset_count,
                  COALESCE(SUM(s.size_mb), 0) AS total_size_mb,
                  (SELECT s2.r2_key FROM album_assets s2 WHERE s2.album_id = a.id ORDER BY s2.created_at DESC LIMIT 1) AS latest_asset_key
             FROM albums a
             LEFT JOIN album_assets s ON s.album_id = a.id
            WHERE a.owner_id = ?
              AND a.subject_kind = ?
              AND a.tenant_id = ?
            GROUP BY a.id
            ORDER BY a.updated_at DESC, a.created_at DESC`
        )
        .bind(userId, kind, tenant)
        .all<AlbumListItem>()
    : db
        .prepare(
          `SELECT a.*,
                  COUNT(s.id) AS asset_count,
                  COALESCE(SUM(s.size_mb), 0) AS total_size_mb,
                  (SELECT s2.r2_key FROM album_assets s2 WHERE s2.album_id = a.id ORDER BY s2.created_at DESC LIMIT 1) AS latest_asset_key
             FROM albums a
             LEFT JOIN album_assets s ON s.album_id = a.id
            WHERE a.owner_id = ?
              AND a.subject_kind = ?
              AND a.tenant_id IS NULL
            GROUP BY a.id
            ORDER BY a.updated_at DESC, a.created_at DESC`
        )
        .bind(userId, kind)
        .all<AlbumListItem>());

  return results ?? [];
}

export async function createAlbum(input: {
  kind: string;
  tenantId?: string | null;
  title: string;
  description?: string | null;
}): Promise<{ id: string }> {
  const userId = await requireActorId();
  const kind = parseSubjectKind(input.kind);
  const tenant = (input.tenantId ?? "").trim() || null;
  const title = (input.title ?? "").trim();
  const description = (input.description ?? "").trim() || null;
  if (!title) throw new Error("앨범 제목을 입력해 주세요.");

  const db = getDB();
  if (tenant) {
    await assertTenantActive(db, tenant);
    await assertTenantRole(db, userId, tenant, "admin");
  }

  const id = nanoid();
  await db
    .prepare(
      `INSERT INTO albums (id, owner_id, subject_kind, tenant_id, title, description)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(id, userId, kind, tenant, title, description)
    .run();

  const tenantQs = tenant ? `?tenant=${encodeURIComponent(tenant)}` : "";
  revalidatePath(`/dashboard/${kind}/albums${tenantQs}`);
  return { id };
}

export async function uploadAlbumAsset(input: {
  albumId: string;
  file: File;
  caption?: string | null;
}): Promise<{ id: string; r2Key: string; sizeMb: number }> {
  const userId = await requireActorId();
  const file = input.file;
  if (!file?.size) throw new Error("업로드할 파일을 선택해 주세요.");
  if (file.size > MAX_ALBUM_ASSET_BYTES) throw new Error("이미지는 15MB 이하만 업로드할 수 있습니다.");
  if (!ALLOWED_MIME.has(file.type)) throw new Error("JPEG/PNG/WebP 이미지 파일만 업로드할 수 있습니다.");

  const album = await assertAlbumWriteAccess(userId, input.albumId);
  const db = getDB();
  const sizeMb = Math.max(1, Math.ceil(file.size / (1024 * 1024)));

  await assertUserStorageQuotaForUpload(db, userId, sizeMb);

  const safeName = file.name.replace(/[^\w.\-()가-힣]/g, "_").slice(0, 120);
  const key = `albums/${userId}/${album.id}/${nanoid()}-${safeName}`;
  const buf = await file.arrayBuffer();
  await getR2().put(key, buf, { httpMetadata: { contentType: file.type || "application/octet-stream" } });

  const assetId = nanoid();
  await db
    .prepare(
      `INSERT INTO album_assets (id, album_id, r2_key, mime_type, size_bytes, size_mb, caption)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(assetId, album.id, key, file.type, file.size, sizeMb, (input.caption ?? "").trim() || null)
    .run();

  await db
    .prepare("UPDATE albums SET updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(album.id)
    .run();

  await applyUserStorageUsageDelta(db, userId, sizeMb);

  const tenantQs = album.tenant_id ? `?tenant=${encodeURIComponent(album.tenant_id)}` : "";
  revalidatePath(`/dashboard/${album.subject_kind}/albums${tenantQs}`);
  return { id: assetId, r2Key: key, sizeMb };
}

export async function listAlbumAssetsForGuardian(albumId: string): Promise<AlbumAssetRow[]> {
  const userId = await requireActorId();
  await assertAlbumWriteAccess(userId, albumId);
  const { results } = await getDB()
    .prepare(
      `SELECT id, album_id, r2_key, mime_type, size_bytes, size_mb, caption, created_at
       FROM album_assets
       WHERE album_id = ?
       ORDER BY created_at DESC`
    )
    .bind(albumId)
    .all<AlbumAssetRow>();
  return results ?? [];
}

export async function deleteAlbumAsset(input: { albumId: string; assetId: string }): Promise<void> {
  const userId = await requireActorId();
  const album = await assertAlbumWriteAccess(userId, input.albumId);
  const db = getDB();

  const asset = await db
    .prepare(
      `SELECT id, r2_key, size_mb
       FROM album_assets
       WHERE id = ? AND album_id = ?`
    )
    .bind(input.assetId, input.albumId)
    .first<{ id: string; r2_key: string; size_mb: number }>();
  if (!asset) throw new Error("삭제할 자산을 찾을 수 없습니다.");

  await db
    .prepare("DELETE FROM album_assets WHERE id = ?")
    .bind(asset.id)
    .run();

  await getR2().delete(asset.r2_key).catch(() => null);
  await applyUserStorageUsageDelta(db, userId, -Math.max(1, Number(asset.size_mb ?? 0)));
  await db.prepare("UPDATE albums SET updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(album.id).run();

  const tenantQs = album.tenant_id ? `?tenant=${encodeURIComponent(album.tenant_id)}` : "";
  revalidatePath(`/dashboard/${album.subject_kind}/albums${tenantQs}`);
}

export async function createAlbumShareLink(input: {
  albumId: string;
  expiresInDays?: number | null;
}): Promise<{ sharePath: string }> {
  const userId = await requireActorId();
  const album = await assertAlbumWriteAccess(userId, input.albumId);
  const days = Math.max(1, Math.min(30, Math.trunc(input.expiresInDays ?? 7)));

  const rawToken = `${nanoid()}${nanoid()}`;
  const tokenHash = await sha256Hex(rawToken);
  const id = nanoid();
  const db = getDB();
  await db
    .prepare(
      `INSERT INTO album_share_links (id, album_id, created_by_user_id, token_hash, expires_at)
       VALUES (?, ?, ?, ?, DATETIME('now', ?))`
    )
    .bind(id, album.id, userId, tokenHash, `+${days} days`)
    .run();

  const tenantQs = album.tenant_id ? `?tenant=${encodeURIComponent(album.tenant_id)}` : "";
  revalidatePath(`/dashboard/${album.subject_kind}/albums${tenantQs}`);
  return { sharePath: buildSharePath(rawToken) };
}

export async function listAlbumShareLinks(albumId: string): Promise<AlbumShareLinkListItem[]> {
  const userId = await requireActorId();
  await assertAlbumWriteAccess(userId, albumId);
  const { results } = await getDB()
    .prepare(
      `SELECT id, album_id, created_by_user_id, expires_at, revoked_at, view_count, last_viewed_at, created_at,
              CASE
                WHEN revoked_at IS NOT NULL THEN 0
                WHEN expires_at IS NOT NULL AND DATETIME(expires_at) < DATETIME('now') THEN 0
                ELSE 1
              END AS is_active
       FROM album_share_links
       WHERE album_id = ?
       ORDER BY created_at DESC`
    )
    .bind(albumId)
    .all<
      Omit<AlbumShareLinkListItem, "share_path"> & {
        token_hash?: string;
      }
    >();
  return (results ?? []).map((row) => ({
    ...row,
    share_path: "/share/albums/[발급 시 복사 가능]",
  }));
}

export async function revokeAlbumShareLink(input: { albumId: string; shareLinkId: string }): Promise<void> {
  const userId = await requireActorId();
  const album = await assertAlbumWriteAccess(userId, input.albumId);
  const db = getDB();
  await db
    .prepare(
      `UPDATE album_share_links
       SET revoked_at = COALESCE(revoked_at, CURRENT_TIMESTAMP)
       WHERE id = ? AND album_id = ?`
    )
    .bind(input.shareLinkId, input.albumId)
    .run();
  const tenantQs = album.tenant_id ? `?tenant=${encodeURIComponent(album.tenant_id)}` : "";
  revalidatePath(`/dashboard/${album.subject_kind}/albums${tenantQs}`);
}

export async function getSharedAlbumByToken(token: string): Promise<{
  album: { id: string; title: string; description: string | null; subject_kind: SubjectKind };
  assets: Array<{ id: string; r2_key: string; caption: string | null; created_at: string }>;
} | null> {
  const raw = token.trim();
  if (!raw) return null;
  const tokenHash = await sha256Hex(raw);
  const db = getDB();

  const share = await db
    .prepare(
      `SELECT id, album_id, expires_at, revoked_at
       FROM album_share_links
       WHERE token_hash = ?
       LIMIT 1`
    )
    .bind(tokenHash)
    .first<{ id: string; album_id: string; expires_at: string | null; revoked_at: string | null }>();
  if (!share) return null;

  const isExpired =
    share.expires_at != null &&
    new Date(share.expires_at.replace(" ", "T")).getTime() < Date.now();
  if (share.revoked_at || isExpired) {
    return null;
  }

  const album = await db
    .prepare(
      `SELECT id, title, description, subject_kind
       FROM albums
       WHERE id = ?`
    )
    .bind(share.album_id)
    .first<{ id: string; title: string; description: string | null; subject_kind: string }>();
  if (!album) return null;

  const { results: assets } = await db
    .prepare(
      `SELECT id, r2_key, caption, created_at
       FROM album_assets
       WHERE album_id = ?
       ORDER BY created_at DESC`
    )
    .bind(album.id)
    .all<{ id: string; r2_key: string; caption: string | null; created_at: string }>();

  const h = await headers();
  const ipAddress =
    h.get("cf-connecting-ip") ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    null;
  const userAgent = h.get("user-agent");
  await db
    .prepare(
      `INSERT INTO album_share_access_logs (id, share_link_id, ip_address, user_agent, success)
       VALUES (?, ?, ?, ?, 1)`
    )
    .bind(nanoid(), share.id, ipAddress, userAgent)
    .run()
    .catch(() => null);
  await db
    .prepare(
      `UPDATE album_share_links
       SET view_count = view_count + 1,
           last_viewed_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
    .bind(share.id)
    .run()
    .catch(() => null);

  return {
    album: {
      id: album.id,
      title: album.title,
      description: album.description,
      subject_kind: parseSubjectKind(album.subject_kind),
    },
    assets: assets ?? [],
  };
}
