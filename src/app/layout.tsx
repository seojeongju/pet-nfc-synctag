import type { Metadata, Viewport } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { PwaInstallProvider } from "@/components/pwa-install-context";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import { ViewportFix } from "@/components/viewport-fix";
import { SiteLegalFooter } from "@/components/layout/SiteLegalFooter";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  BRAND_KEYWORDS,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE_DEFAULT,
  buildOrganizationJsonLd,
  buildPublicMetadata,
  buildWebSiteJsonLd,
  getSiteUrl,
} from "@/lib/seo";

const googleSiteVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim();
const naverSiteVerification =
  process.env.NAVER_SITE_VERIFICATION?.trim() || "ba44fdda87301268312e215cb8d0aa5c660bc40c";

export const metadata: Metadata = {
  ...buildPublicMetadata({
    title: SITE_TITLE_DEFAULT,
    description: SITE_DESCRIPTION,
    path: "/",
  }),
  metadataBase: new URL(getSiteUrl()),
  applicationName: SITE_NAME,
  keywords: [...BRAND_KEYWORDS],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Link-U",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/icons/icon-192x192.png",
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
        {googleSiteVerification ? (
          <meta name="google-site-verification" content={googleSiteVerification} />
        ) : null}
        {naverSiteVerification ? (
          <meta name="naver-site-verification" content={naverSiteVerification} />
        ) : null}
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
        <JsonLd data={[buildOrganizationJsonLd(), buildWebSiteJsonLd()]} />
        {/* Google OAuth 복귀 시 viewport 오염 자동 복구 */}
        <ViewportFix />
        <PwaInstallProvider>
          <div className="flex min-h-dvh min-h-[100svh] flex-col">
            <div className="flex-1 flex flex-col">{children}</div>
            <SiteLegalFooter />
          </div>
          <PwaInstallPrompt />
        </PwaInstallProvider>
      </body>
    </html>
  );
}
