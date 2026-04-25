import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { parseSubjectKind, subjectKindMeta } from "@/lib/subject-kind";
import { getAuth } from "@/lib/auth";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { requireTenantMember } from "@/lib/tenant-membership";
import { isTenantSuspendedSafe } from "@/lib/tenant-status";
import {
  createAlbum,
  createAlbumShareLink,
  deleteAlbumAsset,
  listAlbumAssetsForGuardian,
  listAlbumShareLinks,
  listAlbumsForGuardian,
  revokeAlbumShareLink,
  uploadAlbumAsset,
} from "@/app/actions/album";
import { getUserStorageQuotaSummary } from "@/lib/storage-quota";
import { rethrowNextControlFlowErrors } from "@/lib/next-redirect-guard";
import ShareLinkCopyCard from "@/components/albums/ShareLinkCopyCard";
import Image from "next/image";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function AlbumsPage({
  params,
  searchParams,
}: {
  params: Promise<{ kind: string }>;
  searchParams: Promise<{ tenant?: string; share?: string }>;
}) {
  const { kind: kindRaw } = await params;
  const { tenant: tenantRaw, share: shareRaw } = await searchParams;
  const kind = parseSubjectKind(kindRaw);
  const meta = subjectKindMeta[kind];
  const tenantId = typeof tenantRaw === "string" && tenantRaw.trim() ? tenantRaw.trim() : null;
  const sharePathFlash =
    typeof shareRaw === "string" && shareRaw.trim()
      ? (() => {
          try {
            return decodeURIComponent(shareRaw.trim());
          } catch {
            return null;
          }
        })()
      : null;
  const tenantQs = tenantId ? `?tenant=${encodeURIComponent(tenantId)}` : "";

  try {
    const context = getCfRequestContext();
    const auth = getAuth(context.env);
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      redirect(`/login?kind=${encodeURIComponent(kind)}`);
    }
    if (tenantId) {
      await requireTenantMember(context.env.DB, session.user.id, tenantId);
    }
    const tenantSuspended = await isTenantSuspendedSafe(context.env.DB, tenantId);
    const [albums, quota] = await Promise.all([
      listAlbumsForGuardian(kind, tenantId),
      getUserStorageQuotaSummary(context.env.DB, session.user.id),
    ]);
    const albumDetailsEntries = await Promise.all(
      albums.map(async (album) => {
        const [assets, shareLinks] = await Promise.all([
          listAlbumAssetsForGuardian(album.id),
          listAlbumShareLinks(album.id),
        ]);
        return [album.id, { assets, shareLinks }] as const;
      })
    );
    const albumDetails = Object.fromEntries(albumDetailsEntries) as Record<
      string,
      {
        assets: Awaited<ReturnType<typeof listAlbumAssetsForGuardian>>;
        shareLinks: Awaited<ReturnType<typeof listAlbumShareLinks>>;
      }
    >;

    async function createAlbumAction(formData: FormData) {
      "use server";
      const title = String(formData.get("title") ?? "");
      const description = String(formData.get("description") ?? "");
      await createAlbum({ kind, tenantId, title, description });
    }

    return (
      <div className="space-y-6 pb-20 font-outfit">
        <header className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-wider text-teal-600">전자앨범</p>
          <h1 className="text-2xl font-black text-slate-900">{meta.label} 앨범</h1>
          <p className="text-sm font-semibold text-slate-500 leading-relaxed">
            기본은 보호자 전용이며, 이후 공유 링크 기능으로 선택한 사람에게만 전달할 수 있습니다.
          </p>
          <p className="text-xs font-bold text-slate-400">
            저장공간 {quota.usedQuotaMb}MB / {quota.effectiveQuotaMb}MB · 남은 {quota.freeQuotaMb}MB
          </p>
          <a
            href="/hub"
            className="inline-flex rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-black text-slate-700 hover:bg-slate-50"
          >
            추가용량 구매 준비중 (허브에서 안내 예정)
          </a>
        </header>

        {sharePathFlash ? <ShareLinkCopyCard sharePath={sharePathFlash} /> : null}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
          <h2 className="text-sm font-black text-slate-900">새 앨범 만들기</h2>
          <form action={createAlbumAction} className="space-y-2">
            <input
              type="text"
              name="title"
              required
              placeholder="예: 2026 봄 산책 앨범"
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-teal-400"
            />
            <textarea
              name="description"
              rows={2}
              placeholder="앨범 설명 (선택)"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-teal-400"
            />
            <button
              type="submit"
              disabled={tenantSuspended}
              className="h-10 rounded-xl bg-teal-600 px-4 text-xs font-black text-white hover:bg-teal-500 disabled:opacity-50"
            >
              앨범 생성
            </button>
          </form>
        </section>

        <section className="space-y-3">
          {albums.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
              <p className="text-sm font-black text-slate-700">아직 앨범이 없습니다.</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">위에서 첫 앨범을 만들고 사진을 업로드해 보세요.</p>
            </div>
          ) : (
            albums.map((album) => {
              const details = albumDetails[album.id] ?? { assets: [], shareLinks: [] };
              async function uploadAction(formData: FormData) {
                "use server";
                const file = formData.get("file");
                if (!(file instanceof File)) throw new Error("이미지 파일을 선택해 주세요.");
                const caption = String(formData.get("caption") ?? "");
                await uploadAlbumAsset({ albumId: album.id, file, caption });
              }
              async function deleteAssetAction(formData: FormData) {
                "use server";
                const assetId = String(formData.get("asset_id") ?? "");
                await deleteAlbumAsset({ albumId: album.id, assetId });
              }
              async function createShareAction(formData: FormData) {
                "use server";
                const days = Number(formData.get("expires_in_days") ?? 7);
                const created = await createAlbumShareLink({ albumId: album.id, expiresInDays: days });
                const next = `/dashboard/${kind}/albums${tenantQs ? `${tenantQs}&` : "?"}share=${encodeURIComponent(created.sharePath)}`;
                redirect(next);
              }
              async function revokeShareAction(formData: FormData) {
                "use server";
                const shareLinkId = String(formData.get("share_link_id") ?? "");
                await revokeAlbumShareLink({ albumId: album.id, shareLinkId });
              }

              return (
                <article key={album.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-slate-900 break-words">{album.title}</h3>
                      <p className="text-[11px] font-semibold text-slate-500 mt-1">
                        자산 {album.asset_count}개 · {album.total_size_mb}MB
                      </p>
                    </div>
                    {album.latest_asset_key ? (
                      <a
                        href={`/api/r2/${album.latest_asset_key}`}
                        target="_blank"
                        className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[10px] font-black text-slate-700"
                      >
                        최근 이미지
                      </a>
                    ) : null}
                  </div>
                  <form action={uploadAction} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div className="space-y-2">
                      <input
                        type="file"
                        name="file"
                        required
                        accept="image/jpeg,image/png,image/webp"
                        className="block w-full text-[11px] font-semibold text-slate-600"
                      />
                      <input
                        type="text"
                        name="caption"
                        placeholder="캡션 (선택)"
                        className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold outline-none focus:border-teal-400"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={tenantSuspended}
                      className="h-9 rounded-lg bg-slate-900 px-4 text-[11px] font-black text-white hover:bg-teal-600 disabled:opacity-50"
                    >
                      이미지 업로드
                    </button>
                  </form>

                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-2">
                    <p className="text-[11px] font-black text-slate-700">앨범 자산</p>
                    {details.assets.length === 0 ? (
                      <p className="text-[11px] font-semibold text-slate-500">업로드된 이미지가 없습니다.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {details.assets.map((asset) => (
                          <article key={asset.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                            <a href={`/api/r2/${asset.r2_key}`} target="_blank" className="block">
                              <div className="relative aspect-square w-full bg-slate-100">
                                <Image
                                  src={`/api/r2/${asset.r2_key}`}
                                  alt={asset.caption || "앨범 이미지"}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 640px) 50vw, 180px"
                                />
                              </div>
                            </a>
                            <div className="space-y-1 px-2 py-2">
                              <p className="truncate text-[10px] font-bold text-slate-600">
                                {asset.caption || asset.r2_key.split("/").slice(-1)[0]}
                              </p>
                              <form action={deleteAssetAction}>
                                <input type="hidden" name="asset_id" value={asset.id} />
                                <button
                                  type="submit"
                                  disabled={tenantSuspended}
                                  className="w-full rounded-md border border-rose-100 bg-rose-50 px-2 py-1 text-[10px] font-black text-rose-600 disabled:opacity-50"
                                >
                                  삭제
                                </button>
                              </form>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-teal-100 bg-teal-50/60 p-3 space-y-2">
                    <p className="text-[11px] font-black text-teal-800">공유 링크</p>
                    <form action={createShareAction} className="flex flex-wrap items-center gap-2">
                      <select
                        name="expires_in_days"
                        defaultValue="7"
                        className="h-8 rounded-md border border-teal-200 bg-white px-2 text-[11px] font-bold text-teal-700"
                      >
                        <option value="1">1일</option>
                        <option value="7">7일</option>
                        <option value="30">30일</option>
                      </select>
                      <button
                        type="submit"
                        disabled={tenantSuspended}
                        className="h-8 rounded-md bg-teal-600 px-3 text-[10px] font-black text-white hover:bg-teal-500 disabled:opacity-50"
                      >
                        공유 링크 생성
                      </button>
                    </form>
                    {details.shareLinks.length === 0 ? (
                      <p className="text-[11px] font-semibold text-teal-700/80">생성된 공유 링크가 없습니다.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {details.shareLinks.map((share) => (
                          <div key={share.id} className="rounded-lg border border-teal-100 bg-white px-2.5 py-2">
                            <p className="text-[10px] font-bold text-slate-600">
                              생성 {share.created_at} · 조회 {share.view_count}회
                              {share.expires_at ? ` · 만료 ${share.expires_at}` : ""}
                            </p>
                            <div className="mt-1 flex items-center justify-between gap-2">
                              <span
                                className={`text-[10px] font-black ${share.is_active ? "text-teal-700" : "text-slate-400"}`}
                              >
                                {share.is_active ? "활성" : "비활성"}
                              </span>
                              <form action={revokeShareAction}>
                                <input type="hidden" name="share_link_id" value={share.id} />
                                <button
                                  type="submit"
                                  disabled={!share.is_active || tenantSuspended}
                                  className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-black text-slate-700 disabled:opacity-50"
                                >
                                  링크 폐기
                                </button>
                              </form>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-[10px] font-medium text-teal-700/70">
                      공유 URL은 링크 생성 시점에 보호자에게 전달되며, 공개 목록에서는 보안상 원문 토큰을 다시 보여주지 않습니다.
                    </p>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>
    );
  } catch (error: unknown) {
    rethrowNextControlFlowErrors(error);
    console.error("[dashboard/albums] error:", error);
    return (
      <div className="space-y-3 py-16 text-center font-outfit">
        <p className="text-lg font-black text-slate-900">앨범을 불러오지 못했습니다</p>
        <a
          href={`/dashboard/${kind}/albums${tenantQs}`}
          className="inline-flex rounded-full bg-teal-500 px-6 py-3 text-sm font-black text-white"
        >
          다시 시도
        </a>
      </div>
    );
  }
}
