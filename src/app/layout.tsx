import type { Metadata } from "next";
import "./globals.css";
import { Outfit } from "next/font/google";
import { cn } from "@/lib/utils";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

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
    <html lang="ko" className={cn("font-outfit", outfit.variable)}>
      <body className="antialiased font-outfit">
        {children}
      </body>
    </html>
  );
}
