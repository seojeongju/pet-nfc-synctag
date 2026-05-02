"use client";

import { useEffect, useState } from "react";
import { peekTenantPasswordFlash } from "@/app/actions/admin-tenants";
import AdminTenantPasswordFlash from "@/components/admin/tenants/AdminTenantPasswordFlash";

export default function TenantPasswordFlashRecover() {
  const [flash, setFlash] = useState<Awaited<ReturnType<typeof peekTenantPasswordFlash>>>(null);

  useEffect(() => {
    void peekTenantPasswordFlash().then(setFlash);
  }, []);

  if (!flash) return null;
  return (
    <AdminTenantPasswordFlash
      variant="page"
      email={flash.email}
      temporaryPassword={flash.temporaryPassword}
    />
  );
}
