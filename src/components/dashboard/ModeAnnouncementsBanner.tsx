"use client";

import Image from "next/image";
import { Megaphone, ExternalLink, FileText } from "lucide-react";
import { motion } from "framer-motion";
import type { ModeAnnouncementRow } from "@/types/mode-announcement";
import { cn } from "@/lib/utils";

export default function ModeAnnouncementsBanner({ items }: { items: ModeAnnouncementRow[] }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
      aria-labelledby="mode-announcements-title"
    >
      <h2
        id="mode-announcements-title"
        className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600"
      >
        운영 공지
      </h2>
      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-white/90 px-4 py-3 text-xs font-semibold text-slate-500">
          표시 중인 공지가 없습니다. 플랫폼에서 발행된 소식이 있으면 이곳에 나타납니다.
        </p>
      ) : null}
      {items.map((a) => {
        const attUrl = a.attachment_r2_key ? `/api/r2/${a.attachment_r2_key}` : null;
        return (
          <div
            key={a.id}
            className="rounded-[28px] border border-teal-100 bg-gradient-to-br from-teal-50/90 to-white p-5 shadow-lg shadow-teal-500/5"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-md shadow-teal-500/20">
                <Megaphone className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <h3 className="text-base font-black text-slate-900 leading-snug">{a.title}</h3>
                {a.body && (
                  <p className="text-sm font-semibold text-slate-600 whitespace-pre-wrap break-words leading-relaxed">
                    {a.body}
                  </p>
                )}
                {a.link_url && (
                  <a
                    href={a.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-black text-teal-600 hover:text-teal-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                    관련 링크 열기
                  </a>
                )}
                {attUrl && a.attachment_kind === "image" && (
                  <div className="relative mt-2 w-full max-h-64 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                    <Image
                      src={attUrl}
                      alt=""
                      width={800}
                      height={400}
                      className="h-auto w-full object-contain"
                      unoptimized
                    />
                  </div>
                )}
                {attUrl && a.attachment_kind === "pdf" && (
                  <a
                    href={attUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3",
                      "text-sm font-black text-slate-800 hover:bg-slate-50"
                    )}
                  >
                    <FileText className="h-5 w-5 text-rose-500" />
                    PDF 문서 보기
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </motion.section>
  );
}

