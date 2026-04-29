import AdminMonitoringClient from "@/components/admin/AdminMonitoringClient";
import {
  getMapTelemetryAlertState,
  getMapTelemetryThresholdAudits,
  getLandingAutoRouteEventsPage,
  getMapTelemetryHealthSummary,
  getMapTelemetryThresholds,
  getMapTelemetryTrend,
  getNativeRejectTopReasons,
  getLowBatteryCandidates,
  getMonitoringSummary,
  getRecentBleEvents,
  getGuardianNfcAppEventsPage,
  getRecentNfcScansPage,
  getUnknownTagAccessesPage,
} from "@/lib/admin-monitoring-data";

export const runtime = "edge";

export default async function AdminMonitoringPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; np?: string; up?: string; ap?: string; gp?: string }>;
}) {
  const sp = await searchParams;
  const period = sp.period === "1h" || sp.period === "7d" ? sp.period : "24h";
  const nfcPage = Math.max(1, Number(sp.np) || 1);
  const unknownPage = Math.max(1, Number(sp.up) || 1);
  const autoRoutePage = Math.max(1, Number(sp.ap) || 1);
  const guardianAppEventPage = Math.max(1, Number(sp.gp) || 1);

  const [summary, mapHealth, mapThresholds, mapAlertState, mapThresholdAudits, mapTrend, recentNfcPage, unknownAccessPage, autoRouteEventsPage, guardianNfcAppEventsPage, recentBle, lowBattery, nativeRejectTop] = await Promise.all([
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
      nativeWriteFail24h: 0,
      nativeWriteFail7d: 0,
      nativeHandoff7d: 0,
      nativeRejected24h: 0,
      nativeRejected7d: 0,
      finderCall24h: 0,
      finderSms24h: 0,
      finderLocationClick24h: 0,
      finderLocationSuccess24h: 0,
      finderLocationClick7d: 0,
      finderLocationSuccess7d: 0,
      guardianAlerts24h: 0,
      guardianAlerts7d: 0,
      tagsTotal: 0,
      tagsActive: 0,
      tagsUnsold: 0,
    })),
    getMapTelemetryHealthSummary(period).catch(() => ({
      windowLabel: period === "1h" ? "최근 1시간" : period === "7d" ? "최근 7일" : "최근 24시간",
      samples24h: 0,
      avgRefreshMs24h: 0,
      errorRatePercent24h: 0,
      timeoutRatePercent24h: 0,
      offlineRatePercent24h: 0,
      autoRefreshOnRatePercent24h: 0,
      errorSamples: 0,
      timeoutSamples: 0,
      offlineSamples: 0,
      topFailureReason: "none" as const,
      lastReceivedAt: null,
    })),
    getMapTelemetryThresholds().catch(() => ({
      warningErrorRate: 8,
      warningTimeoutRate: 5,
      warningOfflineRate: 8,
      dangerErrorRate: 20,
      dangerTimeoutRate: 15,
      dangerOfflineRate: 20,
    })),
    getMapTelemetryAlertState().catch(() => ({ acknowledgedUntil: null })),
    getMapTelemetryThresholdAudits(10).catch(() => []),
    getMapTelemetryTrend(period).catch(() => []),
    getRecentNfcScansPage({ page: nfcPage, pageSize: 10 }).catch(() => ({ rows: [], total: 0, page: 1, pageSize: 10 })),
    getUnknownTagAccessesPage({ page: unknownPage, pageSize: 10 }).catch(() => ({ rows: [], total: 0, page: 1, pageSize: 10 })),
    getLandingAutoRouteEventsPage({ page: autoRoutePage, pageSize: 10 }).catch(() => ({ rows: [], total: 0, page: 1, pageSize: 10 })),
    getGuardianNfcAppEventsPage({ page: guardianAppEventPage, pageSize: 10 }).catch(() => ({ rows: [], total: 0, page: 1, pageSize: 10 })),
    getRecentBleEvents(40).catch(() => []),
    getLowBatteryCandidates(30).catch(() => []),
    getNativeRejectTopReasons(5).catch(() => []),
  ]);

  return (
    <AdminMonitoringClient
      summary={summary}
      mapHealth={mapHealth}
      mapThresholds={mapThresholds}
      mapAlertState={mapAlertState}
      mapThresholdAudits={mapThresholdAudits}
      mapTrend={mapTrend}
      period={period}
      recentNfcPage={recentNfcPage}
      unknownAccessPage={unknownAccessPage}
      autoRouteEventsPage={autoRouteEventsPage}
      guardianNfcAppEventsPage={guardianNfcAppEventsPage}
      recentBle={recentBle}
      lowBattery={lowBattery}
      nativeRejectTop={nativeRejectTop}
    />
  );
}
