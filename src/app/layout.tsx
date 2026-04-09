import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "링크유 Link-U | NFC로 연결하는 안심 플랫폼",
  description: "반려동물·가족·아이·수하물까지 NFC 태그로 보호자와 연결하는 링크유(Link-U)입니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={cn("font-outfit")}>
      <head>
        {/* Cloudflare Edge에서 next/font Google 로더 이슈 회피 — 루트에서 전역 링크 */}
        {/* eslint-disable @next/next/no-page-custom-font -- root layout; applies site-wide */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@100;200;300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        {/* eslint-enable @next/next/no-page-custom-font */}
      </head>
      <body className="antialiased font-outfit">{children}</body>
    </html>
  );
}
