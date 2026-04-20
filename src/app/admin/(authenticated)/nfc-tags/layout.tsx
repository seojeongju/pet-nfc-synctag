import { NfcTagsSubNav } from "@/components/admin/nfc-tags/NfcTagsSubNav";

export const runtime = "edge";

export default function AdminNfcTagsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full min-w-0 flex-col bg-[#F8FAFC]">
      {/* 상단 워크플로 메뉴와 본문을 세로로 분리해 겹침·스택 순서 문제 방지 */}
      <div className="shrink-0">
        <NfcTagsSubNav />
      </div>
      <div className="min-h-0 min-w-0 flex-1">{children}</div>
    </div>
  );
}
