import type { Viewport } from "next";
import { VIEWPORT_BOOTSTRAP_SCRIPT } from "@/lib/viewport-meta";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function AuthCompleteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: VIEWPORT_BOOTSTRAP_SCRIPT }} />
      {children}
    </>
  );
}
