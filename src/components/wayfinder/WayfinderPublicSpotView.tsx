"use client";

import Link from "next/link";
import {
  Baby,
  Briefcase,
  Gem,
  ListOrdered,
  MapPin,
  MessageCircle,
  Navigation2,
  PawPrint,
  Phone,
  UserRound,
  Volume2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { parseSubjectKind, subjectKindMeta, type SubjectKind } from "@/lib/subject-kind";
import { parseGuideSteps, type GuideStep } from "@/lib/wayfinder/parse-guide-steps";
import {
  linkuCompanionMenuTitle,
  linkuCompanionSpotSubLabel,
  linkuCompanionServiceDescription,
} from "@/lib/wayfinder/copy";
import { WayfinderSpeechAnnouncer } from "@/components/wayfinder/WayfinderSpeechAnnouncer";
import { WayfinderSpotUrlCopy } from "@/components/wayfinder/WayfinderSpotUrlCopy";
import { WayfinderStationMap } from "@/components/wayfinder/WayfinderStationMap";
const kindIcons: Record<SubjectKind, LucideIcon> = {
  pet: PawPrint,
  elder: UserRound,
  child: Baby,
  luggage: Briefcase,
  gold: Gem,
};

export type WayfinderPublicSpotViewProps = {
  title: string;
  summary: string | null;
  floorLabel: string | null;
  guideText: string | null;
  contactPhone: string | null;
  contactPhoneDisplay: string | null;
  subjectKind: string;
  mapHref: string | null;
  routeHref: string | null;
  latitude: number | null;
  longitude: number | null;
  pageUrl: string;
  speechText: string;
};

function GuideStepsList({ steps }: { steps: GuideStep[] }) {
  return (
    <ol className="space-y-3" aria-label="이동·이용 단계">
      {steps.map((step) => (
        <li
          key={`${step.number}-${step.text.slice(0, 24)}`}
          className="flex gap-3 rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm"
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-sm font-black text-white"
            aria-hidden
          >
            {step.number}
          </span>
          <p className="pt-1 text-sm font-semibold leading-relaxed text-slate-800">{step.text}</p>
        </li>
      ))}
    </ol>
  );
}

export function WayfinderPublicSpotView({
  title,
  summary,
  floorLabel,
  guideText,
  contactPhone,
  contactPhoneDisplay,
  subjectKind: subjectKindRaw,
  mapHref,
  routeHref,
  latitude,
  longitude,
  pageUrl,
  speechText,
}: WayfinderPublicSpotViewProps) {
  const kind = parseSubjectKind(subjectKindRaw);
  const KindIcon = kindIcons[kind];
  const kindLabel = subjectKindMeta[kind].label;
  const { steps, remainder } = parseGuideSteps(guideText);
  const detailBody = remainder ?? (steps.length > 0 ? null : guideText?.trim() || null);
  const tel = contactPhone;
  const telLabel = contactPhoneDisplay ?? tel;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col gap-6 pb-16 font-outfit text-slate-900">
      <Link
        href="/wayfinder"
        className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 p-3.5 shadow-sm transition hover:border-indigo-200"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <Navigation2 className="h-5 w-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1 text-left">
          <span className="block text-[10px] font-black uppercase tracking-wide text-indigo-600">메인 기능</span>
          <span className="block text-sm font-black text-slate-900">{linkuCompanionServiceDescription}</span>
          <span className="block text-[11px] font-semibold text-slate-600">GPS로 근처 지하철역 찾기 →</span>
        </span>
      </Link>
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black tracking-wider text-slate-600">
            보조 · {linkuCompanionSpotSubLabel}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-black text-slate-600">
            <KindIcon className="h-3.5 w-3.5 text-indigo-500" aria-hidden />
            {kindLabel}
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black leading-tight tracking-tight text-slate-900 sm:text-[28px]">
            {title}
          </h1>
          {floorLabel ? (
            <p className="flex items-start gap-2 text-sm font-bold text-slate-600">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" aria-hidden />
              {floorLabel}
            </p>
          ) : null}
          {summary ? (
            <p className="text-base font-semibold leading-relaxed text-slate-700">{summary}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <WayfinderSpotUrlCopy url={pageUrl} className="text-[11px]" />
          <span className="text-[10px] font-semibold text-slate-400">안내 링크 공유</span>
        </div>
      </header>

      <section
        aria-label="빠른 도움"
        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
      >
        <div className="col-span-2 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-3 sm:col-span-4">
          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-700">
            <Volume2 className="h-3.5 w-3.5" aria-hidden />
            음성 안내
          </p>
          <WayfinderSpeechAnnouncer text={speechText} />
        </div>

        {mapHref ? (
          <a
            href={mapHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[4.5rem] flex-col items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/50 active:scale-[0.98]"
          >
            <MapPin className="h-6 w-6 text-indigo-600" aria-hidden />
            <span className="text-[11px] font-black text-slate-800">카카오맵</span>
          </a>
        ) : null}

        {routeHref ? (
          <a
            href={routeHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[4.5rem] flex-col items-center justify-center gap-1.5 rounded-2xl border border-indigo-200 bg-indigo-50 p-3 text-center shadow-sm transition hover:bg-indigo-100/80 active:scale-[0.98]"
          >
            <Navigation2 className="h-6 w-6 text-indigo-700" aria-hidden />
            <span className="text-[11px] font-black text-indigo-900">길찾기</span>
          </a>
        ) : null}

        {tel ? (
          <>
            <a
              href={`tel:${tel}`}
              className="flex min-h-[4.5rem] flex-col items-center justify-center gap-1.5 rounded-2xl border-b-4 border-teal-700 bg-teal-500 p-3 text-center text-white shadow-md transition active:scale-[0.98]"
            >
              <Phone className="h-6 w-6" aria-hidden />
              <span className="text-[11px] font-black">전화 문의</span>
            </a>
            <a
              href={`sms:${tel}`}
              className="flex min-h-[4.5rem] flex-col items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-100 p-3 text-center shadow-sm transition hover:bg-slate-200 active:scale-[0.98]"
            >
              <MessageCircle className="h-6 w-6 text-teal-700" aria-hidden />
              <span className="text-[11px] font-black text-slate-800">문자 보내기</span>
            </a>
          </>
        ) : null}
      </section>

      {latitude != null &&
      longitude != null &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) ? (
        <section className="space-y-2" aria-label="위치 지도">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">위치</h2>
          <WayfinderStationMap latitude={latitude} longitude={longitude} label={title} />
        </section>
      ) : null}

      {telLabel ? (
        <p className="text-center text-xs font-bold text-slate-500">
          시설·데스크 연락처: <span className="font-mono text-slate-700">{telLabel}</span>
        </p>
      ) : (
        <p className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-center text-xs font-semibold leading-relaxed text-slate-600">
          등록된 시설 연락처가 없습니다. 안내 데스크나 직원에게 말씀해 주세요.
        </p>
      )}

      {steps.length >= 2 ? (
        <section className="space-y-3" aria-labelledby="wf-steps-heading">
          <h2
            id="wf-steps-heading"
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400"
          >
            <ListOrdered className="h-4 w-4" aria-hidden />
            이용 단계
          </h2>
          <GuideStepsList steps={steps} />
        </section>
      ) : null}

      {detailBody ? (
        <section className="space-y-2" aria-label="상세 안내">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">상세 안내</h2>
          <div className="whitespace-pre-wrap rounded-2xl border border-slate-100 bg-white p-4 text-sm font-medium leading-relaxed text-slate-800 shadow-sm">
            {detailBody}
          </div>
        </section>
      ) : null}

      <footer className="space-y-3 border-t border-slate-100 pt-6 text-center">
        <p className="text-[11px] font-semibold leading-relaxed text-slate-500">
          NFC·QR 지점 안내(보조)입니다. 지하철 이동 경로는{" "}
          <Link href="/wayfinder" className="font-black text-indigo-600 underline-offset-2 hover:underline">
            {linkuCompanionMenuTitle} 메인
          </Link>
          에서 찾을 수 있습니다.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link
            href="/wayfinder"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-indigo-600 px-4 text-xs font-black text-white hover:bg-indigo-700"
          >
            지하철역 찾기
          </Link>
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-800 hover:bg-slate-50"
          >
            링크유 홈
          </Link>
        </div>
      </footer>
    </div>
  );
}
