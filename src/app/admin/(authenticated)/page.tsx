import { getAdminStats } from "@/app/actions/admin";
import AdminDashboardClient from "@/components/admin/AdminDashboardClient";

export const runtime = "edge";

export default async function AdminPage() {
    const stats = await getAdminStats();

    return (
        <AdminDashboardClient stats={stats} />
    );
}
