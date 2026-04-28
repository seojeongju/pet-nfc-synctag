"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Snapshot = { kind: string | null; tenant: string | null };

/**
 * `useSearchParams()`는 RSC/CSR 첫 프레임에서 쿼리가 달라 React #418(텍스트)를 유발할 수 있어,
 * 마운트 이후에만 쿼리를 반영한다. 첫 프레임은 `null`로 두고(서버/클라이언트 일치) 경로 기반 `kind`와 맞춘다.
 */
export function useDashboardNavSearchSnapshot() {
  const searchParams = useSearchParams();
  const [snap, setSnap] = useState<Snapshot | null>(null);
  useEffect(() => {
    setSnap({
      kind: searchParams.get("kind"),
      tenant: searchParams.get("tenant")?.trim() || null,
    });
  }, [searchParams]);
  return snap;
}
