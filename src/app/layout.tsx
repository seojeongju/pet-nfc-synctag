import type { Metadata, Viewport } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import { ViewportFix } from "@/components/viewport-fix";

export const metadata: Metadata = {
  title: "링크유 Link-U | NFC로 연결하는 안심 플랫폼",
  description: "반려동물·가족·아이·수하물까지 NFC 태그로 보호자와 연결하는 링크유(Link-U)입니다.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Link-U",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#14b8a6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={cn("font-outfit h-full")}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
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
      <body className="min-h-dvh min-h-[100svh] antialiased font-outfit">
        {/* Google OAuth 복귀 시 viewport 오염 자동 복구 */}
        <ViewportFix />
        {children}
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
