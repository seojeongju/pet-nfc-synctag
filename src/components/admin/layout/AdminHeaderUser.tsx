"use client";

import Image from "next/image";

export type SessionUser = { id: string; image?: string | null; name?: string | null };

export function AdminHeaderUser({ user }: { user?: SessionUser }) {
  return (
    <div className="flex items-center gap-2 lg:gap-4 group cursor-pointer p-1 lg:pr-4 rounded-full hover:bg-slate-50 transition-all">
      <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full border-2 border-teal-500/20 overflow-hidden shadow-lg group-hover:border-teal-500 transition-colors shrink-0">
        {user?.image ? (
          <Image
            src={user.image.replace("http://", "https://")}
            alt={user.name || ""}
            width={40}
            height={40}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-slate-800 flex items-center justify-center uppercase font-black text-teal-400 text-xs">
            {(user?.name || "A").charAt(0)}
          </div>
        )}
      </div>
      <div className="text-right hidden sm:block min-w-0">
        <p className="text-xs font-black text-slate-800 leading-none uppercase tracking-tighter truncate max-w-[140px] lg:max-w-[200px]">
          {user?.name}
        </p>
        <p className="text-[9px] text-teal-500 font-black uppercase tracking-[0.2em] mt-1.5 opacity-80 italic">
          관리자 인증
        </p>
      </div>
    </div>
  );
}
