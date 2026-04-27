"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PawPrint,
  UserRound,
  Baby,
  Briefcase,
  Gem,
  ChevronRight,
  BadgeCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { subjectKindMeta, type SubjectKind } from "@/lib/subject-kind";
import { loadRecentKind, saveRecentKind } from "@/lib/recent-kind";

const hubIcons: Record<SubjectKind, typeof PawPrint> = {
  pet: PawPrint,
  elder: UserRound,
  child: Baby,
  luggage: Briefcase,
  gold: Gem,
};

interface HubModeCardsProps {
  kinds: SubjectKind[];
  onboardingKind: SubjectKind | null;
}

export default function HubModeCards({ kinds, onboardingKind }: HubModeCardsProps) {
  const [recentKind, setRecentKind] = useState<SubjectKind | null>(null);

  useEffect(() => {
    const saved = loadRecentKind();
    if (saved && kinds.includes(saved)) {
      setRecentKind(saved);
    }
  }, [kinds]);

  const orderedKinds = useMemo(() => {
    const priority = onboardingKind ?? recentKind;
    if (!priority) return kinds;
    if (!kinds.includes(priority)) return kinds;
    return [...kinds].sort((a, b) => {
      if (a === priority) return -1;
      if (b === priority) return 1;
      return 0;
    });
  }, [kinds, onboardingKind, recentKind]);

  return (
    <nav className="space-y-3">
      {orderedKinds.map((kind, index) => {
        const meta = subjectKindMeta[kind];
        const Icon = hubIcons[kind];
        const isRecommended = index === 0;
        return (
          <a
            key={kind}
            href={`/dashboard/${kind}`}
            onClick={() => {
              saveRecentKind(kind);
            }}
            className={cn(
              "flex items-center gap-4 rounded-[24px] border border-slate-100 bg-white p-4 min-[430px]:p-5 shadow-sm",
              "transition-all hover:border-teal-200 hover:shadow-md active:scale-[0.99]"
            )}
          >
            <div className="flex h-12 w-12 min-[430px]:h-14 min-[430px]:w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
              <Icon className="h-6 w-6 min-[430px]:h-7 min-[430px]:w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="font-black text-slate-900 text-[15px] min-[430px]:text-base">{meta.label}</p>
                {isRecommended ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-black text-emerald-700">
                    <BadgeCheck className="h-2.5 w-2.5" />
                    추천
                  </span>
                ) : null}
              </div>
              <p className="text-[13px] text-slate-500 font-medium mt-0.5 leading-snug">{meta.description}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-300 shrink-0" />
          </a>
        );
      })}
    </nav>
  );
}
