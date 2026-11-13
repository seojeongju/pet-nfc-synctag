import type { SeoFaqItem } from "@/lib/seo-content";
import { cn } from "@/lib/utils";

type Props = {
  title?: string;
  items: readonly SeoFaqItem[];
  className?: string;
  id?: string;
};

/**
 * AEO용 공개 FAQ — 실제 DOM에 Q/A를 남겨 크롤러·답변 엔진이 인용할 수 있게 한다.
 * JSON-LD FAQPage는 페이지에서 `buildFaqJsonLd`로 별도 삽입.
 */
export function SeoFaq({ title = "자주 묻는 질문", items, className, id = "faq" }: Props) {
  if (!items.length) return null;
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-24 rounded-[28px] border border-slate-200/80 bg-white/95 p-5 shadow-sm min-[390px]:p-6 lg:rounded-[36px] lg:p-8",
        className
      )}
      aria-labelledby={`${id}-heading`}
    >
      <h2 id={`${id}-heading`} className="text-lg font-black tracking-tight text-slate-900 lg:text-2xl">
        {title}
      </h2>
      <div className="mt-4 divide-y divide-slate-100 lg:mt-6">
        {items.map((item) => (
          <details key={item.question} className="group py-3.5 first:pt-0 last:pb-0 lg:py-4">
            <summary className="cursor-pointer list-none text-[14px] font-black text-slate-800 marker:content-none break-keep [word-break:keep-all] lg:text-[16px]">
              <span className="inline-flex w-full items-start justify-between gap-3">
                <span>{item.question}</span>
                <span className="mt-0.5 shrink-0 text-teal-600 transition group-open:rotate-45" aria-hidden>
                  +
                </span>
              </span>
            </summary>
            <p
              data-seo-answer
              className="mt-2.5 text-[13px] font-semibold leading-relaxed text-slate-600 break-keep [word-break:keep-all] lg:text-[15px] lg:leading-7"
            >
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
