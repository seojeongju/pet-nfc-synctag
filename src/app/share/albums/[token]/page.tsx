import { notFound } from "next/navigation";
import { getSharedAlbumByToken } from "@/app/actions/album";
import { subjectKindMeta } from "@/lib/subject-kind";
import AlbumAssetLightboxGrid from "@/components/albums/AlbumAssetLightboxGrid";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function SharedAlbumPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await getSharedAlbumByToken(token);
  if (!data) {
    notFound();
  }

  const meta = subjectKindMeta[data.album.subject_kind];

  return (
    <div className="min-h-screen bg-slate-50 font-outfit">
      <main className="mx-auto w-full max-w-screen-sm space-y-4 px-4 py-8">
        <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-teal-600">공유 전자앨범</p>
          <h1 className="mt-1 text-xl font-black text-slate-900 break-words">{data.album.title}</h1>
          <p className="mt-1 text-[11px] font-semibold text-slate-500">{meta.label}</p>
          <p className="mt-1 text-[11px] font-bold text-slate-400">공유 이미지 {data.assets.length}개</p>
          {data.album.description ? (
            <p className="mt-2 text-sm font-semibold text-slate-600 leading-relaxed break-words">
              {data.album.description}
            </p>
          ) : null}
        </header>

        <section className="rounded-2xl border border-teal-100 bg-teal-50/60 p-3">
          <p className="text-[11px] font-black text-teal-800">
            이 페이지는 공유 링크로만 접근 가능합니다. 링크가 만료되거나 폐기되면 자동으로 닫힙니다.
          </p>
        </section>

        {data.assets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-12 text-center">
            <p className="text-sm font-black text-slate-700">공유된 이미지가 없습니다.</p>
          </div>
        ) : (
          <AlbumAssetLightboxGrid
            assets={data.assets.map((asset) => ({
              id: asset.id,
              r2Key: asset.r2_key,
              caption: asset.caption,
              createdAt: asset.created_at,
            }))}
            variant="shared"
          />
        )}
      </main>
    </div>
  );
}
