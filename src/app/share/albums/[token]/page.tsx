import Image from "next/image";
import { notFound } from "next/navigation";
import { getSharedAlbumByToken } from "@/app/actions/album";
import { subjectKindMeta } from "@/lib/subject-kind";

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
          {data.album.description ? (
            <p className="mt-2 text-sm font-semibold text-slate-600 leading-relaxed break-words">
              {data.album.description}
            </p>
          ) : null}
        </header>

        {data.assets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-12 text-center">
            <p className="text-sm font-black text-slate-700">공유된 이미지가 없습니다.</p>
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-3">
            {data.assets.map((asset) => (
              <article key={asset.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <a href={`/api/r2/${asset.r2_key}`} target="_blank" className="block">
                  <div className="relative aspect-[4/3] w-full bg-slate-100">
                    <Image
                      src={`/api/r2/${asset.r2_key}`}
                      alt={asset.caption || "공유 앨범 이미지"}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 720px"
                    />
                  </div>
                </a>
                {asset.caption ? (
                  <div className="px-3 py-2">
                    <p className="text-[12px] font-semibold text-slate-700 break-words">{asset.caption}</p>
                  </div>
                ) : null}
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
