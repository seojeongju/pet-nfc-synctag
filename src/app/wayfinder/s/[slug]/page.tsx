import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCfRequestContext } from "@/lib/cf-request-context";
import { getPublishedWayfinderSpotBySlug, normalizeWayfinderSlug } from "@/lib/wayfinder-spots-db";
import { linkuCompanionMenuTitle } from "@/lib/wayfinder/copy";
import { buildPublicMetadata } from "@/lib/seo";
import { WayfinderSpeechAnnouncer } from "@/components/wayfinder/WayfinderSpeechAnnouncer";
import { MapPin, Navigation2 } from "lucide-react";

export const runtime = "edge";
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

async function loadPublishedSpot(slugRaw: string) {
  const slug = normalizeWayfinderSlug(slugRaw);
  if (!slug) return null;
  try {
    const ctx = getCfRequestContext();
    return await getPublishedWayfinderSpotBySlug(ctx.env.DB, slug);
  } catch (e) {
    console.error("wayfinder public spot load error:", e);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug: slugRaw } = await params;
  const row = await loadPublishedSpot(slugRaw);
  if (!row) {
    return {
      title: `안내를 찾을 수 없습니다 | ${linkuCompanionMenuTitle}`,
      robots: { index: false, follow: false },
    };
  }
  const path = `/wayfinder/s/${row.slug}`;
  return buildPublicMetadata({
    title: `${row.title} | ${linkuCompanionMenuTitle}`,
    description: row.summary?.trim() || `${row.title} — ${linkuCompanionMenuTitle} 시설 안내`,
    path,
    keywords: ["링크유", "동행", "교통약자", "시설 안내", "NFC 안내", "접근성", row.title],
    noIndex: false,
  });
}

function buildSpeechText(row: {
  title: string;
  summary: string | null;
  guide_text: string | null;
  floor_label: string | null;
}): string {
  const parts: string[] = [row.title];
  if (row.floor_label?.trim()) {
    parts.push(`위치 안내. ${row.floor_label.trim()}`);
  }
  if (row.summary?.trim()) {
    parts.push(row.summary.trim());
  }
  if (row.guide_text?.trim()) {
    parts.push(row.guide_text.trim());
  }
  return parts.join(". ");
}

export default async function WayfinderPublicSpotPage({ params }: PageProps) {
  const { slug: slugRaw } = await params;
  const row = await loadPublishedSpot(slugRaw);
  if (!row) {
    notFound();
  }

  const speechText = buildSpeechText(row);
  const mapHref =
    row.latitude != null &&
    row.longitude != null &&
    Number.isFinite(row.latitude) &&
    Number.isFinite(row.longitude)
      ? `https://map.kakao.com/link/map/${encodeURIComponent(row.title)},${row.latitude},${row.longitude}`
      : null;

  return (
    <main
      className="mx-auto flex min-h-[70vh] max-w-lg flex-col gap-6 px-4 py-10 pb-16 font-outfit text-slate-900 sm:px-5"
      lang="ko"
    >
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black tracking-wider text-indigo-700">
          <Navigation2 className="h-3.5 w-3.5" aria-hidden />
          {linkuCompanionMenuTitle} · 시설 안내
        </div>
        <h1 className="text-2xl font-black leading-tight tracking-tight text-slate-900 sm:text-[26px]">{row.title}</h1>
        {row.floor_label ? (
          <p className="flex items-center gap-2 text-sm font-bold text-slate-600">
            <MapPin className="h-4 w-4 shrink-0 text-indigo-500" aria-hidden />
            {row.floor_label}
          </p>
        ) : null}
        {row.summary ? <p className="text-base font-semibold leading-relaxed text-slate-700">{row.summary}</p> : null}
      </header>

      <section aria-label="음성 안내" className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 shadow-sm">
        <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-indigo-700">음성 안내</p>
        <WayfinderSpeechAnnouncer text={speechText} />
      </section>

      {row.guide_text ? (
        <section aria-label="상세 안내" className="space-y-2">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">상세 안내</h2>
          <div className="whitespace-pre-wrap rounded-2xl border border-slate-100 bg-white p-4 text-sm font-medium leading-relaxed text-slate-800 shadow-sm">
            {row.guide_text}
          </div>
        </section>
      ) : null}

      {mapHref ? (
        <p className="text-center">
          <a
            href={mapHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-black text-indigo-600 underline-offset-4 hover:underline"
          >
            카카오맵에서 위치 열기
          </a>
        </p>
      ) : null}

      <p className="text-center text-[10px] font-bold text-slate-400">
        스캔·NFC로 연결된 공개 안내입니다. 문의는 시설 또는 등록 보호자에게 연락해 주세요.
      </p>
    </main>
  );
}
