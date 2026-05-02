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
    <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 px-2 py-2">
      <AdminTenantPasswordFlash
        variant="row"
        email={flash.email}
        temporaryPassword={flash.temporaryPassword}
      />
    </div>
  );
}
