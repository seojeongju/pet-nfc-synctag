import Link from "next/link";
import { redirect } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { AdminPageIntro } from "@/components/admin/layout/AdminPageIntro";
import { platformServiceIcons } from "@/components/platform/service-icons";
import { resolveAdminScope } from "@/lib/admin-authz";
import { formFactorsForService } from "@/lib/platform/form-factors";
import { PLATFORM_SERVICES, platformServiceStatusLabel } from "@/lib/platform/services";
import { adminUi } from "@/styles/admin/ui";
import { cn } from "@/lib/utils";

export const runtime = "edge";

const payloadLabel: Record<string, string> = {
  linku_profile: "Link-U 프로필 (/t/UID)",
  vcard_url: "명함 페이지 URL",
  wifi: "Wi-Fi 설정 (NDEF)",
  url: "일반 URL",
};

export default async function AdminPlatformServicesPage() {
  const scope = await resolveAdminScope("admin");
  if (!scope.actor.isPlatformAdmin) redirect("/admin/shop/orders");

  return (
    <div className={cn(adminUi.pageContainer, adminUi.pageBottomSafe)}>
      <AdminPageIntro
        title="서비스 관리"
        subtitle="플랫폼에 등록된 NFC 서비스와 제작 가능한 태그 모양입니다. 서비스 추가·상태 변경은 현재 코드(src/lib/platform/services.ts)에서 관리하며, 이후 DB 편집으로 전환합니다."
        crumbs={[{ label: "통합 관리자", href: "/admin" }, { label: "서비스 관리" }]}
      />

      <div className={cn(adminUi.sectionCard, "overflow-x-auto border p-0 sm:p-0")}>
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className={adminUi.tableHeadRow}>
              <th className={adminUi.tableHeadCell}>서비스</th>
              <th className={adminUi.tableHeadCell}>상태</th>
              <th className={adminUi.tableHeadCell}>NFC 기록 내용</th>
              <th className={adminUi.tableHeadCell}>제작 가능한 태그</th>
              <th className={adminUi.tableHeadCell}>바로가기</th>
            </tr>
          </thead>
          <tbody>
            {PLATFORM_SERVICES.map((s) => {
              const Icon = platformServiceIcons[s.id];
              const live = s.status === "live";
              const forms = formFactorsForService(s.id);
              return (
                <tr key={s.id} className={cn(adminUi.tableRowHover, "border-b border-slate-50 last:border-0")}>
                  <td className={adminUi.tableBodyCellStrong}>
                    <span className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                          live ? "bg-teal-500 text-white" : "bg-slate-100 text-slate-500"
                        )}
                      >
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <span>
                        <span className="block">{s.name}</span>
                        <span className="block font-mono text-[10px] text-slate-400">{s.id}</span>
                      </span>
                    </span>
                  </td>
                  <td className={adminUi.tableBodyCell}>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-black",
                        live ? adminUi.successBadge : adminUi.neutralBadge
                      )}
                    >
                      {platformServiceStatusLabel[s.status]}
                    </span>
                  </td>
                  <td className={adminUi.tableBodyCell}>{payloadLabel[s.payloadType] ?? s.payloadType}</td>
                  <td className={adminUi.tableBodyCell}>{forms.length ? forms.map((f) => f.name).join(", ") : "—"}</td>
                  <td className={adminUi.tableBodyCell}>
                    <span className="flex flex-wrap gap-2">
                      <Link
                        href={`/services/${s.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-800"
                      >
                        소개 <ExternalLink className="h-3 w-3" aria-hidden />
                      </Link>
                      {s.id === "linku" ? (
                        <Link href="/admin/linku" prefetch={false} className="text-teal-600 hover:text-teal-800">
                          운영 대시보드
                        </Link>
                      ) : null}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
