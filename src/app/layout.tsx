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
  title: "Pet-ID Connect | 스마트 반려동물 인식표",
  description: "3D 프린팅 NFC 기술로 사랑하는 반려동물을 지켜주세요.",
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
