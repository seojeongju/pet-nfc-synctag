"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, Loader2 } from "lucide-react";
import { createTenant } from "@/app/actions/tenancy";

export default function OrgCreateClient() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const r = await createTenant(name);
      if (r.ok) {
        router.push("/hub");
        router.refresh();
        return;
      }
      setError(r.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : "조직을 만들 수 없습니다.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-outfit px-5 py-10 pb-24">
      <div className="max-w-md mx-auto space-y-8">
        <Link
          href="/hub"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-teal-600"
        >
          <ArrowLeft className="h-4 w-4" />
          허브로
        </Link>

        <header className="space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">조직 만들기</h1>
          <p className="text-sm text-slate-500 font-medium">
            팀·시설·매장 등 B2B용 워크스페이스입니다. 생성 시 본인이 소유자로 등록됩니다.
          </p>
        </header>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="org-name" className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
              조직 이름
            </label>
            <input
              id="org-name"
              name="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: OO 동물병원"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              maxLength={120}
              autoComplete="organization"
              disabled={pending}
              required
            />
          </div>

          {error && (
            <p className="text-sm font-semibold text-red-600" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-4 text-sm font-black text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                생성 중…
              </>
            ) : (
              "조직 생성"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
