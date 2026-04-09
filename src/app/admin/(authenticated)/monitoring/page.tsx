import AdminMonitoringClient from "@/components/admin/AdminMonitoringClient";
import {
  getLandingAutoRouteEvents,
  getLowBatteryCandidates,
  getMonitoringSummary,
  getRecentBleEvents,
  getRecentNfcScans,
  getUnknownTagAccesses,
} from "@/lib/admin-monitoring-data";

export const runtime = "edge";

export default async function AdminMonitoringPage() {
  const [summary, recentNfc, unknownAccess, autoRouteEvents, recentBle, lowBattery] = await Promise.all([
    getMonitoringSummary().catch(() => ({
      nfcScans24h: 0,
      nfcScans7d: 0,
      nfcWithLocation24h: 0,
      unknownUidAccess7d: 0,
      landingAutoRoutes7d: 0,
      bleEvents24h: 0,
      bleEvents7d: 0,
      bleLostEvents7d: 0,
      distinctPetsBatteryLow30d: 0,
      tagsTotal: 0,
      tagsActive: 0,
      tagsUnsold: 0,
    })),
    getRecentNfcScans(40).catch(() => []),
    getUnknownTagAccesses(30).catch(() => []),
    getLandingAutoRouteEvents(30).catch(() => []),
    getRecentBleEvents(40).catch(() => []),
    getLowBatteryCandidates(30).catch(() => []),
  ]);

  return (
    <AdminMonitoringClient
      summary={summary}
      recentNfc={recentNfc}
      unknownAccess={unknownAccess}
      autoRouteEvents={autoRouteEvents}
      recentBle={recentBle}
      lowBattery={lowBattery}
    />
  );
}
