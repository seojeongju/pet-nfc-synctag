import ModeAnnouncementsAdminClient from "./ModeAnnouncementsAdminClient";
import { listModeAnnouncementsForAdmin } from "@/app/actions/mode-announcements";
import { resolveAdminScope } from "@/lib/admin-authz";

export const runtime = "edge";

export default async function AdminAnnouncementsPage() {
  const scope = await resolveAdminScope("admin");
  const rows = await listModeAnnouncementsForAdmin().catch(() => []);
  return <ModeAnnouncementsAdminClient initialRows={rows} isPlatformAdmin={scope.actor.isPlatformAdmin} />;
}
