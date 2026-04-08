import { Suspense } from "react";
import AdminTagsPageClient from "./AdminTagsPageClient";

export const runtime = "edge";

export default function AdminTagsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC]" />}>
      <AdminTagsPageClient />
    </Suspense>
  );
}
