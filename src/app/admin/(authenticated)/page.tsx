import {
    getAdminStats,
    getTagOpsStats,
    getAdminFailureTopActions,
    getPetsSubjectKindCounts,
} from "@/app/actions/admin";
import AdminDashboardClient from "@/components/admin/AdminDashboardClient";
import { redirect } from "next/navigation";
import { resolveAdminScope } from "@/lib/admin-authz";

export const runtime = "edge";

export default async function AdminPage() {
    const scope = await resolveAdminScope("admin");
    if (!scope.actor.isPlatformAdmin) {
        redirect("/admin/shop/orders");
    }
    const [stats, ops, failureTop, petsBySubjectKind] = await Promise.all([
        getAdminStats(),
        getTagOpsStats(),
        getAdminFailureTopActions(7, 5),
        getPetsSubjectKindCounts(),
    ]);
    const dataAsOf = new Date().toISOString();

    return (
        <AdminDashboardClient
            stats={stats}
            ops={ops}
            failureTop={failureTop}
            petsBySubjectKind={petsBySubjectKind}
            dataAsOf={dataAsOf}
        />
    );
}
