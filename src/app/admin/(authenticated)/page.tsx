import { getAdminStats, getTagOpsStats, getAdminFailureTopActions } from "@/app/actions/admin";
import AdminDashboardClient from "@/components/admin/AdminDashboardClient";

export const runtime = "edge";

export default async function AdminPage() {
    const stats = await getAdminStats();
    const ops = await getTagOpsStats();
    const failureTop = await getAdminFailureTopActions(7, 5);

    return (
        <AdminDashboardClient stats={stats} ops={ops} failureTop={failureTop} />
    );
}
