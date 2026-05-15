import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { linkuCompanionMenuTitle } from "@/lib/wayfinder/copy";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  className?: string;
};

export function WayfinderPublicShell({ children, backHref, backLabel, className }: Props) {
  return (
    <div className={cn("min-h-[70vh] font-outfit text-slate-900", className)}>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[min(42vh,320px)] bg-gradient-to-b from-indigo-600/12 via-violet-500/6 to-transparent" />
      <div className="relative z-10 mx-auto w-full max-w-lg px-4 py-8 sm:px-5 sm:py-10">
        {backHref ? (
          <Link
            href={backHref}
            className="mb-4 inline-flex items-center gap-1 rounded-xl px-1 py-1 text-xs font-black text-indigo-700 hover:text-indigo-900"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            {backLabel ?? linkuCompanionMenuTitle}
          </Link>
        ) : null}
        {children}
      </div>
    </div>
  );
}
