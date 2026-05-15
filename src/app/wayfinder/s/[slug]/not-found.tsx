import Link from "next/link";
import { Navigation2 } from "lucide-react";

export default function WayfinderSpotNotFound() {
  return (
    <main
      className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-4 py-16 text-center font-outfit"
      lang="ko"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <Navigation2 className="h-8 w-8" aria-hidden />
      </div>
      <h1 className="text-xl font-black text-slate-900">안내를 찾을 수 없습니다</h1>
      <p className="text-sm font-medium leading-relaxed text-slate-600">
        링크가 만료되었거나 비공개 상태일 수 있습니다. 시설 안내 데스크에 문의해 주세요.
      </p>
      <Link href="/" className="text-sm font-black text-indigo-600 underline-offset-4 hover:underline">
        링크유 홈으로
      </Link>
    </main>
  );
}
