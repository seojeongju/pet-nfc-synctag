import ModeAnnouncementsAdminClient from "./ModeAnnouncementsAdminClient";
import { listModeAnnouncementsForAdmin } from "@/app/actions/mode-announcements";

export const runtime = "edge";

export default async function AdminAnnouncementsPage() {
  const rows = await listModeAnnouncementsForAdmin().catch(() => []);
  return <ModeAnnouncementsAdminClient initialRows={rows} />;
}
