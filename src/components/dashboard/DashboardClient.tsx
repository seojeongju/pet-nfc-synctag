import { type SubjectKind } from "@/lib/subject-kind";
import type { ModeAnnouncementRow } from "@/types/mode-announcement";
import type { TenantPlanUsageSummary } from "@/lib/tenant-quota";
import PetDashboard from "./modes/PetDashboard";
import ElderDashboard from "./modes/ElderDashboard";
import ChildDashboard from "./modes/ChildDashboard";
import LuggageDashboard from "./modes/LuggageDashboard";
import GoldDashboard from "./modes/GoldDashboard";

interface DashboardClientProps {
  session: { user: { name?: string | null; image?: string | null } };
  pets: Array<{ id: string; name: string; breed?: string | null; photo_url?: string | null; is_lost?: number | null }>;
  isAdmin: boolean;
  subjectKind: SubjectKind;
  modeAnnouncements: ModeAnnouncementRow[];
  tenantId?: string | null;
  tenantUsage?: TenantPlanUsageSummary | null;
  tenantSuspended?: boolean;
  linkedTagCount?: number;
}

export default function DashboardClient({
  session,
  pets,
  isAdmin,
  subjectKind,
  modeAnnouncements,
  tenantId,
  tenantUsage,
  tenantSuspended = false,
  linkedTagCount = 0
}: DashboardClientProps) {
  switch (subjectKind) {
    case "pet":
      return (
        <PetDashboard
          session={session}
          pets={pets}
          isAdmin={isAdmin}
          modeAnnouncements={modeAnnouncements}
          tenantId={tenantId}
          tenantUsage={tenantUsage}
          tenantSuspended={tenantSuspended}
          linkedTagCount={linkedTagCount}
        />
      );
    case "elder":
      return (
        <ElderDashboard
          session={session}
          subjects={pets}
          isAdmin={isAdmin}
          modeAnnouncements={modeAnnouncements}
          tenantId={tenantId}
          tenantUsage={tenantUsage}
          tenantSuspended={tenantSuspended}
          linkedTagCount={linkedTagCount}
        />
      );
    case "child":
      return (
        <ChildDashboard
          session={session}
          subjects={pets}
          isAdmin={isAdmin}
          modeAnnouncements={modeAnnouncements}
          tenantId={tenantId}
          tenantUsage={tenantUsage}
          tenantSuspended={tenantSuspended}
          linkedTagCount={linkedTagCount}
        />
      );
    case "luggage":
      return (
        <LuggageDashboard
          session={session}
          items={pets}
          isAdmin={isAdmin}
          modeAnnouncements={modeAnnouncements}
          tenantId={tenantId}
          tenantUsage={tenantUsage}
          tenantSuspended={tenantSuspended}
          linkedTagCount={linkedTagCount}
        />
      );
    case "gold":
      return (
        <GoldDashboard
          session={session}
          items={pets}
          isAdmin={isAdmin}
          modeAnnouncements={modeAnnouncements}
          tenantId={tenantId}
          tenantUsage={tenantUsage}
          tenantSuspended={tenantSuspended}
          linkedTagCount={linkedTagCount}
        />
      );
    default:
      return null;
  }
}
