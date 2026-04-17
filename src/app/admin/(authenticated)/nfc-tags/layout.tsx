import { NfcTagsSubNav } from "@/components/admin/nfc-tags/NfcTagsSubNav";

export const runtime = "edge";

export default function AdminNfcTagsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full bg-[#F8FAFC]">
      <NfcTagsSubNav />
      {children}
    </div>
  );
}
