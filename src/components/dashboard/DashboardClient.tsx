import { type SubjectKind } from "@/lib/subject-kind";
import type { ModeAnnouncementRow } from "@/types/mode-announcement";
import type { TenantPlanUsageSummary } from "@/lib/tenant-quota";
import { GuardianPushSubscribeCard } from "@/components/dashboard/GuardianPushSubscribeCard";
import PetDashboard from "./modes/PetDashboard";
import ElderDashboard from "./modes/ElderDashboard";
import ChildDashboard from "./modes/ChildDashboard";
import LuggageDashboard from "./modes/LuggageDashboard";
import GoldDashboard from "./modes/GoldDashboard";

interface DashboardClientProps {
  session: { user: { name?: string | null; image?: string | null } };
  pets: Array<{
    id: string;
    name: string;
    breed?: string | null;
    photo_url?: string | null;
    is_lost?: number | null;
    subject_kind?: SubjectKind;
  }>;
  isAdmin: boolean;
  subjectKind: SubjectKind;
  modeAnnouncements: ModeAnnouncementRow[];
  tenantId?: string | null;
  tenantUsage?: TenantPlanUsageSummary | null;
  tenantSuspended?: boolean;
  modeFeatureEnabled?: boolean;
  linkedTagCount?: number;
  /** pet 모드 원탭 가이드 3단계(테스트 스캔) — scan_logs 기준 */
  petScanLogCount?: number;
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
  modeFeatureEnabled = true,
  linkedTagCount = 0,
  petScanLogCount = 0
}: DashboardClientProps) {
  const dashboard = (() => {
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
          modeFeatureEnabled={modeFeatureEnabled}
          linkedTagCount={linkedTagCount}
          petScanLogCount={petScanLogCount}
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
          modeFeatureEnabled={modeFeatureEnabled}
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
          modeFeatureEnabled={modeFeatureEnabled}
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
          modeFeatureEnabled={modeFeatureEnabled}
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
          modeFeatureEnabled={modeFeatureEnabled}
          linkedTagCount={linkedTagCount}
        />
      );
    default:
      return (
        <PetDashboard
          session={session}
          pets={pets}
          isAdmin={isAdmin}
          modeAnnouncements={modeAnnouncements}
          tenantId={tenantId}
          tenantUsage={tenantUsage}
          tenantSuspended={tenantSuspended}
          modeFeatureEnabled={modeFeatureEnabled}
          linkedTagCount={linkedTagCount}
          petScanLogCount={petScanLogCount}
        />
      );
  }
  })();

  return (
    <>
      <GuardianPushSubscribeCard />
      {dashboard}
    </>
  );
}
