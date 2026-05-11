import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata("링크유 관리자");

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
